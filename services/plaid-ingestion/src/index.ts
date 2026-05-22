import express from 'express';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { connectKafka, disconnectKafka } from './kafkaClient';
import { fetchTransactions, fetchIdentity } from './fetchTransactions';
import { fetchBalances } from './fetchBalances';
import { handleWebhook } from './webhookHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '*/5 * * * *';

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Webhook endpoint
app.post('/webhook', handleWebhook);

async function startServer() {
  try {
    // 1. Connect to Kafka
    await connectKafka();

    // 2. Schedule Cron Job
    console.log(`[Plaid Ingestion] Scheduling cron job with schedule: "${CRON_SCHEDULE}"`);
    cron.schedule(CRON_SCHEDULE, async () => {
      console.log('[Plaid Ingestion] Cron triggered! Running scheduled tasks...');
      await fetchTransactions();
      await fetchBalances();
      await fetchIdentity();
    });

    // 3. Start Express Web Server
    app.listen(PORT, () => {
      console.log(`[Plaid Ingestion] Web server listening on port ${PORT}`);
    });

  } catch (error) {
    console.error('[Plaid Ingestion] Failed to start service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`[Plaid Ingestion] Received ${signal}. Starting graceful shutdown...`);
  try {
    await disconnectKafka();
    console.log('[Plaid Ingestion] Graceful shutdown complete.');
    process.exit(0);
  } catch (err) {
    console.error('[Plaid Ingestion] Error during graceful shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

startServer();
