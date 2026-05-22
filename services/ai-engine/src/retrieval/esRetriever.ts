import { Client } from '@elastic/elasticsearch';

const es = new Client({ node: process.env.ES_URL || 'http://elasticsearch:9200' });

export async function fetchFinancialContext(userId: string, emiDueDate: string, emiAmount: number) {
  // Last 90 days transactions — aggregated by category
  const txAgg = await es.search({
    index: 'transactions-*',
    body: {
      query: {
        bool: {
          must: [
            { term: { user_id: userId } },
            { range: { transaction_ts: { gte: 'now-90d', lte: 'now' } } }
          ]
        }
      },
      aggs: {
        by_category: {
          terms: { field: 'spend_category_primary', size: 10 },
          aggs: { total_spend: { sum: { field: 'spend_amount' } } }
        },
        monthly: {
          date_histogram: { field: 'transaction_ts', calendar_interval: 'month' },
          aggs: { monthly_total: { sum: { field: 'spend_amount' } } }
        },
        total_90d: { sum: { field: 'spend_amount' } }
      },
      size: 0
    }
  });

  // Latest balance snapshot
  const balance = await es.search({
    index: 'balances-*',
    body: {
      query: { term: { user_id: userId } },
      sort: [{ snapshot_at: 'desc' }],
      size: 1
    }
  });

  return { txAgg, balance };
}
