import nodemailer from 'nodemailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.log('\n==================================================');
    console.log('[MOCK EMAIL SENT]');
    console.log(`To:      ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log('Body:');
    console.log(options.html.trim());
    console.log('==================================================\n');
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });

  console.log(`[Email] Sending email to ${options.to}...`);
  await transporter.sendMail({
    from: `"Vigilance AI early warning" <${user}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
  console.log(`[Email] Email successfully dispatched to ${options.to}`);
}
