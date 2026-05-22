import { Kafka } from 'kafkajs';
import { EnrichedPrediction } from '../types';

const kafkaBroker = process.env.KAFKA_BROKER || 'kafka:9092';
const kafka = new Kafka({
  clientId: 'ai-engine',
  brokers: [kafkaBroker],
});
const producer = kafka.producer();
let isConnected = false;

export async function publishToKafka(prediction: EnrichedPrediction): Promise<void> {
  console.log(`[AI Engine] Publishing prediction alert to Kafka risk-alerts topic for user ${prediction.user_id}...`);
  if (!isConnected) {
    await producer.connect();
    isConnected = true;
  }
  await producer.send({
    topic: 'risk-alerts',
    messages: [
      {
        key: prediction.user_id,
        value: JSON.stringify(prediction),
      },
    ],
  });
}
