import { Ollama } from 'langchain/llms/ollama';
import { buildPredictionPrompt } from '../ollama/prompt';
import { fetchFinancialContext } from '../retrieval/esRetriever';
import { buildContextString } from '../retrieval/contextBuilder';
import { PredictionSchema, Prediction } from './schema';
import { writeToES } from '../output/writeToES';
import { writeToMongo } from '../output/writeToMongo';
import { publishToKafka } from '../output/publishToKafka';

const ollama = new Ollama({
  baseUrl: process.env.OLLAMA_HOST || 'http://ollama:11434',
  model: process.env.OLLAMA_MODEL || 'tinyllama',
  temperature: 0.1,  // Low temp for consistent structured output
  format: 'json',    // Force Ollama to output valid JSON
});

/**
 * Deterministic fallback generator when LLM fails to output valid or parseable JSON.
 * Analyzes depository/checking balance, debt ratios, and cash buffers.
 */
function generateFallbackPrediction(rawContext: any, emiAmount: number): Prediction {
  const balanceDocs = rawContext.balance?.hits?.hits || [];
  const balanceDoc = balanceDocs[0]?._source || {};
  const accountsEnriched = balanceDoc.accounts_enriched || [];

  let depositoryBalance = 0;
  let hasCreditCard = false;
  let creditUtilization = 0;
  let minBalanceBufferDays = 999;

  accountsEnriched.forEach((acc: any) => {
    if (acc.type === 'depository') {
      depositoryBalance += (acc.current_balance || 0);
    }
    if (acc.type === 'credit') {
      hasCreditCard = true;
      creditUtilization = Math.max(creditUtilization, acc.utilisation_pct || 0);
    }
    if (acc.balance_buffer_days !== undefined && acc.balance_buffer_days !== null) {
      minBalanceBufferDays = Math.min(minBalanceBufferDays, acc.balance_buffer_days);
    }
  });

  let riskScore = 15;
  let reasoning = 'User displays stable account balances and solid cash buffer relative to EMI size.';
  const warningFlags: string[] = [];
  const suggestions: string[] = [];

  if (depositoryBalance < emiAmount) {
    riskScore = 88;
    reasoning = `Upcoming EMI of ₹${emiAmount} exceeds available savings balance of ₹${depositoryBalance.toFixed(2)}. Highly elevated default risk.`;
    warningFlags.push('INSUFFICIENT_FUNDS', 'CRITICAL_LIQUIDITY_STRESS');
    suggestions.push(
      'Transfer funds immediately from an external savings account to cover the EMI.',
      'Contact your lender to request a temporary grace period or tenure extension.',
      'Restrict all discretionary expenses until the EMI is fully paid.'
    );
  } else if (depositoryBalance < emiAmount * 2) {
    riskScore = 55;
    reasoning = `Savings balance (₹${depositoryBalance.toFixed(2)}) is close to the EMI amount of ₹${emiAmount}. Cash flow is tight.`;
    warningFlags.push('LOW_CASH_BUFFER');
    suggestions.push(
      'Reduce non-essential entertainment and retail spends this week.',
      'Segregate the EMI amount in your account to prevent accidental withdrawals.',
      'Ensure salary or primary income credit occurs before the EMI due date.'
    );
  } else {
    if (minBalanceBufferDays < 7) {
      riskScore = Math.max(riskScore, 45);
      reasoning = `High transaction burn rate. Current cash runway is less than a week (${minBalanceBufferDays.toFixed(1)} days).`;
      warningFlags.push('SHORT_CASH_RUNWAY');
      suggestions.push(
        'Set up strict daily spending limits to stretch your balance runway.',
        'Review recent recurring subscriptions and cancel unused plans.'
      );
    }
    if (creditUtilization > 75) {
      riskScore = Math.max(riskScore, 40);
      reasoning = `High credit card utilization (${creditUtilization.toFixed(1)}%). Significant outstanding debt burden.`;
      warningFlags.push('HIGH_DEBT_UTILISATION');
      suggestions.push('Prioritize paying down outstanding credit card balances to improve credit score.');
    }
    
    if (riskScore === 15) {
      suggestions.push(
        'Maintain current financial discipline and balance buffers.',
        'Set up standing instructions/auto-debit for stress-free EMI payment.',
        'Consider parking surplus savings in liquid interest-bearing accounts.'
      );
    } else {
      suggestions.push('Keep emergency cash reserves liquid to absorb balance dips.');
    }
  }

  while (suggestions.length < 3) {
    suggestions.push('Establish a secondary cash reserve equivalent to 3 monthly EMIs.');
  }

  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (riskScore >= 80) severity = 'critical';
  else if (riskScore >= 50) severity = 'high';
  else if (riskScore >= 30) severity = 'medium';

  const missProbability = Number((riskScore / 100).toFixed(2));

  return {
    risk_score: riskScore,
    miss_probability: missProbability,
    severity,
    reasoning,
    suggestions,
    warning_flags: warningFlags
  };
}

export async function runPrediction(userId: string, emiAmount: number, emiDueDate: string) {
  // 1. Retrieve context from ES
  const rawContext = await fetchFinancialContext(userId, emiDueDate, emiAmount);
  const contextString = buildContextString(rawContext, emiAmount);

  let prediction: Prediction;

  try {
    // 2. Build and send prompt to Ollama
    console.log(`[AI Engine] Invoking Ollama with formatted context prompt...`);
    const prompt = buildPredictionPrompt(contextString, emiAmount, emiDueDate);
    const rawResponse = await ollama.call(prompt);
    console.log('[AI Engine] Raw LLM Response:', rawResponse);

    // 3. Parse and validate JSON output
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Ollama response.');
    }

    const parsedJson = JSON.parse(jsonMatch[0]);
    const parseResult = PredictionSchema.safeParse(parsedJson);
    if (!parseResult.success) {
      console.error('[AI Engine] Zod validation failed for JSON:', JSON.stringify(parsedJson, null, 2));
      console.error('[AI Engine] Zod errors:', JSON.stringify(parseResult.error.errors, null, 2));
      throw new Error(`LLM output did not match expected schema`);
    }
    prediction = parseResult.data;
    console.log('[AI Engine] Successfully generated prediction via Ollama LLM.');
  } catch (error: any) {
    console.warn(`[AI Engine] Ollama prediction run failed or returned invalid JSON. Invoking self-healing fallback algorithm... Error:`, error.message || error);
    prediction = generateFallbackPrediction(rawContext, emiAmount);
    console.log('[AI Engine] Fallback prediction computed successfully:', JSON.stringify(prediction, null, 2));
  }

  // 4. Enrich prediction
  const result = {
    ...prediction,
    user_id: userId,
    prediction_id: `pred-${Date.now()}`,
    emi_due_date: emiDueDate,
    emi_amount: emiAmount,
    model_version: process.env.OLLAMA_MODEL || 'tinyllama',
    created_at: new Date().toISOString(),
  };

  // 5. Write to all outputs
  await Promise.all([
    writeToES(result),
    writeToMongo(result),
    publishToKafka(result),
  ]);

  return result;
}
