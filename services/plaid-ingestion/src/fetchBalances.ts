import { plaidClient } from './plaidClient';
import { producer } from './kafkaClient';
import { KafkaMessageEnvelope } from './types';

export async function fetchBalances(): Promise<void> {
  try {
    const accessToken = process.env.PLAID_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error('PLAID_ACCESS_TOKEN environment variable is not set');
    }

    console.log('[Plaid Ingestion] Fetching Plaid account balances...');

    const response = await plaidClient.accountsBalanceGet({
      access_token: accessToken,
    });

    const envelope: KafkaMessageEnvelope = {
      eventType: 'balance.update',
      source: 'plaid-sandbox',
      userId: 'sandbox-user-001',
      timestamp: new Date().toISOString(),
      payload: {
        accounts: response.data.accounts,
        item: response.data.item,
      },
    };

    console.log(`[Plaid Ingestion] Publishing ${response.data.accounts.length} account balances to balance-updates Kafka topic...`);
    await producer.send({
      topic: 'balance-updates',
      messages: [
        {
          key: 'sandbox-user-001',
          value: JSON.stringify(envelope),
        },
      ],
    });

    console.log('[Plaid Ingestion] Successfully published balance updates to balance-updates topic.');

  } catch (error: any) {
    const errorDetails = error.response?.data || error.message || error;
    console.error('[Plaid Ingestion] Error in fetchBalances:', JSON.stringify(errorDetails));
  }
}
