import express from 'express';
import { runPrediction } from './prediction/predict';
import { Client } from '@elastic/elasticsearch';

const app = express();
app.use(express.json());

const port = process.env.PORT || 3002;
const es = new Client({ node: process.env.ES_URL || 'http://elasticsearch:9200' });

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// POST /predict endpoint
app.post('/predict', async (req, res) => {
  const { userId, emiAmount, emiDueDate } = req.body;
  
  if (!userId || emiAmount === undefined || !emiDueDate) {
    return res.status(400).json({ error: 'Missing required parameters: userId, emiAmount, emiDueDate' });
  }

  try {
    console.log(`[AI Engine] Triggering prediction for user ${userId}, EMI: ₹${emiAmount}, due: ${emiDueDate}...`);
    const result = await runPrediction(userId, Number(emiAmount), emiDueDate);
    res.status(200).json(result);
  } catch (error: any) {
    console.error(`[AI Engine] Prediction failed:`, error.message || error);
    res.status(500).json({ error: 'Prediction run failed', details: error.message || error });
  }
});

// GET /predict/:userId/latest endpoint
app.get('/predict/:userId/latest', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const searchRes = await es.search({
      index: 'risk-signals',
      body: {
        query: { term: { user_id: userId } },
        sort: [{ created_at: 'desc' }],
        size: 1,
      },
    });

    const docs = searchRes.hits.hits;
    if (docs.length === 0) {
      return res.status(404).json({ error: `No predictions found for user ${userId}` });
    }
    
    res.status(200).json(docs[0]._source);
  } catch (error: any) {
    console.error(`[AI Engine] Fetching latest prediction failed:`, error.message || error);
    res.status(500).json({ error: 'Failed to fetch latest prediction', details: error.message || error });
  }
});

app.listen(port, () => {
  console.log(`[AI Engine] Service listening on port ${port}`);
});
