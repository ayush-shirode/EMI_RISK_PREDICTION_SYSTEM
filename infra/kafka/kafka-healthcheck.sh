#!/bin/bash
# Simple script for checking Kafka broker health status
kafka-topics.sh --bootstrap-server localhost:9092 --list &>/dev/null
