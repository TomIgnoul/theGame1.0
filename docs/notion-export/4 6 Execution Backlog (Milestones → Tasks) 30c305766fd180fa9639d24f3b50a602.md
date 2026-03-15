# 4.6 Execution Backlog (Milestones → Tasks)

## 4.6.1 Doel

De milestones (M0–M4) vertalen naar een uitvoerbaar backlog zodat:

- iedereen weet **wat** er moet gebeuren en in welke volgorde
- ownership duidelijk is
- gates/evidence/sign-off (4.5) snel gehaald worden
- een AI agent taken kan selecteren **zonder te improviseren**

---

## 4.6.2 Backlog Rules (locked)

- Elke task hoort bij exact **1 milestone**.
- Elke task heeft 1 duidelijke **deliverable** (iets dat je kan tonen).
- Tasks mogen **geen scope** toevoegen buiten de milestone gate.
- “Done” op task ≠ “Done” op milestone. Milestone is pas done na **gate + evidence + sign-off** (4.5).
- Elke task eindigt met: **evidence link** (naar 4.5 Evidence Archive) of “n/a” als niet van toepassing.

---

## 4.6.3 Milestone Status Snapshot

- **M0 — Platform boots:** ✅ PASS
- **M1 — Database ready:** ✅ PASS
- **M2 — Data pipeline ready:** ✅ PASS
- **M3 — Route generation works:** ⏳ IN PROGRESS
    - **A) Backend contract:** ✅ PASS
    - **B) UI rendering:** ⏳ PENDING (frontend nog niet aanwezig)
- **M4 — Chat per stop + security checks:** ✅ PASS

---

## 4.6.4 Backlog per Milestone

### M0 — Platform boots (✅ PASS)

**Deliverables**

- docker-compose runtime start (postgres + backend + n8n)
- backend `/health` endpoint beschikbaar
- n8n UI bereikbaar

**Tasks (historical, locked)**

1. Repo structuur final check (folders + placeholders) — Owner: Project Lead — Evidence: 4.5 M0
2. Docker Compose baseline (postgres/backend/n8n) — Owner: Backend owner — Evidence: 4.5 M0
3. Backend skeleton + `/health` — Owner: Backend owner — Evidence: 4.5 M0
4. `.env.example` + secrets policy (geen secrets in git) — Owner: Security owner — Evidence: 4.5 M0
5. Runbook “Start local runtime” + evidence placeholders — Owner: Project Lead — Evidence: 4.4/4.5
6. Evidence verzamelen voor M0 gate — Owner: Project Lead — Evidence: 4.5 Evidence M0

**Dependencies**

- Repo skeleton (4.1)

---

### M1 — Database ready (✅ PASS)

**Deliverables**

- schemas `raw` en `app`
- tabellen: `app.pois`, `app.routes`, `app.route_stops`
- `./scripts/migrate.sh` voert migrations uit

**Tasks (historical, locked)**

1. Migration strategy (SQL files) documenteren — Owner: Database owner — Evidence: 4.5 M1
2. Migrations voor `raw` + `app` schemas — Owner: Database owner — Evidence: 4.5 M1
3. Migrations voor MVP tables — Owner: Database owner — Evidence: 4.5 M1
4. `scripts/migrate.sh` als canonieke entrypoint — Owner: Database owner — Evidence: 4.5 M1
5. DB connect check via runtime (backend env ok) — Owner: Backend owner — Evidence: 4.5 M1
6. Evidence verzamelen (migrate output + schema/table listing) — Owner: Database owner — Evidence: 4.5 Evidence M1
7. Sign-off voorbereiden — Owner: Project Lead — Evidence: 4.5 Sign-off log

**Dependencies**

- M0 runtime draait

---

### M2 — Data pipeline ready (✅ PASS)

**Deliverables**

- `./scripts/seed.sh` runnable (idempotent)
- `app.pois` bevat data (count > 0)
- `GET /pois` endpoint levert data

**Tasks (historical, locked)**

1. Seed/ETL rules vastleggen (unknown→Culture, invalid skip+log) — Owner: Data/DB owner — Evidence: 4.5 M2
2. Seed assets/code in `db/etl/` — Owner: Data/DB owner — Evidence: 4.5 M2
3. `scripts/seed.sh` canonieke entrypoint — Owner: Data/DB owner — Evidence: 4.5 M2
4. `GET /pois` implementeren — Owner: Backend owner — Evidence: 4.5 M2
5. Evidence verzamelen (seed output + count + /pois response) — Owner: Data/DB owner — Evidence: 4.5 Evidence M2
6. Sign-off voorbereiden — Owner: Project Lead — Evidence: 4.5 Sign-off log

**Dependencies**

- M1 migrations klaar

---

### M3 — Route generation works (⏳ IN PROGRESS)

**Deliverables**

- `POST /routes/generate` werkt volgens contract
- route payload bevat `coordinates` + `stops` (max 5)
- UI toont polyline + genummerde stops

**Tasks**

1. Route contract final check (payload shape locked) — Owner: Backend owner — Deliverable: contract note — Evidence: 4.5 M3
2. `POST /routes/generate` implementeren (MVP stub ok) — Owner: Backend owner — Deliverable: endpoint working — Evidence: 4.5 Evidence M3-A
3. Enforce hard cap (max 5 POIs) — Owner: Backend owner — Deliverable: cap proof (429 niet nodig, dit is functioneel) — Evidence: 4.5 Evidence M3-C
4. UI integratie: polyline render + stop numbering — Owner: Frontend owner — Deliverable: screenshot UI — Evidence: 4.5 Evidence M3-B
5. Evidence bundelen + sign-off klaarzetten — Owner: Project Lead — Deliverable: Evidence page complete — Evidence: 4.5 Evidence M3

**Dependencies**

- M2 POIs beschikbaar
- Frontend basis aanwezig (voor M3-B)

**Current**

- A) Backend contract: ✅ done
- B) UI rendering: ⏳ pending

---

### M4 — Chat per stop + security checks (✅ PASS)

**Deliverables**

- `POST /chat/stop` werkt met stop-context + header format
- message cap 500 chars enforced (400)
- rate limiting actief (429)
- geen persistente chat logs (metrics only)

**Tasks (historical, locked)**

1. Chat contract final check (header rule) — Owner: Backend owner — Evidence: 4.5 M4
2. `POST /chat/stop` implementeren (MVP stub ok) — Owner: Backend owner — Evidence: 4.5 Evidence M4-A
3. Validatie: max 500 chars (400) — Owner: Backend owner — Evidence: 4.5 Evidence M4-B1
4. Rate limiting implementeren (routes/chat) — Owner: Security owner — Evidence: 4.5 Evidence M4-B2
5. Logging policy toepassen (metrics only, no chat persist) — Owner: Security owner — Evidence: 4.5 Evidence M4-B3
6. Evidence bundelen + sign-off voorbereiden — Owner: Project Lead — Evidence: 4.5 Evidence M4 + Sign-off log

**Dependencies**

- DB + POIs beschikbaar
- (later) LLM key policy voor echte LLM integratie (buiten M4 stub)

---

## 4.6.5 Output format per task (praktisch)

Per task wordt bijgehouden:

- Status: Not started / In progress / In review / Done
- Owner
- Deliverable (1 zin)
- Evidence link (naar 4.5 Evidence Archive) of “n/a”
- Notes (kort)

---

### 4.6.6 Next Focus (nu)

- **Close M3-B** zodra er minimale frontend bestaat:
    - polyline tekenen uit `coordinates`
    - numbered stops 1..N uit `stops`
    - screenshot toevoegen aan Evidence M3-B
    - M3 decision → PASS + sign-off