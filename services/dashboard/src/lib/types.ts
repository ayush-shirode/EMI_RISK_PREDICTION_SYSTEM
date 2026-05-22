export interface Prediction {
  _id?: string;
  prediction_id: string;
  user_id: string;
  risk_score: number;
  miss_probability: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reasoning: string;
  suggestions: string[];
  warning_flags: string[];
  emi_due_date: string;
  emi_amount: number;
  model_version: string;
  created_at: string;
}

export interface SpendTrend {
  month: string;
  amount: number;
}
