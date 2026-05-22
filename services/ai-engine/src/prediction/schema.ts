import { z } from 'zod';

export const PredictionSchema = z.object({
  risk_score: z.number().int().min(0).max(100),
  miss_probability: z.number().min(0.0).max(1.0),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  reasoning: z.string(),
  suggestions: z.array(z.string()),
  warning_flags: z.array(z.string()),
});

export type Prediction = z.infer<typeof PredictionSchema>;
