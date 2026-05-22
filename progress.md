# Project Progress — Early Warning Credit Risk & EMI Stress Prediction System

**Last Updated:** 2026-05-22
**Overall Status:** 🟡 In Progress

---

## How to Use This File
- Every AI session MUST read this file first before touching any code
- Every AI session MUST update the relevant section when done
- Never re-implement anything marked [COMPLETE]
- Skip reading files in: node_modules, dist, build, .next, coverage, .git

---

## RAM Budget Summary (16 GB machine)

| Service | Limit | Status |
|---|---|---|
| Zookeeper | 384 MB | 🟢 |
| Kafka | 768 MB | 🟢 |
| Kafka UI | 256 MB | 🟢 |
| Elasticsearch | 1,536 MB | ⬜ |
| Kibana | 768 MB | ⬜ |
| Logstash | 768 MB | ⬜ |
| Ollama | 4,096 MB | ⬜ |
| MongoDB | 512 MB | ⬜ |
| Mongo Express | 128 MB | ⬜ |
| AI Engine | 512 MB | ⬜ |
| Plaid Ingestion | 256 MB | 🟢 |
| Dashboard | 768 MB | ⬜ |
| Scheduler | 256 MB | ⬜ |
| **Total** | **~11.5 GB** | |

---

## Step 1 — Plaid Data Ingestion [COMPLETE]
**Status:** 🟢 COMPLETE

**Files to create:**
- [x] services/plaid-ingestion/Dockerfile
- [x] services/plaid-ingestion/package.json
- [x] services/plaid-ingestion/src/index.ts
- [x] services/plaid-ingestion/src/plaidClient.ts
- [x] services/plaid-ingestion/src/kafkaClient.ts
- [x] services/plaid-ingestion/src/fetchTransactions.ts
- [x] services/plaid-ingestion/src/fetchBalances.ts
- [x] services/plaid-ingestion/src/webhookHandler.ts

**Notes:**
- Built a Dockerised Node.js/TypeScript service that connects to the Plaid Sandbox API.
- Implemented periodic data fetching (5-minute cron) for `/transactions/get` (pushes raw transactions array to Kafka topic `raw-transactions`), `/accounts/balance/get` (pushes account balance snapshots to Kafka topic `balance-updates`), and `/identity/get` (logs identity data for enrichment).
- Built a robust Express-based POST `/webhook` route at port 3001 to handle real-time Plaid webhooks and asynchronously trigger ingestion.
- Built and validated with a multi-stage slim Docker image respecting the memory constraint (<256MB).
- Integrated the service block with Zookeeper and Kafka into the root `docker-compose.yml` to lay the groundwork for Step 2.

---

## Step 2 — Kafka Infrastructure [COMPLETE]
**Status:** 🟢 COMPLETE

**Files to create:**
- [x] docker-compose.yml (root — Kafka/Zookeeper blocks)
- [x] infra/kafka/validate-topics.sh

**Kafka Topics:**
- [x] raw-transactions (3 partitions)
- [x] balance-updates (3 partitions)
- [x] risk-alerts (1 partition)
- [x] processed-events (3 partitions)

**Notes:**
- Successfully created a resource-tuned, lightweight event streaming cluster using legacy Bitnami Zookeeper and Kafka images (due to Bitnami's late 2025 catalog transition).
- Created a background startup initialization script `infra/kafka/kafka-setup.sh` that polling-waits for Kafka and configures the 4 required topics with precise partition counts and retention intervals.
- Integrated healthy checking logic using `infra/kafka/kafka-healthcheck.sh` and port listening controls.
- Configured a Kafka UI service container on port 8080.
- Implemented and executed the validation script `infra/kafka/validate-topics.sh` to confirm topics exist and meet standard replication and retention configurations.

---

## Step 3 — Logstash Pipeline
**Status:** ⬜ NOT STARTED

**Files to create:**
- [ ] infra/logstash/Dockerfile
- [ ] infra/logstash/config/logstash.yml
- [ ] infra/logstash/pipeline/01-transactions.conf
- [ ] infra/logstash/pipeline/02-balances.conf
- [ ] infra/logstash/pipeline/03-dead-letter.conf

**Notes:** [AI fills in after completion]

---

## Step 4 — Elasticsearch + Kibana
**Status:** ⬜ NOT STARTED

**Files to create:**
- [ ] infra/elasticsearch/init/index.js
- [ ] infra/elasticsearch/init/package.json
- [ ] infra/elasticsearch/init/mappings/transactions.json
- [ ] infra/elasticsearch/init/mappings/balances.json
- [ ] infra/elasticsearch/init/mappings/risk-signals.json

**ES Indices:**
- [ ] transactions-current
- [ ] balances-current
- [ ] risk-signals

**Notes:** [AI fills in after completion]

---

## Step 5 — Ollama AI Prediction Engine
**Status:** ⬜ NOT STARTED

**Files to create:**
- [ ] services/ai-engine/Dockerfile
- [ ] services/ai-engine/package.json
- [ ] services/ai-engine/src/index.ts
- [ ] services/ai-engine/src/ollama/ollamaClient.ts
- [ ] services/ai-engine/src/ollama/prompt.ts
- [ ] services/ai-engine/src/retrieval/esRetriever.ts
- [ ] services/ai-engine/src/retrieval/contextBuilder.ts
- [ ] services/ai-engine/src/prediction/predict.ts
- [ ] services/ai-engine/src/prediction/schema.ts
- [ ] services/ai-engine/src/output/writeToES.ts
- [ ] services/ai-engine/src/output/writeToMongo.ts
- [ ] services/ai-engine/src/output/publishToKafka.ts

**Notes:** [AI fills in after completion]

---

## Step 6 — Next.js Dashboard
**Status:** ⬜ NOT STARTED

**Files to create:**
- [ ] services/dashboard/Dockerfile
- [ ] services/dashboard/src/app/page.tsx
- [ ] services/dashboard/src/app/layout.tsx
- [ ] services/dashboard/src/app/api/risk/route.ts
- [ ] services/dashboard/src/app/api/trends/route.ts
- [ ] services/dashboard/src/app/api/suggestions/route.ts
- [ ] services/dashboard/src/app/api/alerts/route.ts
- [ ] services/dashboard/src/components/RiskGauge.tsx
- [ ] services/dashboard/src/components/SpendTrendChart.tsx
- [ ] services/dashboard/src/components/SuggestionCards.tsx
- [ ] services/dashboard/src/components/AlertTimeline.tsx
- [ ] services/dashboard/src/hooks/useRiskPolling.ts
- [ ] services/dashboard/src/lib/mongodb.ts

**Notes:** [AI fills in after completion]

---

## Step 7 — MongoDB Persistence
**Status:** ⬜ NOT STARTED

**Files to create:**
- [ ] infra/mongodb/init/01-init.js
- [ ] packages/db/src/connection.ts
- [ ] packages/db/src/models/Prediction.ts
- [ ] packages/db/src/models/SpendTrend.ts
- [ ] packages/db/src/models/Suggestion.ts
- [ ] packages/db/src/models/AlertLog.ts
- [ ] packages/db/src/index.ts

**Notes:** [AI fills in after completion]

---

## Step 8 — Scheduler, Notifications & Final Compose
**Status:** ⬜ NOT STARTED

**Files to create:**
- [ ] services/scheduler/Dockerfile
- [ ] services/scheduler/src/index.ts
- [ ] services/scheduler/src/jobs/nightlyRescore.ts
- [ ] services/scheduler/src/jobs/aggregateTrends.ts
- [ ] services/scheduler/src/jobs/sendAlerts.ts
- [ ] services/scheduler/src/notify/email.ts
- [ ] docker-compose.yml (final complete version)
- [ ] Makefile
- [ ] .env.example

**Notes:** [AI fills in after completion]

---

## Known Issues / Blockers
[AI documents anything blocking progress here]

---

## Environment Variables Needed From Human
- [ ] PLAID_CLIENT_ID — from Plaid dashboard
- [ ] PLAID_SECRET — from Plaid dashboard  
- [ ] PLAID_ACCESS_TOKEN — generated via curl exchange
- [ ] SMTP credentials — for email alerts
- [ ] ALERT_EMAIL — where to send risk alerts
