import { Customer } from './customers';

export interface ShapFeature {
  featureName: string;
  featureKey: string;
  rawValue: string;
  shapValue: number;
  direction: 'increase' | 'decrease';
  impact: 'high' | 'medium' | 'low';
  explanation: string;
}

export interface ShapResult {
  baselineScore: number;
  finalScore: number;
  features: ShapFeature[];
  modelConfidence: number;
  contextWindowDays: number;
  computedAt: string;
}

export function computeShap(customer: Customer): ShapResult {
  const baseline = 35;
  const features: ShapFeature[] = [];

  // --- Feature 1: Savings vs EMI gap ---
  const savingsGap = customer.emiAmount - customer.assessedSavings;
  const savingsRatio = customer.assessedSavings / customer.emiAmount;
  const f1Shap = savingsRatio < 1
    ? +(((1 - savingsRatio) * 35)).toFixed(1)
    : -5;
  features.push({
    featureName: 'Savings vs EMI gap',
    featureKey: 'savings_gap',
    rawValue: savingsGap > 0
      ? `₹${savingsGap.toLocaleString('en-IN')} short`
      : `₹${Math.abs(savingsGap).toLocaleString('en-IN')} surplus`,
    shapValue: f1Shap,
    direction: f1Shap > 0 ? 'increase' : 'decrease',
    impact: Math.abs(f1Shap) > 20 ? 'high' : Math.abs(f1Shap) > 10 ? 'medium' : 'low',
    explanation: savingsGap > 0
      ? `Current savings cover only ${Math.round(savingsRatio * 100)}% of the EMI — the single largest risk driver.`
      : 'Savings exceed the EMI amount, significantly reducing miss risk.',
  });

  // --- Feature 2: 3-month spend trend ---
  const trend = customer.spendTrend;
  const recentAvg = (trend[3].amount + trend[4].amount + trend[5].amount) / 3;
  const prevAvg   = (trend[0].amount + trend[1].amount + trend[2].amount) / 3;
  const trendPct  = ((recentAvg - prevAvg) / prevAvg) * 100;
  const f2Shap = trendPct > 0
    ? +(Math.min(trendPct * 0.55, 28)).toFixed(1)
    : +(Math.max(trendPct * 0.3, -8)).toFixed(1);
  features.push({
    featureName: '3-month spend trend',
    featureKey: 'spend_trend_3m',
    rawValue: `${trendPct > 0 ? '+' : ''}${Math.round(trendPct)}% ${trendPct > 0 ? 'rising' : 'falling'}`,
    shapValue: f2Shap,
    direction: f2Shap > 0 ? 'increase' : 'decrease',
    impact: Math.abs(f2Shap) > 15 ? 'high' : Math.abs(f2Shap) > 8 ? 'medium' : 'low',
    explanation: trendPct > 10
      ? `Spending has grown ${Math.round(trendPct)}% over the last 3 months — a sustained upward trajectory.`
      : trendPct < -5
      ? `Spending is trending downward by ${Math.round(Math.abs(trendPct))}%, which is a positive signal.`
      : 'Spending is relatively stable over the last 3 months.',
  });

  // --- Feature 3: Income utilisation ---
  const currentMonthSpend = trend[5].amount;
  const utilisationPct = (currentMonthSpend / customer.monthlyIncome) * 100;
  const f3Shap = utilisationPct > 90 ? +18 :
                 utilisationPct > 75 ? +12 :
                 utilisationPct > 60 ? +6  :
                 utilisationPct > 45 ? +2  : -3;
  features.push({
    featureName: 'Income utilisation %',
    featureKey: 'income_utilisation',
    rawValue: `${Math.round(utilisationPct)}% of income`,
    shapValue: f3Shap,
    direction: f3Shap > 0 ? 'increase' : 'decrease',
    impact: f3Shap >= 12 ? 'high' : f3Shap >= 6 ? 'medium' : 'low',
    explanation: utilisationPct > 90
      ? 'Nearly all monthly income is being spent, leaving no room for the EMI payment.'
      : utilisationPct > 75
      ? 'High income utilisation leaves a thin margin before the EMI date.'
      : 'Income utilisation is at a manageable level.',
  });

  // --- Feature 4: EMI as % of income ---
  const emiPct = (customer.emiAmount / customer.monthlyIncome) * 100;
  const f4Shap = emiPct > 40 ? +10 :
                 emiPct > 30 ? +6  :
                 emiPct > 20 ? +2  : -2;
  features.push({
    featureName: 'EMI-to-income ratio',
    featureKey: 'emi_income_ratio',
    rawValue: `${Math.round(emiPct)}% of monthly income`,
    shapValue: f4Shap,
    direction: f4Shap > 0 ? 'increase' : 'decrease',
    impact: f4Shap >= 8 ? 'high' : f4Shap >= 4 ? 'medium' : 'low',
    explanation: emiPct > 40
      ? 'EMI exceeds 40% of monthly income — above the safe threshold of 30-35%.'
      : `EMI is ${Math.round(emiPct)}% of income, which is ${emiPct < 30 ? 'within' : 'slightly above'} the safe range.`,
  });

  // --- Feature 5: Credit score ---
  const creditScore = customer.creditScore;
  const f5Shap = creditScore > 750 ? -8  :
                 creditScore > 700 ? -5  :
                 creditScore > 650 ? -2  :
                 creditScore > 600 ? +3  : +7;
  features.push({
    featureName: 'Credit score',
    featureKey: 'credit_score',
    rawValue: `${creditScore}`,
    shapValue: f5Shap,
    direction: f5Shap > 0 ? 'increase' : 'decrease',
    impact: Math.abs(f5Shap) >= 6 ? 'high' : Math.abs(f5Shap) >= 3 ? 'medium' : 'low',
    explanation: creditScore > 750
      ? 'Excellent credit score indicates strong historical repayment behaviour.'
      : creditScore < 620
      ? 'Low credit score suggests past repayment difficulties.'
      : `Credit score of ${creditScore} is ${creditScore > 700 ? 'good' : 'average'}.`,
  });

  // --- Feature 6: Average 90-day balance ---
  const avgSpend = trend.reduce((s, m) => s + m.amount, 0) / trend.length;
  const impliedAvgBalance = customer.monthlyIncome - avgSpend;
  const f6Shap = impliedAvgBalance > 20000 ? -6  :
                 impliedAvgBalance > 10000 ? -3  :
                 impliedAvgBalance > 5000  ? -1  :
                 impliedAvgBalance > 0     ? +2  : +5;
  features.push({
    featureName: 'Avg monthly balance',
    featureKey: 'avg_balance',
    rawValue: `₹${Math.max(0, Math.round(impliedAvgBalance)).toLocaleString('en-IN')}`,
    shapValue: f6Shap,
    direction: f6Shap > 0 ? 'increase' : 'decrease',
    impact: Math.abs(f6Shap) >= 4 ? 'medium' : 'low',
    explanation: impliedAvgBalance > 10000
      ? 'Consistent positive balance history suggests financial discipline.'
      : 'Thin or negative implied balance history is a moderate risk indicator.',
  });

  // --- Feature 7: Loan tenure remaining ---
  const loanStart = new Date(customer.loanStartDate);
  const monthsElapsed = Math.floor(
    (Date.now() - loanStart.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  const monthsRemaining = Math.max(0, customer.loanTenureMonths - monthsElapsed);
  const tenurePct = monthsElapsed / customer.loanTenureMonths;
  const f7Shap = tenurePct < 0.1 ? +4
               : tenurePct > 0.8 ? -4
               : +1;
  features.push({
    featureName: 'Loan tenure remaining',
    featureKey: 'tenure_remaining',
    rawValue: `${monthsRemaining} months left`,
    shapValue: f7Shap,
    direction: f7Shap > 0 ? 'increase' : 'decrease',
    impact: 'low',
    explanation: tenurePct < 0.1
      ? 'Early stage of the loan where default rates are historically higher.'
      : tenurePct > 0.8
      ? 'Near the end of the loan term — customers typically maintain payments here.'
      : 'Mid-tenure phase with neutral impact on miss probability.',
  });

  // Sort by absolute SHAP value descending
  features.sort((a, b) => Math.abs(b.shapValue) - Math.abs(a.shapValue));

  const sumShap = features.reduce((s, f) => s + f.shapValue, 0);
  const finalScore = Math.min(100, Math.max(0, Math.round(baseline + sumShap)));

  const modelConfidence = Math.min(97, Math.max(60,
    85 + (Math.abs(finalScore - 50) * 0.25)
  ));

  return {
    baselineScore: baseline,
    finalScore,
    features,
    modelConfidence: Math.round(modelConfidence),
    contextWindowDays: 90,
    computedAt: new Date().toISOString(),
  };
}

export function getShapSummary(shap: ShapResult, customer: Customer): string {
  const topDrivers = shap.features.filter(f => f.shapValue > 0).slice(0, 2);
  const topMitigators = shap.features.filter(f => f.shapValue < 0).slice(0, 1);

  const driverText = topDrivers.map(f => f.featureName.toLowerCase()).join(' and ');
  const mitigatorText = topMitigators.length > 0
    ? ` ${topMitigators[0].featureName} (${topMitigators[0].rawValue}) provides a partial mitigating effect.`
    : '';

  return `${customer.name}'s risk score of ${shap.finalScore}/100 is primarily driven by ${driverText}.` +
    ` Assessed savings of ₹${customer.assessedSavings.toLocaleString('en-IN')} cover only` +
    ` ${Math.round((customer.assessedSavings / customer.emiAmount) * 100)}% of the` +
    ` ₹${customer.emiAmount.toLocaleString('en-IN')} EMI due on the ${customer.emiDueDate}th.` +
    mitigatorText;
}
