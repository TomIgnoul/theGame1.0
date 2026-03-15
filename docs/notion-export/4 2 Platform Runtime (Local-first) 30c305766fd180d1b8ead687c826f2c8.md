# 4.2 Platform Runtime (Local-first)

## 4.2.0 Design Locked - Non-Negotiables

- Frontend draait lokaal via dev server (hot reload) en zit **niet** in Docker Compose (M0).
- Frontend praat **enkel** met backend (BFF).
- Backend praat met Postgres en (later) Maps/LLM via **server-side secrets**.
- Secrets komen nooit in repo of frontend.
- `scripts/` is **source of truth**; n8n is **runner**.
- n8n is **must**: runtime is niet “up” als n8n niet draait.

## 4.2.1 Doel

Een lokale runtime definiëren die:

- reproduceerbaar is voor het hele team
- later 1-op-1 vertaald wordt naar `docker-compose.yml`
- bruikbaar is voor automation (n8n) en (later) agentic tooling (MCP)

## 4.2.2 Runtime Model (Local-first)

- **Frontend**: lokaal (dev server, hot reload), buiten Docker Compose.
- **Docker Compose** draait:
    - `postgres` (database)
    - `backend` (FastAPI BFF API)
    - `n8n` (workflow runner)

## 4.2.3 Service Boundaries (Design Locked)

- Frontend → **alleen** backend (HTTP).
- Backend → Postgres (read/write).
- Backend → Externe APIs (Maps + LLM) met secrets server-side.
- n8n → **geen directe DB/front-end coupling**:
    - n8n triggert enkel canonieke scripts (`./scripts/*`).

## 4.2.4 Conceptueel Runtime Diagram (ASCII)

```
[Frontend Dev Server]
         |
         | HTTP (API calls)
         v
     [Backend API]  ----->  (Maps API, LLM API)
         |
         | SQL
         v
      [Postgres]

[n8n] ---> triggers ---> ./scripts/migrate.sh
[n8n] ---> triggers ---> ./scripts/seed.sh
```

## 4.2.5 Data & Secrets Policy (Runtime)

- Secrets (Maps/LLM keys) bestaan enkel server-side (backend `.env`).
- Geen secrets in frontend code of repo.
- Postgres data is persistent via volumes (concreet in compose-spec).

## 4.2.6 Verification (Conceptueel)

Runtime is “up” als:

- Backend health OK (later: `GET /health` = 200)
- Postgres bereikbaar voor backend
- n8n UI bereikbaar

## 4.2.7 n8n - Mandatory Automation Layer

- n8n draait **altijd** mee in de lokale runtime.
- n8n is de workflow runner voor team-consistente automation.
- Canonieke acties blijven in `./scripts/*`.
- n8n workflows zijn versioned in `n8n/workflows/`.

## 4.2.8 Service Contracts (locked template)

Voor elke service documenteren we consistent:

1. Purpose
2. Depends on
3. Exposes
4. Persists
5. Env required
6. Health / Verification

### 4.2.8.1 Service: `postgres`

**Purpose**

Persistente datastore voor de applicatie (MVP: POIs, routes, route_stops).

**Depends on**

Geen.

**Exposes**

- SQL endpoint voor backend.

**Persists**

- Persistent volume voor DB data.

**Env required**

- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`

**Health / Verification**

- Service accepteert connections.
- Verifieerbaar via: backend kan connecteren (M1 gate), migrations kunnen runnen.

### 4.2.8.2 Service: `backend` (FastAPI - BFF)

**Purpose**

Backend-for-Frontend API:

- Frontend praat enkel met backend
- Backend beheert secrets en calls naar externe APIs (Maps/LLM)

**Depends on**

- `postgres` (read/write)
- (later) Maps/LLM (via server-side keys)

**Exposes**

- HTTP API (M0: `/health`)
- Later: `/pois`, `/routes/generate`, `/chat/stop`

**Persists**

- Geen container-state (state in Postgres)
- Logging: metrics/diagnose, geen chat persist

**Env required**

- `DATABASE_URL` (verplicht)
- `MAPS_API_KEY` (later verplicht, M3)
- `LLM_API_KEY` (later verplicht, M4)
- Policy: fail-fast op missing required env (per milestone)

**Health / Verification**

- `GET /health` = 200 OK (M0 gate)
- DB connect werkt (M1 gate)
- Rate limiting + message cap werkt (M4 gate)

### 4.2.8.3 Service: `n8n`

**Purpose**

Workflow runner om team-consistente automatisatie te garanderen.

**Depends on**

- Docker runtime (compose)
- Repo scripts (`./scripts/*`)
- (optioneel later) backend endpoints voor checks

**Exposes**

- n8n UI (web)
- Trigger mechanisme voor scripts

**Persists**

- Persistent storage voor n8n config/workflows.

**Env required**

- n8n basisconfig (details volgen in compose-spec)

**Health / Verification**

- n8n UI bereikbaar
- Vanaf M1/M2: workflows kunnen canonieke scripts uitvoeren
- n8n is must: runtime niet “up” als n8n down is

## 4.2.9 Automation Maturity (Milestone-gated)

- **M0:** n8n draait + UI bereikbaar. Workflows mogen placeholder zijn.
- **M1:** workflow “Run migrate” triggert `scripts/migrate.sh`.
- **M2:** workflow “Run seed” triggert `scripts/seed.sh`.
- Workflows worden pas “required” als het onderliggende script een DoD heeft.

## 4.2.10 Canonical Automation Policy (n8n + scripts)

- `scripts/` blijft source of truth.
- n8n mag scripts triggeren, niet vervangen.
- Workflows worden opgeslagen/exported als code in `n8n/workflows/` (versioned).

## 4.2.11 Agent Protocol (Master AI)

- Lees eerst lifecycle + milestone DoD in Notion.
- Bouw alleen wat expliciet in scope staat.
- Ontbreekt iets? Maak een **Spec Update Proposal** i.p.v. te gokken.
- Lever per milestone evidence (checks/logs) en vraag sign-off.