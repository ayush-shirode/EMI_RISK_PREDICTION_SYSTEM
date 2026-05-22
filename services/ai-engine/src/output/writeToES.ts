import { Client } from '@elastic/elasticsearch';
import { EnrichedPrediction } from '../types';

const es = new Client({ node: process.env.ES_URL || 'http://elasticsearch:9200' });

export async function writeToES(prediction: EnrichedPrediction): Promise<void> {
  console.log(`[AI Engine] Saving prediction to Elasticsearch risk-signals index for user ${prediction.user_id}...`);
  await es.index({
    index: 'risk-signals',
    id: prediction.prediction_id,
    document: prediction,
    refresh: true, // make searchable immediately for test verification
  });
}
