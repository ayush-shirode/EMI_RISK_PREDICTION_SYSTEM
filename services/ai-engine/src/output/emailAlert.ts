import nodemailer from 'nodemailer';

export interface AlertPayload {
  user_id: string;
  prediction_id: string;
  risk_score: number;
  miss_probability: number;
  severity: string;
  emi_amount: number;
  emi_due_date: string;
  reasoning: string;
  suggestions: string[];
  warning_flags: string[];
}

/**
 * Sends an immediate email alert when the prediction severity is high or critical.
 * Falls back to console logging when SMTP credentials are not configured.
 * Called directly from predict.ts after writing to MongoDB — does NOT wait for the
 * 30-minute scheduler cron cycle.
 */
export async function triggerEmailAlert(prediction: AlertPayload): Promise<void> {
  const alertEmail = process.env.ALERT_EMAIL;
  const smtpHost   = process.env.SMTP_HOST;
  const smtpUser   = process.env.SMTP_USER;
  const smtpPass   = process.env.SMTP_PASS;
  const dashUrl    = process.env.DASHBOARD_URL || 'http://localhost:3001';

  const sevEmoji = prediction.severity === 'critical' ? '🚨' : '⚠️';
  const subject  = `${sevEmoji} EMI Risk Alert — ${prediction.severity.toUpperCase()} | Risk Score: ${prediction.risk_score}/100`;

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .header { background: ${prediction.severity === 'critical' ? '#7f1d1d' : '#7c2d12'}; color: #ffffff; padding: 24px 28px; }
  .header h1 { margin: 0; font-size: 20px; }
  .header p  { margin: 4px 0 0; font-size: 13px; opacity: 0.85; }
  .body { padding: 24px 28px; }
  .metric { display: inline-block; background: #f8f8f8; border: 1px solid #e0e0e0; border-radius: 6px; padding: 10px 16px; margin: 6px 6px 6px 0; min-width: 130px; }
  .metric .label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.05em; }
  .metric .value { font-size: 20px; font-weight: 700; color: #111; margin-top: 2px; }
  .reasoning { background: #fef9ec; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 0 6px 6px 0; margin: 18px 0; font-size: 14px; color: #333; line-height: 1.6; }
  .suggestions h3 { font-size: 14px; color: #444; margin-bottom: 8px; }
  .suggestions ul { margin: 0; padding-left: 20px; }
  .suggestions li { font-size: 13px; color: #555; margin-bottom: 6px; line-height: 1.5; }
  .flags { margin-top: 14px; }
  .flag { display: inline-block; background: #fee2e2; color: #991b1b; border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: 700; margin: 2px; }
  .cta { margin-top: 24px; text-align: center; }
  .cta a { background: #0f766e; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 700; font-size: 14px; display: inline-block; }
  .footer { background: #f8f8f8; padding: 14px 28px; font-size: 12px; color: #999; text-align: center; border-top: 1px solid #eee; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>${sevEmoji} EMI Payment Risk Detected</h1>
    <p>Prediction ID: ${prediction.prediction_id} | Generated: ${new Date().toLocaleString('en-IN')}</p>
  </div>
  <div class="body">
    <div>
      <div class="metric">
        <div class="label">User</div>
        <div class="value" style="font-size:14px">${prediction.user_id}</div>
      </div>
      <div class="metric">
        <div class="label">Risk Score</div>
        <div class="value" style="color:${prediction.severity === 'critical' ? '#dc2626' : '#ea580c'}">${prediction.risk_score}/100</div>
      </div>
      <div class="metric">
        <div class="label">Miss Probability</div>
        <div class="value" style="color:${prediction.severity === 'critical' ? '#dc2626' : '#ea580c'}">${(prediction.miss_probability * 100).toFixed(0)}%</div>
      </div>
      <div class="metric">
        <div class="label">EMI Amount</div>
        <div class="value" style="font-size:15px">₹${prediction.emi_amount.toLocaleString('en-IN')}</div>
      </div>
      <div class="metric">
        <div class="label">EMI Due Date</div>
        <div class="value" style="font-size:14px">${prediction.emi_due_date}</div>
      </div>
    </div>

    <div class="reasoning">${prediction.reasoning}</div>

    <div class="suggestions">
      <h3>AI-Recommended Actions</h3>
      <ul>
        ${prediction.suggestions.map(s => `<li>${s}</li>`).join('')}
      </ul>
    </div>

    ${prediction.warning_flags.length > 0 ? `
    <div class="flags">
      ${prediction.warning_flags.map(f => `<span class="flag">${f}</span>`).join('')}
    </div>` : ''}

    <div class="cta">
      <a href="${dashUrl}/prediction?customerId=${prediction.user_id}">View Full AI Analysis →</a>
    </div>
  </div>
  <div class="footer">
    VIGILANCE AI Early Warning System · Auto-generated alert · Do not reply
  </div>
</div>
</body>
</html>`;

  if (!smtpHost || !smtpUser || !smtpPass) {
    // No SMTP configured — print to console (visible in docker logs)
    console.log('\n' + '═'.repeat(60));
    console.log('[VIGILANCE AI] MOCK EMAIL ALERT (configure SMTP to send real emails)');
    console.log(`To:      ${alertEmail || 'user@example.com'}`);
    console.log(`Subject: ${subject}`);
    console.log(`Risk:    ${prediction.risk_score}/100 | ${prediction.severity.toUpperCase()}`);
    console.log(`EMI:     ₹${prediction.emi_amount.toLocaleString('en-IN')} due ${prediction.emi_due_date}`);
    console.log(`Reason:  ${prediction.reasoning}`);
    console.log('Suggestions:');
    prediction.suggestions.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
    console.log('═'.repeat(60) + '\n');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: 587,
    secure: false,
    auth: { user: smtpUser, pass: smtpPass },
  });

  const to = alertEmail || smtpUser;
  console.log(`[AI Engine] Sending risk alert email to ${to}...`);
  await transporter.sendMail({
    from: `"VIGILANCE AI" <${smtpUser}>`,
    to,
    subject,
    html,
  });
  console.log(`[AI Engine] ✓ Alert email dispatched to ${to} (prediction ${prediction.prediction_id})`);
}
