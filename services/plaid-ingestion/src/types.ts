export interface KafkaMessageEnvelope<T = any> {
  eventType: string;
  source: string;
  userId: string;
  timestamp: string;
  payload: T;
}

export type PlaidIngestionEvent = 'transaction.batch' | 'balance.update';
