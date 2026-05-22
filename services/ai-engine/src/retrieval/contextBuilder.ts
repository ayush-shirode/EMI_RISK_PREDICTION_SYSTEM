export function buildContextString(rawContext: any, emiAmount: number): string {
  const balanceDocs = rawContext.balance?.hits?.hits || [];
  const balanceDoc = balanceDocs[0]?._source || {};
  const accountsEnriched = balanceDoc.accounts_enriched || [];

  const txAgg = rawContext.txAgg || {};
  const total90d = txAgg.aggregations?.total_90d?.value || 0;

  const categories = txAgg.aggregations?.by_category?.buckets || [];
  const categorySummary = categories
    .map((b: any) => `- ${b.key}: ₹${(b.total_spend?.value || 0).toFixed(2)}`)
    .join('\n');

  const monthlyBuckets = txAgg.aggregations?.monthly?.buckets || [];
  const monthlySummary = monthlyBuckets
    .map((b: any) => `- ${b.key_as_string ? b.key_as_string.slice(0, 7) : 'Unknown'}: ₹${(b.monthly_total?.value || 0).toFixed(2)}`)
    .join('\n');

  let accountDetails = '';
  accountsEnriched.forEach((acc: any) => {
    accountDetails += `\nAccount ID: ${acc.account_id}
- Name: ${acc.name}
- Type: ${acc.type} (${acc.subtype})
- Current Balance: ₹${acc.current_balance}
- Available Balance: ₹${acc.available_balance}
- Credit Limit: ₹${acc.credit_limit || 0}
- Utilization: ${acc.utilisation_pct || 0}%
- Balance Buffer Days: ${acc.balance_buffer_days || 0} days\n`;
  });

  return `### Account Balances:${accountDetails || '\nNo accounts data available.'}

### Spend Totals (Last 90 Days):
- Total Ingested Spend: ₹${total90d.toFixed(2)}

### Category Spend breakdown (Last 90 Days):
${categorySummary || 'No category transaction aggregates available.'}

### Monthly Spend Trends:
${monthlySummary || 'No monthly transaction aggregates available.'}`;
}
