# 4.1 Repo Skeleton

## Repository Blueprint

## Purpose

Deze repository is de **single source of truth** voor de volledige applicatie: backend, database assets, scripts, n8n workflows, MCP configuratie en projectdocumentatie.

## Repository Principles

- **Monorepo**: alles zit in één repo om synchronisatieproblemen te vermijden.
- **Local-first**: development gebeurt lokaal; infra via Docker Compose (zie 4.2).
- **Backend-first contracts**: frontend praat enkel met backend (BFF).
- **Scripts are canonical**: scripts definiëren de operaties; tools (zoals n8n) mogen enkel triggeren.
- **No secrets in git**: secrets zijn altijd via `.env` en nooit in de repo.

## Folder Responsibilities (wat hoort waar)

### `/backend`

Bevat de **FastAPI backend** (BFF-layer).

- `backend/app/` = applicatiecode
- `backend/tests/` = tests
- `backend/pyproject.toml` = dependencies & tooling (Poetry)
- `backend/Dockerfile` = container build voor backend

### `/db`

Database artefacts.

- `db/migrations/` = schema changes (SQL of migration tool output)
- `db/etl/` = ETL scripts voor `raw → app` pipeline

### `/scripts`

Canonieke operaties (source of truth).

- `scripts/migrate.sh` = voert migrations uit (M1)
- `scripts/seed.sh` = seed/ETL pipeline run (M2)

> Policy: als een operatie niet in `scripts/` staat, bestaat ze niet als “officiële” flow.
> 

### `/n8n`

Workflow automation.

- `n8n/workflows/` = versioned workflow exports

> n8n is een **runner**, geen bron van waarheid.
> 

### `/mcp` en `/docs/mcp`

MCP (agent tooling) configuratie + documentatie.

- `mcp/` = config
- `docs/mcp/` = uitleg, regels, toegangen

### `/docs`

Projectdocumentatie.

- `docs/decisions/` = korte decision logs (ADRs) om design locked keuzes traceerbaar te houden

### `/frontend`

Frontend placeholder.

- In MVP draait frontend lokaal met hot reload.
- Frontend zit bewust **niet** in compose in M0.

## Canonical Repository Layout (locked)

```
theGame/
├─ backend/
├─ db/
├─ scripts/
├─ n8n/
├─ mcp/
├─ docs/
├─ frontend/
├─ docker-compose.yml
├─ .env.example
├─ .gitignore
└─ README.md
```

## Environment & Secrets Policy

- `.env.example` bevat **alleen placeholders**.
- `.env` wordt lokaal gebruikt en staat in `.gitignore`.
- Secrets worden **nooit** naar frontend gelekt.

## Naming & Change Rules

- Nieuwe components komen alleen bij in de juiste folder (geen “misc” of random roots).
- Wijzigingen aan structuur = decision log in `docs/decisions/`.
- Scripts blijven canoniek: n8n workflows mogen scripts triggeren, maar niet vervangen.

## Link met Implementatie Milestones

- **M0**: repo blueprint + placeholders
- **M1**: migrations worden ingevuld in `db/migrations` + `scripts/migrate.sh`
- **M2**: ETL/seed wordt ingevuld in `db/etl` + `scripts/seed.sh`
- **M3–M4**: feature endpoints in backend, workflows optioneel in n8n