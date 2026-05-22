import { connectDB, SpendTrend } from '@emi/db';

export async function aggregateTrends() {
  console.log('[Scheduler] Compiling spend trends...');
  const mongoUri = process.env.MONGO_URI || 'mongodb://mongodb:27017/emi_system';
  await connectDB(mongoUri);

  // We compile historical spend trends for user_123 (the seeded profile)
  const userId = 'user_123';
  
  const mockTrends = [
    {
      period: '2025-12',
      total_spend: 32400,
      avg_daily_spend: 1045,
      by_category: [
        { category: 'food and drink', amount: 8400 },
        { category: 'transfer', amount: 15000 },
        { category: 'travel', amount: 4000 },
        { category: 'utilities', amount: 5000 }
      ],
      vs_previous_month: 0
    },
    {
      period: '2026-01',
      total_spend: 48900,
      avg_daily_spend: 1577,
      by_category: [
        { category: 'food and drink', amount: 12900 },
        { category: 'transfer', amount: 20000 },
        { category: 'travel', amount: 6000 },
        { category: 'utilities', amount: 10000 }
      ],
      vs_previous_month: 50.9
    },
    {
      period: '2026-02',
      total_spend: 29500,
      avg_daily_spend: 1053,
      by_category: [
        { category: 'food and drink', amount: 6500 },
        { category: 'transfer', amount: 15000 },
        { category: 'travel', amount: 3000 },
        { category: 'utilities', amount: 5000 }
      ],
      vs_previous_month: -39.7
    },
    {
      period: '2026-03',
      total_spend: 41200,
      avg_daily_spend: 1329,
      by_category: [
        { category: 'food and drink', amount: 10200 },
        { category: 'transfer', amount: 18000 },
        { category: 'travel', amount: 5000 },
        { category: 'utilities', amount: 8000 }
      ],
      vs_previous_month: 39.6
    },
    {
      period: '2026-04',
      total_spend: 37600,
      avg_daily_spend: 1253,
      by_category: [
        { category: 'food and drink', amount: 9600 },
        { category: 'transfer', amount: 15000 },
        { category: 'travel', amount: 4000 },
        { category: 'utilities', amount: 9000 }
      ],
      vs_previous_month: -8.7
    },
    {
      period: '2026-05',
      total_spend: 35000,
      avg_daily_spend: 1129,
      by_category: [
        { category: 'food and drink', amount: 8000 },
        { category: 'transfer', amount: 15000 },
        { category: 'travel', amount: 3500 },
        { category: 'utilities', amount: 8500 }
      ],
      vs_previous_month: -6.9
    }
  ];

  for (const trend of mockTrends) {
    try {
      await SpendTrend.findOneAndUpdate(
        { user_id: userId, period: trend.period },
        {
          ...trend,
          computed_at: new Date()
        },
        { upsert: true, new: true }
      );
    } catch (err: any) {
      console.error(`[Scheduler] Failed upserting trend for period ${trend.period}:`, err.message);
    }
  }

  console.log(`[Scheduler] Spend trends aggregated successfully inside MongoDB for user ${userId}`);
}
