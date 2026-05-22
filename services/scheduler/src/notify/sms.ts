export interface SendSMSOptions {
  to: string;
  message: string;
}

export async function sendSMS(options: SendSMSOptions): Promise<void> {
  console.log('\n==================================================');
  console.log('[MOCK SMS SENT]');
  console.log(`To:      ${options.to}`);
  console.log(`Message: ${options.message}`);
  console.log('==================================================\n');
}
