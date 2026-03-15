# 4.4 Runbooks & Canonical Scripts

## 4.4.1 Doel

Een uniforme werkwijze vastleggen om de applicatie lokaal te **starten**, **updaten** (migrate/seed) en **verifiëren**, zodat:

- elk teamlid dezelfde stappen volgt
- n8n later exact dezelfde acties kan automatiseren
- de master agent niet moet gokken wat “de juiste manier” is

## 4.4.2 Canonical Scripts Policy (Design Locked)

- Alle operationele acties bestaan als scripts in `./scripts/`.
- `./scripts/*` is **source of truth**; n8n is enkel runner.
- Scripts zijn voorspelbaar:
    - falen hard bij errors (non-zero exit)
    - zijn herhaalbaar waar mogelijk (idempotent by design)
- Als een actie niet in `./scripts/` staat, is het **geen officiële flow**.

## 4.4.3 Team Runbooks (Human-first)

### 4.4.3.1 Runbook — Start Local Runtime (M0)

**Doel**

Local runtime opstarten voor development.

**Stappen (conceptueel)**

- Start Docker Compose (postgres + backend + n8n)
- Start frontend lokaal via dev server (buiten compose)

**Success criteria (M0 gate)**

- Backend: `GET /health` = 200 OK
- n8n UI reachable
- Postgres container draait (DB-connect wordt harde gate vanaf M1)

**Evidence**

- terminal output/screenshot compose up
- output van health check

### 4.4.3.2 Runbook — Apply Migrations (M1)

**Doel**

Database schemas/tables up-to-date brengen volgens `db/migrations/`.

**Stappen**

- Run `./scripts/migrate.sh`

**Success criteria (M1 gate)**

- Script eindigt zonder errors
- `raw` en `app` schema bestaan
- MVP tables bestaan (app.pois, app.routes, app.route_stops)
- Backend kan connecteren naar Postgres

**Evidence**

- terminal output migrate script
- minimale DB check (exacte check wordt gespecificeerd in M1)

### 4.4.3.3 Runbook — Seed/ETL Load (M2)

**Doel**

Open data verwerken van `raw → app` en `app.pois` vullen.

**Stappen**

- Run `./scripts/seed.sh`

**ETL Rules (Design Locked)**

- unknown category → default “Culture”
- invalid coords/name → skip + log

**Success criteria (M2 gate)**

- Script eindigt zonder errors
- `app.pois` bevat records (count > 0)
- `GET /pois` retourneert data

**Evidence**

- terminal output seed script
- bewijs response van `GET /pois`

## 4.4.4 Canonical Script Specs

### 4.4.4.1 `./scripts/migrate.sh` (M1)

**Purpose**

Migrations uitvoeren en DB in de juiste state brengen.

**Inputs**

- migrations in `db/migrations/`
- DB connection config (via env)

**Outputs**

- schemas/tables bestaan correct

**Failure modes**

- DB unreachable
- migration errors/conflicts

### 4.4.4.2 `./scripts/seed.sh` (M2)

**Purpose**

ETL/seed pipeline uitvoeren voor POI data.

**Inputs**

- ETL code/assets in `db/etl/`
- raw ingest brondata

**Outputs**

- `app.pois` gevuld
- logs voor skips (invalid rows)

**Failure modes**

- data quality issues
- ETL crash

## 4.4.5 n8n Runner Mapping (Milestone-gated)

**M0**

- n8n draait + UI reachable
- workflows mogen placeholder zijn

**M1**

- workflow “Run migrate” → triggert `./scripts/migrate.sh`

**M2**

- workflow “Run seed” → triggert `./scripts/seed.sh`

**Policy**

- workflows worden versioned opgeslagen/exported naar `n8n/workflows/`

---

## 4.4.6 Out of scope

- Concrete commands/flags worden pas “locked” wanneer we effectief implementeren (M0–M2), maar success criteria staan hier al vast.