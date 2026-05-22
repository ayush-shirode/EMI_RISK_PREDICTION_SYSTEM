import axios from 'axios';
import { connectDB } from '@emi/db';
import { Prediction } from '@emi/db';

export async function nightlyRescore() {
  console.log('[Scheduler] Starting nightly rescore...');
  const mongoUri = process.env.MONGO_URI || 'mongodb://mongodb:27017/emi_system';
  await connectDB(mongoUri);

  // Get all unique user IDs that have had predictions
  let users = await Prediction.distinct('user_id');
  
  if (!users || users.length === 0) {
    console.log('[Scheduler] No active users in Predictions log. Defaulting rescore test to: user_123');
    users = ['user_123'];
  }
  
  for (const userId of users) {
    try {
      console.log(`[Scheduler] Dispatching prediction request for user ${userId} to AI engine...`);
      await axios.post(`${process.env.AI_ENGINE_URL}/predict`, {
        userId,
        emiAmount: parseFloat(process.env.DEFAULT_EMI_AMOUNT || '15000'),
        emiDueDate: getNextEMIDate(),
      });
      console.log(`[Scheduler] Rescored user: ${userId}`);
      // Throttle — don't hammer Ollama
      await new Promise(r => setTimeout(r, 3000));
    } catch (err: any) {
      console.error(`[Scheduler] Failed for user ${userId}:`, err.message);
    }
  }
}

function getNextEMIDate(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  date.setDate(5); // Assume EMI due on 5th of each month
  return date.toISOString().split('T')[0];
}
