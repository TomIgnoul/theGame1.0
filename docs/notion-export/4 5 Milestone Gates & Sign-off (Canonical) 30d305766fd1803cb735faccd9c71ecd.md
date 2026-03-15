# 4.5 Milestone Gates & Sign-off (Canonical)

## 4.5.0 Metadata

- **Version:** v1.0.0
- **Last updated:** 2026-02-20
- **Owner:** Project Lead

---

## 4.5.1 Purpose

This page is the **single source of truth** for:

- Milestone gates (M0–M4) and sub-gates (A/B where needed)
- Acceptance criteria (what “PASS” means)
- Required evidence (links only)
- Sign-off ownership

**Hard rule:** 4.5 contains **no** terminal output, curl responses, screenshots, or run logs. All proof lives in **Evidence pages**.

---

## 4.5.2 Operating Rules (Locked)

1. **No evidence dumps in 4.5.** Only links to Evidence pages.
2. Work can happen in parallel via **sub-gates**, but **milestone PASS requires all sub-gates PASS**.
3. Status is tracked at **sub-gate level** (e.g., M3-A PASS, M3-B PENDING).
4. Sign-off is done by domain owners; final milestone closure is owned by **Project Lead**.
5. “Done on tasks” ≠ “Milestone PASS”. Milestone PASS needs: **Gate + Evidence + Sign-off**.
6. **Canonical runtime rule:** `n8n` is required for project runtime compliance. If `n8n` is down, M0 cannot be fully PASS.

---

## 4.5.3 Gate Matrix Overview (M0–M4)

> Replace `LINK` placeholders with actual Notion Evidence page URLs.
> 

| Gate | Scope | Status | Owner (A) | Reviewer (R) | Required Evidence |
| --- | --- | --- | --- | --- | --- |
| M0 | Platform boots (runtime incl. n8n) | PASS / PENDING / FAIL | Backend Owner | Project Lead | Evidence M0 → LINK |
| M1 | Database ready (schemas + tables + migrations) | PASS / PENDING / FAIL | Data/DB Owner | Project Lead | Evidence M1 → LINK |
| M2 | Data pipeline ready (seed/ETL + /pois) | PASS / PENDING / FAIL | Data/DB Owner | Project Lead | Evidence M2 → LINK |
| M3-A | Route generation backend contract | PASS / PENDING / FAIL | Backend Owner | Project Lead | Evidence M3 → LINK |
| M3-B | Route rendering proof in UI | PASS / PENDING / FAIL | Frontend Owner | Project Lead | Evidence M3 → LINK |
| M4-A | Chat per stop works (API) | PASS / PENDING / FAIL | Backend Owner | Project Lead | Evidence M4 → LINK |
| M4-B | Security controls verified | PASS / PENDING / FAIL | Security Owner | Project Lead | Evidence M4 → LINK |

**Milestone roll-up rule**

- **M3 = PASS only if M3-A + M3-B are PASS**
- **M4 = PASS only if M4-A + M4-B are PASS**

---

## 4.5.4 Gate Definitions + Acceptance Criteria

### M0 — Platform boots

**Gate**

- Docker runtime starts: postgres + backend + n8n
- `GET /health` returns HTTP 200
- n8n UI reachable

**Acceptance criteria**

- Services are up and stable (no crash loop)
- Health endpoint responds consistently
- n8n reachable in local runtime

**Required evidence**

- Evidence M0 contains: compose status + health proof + n8n UI proof

**Sign-off**

- A: Backend Owner
- R: Project Lead

---

### M1 — Database ready

**Gate**

- Migrations run without errors
- Schemas exist: `raw` and `app`
- Tables exist: `app.pois`, `app.routes`, `app.route_stops`
- Backend can connect to Postgres

**Acceptance criteria**

- Schema + tables present
- Connection works (no auth/network issues)

**Required evidence**

- Evidence M1 contains: migrate output + schema list + table list + basic query/connect proof

**Sign-off**

- A: Data/DB Owner
- R: Project Lead

---

### M2 — Data pipeline ready

**Gate**

- Seed/ETL runnable via canonical script (`./scripts/seed.sh`)
- POIs exist in DB (`count > 0`)
- `GET /pois` returns data

**Acceptance criteria**

- Seed/ETL completes without errors
- API returns valid POI objects

**Required evidence**

- Evidence M2 contains: seed output + POI count + `/pois` response

**Sign-off**

- A: Data/DB Owner
- R: Project Lead

---

### M3 — Route generation works

### Sub-gate M3-A — Backend contract (API)

**Gate**

- `POST /routes/generate` returns payload per contract
- Hard cap enforced: **max 5 stops**
- Payload includes geometry suitable for UI rendering (coordinates/polyline)

**Acceptance criteria**

- HTTP 200 and payload shape is stable
- Stops count <= 5 always

**Required evidence**

- Evidence M3 includes: sample request/response + cap proof

**Sign-off**

- A: Backend Owner
- R: Project Lead

### Sub-gate M3-B — UI rendering (Frontend)

**Gate**

- Polyline visible on map
- Stops displayed as numbered markers **1..N**

**Acceptance criteria**

- One screenshot clearly shows both polyline and numbered stops

**Required evidence**

- Evidence M3 includes: UI screenshot + short caption

**Sign-off**

- A: Frontend Owner
- R: Project Lead

---

### M4 — Chat per stop + security checks

### Sub-gate M4-A — Chat functional (API)

**Gate**

- `POST /chat/stop` works
- Response header format: **`Stop {n} — {POI name}`**
- Response produced with stop context

**Acceptance criteria**

- HTTP 200
- Header format exact

**Required evidence**

- Evidence M4 includes: sample request/response proving header + reply

**Sign-off**

- A: Backend Owner
- R: Project Lead

### Sub-gate M4-B — Security controls

**Gate**

- Max message length: **500 chars** enforced → HTTP 400
- Rate limiting enforced:
- `/routes/generate`: **3 req/min/IP** → HTTP 429
- `/chat/stop`: **10 req/min/IP** → HTTP 429
- No persistent chat logs (metrics only; no message content stored)

**Acceptance criteria**

- 400 proof exists for >500 chars
- 429 proof exists for both endpoints
- Clear statement of “no persistence” with reference to code/config policy

**Required evidence**

- Evidence M4 includes: 400 output + 429 outputs + “no persistence” note (and link)

**Sign-off**

- A: Security Owner
- R: Project Lead

---

## 4.5.5 Sign-off Protocol (Locked)

For each gate/sub-gate:

1. **Owner (A)** verifies evidence completeness and marks PASS/FAIL.
2. **Reviewer (R)** validates scope adherence and acceptance criteria.
3. **Project Lead** confirms milestone roll-up PASS when all required sub-gates are PASS.

Sign-off record must include:

- Gate/Sub-gate
- PASS/PENDING/FAIL
- Evidence link
- Sign-off names (A + R)
- Date

---

## 4.5.6 Change Control (Locked)

Any change to:

- gate definitions
- acceptance criteria
- rate limits
- caps (max stops / message length)

requires:

1. A **Decision Log entry** (ADR/DEC reference)
2. A **version bump** in section 4.5.0
3. A short **changelog note** on this page

## 4.5.7 Changelog

| Version | Date | Changed by | Summary of change | Decision Log Ref |
| --- | --- | --- | --- | --- |
| v1.0.0 | 2026-02-20 | Project Lead | Baseline created: locked operating rules, gate matrix, acceptance criteria, sign-off protocol, and change control. | DEC-XXXX-001 |
| v1.0.1 | YYYY-MM-DD | NAME | Example: updated M3-B acceptance wording to clarify screenshot requirement. | DEC-XXXX-002 |
| v1.1.0 | YYYY-MM-DD | NAME | Example: changed rate limits or caps (breaking governance change). | DEC-XXXX-003 |

**Usage rules**

- Every governance-impacting edit to 4.5 must add one row.
- `Decision Log Ref` is mandatory for gate/criteria/rate-limit/cap changes.
- Use semver style:
- `PATCH` (`x.x.+1`) = wording/clarity, no behavioral gate change
- `MINOR` (`x.+1.0`) = new gate/sub-gate or non-breaking policy extension
- `MAJOR` (`+1.0.0`) = breaking governance change (criteria/limits/roll-up logic)