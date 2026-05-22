import cron from 'node-cron';
import { nightlyRescore } from './jobs/nightlyRescore';
import { aggregateTrends } from './jobs/aggregateTrends';
import { sendAlerts } from './jobs/sendAlerts';

console.log('[Scheduler] Starting credit-stress scheduler daemon...');

// Nightly rescore at 2:00 AM
cron.schedule('0 2 * * *', () => nightlyRescore().catch(console.error));

// Aggregate spend trends every 6 hours
cron.schedule('0 */6 * * *', () => aggregateTrends().catch(console.error));

// Check and send alerts every 30 minutes
cron.schedule('*/30 * * * *', () => sendAlerts().catch(console.error));

// Run immediately on start for testing
if (process.env.RUN_ON_START === 'true') {
  console.log('[Scheduler] RUN_ON_START active. Triggering immediate runs in 10 seconds...');
  setTimeout(async () => {
    try {
      console.log('[Scheduler] Triggering immediate trend aggregation...');
      await aggregateTrends();
      
      console.log('[Scheduler] Triggering immediate nightly rescore...');
      await nightlyRescore();
      
      console.log('[Scheduler] Triggering immediate alerts dispatcher...');
      await sendAlerts();
    } catch (err: any) {
      console.error('[Scheduler] Immediate start execution failed:', err.message);
    }
  }, 10000); // Wait 10s for dependencies to settle
}

console.log('[Scheduler] All early warning stress cron jobs successfully scheduled');
