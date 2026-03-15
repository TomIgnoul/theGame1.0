# 4.8 Notion Source of Truth (SoT) — Index Page

## 4.8.1 Doel

Eén centrale pagina die fungeert als:

- startpunt voor team onboarding
- startpunt voor MCP read-only agents
- navigatie naar alle lifecycle-artefacts (zonder zoekwerk)

## 4.8.2 Golden Rules (locked)

- Deze pagina is de **enige entrypoint** voor lifecycle navigatie.
- Alles wat “design locked” is, staat gelinkt én kort samengevat.
- Nieuwe artefacts worden hier toegevoegd. Geen “losse pages”.

## 4.8.3 Quick Links (1-click)

> Vervang onderstaande met Notion links naar jullie pagina’s.
> 

### Lifecycle Phases

- 
    1. Beeldvorming → [link]
- 
    1. Specificaties → [link]
- 
    1. Ontwerp → [link]
- 
    1. Implementatie (dit document) → [link]

### Implementatie (Core)

- 4.1 Repo Skeleton → [link]
- 4.2 Platform Runtime (Local-first) → [link]
- 4.3 Docker Compose Spec (Core + Interfaces) → [link]
- 4.4 Runbooks & Canonical Scripts → [link]
- 4.5 Milestone Gates & Sign-off → [link]
- 4.6 Execution Backlog → [link]
- 4.7 Roles & AI Agent Instructions → [link]

## 4.8.4 Design Locked Snapshot (TL;DR)

- Frontend draait lokaal (hot reload), **niet** in compose (M0).
- Frontend praat **alleen** met backend (BFF).
- Backend praat met Postgres + (later) Maps/LLM via server-side secrets.
- No secrets in repo/frontend; `.env` lokaal, `.env.example` in repo.
- Docker Compose services: postgres + backend + n8n (**n8n is must**).
- Scripts zijn canoniek (`./scripts/*`), n8n is runner.

## 4.8.5 Current Status (single source)

- Current milestone: **Mx**
- Status: Not started / In progress / In review / Done
- Next gate to hit: **(link naar 4.5 milestone sectie)**

## 4.8.6 MCP Agent Start Instructions (Read-only)

Wanneer een agent start, moet hij:

1. deze SoT index lezen
2. “Design Locked Snapshot” toepassen
3. huidige milestone status bepalen via 4.6/4.5
4. alleen werken binnen de scope van de eerstvolgende milestone

## 4.8.7 Change Control

- Wijzigingen aan design locked regels → noteer in `docs/decisions/` (ADR) + update deze index.
- Elke milestone wijziging vereist review door Project Lead.