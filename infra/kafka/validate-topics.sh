#!/bin/bash
echo "Listing all Kafka topics..."
docker exec kafka kafka-topics.sh --bootstrap-server localhost:9092 --list
echo ""
echo "Topic details:"
docker exec kafka kafka-topics.sh --bootstrap-server localhost:9092 --describe
