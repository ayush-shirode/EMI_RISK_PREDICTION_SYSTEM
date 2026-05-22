#!/bin/bash

# Run the topic creation loop in the background so the script exits immediately,
# allowing the Bitnami entrypoint to proceed with starting the Kafka server.
(
  echo "Waiting for Kafka to be ready..."
  until kafka-topics.sh --bootstrap-server localhost:9092 --list &>/dev/null; do
    echo "Kafka is not ready yet. Retrying in 2 seconds..."
    sleep 2
  done

  echo "Kafka is ready! Creating topics..."

  # Create raw-transactions topic (3 partitions, 1 replication, 7 days = 604800000 ms retention)
  kafka-topics.sh --create --if-not-exists --bootstrap-server localhost:9092 --replication-factor 1 --partitions 3 --topic raw-transactions --config retention.ms=604800000

  # Create balance-updates topic (3 partitions, 1 replication, 3 days = 259200000 ms retention)
  kafka-topics.sh --create --if-not-exists --bootstrap-server localhost:9092 --replication-factor 1 --partitions 3 --topic balance-updates --config retention.ms=259200000

  # Create risk-alerts topic (1 partition, 1 replication, 30 days = 2592000000 ms retention)
  kafka-topics.sh --create --if-not-exists --bootstrap-server localhost:9092 --replication-factor 1 --partitions 1 --topic risk-alerts --config retention.ms=2592000000

  # Create processed-events topic (3 partitions, 1 replication, 7 days = 604800000 ms retention)
  kafka-topics.sh --create --if-not-exists --bootstrap-server localhost:9092 --replication-factor 1 --partitions 3 --topic processed-events --config retention.ms=604800000

  echo "All Kafka topics successfully created!"
) &
