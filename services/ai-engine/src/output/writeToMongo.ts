import { MongoClient } from 'mongodb';
import { EnrichedPrediction } from '../types';

const mongoUri = process.env.MONGO_URI || 'mongodb://mongodb:27017/emi_system';
let client: MongoClient | null = null;

async function getMongoClient(): Promise<MongoClient> {
  if (!client) {
    client = new MongoClient(mongoUri);
    await client.connect();
  }
  return client;
}

export async function writeToMongo(prediction: EnrichedPrediction): Promise<void> {
  console.log(`[AI Engine] Saving prediction to MongoDB predictions collection for user ${prediction.user_id}...`);
  const mongoClient = await getMongoClient();
  const db = mongoClient.db();
  const predictionsCollection = db.collection('predictions');
  
  await predictionsCollection.updateOne(
    { prediction_id: prediction.prediction_id },
    { $set: prediction },
    { upsert: true }
  );
}
