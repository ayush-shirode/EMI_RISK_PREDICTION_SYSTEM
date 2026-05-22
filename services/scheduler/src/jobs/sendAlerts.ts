import { connectDB, Prediction, AlertLog } from '@emi/db';
import { sendEmail } from '../notify/email';

export async function sendAlerts() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://mongodb:27017/emi_system';
  await connectDB(mongoUri);

  console.log('[Scheduler] Checking for pending high/critical risk alerts...');
  
  // Find high/critical predictions not yet notified
  const pending = await Prediction.find({
    severity: { $in: ['high', 'critical'] },
    notified: false,
    created_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  });

  console.log(`[Scheduler] Found ${pending.length} pending critical predictions for alerts dispatch.`);

  for (const pred of pending) {
    try {
      await sendEmail({
        to: process.env.ALERT_EMAIL || 'user@example.com',
        subject: `⚠️ EMI Risk Alert — ${pred.severity.toUpperCase()} (Score: ${pred.risk_score})`,
        html: `
          <h2>Early Warning: EMI Payment Risk Detected</h2>
          <p><strong>User Profile:</strong> ${pred.user_id}</p>
          <p><strong>Risk Score:</strong> ${pred.risk_score}/100</p>
          <p><strong>Miss Probability:</strong> ${(pred.miss_probability * 100).toFixed(1)}%</p>
          <p><strong>EMI Due:</strong> ₹${pred.emi_amount} on ${pred.emi_due_date}</p>
          <h3>AI Suggestions:</h3>
          <ul>${pred.suggestions.map((s: string) => `<li>${s}</li>`).join('')}</ul>
          <p><a href="${process.env.DASHBOARD_URL || 'http://localhost:3000'}">View Dashboard</a></p>
        `
      });

      await Prediction.updateOne({ _id: pred._id }, { notified: true });
      await AlertLog.create({
        alert_id: `alert-${Date.now()}`,
        user_id: pred.user_id,
        prediction_id: pred.prediction_id,
        severity: pred.severity,
        risk_score: pred.risk_score,
        message: `Risk score ${pred.risk_score} — EMI due ${pred.emi_due_date}`,
        channel: 'email',
        status: 'sent',
      });
      console.log(`[Scheduler] Alert logged and prediction notified for user ${pred.user_id}`);
    } catch (err: any) {
      console.error('[Alerts] Failed:', err.message);
    }
  }
}
