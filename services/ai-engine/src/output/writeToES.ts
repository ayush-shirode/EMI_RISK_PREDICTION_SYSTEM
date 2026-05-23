import { Client } from '@elastic/elasticsearch';
import { EnrichedPrediction } from '../types';

const es = new Client({ node: process.env.ES_URL || 'http://elasticsearch:9200' });

export async function writeToES(prediction: EnrichedPrediction): Promise<void> {
  console.log(`[AI Engine] Saving prediction to Elasticsearch risk-signals index for user ${prediction.user_id}...`);
  try {
    await es.index({
      index: 'risk-signals',
      id: prediction.prediction_id,
      document: prediction,
      refresh: true,
    });
    console.log(`[AI Engine] Elasticsearch write OK for prediction ${prediction.prediction_id}`);
  } catch (err: any) {
    // Handle disk flood-stage watermark / read-only block gracefully.
    // This error means ES has exceeded its disk threshold and locked the index.
    // We log it as a warning and continue — MongoDB and Kafka still receive the prediction.
    const errMsg: string = err?.message || String(err);
    if (
      errMsg.includes('cluster_block_exception') ||
      errMsg.includes('TOO_MANY_REQUESTS') ||
      errMsg.includes('read-only') ||
      errMsg.includes('flood-stage')
    ) {
      console.warn(
        `[AI Engine] ⚠️  Elasticsearch index is READ-ONLY (disk full / flood-stage watermark reached). ` +
        `Prediction will be persisted to MongoDB only. ` +
        `Fix: run "curl -X PUT http://localhost:9200/_cluster/settings -H 'Content-Type: application/json' ` +
        `-d '{\\"persistent\\":{\\"cluster.routing.allocation.disk.watermark.flood_stage\\":\\"99%\\"}}'" ` +
        `OR free up disk space and run "curl -X DELETE http://localhost:9200/_all/_block/write".\n` +
        `Original error: ${errMsg}`
      );
      // Do NOT re-throw — let the prediction succeed via MongoDB/Kafka
    } else {
      // Unexpected ES error — re-throw for upstream handling
      throw err;
    }
  }
}
