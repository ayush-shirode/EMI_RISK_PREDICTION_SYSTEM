.PHONY: up down restart logs ps pull-model pull-model-small status clean

up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f --tail=100

ps:
	docker compose ps

pull-model:
	docker exec ollama ollama pull mistral

pull-model-small:
	docker exec ollama ollama pull tinyllama

status:
	@echo "=== Services ===" && docker compose ps
	@echo "\n=== Kafka Topics ===" && docker exec kafka kafka-topics.sh --bootstrap-server localhost:9092 --list 2>/dev/null || echo "Kafka not ready"
	@echo "\n=== ES Indices ===" && curl -s http://localhost:9200/_cat/indices?v 2>/dev/null || echo "ES not ready"

clean:
	docker compose down -v --remove-orphans
