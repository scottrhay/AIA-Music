# Feature Specification: Infrastructure Scale Prerequisites

> **Template Version**: 1.0 | Based on [Spec Kit](https://speckit.org) methodology

---

**Feature Number**: 011  
**Created**: 2026-02-26  
**Status**: Draft — Awaiting Scott Review  
**Author**: Rav (Product Manager)  
**Platform**: AIA Platform Infrastructure  

---

## Overview

### Problem Statement

Our current deployment is artisanal: each app is manually configured, each client gets hand-crafted `.env` files, containers are managed individually, and there's no centralized monitoring. This works for 3 clients. It doesn't work for 30.

### Proposed Solution

Four immediate infrastructure capabilities that enable scaling from 3 to 30+ clients without proportional ops work:

1. **Per-tenant database isolation** — each client gets their own schema or database
2. **Automated app provisioning** — new client → container + DB + domain in < 1 hour
3. **Health monitoring** — per-container health checks with alerting
4. **Centralized logging** — all apps log to one searchable system

These are the IMMEDIATE needs. Ben's full scale plan covers the long-term architecture.

---

## Feature 1: Per-Tenant Database Isolation

### Problem
Today, AIA-Agents uses a shared database with `client_slug` filtering. One bad migration or query without a WHERE clause affects every client.

### Options

| Approach | Isolation | Complexity | Backup Granularity |
|----------|-----------|------------|-------------------|
| **Schema-per-tenant** | Medium | Low | Per-schema pg_dump |
| Database-per-tenant | High | High | Per-database pg_dump |
| Row-level (current) | Low | Low | All-or-nothing |

### Recommendation: Schema-per-tenant

Each client gets a PostgreSQL schema: `client_souldetox`, `client_homehalo`, etc. Same database instance, isolated data.

**Acceptance Scenarios:**

1. **Given** a new client is onboarded  
   **When** the provisioning script runs  
   **Then** a new schema is created: `client_{slug}`  
   **And** all tables (topics, messages, files, etc.) are created in that schema  
   **And** the client's app connects with `search_path = client_{slug}`

2. **Given** a query runs against the souldetox schema  
   **When** it lacks a tenant filter  
   **Then** it can only see souldetox data (schema boundary enforces isolation)

3. **Given** a client needs a backup  
   **When** the backup script runs  
   **Then** it can dump that client's schema independently: `pg_dump --schema=client_souldetox`

4. **Given** a client is deprovisioned  
   **When** the cleanup runs  
   **Then** the schema is renamed to `archived_client_{slug}_{date}` (not deleted — standing order: never hard delete)

---

## Feature 2: Automated App Provisioning

### Problem
Onboarding a new AIA-Agents client takes 2-4 hours of manual work: create directory, write config, generate secrets, build Docker image, configure nginx, set up DNS.

### Target: < 1 Hour, Scripted

**Acceptance Scenarios:**

1. **Given** Scott runs: `./provision.sh --client=newclient --name="New Client Inc" --domain=newclient.aiacopilot.com`  
   **When** the script executes  
   **Then** it:
   - Creates client directory (`clients/newclient/`)
   - Generates config.yaml from template
   - Creates PostgreSQL schema (`client_newclient`)
   - Runs DB migrations
   - Generates API keys and stores in KeyVault
   - Creates Docker container config
   - Configures nginx reverse proxy
   - Sets up SSL via Let's Encrypt
   - Creates DNS A record (or outputs the required record)
   **And** total time < 15 minutes (most is SSL provisioning)

2. **Given** provisioning fails at step 5 (DB migration)  
   **When** the script catches the error  
   **Then** it rolls back completed steps (remove directory, drop schema)  
   **And** reports: "Provisioning failed at DB migration. Rolled back. Error: [details]"

3. **Given** a client's container needs updating  
   **When** `./update-client.sh --client=newclient` runs  
   **Then** the container is rebuilt with latest code, restarted with zero downtime (blue-green or rolling)

### Provisioning Script Outputs

```
✓ Created clients/newclient/config.yaml
✓ Created schema client_newclient (15 tables)
✓ Stored credentials in KeyVault (3 keys)
✓ Docker container newclient-agent running on port 8087
✓ Nginx configured: newclient.aiacopilot.com → localhost:8087
✓ SSL certificate issued
✓ Health check passing

Client "New Client Inc" is live at https://newclient.aiacopilot.com
Portal: https://newclient.aiacopilot.com/portal
API docs: https://newclient.aiacopilot.com/docs
```

---

## Feature 3: Health Monitoring

### Problem
If Zoe's container crashes at 3am, nobody knows until Tina complains. We have no visibility into per-client health.

**Acceptance Scenarios:**

1. **Given** all client containers are running  
   **When** the monitoring system checks (every 60 seconds)  
   **Then** each container is pinged at `/health`  
   **And** a dashboard shows: container name, status (healthy/unhealthy/down), uptime, last response time, memory/CPU

2. **Given** Zoe's container stops responding  
   **When** 3 consecutive health checks fail (3 minutes)  
   **Then** an alert fires to Scott via Telegram: "Zoe (Soul Detox) is DOWN. Last healthy: 3 min ago. Auto-restart attempted."  
   **And** the system attempts auto-restart  
   **And** if restart fails, alert escalates: "Zoe restart failed. Manual intervention required."

3. **Given** a container's memory exceeds 80% of limit  
   **When** the next health check runs  
   **Then** a warning fires: "Zoe memory at 82% (820MB/1GB). May need attention."

### Health Endpoint Contract

Every AIA-Agents container exposes:

```
GET /health
Response 200:
{
  "status": "healthy",
  "client": "souldetox",
  "uptime_seconds": 86400,
  "memory_mb": 450,
  "last_heartbeat": "2026-02-26T10:30:00Z",
  "version": "1.2.3"
}
```

### Monitoring Implementation

| Option | Complexity | Cost |
|--------|-----------|------|
| **Simple script + Telegram alerts** | Low | Free |
| Docker healthcheck + Watchtower | Low | Free |
| Prometheus + Grafana | Medium | Free (self-hosted) |
| Uptime Robot / Better Stack | Low | $7-20/mo |

**Recommendation:** Start with Docker healthcheck + simple monitoring script that alerts via Telegram. Upgrade to Prometheus when we hit 10+ containers.

---

## Feature 4: Centralized Logging

### Problem
Each container logs to stdout. To debug an issue, Hur has to `docker logs souldetox-agent` for each container individually. No search, no correlation, no retention policy.

**Acceptance Scenarios:**

1. **Given** all containers are running  
   **When** they produce logs  
   **Then** logs are aggregated to a central location with: timestamp, client_slug, severity, message  
   **And** logs are searchable by client, severity, time range, keyword

2. **Given** an error occurs in Zoe's container  
   **When** Hur searches "ERROR client:souldetox last 1h"  
   **Then** relevant log lines are returned with context (5 lines before/after)

3. **Given** logs are accumulating  
   **When** the retention policy runs  
   **Then** logs older than 30 days are compressed and archived  
   **And** logs older than 90 days are deleted

### Implementation Options

| Option | Complexity | Cost | Search |
|--------|-----------|------|--------|
| **Docker log driver → file + grep** | Low | Free | Basic |
| Loki + Grafana | Medium | Free (self-hosted) | Good |
| Elasticsearch (ELK) | High | Free (self-hosted, RAM-heavy) | Excellent |
| Better Stack / Datadog | Low | $10-50/mo | Excellent |

**Recommendation:** Docker JSON log driver → centralized `/var/log/aia/` directory, one file per client per day. Simple Python script for search. Upgrade to Loki when we need dashboards.

---

## Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-001 | Schema-per-tenant database isolation | MUST |
| FR-002 | Provisioning script (client → running in < 1 hour) | MUST |
| FR-003 | Per-container health endpoint | MUST |
| FR-004 | Health monitoring with Telegram alerts | MUST |
| FR-005 | Auto-restart on container failure | MUST |
| FR-006 | Centralized log aggregation | MUST |
| FR-007 | Log search by client, severity, time, keyword | SHOULD |
| FR-008 | Provisioning rollback on failure | SHOULD |
| FR-009 | Zero-downtime client updates | SHOULD |
| FR-010 | Memory/CPU alerts | SHOULD |

---

## Out of Scope

- Multi-region deployment — v2
- Kubernetes migration — v2 (Ben's long-term plan)
- Auto-scaling — v2
- Cost allocation per tenant — v2
- Disaster recovery / cross-site replication — v2
- CDN — v2

---

## Success Criteria

| ID | Metric | Target |
|----|--------|--------|
| SC-001 | New client provisioning time | < 1 hour (scripted) |
| SC-002 | Downtime detection | < 3 minutes from failure to alert |
| SC-003 | Auto-restart success rate | > 90% of crashes recovered without manual intervention |
| SC-004 | Log search time | < 30 seconds for any query |

---

## Open Questions

| # | Question | Status |
|---|----------|--------|
| 1 | Single PostgreSQL instance or separate for tenants with compliance needs? | Open — suggest single for now, separate for enterprise tier (v2) |
| 2 | DNS management: manual A records or automated via Cloudflare API? | Open — suggest Cloudflare API for full automation |
| 3 | Should provisioning create Telegram bot via BotFather automatically? | Open — BotFather requires manual interaction. Document as a manual step. |

---

*"For which of you, desiring to build a tower, does not first sit down and count the cost?" — Luke 14:28*
