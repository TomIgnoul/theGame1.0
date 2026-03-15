# 3.3 Platform Design

## Doel

Een reproduceerbaar development platform dat op elke team-laptop identiek kan draaien met **één commando** (Docker Compose). Cloud is out-scope (kosten).

## Platform layers

1. **Runtime layer (Docker Compose)**
    - `postgres` (database)
    - `backend` (FastAPI API layer)
    - `n8n` (automation/orchestration)
2. **Agent orchestration layer**
    - Master agent + subagents (DB/API/Frontend/QA)
3. **Tooling interface layer (MCP)**
    - gestandaardiseerde tool access voor agents (repo, scripts, DB checks, n8n triggers)
4. **Automation layer (n8n)**
    - workflows voor ETL triggers, logging, task sync, evidence

---

## Services (Docker Compose)

### Postgres

- Doel: opslag POI’s + routes
- Persistent volume: `postgres_data`
- Port: `5432`

### Backend (FastAPI)

- Doel: core productlogica (POI, routes, chat), secrets server-side, rate limiting
- Connectie: naar Postgres via internal network
- Port: `8000`
- Secrets/config: via `.env` (**no secrets in repo**)

### n8n

- Doel: automation/orchestration (ETL trigger, logging, sync)
- Persistent volume: `n8n_data`
- Port: `5678`
- Triggers: webhooks naar backend endpoints / scripts

---

## Service endpoints (voor team)

- **Backend API:** `http://localhost:8000`
- **n8n UI:** `http://localhost:5678`
- **Postgres:** `localhost:5432`

---

## Version pinning (anti-friction rule)

- In `docker-compose.yml` gebruiken we **nooit `latest`**.
- Alle service images worden **gepind** op een vaste versie (bv. `postgres:15`, `n8n:1.x`).
- Doel: identiek gedrag op elke laptop + minder “works on my machine”.

---

## Frontend (buiten Compose)

- Lokaal runnen voor snelle dev (hot reload)
- Frontend praat met backend via `http://localhost:8000`

---

## Repo structuur (minimum)

- `docker-compose.yml`
- `.env.example` + `.gitignore` voor `.env`
- `scripts/`
    - `migrate.sh`
    - `seed.sh`
- `backend/` (FastAPI + poetry)
- `db/` (migrations + seed/ETL code)
- `n8n/workflows/` (exported workflows als JSON)
- `docs/` (architecture + runbook + MCP)

---

## .env policy (secrets & config)

- `.env.example` bevat **alle keys/variabelen** maar zonder echte waarden.
- `.env` is lokaal en wordt **nooit gecommit**.

### Minimum variabelen in `.env.example`

- `DATABASE_URL=...`
- `POSTGRES_USER=...`
- `POSTGRES_PASSWORD=...`
- `POSTGRES_DB=...`
- `N8N_BASIC_AUTH_USER=...` *(optioneel)*
- `N8N_BASIC_AUTH_PASSWORD=...` *(optioneel)*
- `MAPS_API_KEY=` *(leeg default)*
- `LLM_API_KEY=` *(leeg default)*

---

## Runbook (team bootstrap)

1. Clone repo
2. Copy `.env.example` → `.env` en vul lokale waarden in
3. `docker compose up -d`
4. `./scripts/migrate.sh`
5. `./scripts/seed.sh`
6. Start frontend lokaal
7. Smoke test:
    - `GET /health`
    - `GET /pois`
    - `POST /routes/generate`

---

## Migrations & Seed strategy

- **Canonical execution (source of truth):** scripts in repo
    - `./scripts/migrate.sh` → apply DB schema migrations
    - `./scripts/seed.sh` → run ETL/seed (raw → app)
- **Automation execution (agentic):** n8n workflows triggeren scripts
    - Workflow: “Run migrations”
    - Workflow: “Run seed/ETL”

**Waarom:** reproduceerbaar + reviewbaar (Git) en toch automation-ready.

---

## Definition of Done (Platform)

Platform is “done” wanneer:

- `docker compose up -d` start Postgres, backend en n8n zonder errors
- `./scripts/migrate.sh` draait succesvol (schema staat klaar)
- `./scripts/seed.sh` vult `app.pois` en `GET /pois` geeft resultaten terug
- n8n workflows zijn importeerbaar vanuit `n8n/workflows/*.json`

---

## MCP integration (concreet)

- MCP is de **tooling interface** waarmee agents gecontroleerd acties uitvoeren:
    - repo files lezen/schrijven
    - scripts runnen (`migrate.sh`, `seed.sh`)
    - DB checks uitvoeren (read-only waar mogelijk)
    - n8n webhooks triggeren
- **MCP config:** `mcp/` (tool definitions, permissions, connectors)
- **MCP docs:** `docs/mcp/` (uitleg, onboarding, usage rules)
- **Waarom:** config is “code”, docs is “human-readable”.

---

## n8n Workflow Versioning (procedure)

- **Opslag:** `n8n/workflows/*.json` in repo
- **Export:** workflow → “Download/Export JSON” → commit
- **Import:** n8n UI → import workflow → select JSON
    
    **Waarom:** versiebeheer, reproduceerbaarheid, minder team-wrijving
    

---

## Evidence hooks (The Game)

- n8n logt runs (seed/migrate) naar Notion/Trello (optioneel)
- GitHub commits linken naar DEC/EXP logs (bewijs “vibe coding” + experimenten)

---

## Reset procedure (optioneel maar handig)

- Soft reset (containers stoppen): `docker compose down`
- Hard reset (ook data weg): `docker compose down -v`