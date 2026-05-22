import { plaidClient } from './plaidClient';
import { producer } from './kafkaClient';
import { KafkaMessageEnvelope } from './types';

export async function fetchTransactions(): Promise<void> {
  try {
    const accessToken = process.env.PLAID_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error('PLAID_ACCESS_TOKEN environment variable is not set');
    }

    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const startDateStr = formatDate(thirtyDaysAgo);
    const endDateStr = formatDate(today);

    console.log(`[Plaid Ingestion] Fetching Plaid transactions from ${startDateStr} to ${endDateStr}...`);

    const response = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDateStr,
      end_date: endDateStr,
      options: {
        count: 500,
        offset: 0,
      },
    });

    const envelope: KafkaMessageEnvelope = {
      eventType: 'transaction.batch',
      source: 'plaid-sandbox',
      userId: 'sandbox-user-001',
      timestamp: new Date().toISOString(),
      payload: {
        transactions: response.data.transactions,
        accounts: response.data.accounts,
        item: response.data.item,
        total_transactions: response.data.total_transactions,
      },
    };

    console.log(`[Plaid Ingestion] Publishing ${response.data.transactions.length} transactions to raw-transactions Kafka topic...`);
    await producer.send({
      topic: 'raw-transactions',
      messages: [
        {
          key: 'sandbox-user-001',
          value: JSON.stringify(envelope),
        },
      ],
    });

    console.log('[Plaid Ingestion] Successfully published transaction batch to raw-transactions topic.');

  } catch (error: any) {
    const errorDetails = error.response?.data || error.message || error;
    console.error('[Plaid Ingestion] Error in fetchTransactions:', JSON.stringify(errorDetails));
  }
}

export async function fetchIdentity(): Promise<void> {
  try {
    const accessToken = process.env.PLAID_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error('PLAID_ACCESS_TOKEN environment variable is not set');
    }

    console.log('[Plaid Ingestion] Fetching Plaid identity details...');
    const response = await plaidClient.identityGet({
      access_token: accessToken,
    });

    console.log('[Plaid Ingestion] Plaid Identity Data (Log only, used for enrichment):');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error: any) {
    const errorDetails = error.response?.data || error.message || error;
    console.error('[Plaid Ingestion] Error in fetchIdentity:', JSON.stringify(errorDetails));
  }
}
