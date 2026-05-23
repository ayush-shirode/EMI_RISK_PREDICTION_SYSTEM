# Vigilance AI — Early Warning Credit Risk & EMI Stress Prediction System

Vigilance AI is a real-time, event-driven banking analytics and credit stress prediction platform. It monitors bank transactions and balances, aggregates historical spends, runs predictive evaluations using local LLM models (Ollama RAG pipeline over Elasticsearch), and alerts both bank administrators and users before an upcoming EMI payment fails.

Designed for modern fintech systems, Vigilance AI identifies warning signals up to 30 days before default events occur, enabling proactive debt collection and debt restructuring offers.

---

## 🏗️ System Architecture & Data Flow

The system consists of **8 integrated microservices** communicating across an event-driven cluster:

```
[ Plaid Sandbox API ]
        │ (banking data fetch)
        ▼
 [ plaid-ingestion ] ──(publish raw events)──► [ Apache Kafka ]
                                                      │ (consume data stream)
                                                      ▼
                                                [ Logstash ]
                                                      │ (enrich, parse, category-map)
                                                      ▼
                                              [ Elasticsearch ]
                                                      ▲
                                                      │ (RAG last 90-day transactions)
                                                      ▼
[ Next.js Dashboard ] ──(trigger check)──► [ ai-engine (Mistral RAG) ] ◄──► [ Ollama ]
         │                                            │
         │ (fetch history & status)                   │ (save prediction & alerts)
         ▼                                            ▼
[ MongoDB persistence ] ◄─────────────────────────────┘
         ▲
         │ (cron rescores, spend trend compiling, SMTP checks)
 [ scheduler daemon ] ──► [ Nodemailer SMTP Email Alerts ] & [ SMS Alerts ]
```

### Integrated Microservices Stack:
1. **Plaid Ingestion (`services/plaid-ingestion`)**: Fetches banking transactions and balance signals from the Plaid Sandbox API and streams them to Kafka.
2. **Event Streaming Cluster (`infra/kafka`)**: Managed via Bitnami Kafka + Zookeeper, providing high-throughput event logs partitioned into dedicated topics. Includes **Kafka-UI** for real-time monitoring.
3. **Logstash Parser (`infra/logstash`)**: Consumes events from Kafka, runs advanced Grok patterns to compute balances, spend category splits, and indexes them into Elasticsearch.
4. **Elasticsearch & Kibana (`infra/elasticsearch`)**: Storage cluster with strict mappings for balance limits, spend logs, and early warnings signals. Includes Kibana dashboards for deep-dive diagnostics.
5. **AI Prediction Engine (`services/ai-engine`)**: Core NodeJS API querying Elasticsearch for the last 90 days of transactions, constructing a RAG context prompt, and using **Ollama (Mistral / TinyLlama)** with structured JSON schemas to forecast default probabilities.
6. **Persistence Layer (`infra/mongodb` + `packages/db`)**: Consolidates predictions logs, alert histories, and monthly spend aggregates. Shares typed schemas across NodeJS platforms via a custom TypeScript package `@emi/db`. Includes **Mongo-Express** for visual inspection.
7. **Cyber-Luxe Dashboard (`services/dashboard`)**: Premium dark cyber-luxe Next.js 14 Web portal containing real-time cash outflows area charts, glowing SVG risk gauges, and interactive manual EMI simulation controls.
8. **Automation Scheduler (`services/scheduler`)**: Cron microservice managing nightly user rescores (2:00 AM), spend trend aggregations (6h), and automated critical HTML emails dispatch via **Nodemailer**.

---

## ⚙️ Hardware & Memory Allocation

The system is optimized to run on a **16 GB RAM developer machine**. Containers enforce strict memory parameters under **11.5 GB Peak allocation**, leaving plenty of breathing room for the operating system:

*   **Ollama (CPU-only LLM):** 4.0 GB
*   **Elasticsearch 8.x:** 1.5 GB
*   **Logstash:** 768 MB
*   **Kibana:** 768 MB
*   **Kafka:** 768 MB
*   **Next.js Dashboard:** 768 MB
*   **MongoDB:** 512 MB
*   **AI Engine:** 512 MB
*   **Zookeeper:** 384 MB
*   **Plaid Ingestion:** 256 MB
*   **Scheduler Daemon:** 256 MB
*   **Kafka UI / Mongo Express:** 384 MB

---

## 🚀 Step-by-Step Setup Guide

Follow this guide to configure, build, run, and test the entire stack from scratch:

### 1. Prerequisites
Ensure you have the following installed on your host system:
*   [Docker](https://docs.docker.com/get-docker/) & [Docker Compose V2](https://docs.docker.com/compose/)
*   [Node.js (v20 or higher)](https://nodejs.org/) & `npm`
*   `make` (standard utility for Makefile execution)

### 2. Configure Environment Variables
Copy the `.env.example` in the root workspace folder to create your `.env` configuration file:
```bash
cp .env.example .env
```

Open `.env` and fill in the values:
```env
# Plaid Keys (Required for live plaid ingestion testing, optional for mock AI runs)
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_sandbox_secret
PLAID_ACCESS_TOKEN=access-sandbox-xxxxxxxxxx

# AI Model settings (Mistral is default, TinyLlama is recommended for lower CPU usage)
OLLAMA_MODEL=tinyllama

# Notifications (SMTP Details for email alerts)
ALERT_EMAIL=user@example.com
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_gmail_address@gmail.com
SMTP_PASS=your_app_specific_gmail_password

# Defaults
DEFAULT_EMI_AMOUNT=15000
RUN_ON_START=false
```

---

## 🏃 Running the Application

Manage the cluster easily using the root `Makefile` automation shortcuts:

### 1. Boot the Stack
Compile the TypeScript services and start all 11 Docker containers in detached mode:
```bash
make up
```
*This command boots zookeeper, kafka, kafka-ui, elasticsearch, kibana, logstash, mongodb, mongo-express, ollama, ai-engine, plaid-ingestion, dashboard, and the scheduler.*

### 2. Stream Logs
Monitor cluster boot, connections, and cron initializations:
```bash
make logs
```

### 3. Pull LLM Model
Download the light, CPU-optimized `tinyllama` model (or `mistral` depending on your `.env` configurations) inside the Ollama container:
```bash
make pull-model-small
```
*(Use `make pull-model` if you prefer the standard Mistral model).*

### 4. Check Health & Connectivity
Verify that the event streaming pipelines, Kafka topics, and Elasticsearch index families have initialized successfully:
```bash
make status
```
A healthy response shows:
*   11 containers running.
*   5 active Kafka topics (`raw-transactions`, `balance-updates`, `risk-alerts`, `processed-events`).
*   3 active Elasticsearch indices (`risk-signals`, `transactions-current`, `balances-current`).

---

## 🧪 Testing the Application

### 1. Visual Portals Exploration
Open these loopback addresses inside your browser:
*   **Main Dashboard UI:** `http://localhost:3000` (Cyber-Luxe dark analytics UI)
*   **Mongo Express DB Manager:** `http://localhost:8081` (Discovered collections audit)
*   **Kafka UI Manager:** `http://localhost:8080` (Topics partition throughput audit)
*   **Kibana Panel:** `http://localhost:5601` (Elastic search system metrics)

### 2. Testing the RAG AI Engine
Simulate an incoming EMI payment validation request to test the RAG ingestion loop:
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"userId": "user_123", "emiAmount": 16000, "emiDueDate": "2026-06-05"}' \
  http://localhost:3002/predict
```
**What happens behind the scenes:**
1. `ai-engine` queries Elasticsearch for `user_123`'s transaction logs over the past 90 days.
2. Formulates a contextual Prompt analyzing net inflow/outflow balance limits.
3. Sends RAG context to `Ollama`.
4. Returns predictive structures (miss probability, stress score, severity metrics, and AI recommendations list) and indexes the signal log to Elasticsearch `risk-signals`.

### 3. Testing the Automated Scheduler & Alerts Loop
To test the cron rescore and email notifications immediately on demand:
1. Edit the `.env` file and set `RUN_ON_START=true`.
2. Restart the scheduler container to trigger the immediate start timer:
   ```bash
   docker compose restart scheduler
   ```
3. Watch the logs:
   ```bash
   docker compose logs -f scheduler
   ```
**What happens behind the scenes:**
1. The scheduler aggregates historical cash balances into MongoDB `spend_trends`.
2. Gathers distinct users and runs the automated prediction rescore pipeline.
3. Dispatches HTML alert emails for all critical scores (e.g. >= 70).
4. If SMTP credentials were left blank, it prints a stylized **[MOCK EMAIL SENT]** block containing the full predictive details inside the terminal logs!

---

## 🧹 Cleaning Up
To shut down the entire system and cleanly reclaim disk space, wiping caches, container images, and persistent storage volumes:
```bash
make clean
```
😭