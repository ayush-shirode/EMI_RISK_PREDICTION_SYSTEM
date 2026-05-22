const { Client } = require('@elastic/elasticsearch');

const client = new Client({ node: process.env.ES_URL || 'http://elasticsearch:9200' });

async function waitForES() {
  for (let i = 0; i < 30; i++) {
    try {
      await client.ping();
      console.log('Elasticsearch is up');
      return;
    } catch (err) {
      console.log(`Waiting for ES... attempt ${i + 1}`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  throw new Error('Elasticsearch did not start in time');
}

async function createILMPolicies() {
  try {
    await client.ilm.putLifecycle({
      name: 'emi-short-lifecycle',
      body: {
        policy: {
          phases: {
            hot:    { min_age: '0ms', actions: { rollover: { max_age: '7d', max_size: '5gb' } } },
            delete: { min_age: '30d', actions: { delete: {} } }
          }
        }
      }
    });
    console.log('Created or updated ILM policy: emi-short-lifecycle');

    await client.ilm.putLifecycle({
      name: 'emi-long-lifecycle',
      body: {
        policy: {
          phases: {
            hot:    { min_age: '0ms', actions: { rollover: { max_age: '30d' } } },
            delete: { min_age: '90d', actions: { delete: {} } }
          }
        }
      }
    });
    console.log('Created or updated ILM policy: emi-long-lifecycle');
  } catch (error) {
    console.error('Error creating ILM policies:', error.message || error);
    throw error;
  }
}

async function createIndices() {
  const indices = [
    { name: 'transactions-current', mapping: require('./mappings/transactions.json') },
    { name: 'balances-current',     mapping: require('./mappings/balances.json') },
    { name: 'risk-signals',         mapping: require('./mappings/risk-signals.json') },
  ];

  for (const { name, mapping } of indices) {
    try {
      const exists = await client.indices.exists({ index: name });
      if (!exists) {
        await client.indices.create({ index: name, body: mapping });
        console.log(`Created index: ${name}`);
      } else {
        console.log(`Index already exists: ${name}`);
      }
    } catch (error) {
      console.error(`Error processing index ${name}:`, error.message || error);
      throw error;
    }
  }
}

(async () => {
  try {
    await waitForES();
    await createILMPolicies();
    await createIndices();
    console.log('Elasticsearch initialisation complete');
  } catch (err) {
    console.error('Bootstrapping failed:', err.message || err);
    process.exit(1);
  }
})();
