import { Prediction } from './prediction/schema';

export interface EnrichedPrediction extends Prediction {
  user_id: string;
  prediction_id: string;
  emi_due_date: string;
  emi_amount: number;
  model_version: string;
  created_at: string;
}
