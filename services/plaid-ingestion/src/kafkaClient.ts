import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';

dotenv.config();

const kafka = new Kafka({
  clientId: 'plaid-ingestion-service',
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
});

export const producer = kafka.producer();

export async function connectKafka(): Promise<void> {
  console.log('Connecting to Kafka producer...');
  await producer.connect();
  console.log('Kafka producer connected successfully.');
}

export async function disconnectKafka(): Promise<void> {
  console.log('Disconnecting Kafka producer...');
  await producer.disconnect();
  console.log('Kafka producer disconnected.');
}
