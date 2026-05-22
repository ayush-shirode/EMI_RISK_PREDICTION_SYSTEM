export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  accountType: 'salaried' | 'self-employed' | 'business';
  monthlyIncome: number;
  emiAmount: number;
  emiDueDate: string;
  loanType: 'home' | 'car' | 'personal' | 'education';
  loanTenureMonths: number;
  loanStartDate: string;
  creditScore: number;
  riskScore: number;
  missProbability: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  assessedSavings: number;
  spendTrend: { month: string; amount: number }[];
  suggestions: string[];
  lastPredictionAt: string;
}

export const CUSTOMERS: Customer[] = [
  {
    id: 'cust-001',
    name: 'Arjun Sharma',
    email: 'arjun.sharma@example.com',
    phone: '+91 98201 11234',
    city: 'Mumbai',
    accountType: 'salaried',
    monthlyIncome: 85000,
    emiAmount: 18500,
    emiDueDate: '5',
    loanType: 'home',
    loanTenureMonths: 240,
    loanStartDate: '2022-04-01',
    creditScore: 762,
    riskScore: 12,
    missProbability: 0.08,
    severity: 'low',
    assessedSavings: 22000,
    spendTrend: [
      { month: 'Dec 25', amount: 41000 },
      { month: 'Jan 26', amount: 47000 },
      { month: 'Feb 26', amount: 39000 },
      { month: 'Mar 26', amount: 44000 },
      { month: 'Apr 26', amount: 38000 },
      { month: 'May 26', amount: 42000 },
    ],
    suggestions: [
      'Your savings buffer comfortably covers this EMI. Consider a recurring deposit for next quarter.',
      'Spending in Jan was elevated — dining and entertainment categories up 18%. Monitor in June.',
      'Credit utilisation is healthy at 22%. No action needed.',
    ],
    lastPredictionAt: '2026-05-22T08:30:00Z',
  },
  {
    id: 'cust-002',
    name: 'Priya Nair',
    email: 'priya.nair@example.com',
    phone: '+91 94473 22891',
    city: 'Bengaluru',
    accountType: 'salaried',
    monthlyIncome: 62000,
    emiAmount: 9200,
    emiDueDate: '10',
    loanType: 'car',
    loanTenureMonths: 60,
    loanStartDate: '2023-08-01',
    creditScore: 698,
    riskScore: 34,
    missProbability: 0.27,
    severity: 'medium',
    assessedSavings: 8500,
    spendTrend: [
      { month: 'Dec 25', amount: 33000 },
      { month: 'Jan 26', amount: 51000 },
      { month: 'Feb 26', amount: 48000 },
      { month: 'Mar 26', amount: 55000 },
      { month: 'Apr 26', amount: 52000 },
      { month: 'May 26', amount: 57000 },
    ],
    suggestions: [
      'Monthly spend has risen 73% since December. This trend will compress your savings by end of June.',
      'Consider pausing 2-3 discretionary subscriptions (~₹1,400/month) to rebuild buffer before EMI date.',
      'Food delivery spend is ₹6,200 this month — highest in 6 months. Set a ₹3,500 cap.',
    ],
    lastPredictionAt: '2026-05-22T08:31:00Z',
  },
  {
    id: 'cust-003',
    name: 'Rohan Mehta',
    email: 'rohan.mehta@example.com',
    phone: '+91 70121 55674',
    city: 'Pune',
    accountType: 'self-employed',
    monthlyIncome: 110000,
    emiAmount: 32000,
    emiDueDate: '1',
    loanType: 'home',
    loanTenureMonths: 180,
    loanStartDate: '2021-01-01',
    creditScore: 720,
    riskScore: 67,
    missProbability: 0.61,
    severity: 'high',
    assessedSavings: 14000,
    spendTrend: [
      { month: 'Dec 25', amount: 58000 },
      { month: 'Jan 26', amount: 72000 },
      { month: 'Feb 26', amount: 89000 },
      { month: 'Mar 26', amount: 94000 },
      { month: 'Apr 26', amount: 101000 },
      { month: 'May 26', amount: 97000 },
    ],
    suggestions: [
      '⚠️ Assessed savings of ₹14,000 is insufficient to cover the ₹32,000 EMI due on June 1.',
      'Business expense reimbursements pending — chase ₹18,000 in outstanding invoices before month end.',
      'Consider a 7-day spend freeze on non-essential categories to accumulate the required buffer.',
    ],
    lastPredictionAt: '2026-05-22T08:32:00Z',
  },
  {
    id: 'cust-004',
    name: 'Sneha Kulkarni',
    email: 'sneha.kulkarni@example.com',
    phone: '+91 99880 33412',
    city: 'Hyderabad',
    accountType: 'salaried',
    monthlyIncome: 48000,
    emiAmount: 6800,
    emiDueDate: '15',
    loanType: 'education',
    loanTenureMonths: 84,
    loanStartDate: '2020-06-01',
    creditScore: 641,
    riskScore: 88,
    missProbability: 0.84,
    severity: 'critical',
    assessedSavings: 1200,
    spendTrend: [
      { month: 'Dec 25', amount: 29000 },
      { month: 'Jan 26', amount: 33000 },
      { month: 'Feb 26', amount: 38000 },
      { month: 'Mar 26', amount: 42000 },
      { month: 'Apr 26', amount: 45000 },
      { month: 'May 26', amount: 47000 },
    ],
    suggestions: [
      '🚨 CRITICAL: Current savings of ₹1,200 will not cover the ₹6,800 EMI due on June 15.',
      'Contact your loan officer immediately — request a 30-day EMI deferral to avoid a default mark.',
      'Spending has exceeded income for 3 consecutive months. An emergency budget review is required.',
    ],
    lastPredictionAt: '2026-05-22T08:33:00Z',
  },
  {
    id: 'cust-005',
    name: 'Vikram Desai',
    email: 'vikram.desai@example.com',
    phone: '+91 87654 09876',
    city: 'Ahmedabad',
    accountType: 'business',
    monthlyIncome: 195000,
    emiAmount: 45000,
    emiDueDate: '20',
    loanType: 'personal',
    loanTenureMonths: 36,
    loanStartDate: '2024-09-01',
    creditScore: 801,
    riskScore: 5,
    missProbability: 0.03,
    severity: 'low',
    assessedSavings: 112000,
    spendTrend: [
      { month: 'Dec 25', amount: 88000 },
      { month: 'Jan 26', amount: 92000 },
      { month: 'Feb 26', amount: 79000 },
      { month: 'Mar 26', amount: 85000 },
      { month: 'Apr 26', amount: 91000 },
      { month: 'May 26', amount: 86000 },
    ],
    suggestions: [
      'Excellent financial health. Savings buffer is 2.5× the upcoming EMI amount.',
      'You are on track to clear this loan 4 months early at current repayment pace.',
      'Consider increasing SIP contribution by ₹10,000/month given the strong buffer.',
    ],
    lastPredictionAt: '2026-05-22T08:34:00Z',
  },
];

export const SEVERITY_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};

export function getSeverityColor(severity: string): string {
  return SEVERITY_COLORS[severity] ?? '#22c55e';
}
