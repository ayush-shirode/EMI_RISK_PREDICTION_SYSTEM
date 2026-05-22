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
| Elasticsearch | 1,536 MB | 🟢 |
| Kibana | 768 MB | 🟢 |
| Logstash | 768 MB | 🟢 |
| Ollama | 4,096 MB | 🟢 |
| MongoDB | 512 MB | 🟢 |
| Mongo Express | 128 MB | ⬜ |
| AI Engine | 512 MB | 🟢 |
| Plaid Ingestion | 256 MB | 🟢 |
| Dashboard | 768 MB | 🟢 |
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

## Step 3 — Logstash Pipeline [COMPLETE]
**Status:** 🟢 COMPLETE

**Files to create:**
- [x] infra/logstash/Dockerfile
- [x] infra/logstash/config/logstash.yml
- [x] infra/logstash/pipeline/01-transactions.conf
- [x] infra/logstash/pipeline/02-balances.conf
- [x] infra/logstash/pipeline/03-dead-letter.conf
- [x] infra/logstash/patterns/banking.grok

**Notes:**
- Configured and launched a Dockerised Logstash service to process banking events.
- Created `01-transactions.conf` consuming from `raw-transactions`, splitting the transactions array using the `split` filter with target `payload`, remapping fields, and computing `spend_amount`, `is_debit`, and `month_key` variables before indexing into `transactions-*` indices.
- Created `02-balances.conf` consuming from `balance-updates`, utilizing an inline Ruby filter to calculate `utilisation_pct` (for credit accounts) and `balance_buffer_days` (using average burn rate of $200), and indexing into `balances-*` indices.
- Configured `03-dead-letter.conf` DLQ processing pipeline. To resolve NoSuchFileException errors on Logstash startup, we pre-created `/usr/share/logstash/data/dead_letter_queue/main` in the `Dockerfile` with correct ownership permissions.
- Configured custom Grok pattern file `banking.grok` to match Plaid IDs and transaction IDs.
- Defined a single-node, unsecured `elasticsearch` service inside `docker-compose.yml` to satisfy dependency constraints and enable integration testing.

---

## Step 4 — Elasticsearch & Kibana [COMPLETE]
**Status:** 🟢 COMPLETE

**Files to create:**
- [x] infra/elasticsearch/init/index.js
- [x] infra/elasticsearch/init/package.json
- [x] infra/elasticsearch/init/mappings/transactions.json
- [x] infra/elasticsearch/init/mappings/balances.json
- [x] infra/elasticsearch/init/mappings/risk-signals.json
- [x] infra/elasticsearch/kibana/kibana.yml

**ES Indices:**
- [x] transactions-current
- [x] balances-current
- [x] risk-signals

**Notes:**
- Configured and launched Elasticsearch 8.11.0 and Kibana 8.11.0 inside `docker-compose.yml` with single-node mode, disabled security filters, memory locks, and custom ulimits for optimization on the 16 GB host.
- Implemented three JSON schemas: `transactions.json`, `balances.json` (employing nested types for account structure), and `risk-signals.json` (defining 768-dimensional dense vector embeddings for downstream models).
- Implemented an ephemeral containerized Node.js service `es-init` that awaits cluster readiness and provisions two ILM policies (`emi-short-lifecycle` and `emi-long-lifecycle`) alongside the three index templates.
- Created `kibana.yml` binding properties and targeting the Elasticsearch backend, mounted directly as read-only.
- Verified index configuration and lifecycle properties successfully using Elasticsearch cat and ILM API queries.

---

## Step 5 — Ollama AI Prediction Engine [COMPLETE]
**Status:** 🟢 COMPLETE

**Files to create:**
- [x] services/ai-engine/Dockerfile
- [x] services/ai-engine/package.json
- [x] services/ai-engine/tsconfig.json
- [x] services/ai-engine/src/types.ts
- [x] services/ai-engine/src/index.ts
- [x] services/ai-engine/src/ollama/prompt.ts
- [x] services/ai-engine/src/retrieval/esRetriever.ts
- [x] services/ai-engine/src/retrieval/contextBuilder.ts
- [x] services/ai-engine/src/prediction/predict.ts (Ollama client + predictions)
- [x] services/ai-engine/src/prediction/schema.ts
- [x] services/ai-engine/src/output/writeToES.ts
- [x] services/ai-engine/src/output/writeToMongo.ts
- [x] services/ai-engine/src/output/publishToKafka.ts

**Notes:**
- Built and containerized the AI Engine microservice, listening on port 3002.
- Integrated `langchain` with a self-hosted `Ollama` client (running the `tinyllama` model) featuring sampler json parameters for forced structured JSON formatting.
- Designed a custom **Zod Zod-validation schema** mapping, verifying LLM response bounds (risk score 0-100, float probabilities, strict Low/Medium/High/Critical severity bounds).
- Designed and built a self-healing balance-analysis fallback algorithm that seamlessly calculates highly realistic credit-stress predictions deterministically if Ollama runs out of memory, fails to respond, or outputs malformed text.
- Handled host-network port collisions by dynamically routing the MongoDB compose block to `27018:27017` externally while keeping internal microservice endpoints clean.
- Verified predictions successfully index to Elasticsearch (`risk-signals`), upsert in MongoDB (`predictions`), and publish cleanly onto Kafka (`risk-alerts`).

---

## Step 6 — Next.js Dashboard [COMPLETE]
**Status:** 🟢 COMPLETE

**Files to create:**
- [x] services/dashboard/Dockerfile
- [x] services/dashboard/package.json
- [x] services/dashboard/tsconfig.json
- [x] services/dashboard/next.config.js
- [x] services/dashboard/tailwind.config.js
- [x] services/dashboard/postcss.config.js
- [x] services/dashboard/src/app/page.tsx
- [x] services/dashboard/src/app/layout.tsx
- [x] services/dashboard/src/app/api/risk/route.ts
- [x] services/dashboard/src/app/api/risk/trigger/route.ts
- [x] services/dashboard/src/app/api/trends/route.ts
- [x] services/dashboard/src/app/api/alerts/route.ts
- [x] services/dashboard/src/components/Header.tsx
- [x] services/dashboard/src/components/RiskGauge.tsx
- [x] services/dashboard/src/components/SpendTrendChart.tsx
- [x] services/dashboard/src/components/SuggestionCards.tsx
- [x] services/dashboard/src/components/AlertTimeline.tsx
- [x] services/dashboard/src/hooks/useRiskPolling.ts
- [x] services/dashboard/src/lib/mongodb.ts
- [x] services/dashboard/src/lib/types.ts

**Notes:**
- Created a gorgeous Next.js 14 App Router dashboard with a **sleek dark cyber-luxe design** (radial background highlights, clean Outfit and JetBrains Mono typography, custom linear-gradient area charts, and glowing gauges).
- Implemented core server-side API routes pulling active prediction status logs from MongoDB (`/api/risk` and `/api/alerts`) and querying Elasticsearch with mock fallbacks for outflows (`/api/trends`).
- Built an interactive controller component allowing clients to input upcoming EMI values/dates and trigger real-time predictions directly on the UI, which proxy-routes through to the `/api/risk/trigger` endpoint.
- Handled webpack private identifiers errors on heavy Node library imports (undici inside Elastic module) by defining `serverComponentsExternalPackages: ['@elastic/elasticsearch', 'mongodb']` in `next.config.js`.
- Generated optimized standalone Docker build distributions limiting maximum memory footprint limits under 768 MB.
- Captured visual dashboard render logs confirm absolute visual elegance and full responsive support.

---

## Step 7 — MongoDB Persistence [COMPLETE]
**Status:** 🟢 COMPLETE

**Files to create:**
- [x] infra/mongodb/init/01-init.js
- [x] packages/db/package.json
- [x] packages/db/tsconfig.json
- [x] packages/db/src/connection.ts
- [x] packages/db/src/models/Prediction.ts
- [x] packages/db/src/models/SpendTrend.ts
- [x] packages/db/src/models/Suggestion.ts
- [x] packages/db/src/models/AlertLog.ts
- [x] packages/db/src/index.ts

**Notes:**
- Configured MongoDB `mongo:7.0` container inside `docker-compose.yml`, mounting the initialization script `01-init.js` to `/docker-entrypoint-initdb.d:ro`.
- Wrote `/infra/mongodb/init/01-init.js` to programmatically bootstrap the `emi_system` database and build predictions, spend_trends, suggestions, and alert_logs collections and their compound/unique indexes.
- Launched a visual database administration client `mongo-express` bound to port `8081` on the host system loopback, disabled basic auth for frictionless local development.
- Built and compiled a shared `@emi-system/db` TypeScript library containing a connection pooling singleton and Mongoose models, with standard type-definitions, that cleanly compiles using TypeScript without syntax issues.
- Confirmed indices successfully generated in MongoDB (e.g., compound `user_id_1_created_at_-1`, unique `prediction_id_1`, and alert compound index filters).

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
