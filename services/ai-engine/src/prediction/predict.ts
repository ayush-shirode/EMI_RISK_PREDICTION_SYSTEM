import { Ollama } from 'langchain/llms/ollama';
import { buildPredictionPrompt } from '../ollama/prompt';
import { fetchFinancialContext } from '../retrieval/esRetriever';
import { buildContextString } from '../retrieval/contextBuilder';
import { PredictionSchema, Prediction } from './schema';
import { writeToES } from '../output/writeToES';
import { writeToMongo } from '../output/writeToMongo';
import { publishToKafka } from '../output/publishToKafka';
import { triggerEmailAlert } from '../output/emailAlert';

const ollama = new Ollama({
  baseUrl: process.env.OLLAMA_HOST || 'http://ollama:11434',
  model: process.env.OLLAMA_MODEL || 'tinyllama',
  temperature: 0.05,  // Very low temp for consistent, deterministic output
  format: 'json',
});

/* -----------------------------------------------------------------------
 * EMI AMOUNT SANITY GUARD
 * Reject clearly impractical EMI values before sending to the model.
 * Max realistic EMI for an individual in India: ₹5,00,000/month
 * ----------------------------------------------------------------------- */
const MAX_REASONABLE_EMI = 500_000;

function validateEmiAmount(emiAmount: number): void {
  if (emiAmount <= 0) {
    throw new Error(`Invalid EMI amount: ₹${emiAmount}. Must be a positive number.`);
  }
  if (emiAmount > MAX_REASONABLE_EMI) {
    throw new Error(
      `EMI amount ₹${emiAmount.toLocaleString('en-IN')} exceeds the maximum allowed value of ` +
      `₹${MAX_REASONABLE_EMI.toLocaleString('en-IN')}. ` +
      `Please enter a realistic monthly EMI amount (not an annual figure or total loan amount).`
    );
  }
}

/* -----------------------------------------------------------------------
 * DETERMINISTIC FALLBACK — runs when Ollama returns invalid JSON or fails.
 * Uses actual financial figures from Elasticsearch context.
 * Now correctly calibrated against real savings and EMI amounts.
 * ----------------------------------------------------------------------- */
function generateFallbackPrediction(rawContext: any, emiAmount: number): Prediction {
  const balanceDocs = rawContext.balance?.hits?.hits || [];
  const balanceDoc  = balanceDocs[0]?._source || {};
  const accountsEnriched = balanceDoc.accounts_enriched || [];

  let depositoryBalance = 0;
  let hasCreditCard     = false;
  let creditUtilization = 0;
  let minBalanceBufferDays = 999;

  accountsEnriched.forEach((acc: any) => {
    if (acc.type === 'depository') {
      depositoryBalance += (acc.current_balance || 0);
    }
    if (acc.type === 'credit') {
      hasCreditCard     = true;
      creditUtilization = Math.max(creditUtilization, acc.utilisation_pct || 0);
    }
    if (acc.balance_buffer_days !== undefined && acc.balance_buffer_days !== null) {
      minBalanceBufferDays = Math.min(minBalanceBufferDays, acc.balance_buffer_days);
    }
  });

  const txAgg          = rawContext.txAgg || {};
  const total90d       = txAgg.aggregations?.total_90d?.value || 0;
  const monthlyBuckets = txAgg.aggregations?.monthly?.buckets || [];

  // Compute spend trend: compare last 3 months vs prior 3 months
  let spendTrendRatio = 1.0;
  if (monthlyBuckets.length >= 2) {
    const recentMonths = monthlyBuckets.slice(-3);
    const prevMonths   = monthlyBuckets.slice(-6, -3);
    const recentAvg    = recentMonths.reduce((s: number, b: any) => s + (b.monthly_total?.value || 0), 0) / (recentMonths.length || 1);
    const prevAvg      = prevMonths.reduce((s: number, b: any) => s + (b.monthly_total?.value || 0), 0) / (prevMonths.length || 1);
    if (prevAvg > 0) spendTrendRatio = recentAvg / prevAvg;
  }

  // ---- Primary risk scoring ----
  let riskScore = 15;
  const warningFlags: string[] = [];
  const suggestions: string[]  = [];
  let reasoning = '';

  const hasAccountData = accountsEnriched.length > 0;

  if (!hasAccountData && total90d === 0) {
    // No Plaid/ES data at all — apply a cautious medium-risk default
    riskScore = 35;
    reasoning = `No linked account data is available for analysis. A moderate risk level is applied pending account verification.`;
    warningFlags.push('NO_ACCOUNT_DATA');
    suggestions.push(
      'Link your bank account via Plaid to enable accurate risk scoring.',
      `Set aside ₹${emiAmount.toLocaleString('en-IN')} in a dedicated account before the EMI due date.`,
      'Contact your loan officer if you anticipate payment difficulty.'
    );
  } else if (depositoryBalance < emiAmount) {
    // CRITICAL: savings are below EMI — definite risk
    const coveragePct = depositoryBalance > 0 ? Math.round((depositoryBalance / emiAmount) * 100) : 0;
    riskScore = 88;
    reasoning = `Depository balance ₹${depositoryBalance.toFixed(0)} covers only ${coveragePct}% of the ₹${emiAmount.toLocaleString('en-IN')} EMI due. Highly elevated default risk.`;
    warningFlags.push('INSUFFICIENT_FUNDS', 'CRITICAL_LIQUIDITY_STRESS');
    suggestions.push(
      `Transfer at least ₹${(emiAmount - depositoryBalance).toFixed(0)} from an external account immediately to cover the shortfall.`,
      'Contact your lender to request a temporary grace period or EMI deferral.',
      'Restrict all discretionary spending until after the EMI due date.'
    );
  } else if (depositoryBalance < emiAmount * 1.5) {
    // HIGH: thin buffer — less than 1.5× EMI
    riskScore = 55;
    reasoning = `Savings balance ₹${depositoryBalance.toFixed(0)} is only ${Math.round((depositoryBalance / emiAmount) * 100)}% of the ₹${emiAmount.toLocaleString('en-IN')} EMI — a thin buffer that leaves little room for unexpected expenses.`;
    warningFlags.push('LOW_CASH_BUFFER');
    suggestions.push(
      `Segregate ₹${emiAmount.toLocaleString('en-IN')} in a separate account to prevent accidental withdrawal before the due date.`,
      'Reduce non-essential spending (dining, entertainment) this week to build buffer.',
      'Ensure your salary or primary income is credited before the EMI date.'
    );
    if (spendTrendRatio > 1.2) {
      riskScore = Math.min(riskScore + 10, 70);
      warningFlags.push('RISING_SPEND_TREND');
    }
  } else {
    // Savings appear adequate — assess secondary risk factors
    if (minBalanceBufferDays < 7) {
      riskScore = Math.max(riskScore, 45);
      reasoning = `High transaction burn rate: cash runway is only ${Math.round(minBalanceBufferDays)} days despite current balance. Spending pace may deplete funds before the EMI date.`;
      warningFlags.push('SHORT_CASH_RUNWAY');
      suggestions.push(
        'Set strict daily spending limits to preserve your balance runway.',
        'Review recurring subscriptions and cancel any unused services this week.'
      );
    }

    if (creditUtilization > 75) {
      riskScore = Math.max(riskScore, 40);
      reasoning += (reasoning ? ' ' : '') + `Credit card utilisation is ${creditUtilization.toFixed(0)}% — high debt burden may divert liquidity away from EMI.`;
      warningFlags.push('HIGH_CREDIT_UTILISATION');
      suggestions.push('Prioritise paying down outstanding credit card balances to free up liquidity.');
    }

    if (spendTrendRatio > 1.3) {
      riskScore = Math.max(riskScore, 35);
      warningFlags.push('RISING_SPEND_TREND');
      suggestions.push(`Spending has risen ${Math.round((spendTrendRatio - 1) * 100)}% recently — monitor closely to avoid exceeding your income buffer.`);
    }

    if (riskScore === 15) {
      reasoning = `Savings balance ₹${depositoryBalance.toFixed(0)} comfortably covers the ₹${emiAmount.toLocaleString('en-IN')} EMI (${Math.round((depositoryBalance / emiAmount) * 100)}% coverage). Cash flow is healthy.`;
      suggestions.push(
        'Financial health looks good. Set up auto-debit for stress-free EMI payment.',
        'Consider parking surplus savings in a liquid FD to earn interest before the due date.',
        'Maintain current spending discipline to preserve your strong buffer.'
      );
    }
  }

  // Ensure at least 3 suggestions
  while (suggestions.length < 3) {
    suggestions.push('Establish a cash reserve of at least 3 monthly EMIs as an emergency buffer.');
  }

  // Final severity classification
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (riskScore >= 80)      severity = 'critical';
  else if (riskScore >= 50) severity = 'high';
  else if (riskScore >= 30) severity = 'medium';

  const missProbability = Number((riskScore / 100).toFixed(2));

  return {
    risk_score:       riskScore,
    miss_probability: missProbability,
    severity,
    reasoning,
    suggestions,
    warning_flags:    warningFlags,
  };
}

/* -----------------------------------------------------------------------
 * MAIN PREDICTION RUNNER
 * ----------------------------------------------------------------------- */
export async function runPrediction(userId: string, emiAmount: number, emiDueDate: string) {
  // 0. Validate EMI amount before doing any work
  validateEmiAmount(emiAmount);

  // 1. Retrieve context from Elasticsearch
  const rawContext    = await fetchFinancialContext(userId, emiDueDate, emiAmount);
  const contextString = buildContextString(rawContext, emiAmount);

  let prediction: Prediction;

  try {
    // 2. Build and send prompt to Ollama
    console.log(`[AI Engine] Invoking Ollama (${process.env.OLLAMA_MODEL || 'tinyllama'}) for user ${userId}, EMI ₹${emiAmount}...`);
    const prompt      = buildPredictionPrompt(contextString, emiAmount, emiDueDate);
    const rawResponse = await ollama.call(prompt);
    console.log('[AI Engine] Raw LLM Response:', rawResponse.slice(0, 300));

    // 3. Parse and validate JSON output
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON block found in Ollama response.');
    }

    const parsedJson  = JSON.parse(jsonMatch[0]);
    const parseResult = PredictionSchema.safeParse(parsedJson);
    if (!parseResult.success) {
      console.error('[AI Engine] Zod validation failed:', JSON.stringify(parseResult.error.errors, null, 2));
      throw new Error('LLM output did not match expected schema');
    }
    prediction = parseResult.data;
    console.log(`[AI Engine] ✓ Ollama prediction: risk=${prediction.risk_score}, severity=${prediction.severity}`);
  } catch (error: any) {
    console.warn(`[AI Engine] Ollama failed — using deterministic fallback. Reason: ${error.message || error}`);
    prediction = generateFallbackPrediction(rawContext, emiAmount);
    console.log(`[AI Engine] ✓ Fallback prediction: risk=${prediction.risk_score}, severity=${prediction.severity}`);
  }

  // 4. Enrich prediction with metadata
  const result = {
    ...prediction,
    user_id:       userId,
    prediction_id: `pred-${Date.now()}`,
    emi_due_date:  emiDueDate,
    emi_amount:    emiAmount,
    model_version: process.env.OLLAMA_MODEL || 'tinyllama',
    created_at:    new Date().toISOString(),
    notified:      false,
  };

  // 5. Write to all outputs (ES failure is non-fatal, MongoDB is primary)
  await Promise.all([
    writeToES(result),
    writeToMongo(result),
    publishToKafka(result),
  ]);

  // 6. Immediately trigger email alert for high/critical predictions
  //    (don't wait for the 30-min scheduler cron — send now)
  if (result.severity === 'high' || result.severity === 'critical') {
    triggerEmailAlert(result).catch(err =>
      console.error('[AI Engine] Immediate email alert failed (non-fatal):', err.message)
    );
  }

  return result;
}
