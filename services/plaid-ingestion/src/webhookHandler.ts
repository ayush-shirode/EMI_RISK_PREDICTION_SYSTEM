import { Request, Response } from 'express';
import { fetchTransactions, fetchIdentity } from './fetchTransactions';
import { fetchBalances } from './fetchBalances';

export async function handleWebhook(req: Request, res: Response): Promise<void> {
  try {
    const payload = req.body;
    console.log('[Plaid Ingestion] Received Plaid webhook:', JSON.stringify(payload, null, 2));

    const { webhook_type, webhook_code } = payload;

    // Plaid expects a 200 OK response quickly to prevent retries
    res.status(200).json({ status: 'received' });

    // Handle processing asynchronously to avoid blocking the HTTP response
    if (webhook_type === 'TRANSACTIONS') {
      console.log(`[Plaid Ingestion] Webhook of type TRANSACTIONS (${webhook_code}) received. Triggering real-time transaction and balance ingest...`);
      // Trigger updates asynchronously
      fetchTransactions();
      fetchBalances();
    } else if (webhook_type === 'ITEM') {
      console.log(`[Plaid Ingestion] Webhook of type ITEM (${webhook_code}) received. Triggering balance and identity updates...`);
      fetchBalances();
      fetchIdentity();
    } else {
      console.log(`[Plaid Ingestion] Unhandled webhook type: ${webhook_type}`);
    }

  } catch (error: any) {
    console.error('[Plaid Ingestion] Error handling webhook:', error.message || error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
