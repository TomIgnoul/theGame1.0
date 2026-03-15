# 4.5 Milestone Gates & Sign-off.old

## 4.5.1 Doel

Per milestone vastleggen:

- wat de **gate** is (objectieve “pass/fail” criteria)
- welke **evidence** vereist is
- wie **sign-off** geeft

Resultaat: geen discussie achteraf, geen “bij mij werkt het”, geen scope creep.

## 4.5.2 Sign-off Policy (locked)

Een milestone is pas “Done” als:

1. alle gate checks groen zijn
2. evidence is toegevoegd
3. sign-off is gegeven door de juiste rol

Geen sign-off = milestone blijft “In Review”.

- **Partial sign-off is toegestaan per sub-gate** (bv. M3-A backend), maar milestone blijft “In Review” tot alle sub-gates groen zijn.

### Milestone execution policy (locked)

- Milestones may be worked **in parallel**, but only via **sub-gates**.
- A milestone can only be marked **PASS** when **all sub-gates** are PASS.
- Sub-gates are the unit of partial progress:
    - Example: **M3-A PASS** (backend contract) while **M3-B PENDING** (UI proof).
- Sign-off is allowed per sub-gate owner (domain reviewer), but milestone closure remains Project Lead.

## 4.5.3 Gate Matrix (M0–M4)

### M0 - Platform boots

**Gate**

- Docker runtime start (postgres + backend + n8n)
- `GET /health` = 200 OK
- n8n UI reachable

**Required evidence**

- terminal output/screenshot: compose services gestart (postgres/backend/n8n)
- bewijs: `GET /health` response = 200
- screenshot: n8n UI bereikbaar

**Sign-off**

- Project Lead + 1 team reviewer

---

### M1 - Database ready

**Gate**

- `./scripts/migrate.sh` runs zonder errors
- schemas `raw` en `app` bestaan
- tables bestaan: `app.pois`, `app.routes`, `app.route_stops`
- backend kan connecteren naar Postgres

**Required evidence**

- migrate script output (zonder errors)
- bewijs schema `raw` en `app` bestaan
- bewijs tabellen bestaan: `app.pois`, `app.routes`, `app.route_stops`
- (optioneel) simpele `SELECT` op `app.pois` die geen error geeft

**Sign-off**

- Database owner + Project Lead

---

### M2 - Data pipeline ready

**Gate**

- `./scripts/seed.sh` runs zonder errors
- `app.pois` bevat data (count > 0)
- `GET /pois` retourneert data

**Required evidence**

- seed script output (zonder errors)
- bewijs `app.pois` count > 0
- sample response van `GET /pois`

**Sign-off**

- Data/DB owner + Backend owner

---

### M3 - Route generation works

**Gate**

- `POST /routes/generate` levert route payload volgens contract
- polyline + genummerde stops werken in UI
- hard cap: max 5 POIs enforced

**Required evidence**

- **A) Backend:** sample request/response van `POST /routes/generate` + bewijs max 5 stops enforced
- **B) Frontend:** UI screenshot met polyline zichtbaar + stops genummerd 1..N

**Required evidence**

- sample request/response van `POST /routes/generate`
- UI screenshot: polyline zichtbaar + stops genummerd
- bewijs max 5 stops enforced (response of UI proof)

**Sign-off**

- Backend owner + Frontend owner

---

### M4 - Chat per stop + security checks

**Gate**

- `POST /chat/stop` werkt met correcte header context
- max message length 500 chars enforced
- rate limiting actief:
    - routes/generate 3 req/min/IP
    - chat/stop 10 req/min/IP
- geen persistente chat logs (logging = metrics only)

**Sub-gates (M4)**

- **A) Chat functional (API):** correcte header context + response werkt
- **B) Security controls:** 500 chars cap + rate limiting + no chat persist

**Required evidence**

- **A) Chat functional:** sample request/response `POST /chat/stop` met correcte header context
- **B) Security controls:** bewijs 400 bij >500 chars + bewijs 429 bij rate limit + bevestiging “no persistent chat logs”

**Sign-off**

- Security owner + Backend owner + Project Lead

---

## 4.5.4 Sign-off Log (template)

Per milestone:

- Milestone: Mx
- Date:
- Reviewer(s):
- Evidence links:
- Decision: ✅ Approved / ❌ Changes required
- Notes:

## 4.5.5 Evidence Archive (per milestone)

### Evidence - M0 (Platform boots)

**A) Compose services running**

- output van: docker compose ps

```bash
student@Device-01:~/dev/theGame$ docker compose ps
NAME               IMAGE              COMMAND                  SERVICE    CREATED          STATUS          PORTS
thegame-backend    thegame-backend    "uvicorn app.main:ap…"   backend    8 seconds ago    Up 7 seconds    0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp
thegame-n8n        n8nio/n8n:latest   "tini -- /docker-ent…"   n8n        12 minutes ago   Up 12 minutes   0.0.0.0:5678->5678/tcp, [::]:5678->5678/tcp
thegame-postgres   postgres:15        "docker-entrypoint.s…"   postgres   12 minutes ago   Up 12 minutes   0.0.0.0:5432->5432/tcp, [::]:5432->5432/tcp
```

**B) Health check**

Plak hier (exact):

- command: curl -i [http://localhost:8000/health](http://localhost:8000/health)

```bash
student@Device-01:~/dev/theGame$ curl -i <http://localhost:8000/health>
HTTP/1.1 200 OK
date: Wed, 18 Feb 2026 20:00:24 GMT
server: uvicorn
content-length: 15
content-type: application/json
```

student@Device-01:

**C) n8n UI reachable**

Plak hier:

- screenshot van: [http://localhost:5678](http://localhost:5678/)

**D) Decision**

- M0 gate: PASS
- Signed-off by: Tom
- Date: 2026-02-18

---

### Evidence - M1 (Database ready)

(placeholder - wordt ingevuld bij M1)

**A) migrate output**

output van:  `./scripts/migrate.sh`

```bash
[migrate] running /home/student/dev/theGame/db/migrations/001_init.sql
CREATE SCHEMA
CREATE SCHEMA
CREATE TABLE
CREATE TABLE
CREATE TABLE
[migrate] done
```

**B) schema/table existence proof**

command: `docker exec -it thegame-postgres psql -U thegame -d thegame -c "\\\\dn”`

output:

```bash
      List of schemas
  Name  |       Owner
--------+-------------------
 app    | thegame
 public | pg_database_owner
 raw    | thegame
(3 rows)
```

**C) (optioneel) simple SELECT proof**

command: `docker exec -it thegame-postgres psql -U thegame -d thegame -c "\\\\dt app.*"`

output:

```bash
           List of relations
 Schema |    Name     | Type  |  Owner
--------+-------------+-------+---------
 app    | pois        | table | thegame
 app    | route_stops | table | thegame
 app    | routes      | table | thegame
(3 rows)
```

**D) Decision**

- M1 gate: PASS
- Signed-off by: Tom
- Date: 2026-02-18

---

### Evidence - M2 (Data pipeline ready)

**A) Seed output**

```
[seed] inserting minimal POIs into app.pois (idempotent)
INSERT 0 0
[seed] done
```

**B) Count proof (app.pois > 0)**

Command :`docker exec -it thegame-postgres psql -U thegame -d thegame -c "SELECT count(*) FROM app.pois;”`

```
 count
-------
     2
(1 row)
```

**C) API proof (GET /pois)**

Command: `curl -i <http://localhost:8000/pois`>

Output (200 + body):

```json
[{"id":1,"source_id":"seed-001","name":"Hidden Gem 1","lat":50.8466,"lng":4.3528,"theme":"Culture","short_description":"Seed POI for M2","practical_info":null},{"id":2,"source_id":"seed-002","name":"Hidden Gem 2","lat":50.845,"lng":4.36,"theme":"Food","short_description":"Seed POI for M2","practical_info":"Try the local spot"}]
```

**D) Decision**

- M2 gate: PASS
- Signed-off by: Tom
- Date: 2026-02-18

---

## **Evidence — M3 (Route generation works)**

### Evidence — M3 (Route generation works)

**A) API proof — POST /routes/generate**

- Doel: bewijzen dat endpoint bestaat en payload volgens contract teruggeeft.
- **Backend contract** (API response + hard cap)

Command: `curl -i -X POST <http://localhost:8000/routes/generate> \\\\   -H"Content-Type: application/json" \\\\   -d'{"theme":"Culture","distance_km":2}'`

Output:

```bash
{
  "route_id": "962f065f-2ce1-4274-b250-2adbf09948a0",
  "theme": "Culture",
  "distance_km": 2.0,
  "duration_min": null,
  "coordinates": [
    { "lat": 50.8466, "lng": 4.3528 }
  ],
  "stops": [
    {
      "stop_number": 1,
      "poi_id": 1,
      "name": "Hidden Gem 1",
      "lat": 50.8466,
      "lng": 4.3528
    }
  ]
}
```

B) UI proof — Polyline + numbered stops

**Doel**

Bewijzen dat de frontend:

- de route **tekent als polyline**
- de stops **nummering 1..N** correct toont

**Evidence (required)**

- **UI rendering** (polyline + numbering)
- Screenshot van map view met:
    - polyline zichtbaar
    - stop markers zichtbaar met labels **1..N**
    - (optioneel) actieve filter badge zichtbaar

**Where**

- Voeg hier screenshot toe (upload in Notion)

**Notes (optional)**

- Route generated via `POST /routes/generate` (theme=Culture)

**C) Hard cap proof — max 5 stops enforced**

Implementation proof:

- DB query uses `LIMIT 5` when selecting stops for a route.

Command: `curl -s -X POST <http://localhost:8000/routes/generate> \\\\ -H "Content-Type: application/json" \\\\ -d '{"theme":"Culture","distance_km":10}' | python3 -c "import sys, json; d=json.load(sys.stdin); print('stops=', len(d['stops']))"`

Output:

```bash
stops= 1
```

**D) Decision**

M3 gate: **IN PROGRESS**

Reason: **UI proof (B) pending**

- M3 gate: **IN PROGRESS**
- A) done
- B) Pending
- Signed-off by: __
- Date: __

---

## 

## Evidence — M4 (Chat per stop + security checks)

**Status**

- Done

---

## A) Chat functional (API)

**Command**

```bash
curl -i -X POST <http://localhost:8000/chat/stop> \\\\
  -H"Content-Type: application/json" \\\\
  -d'{"route_id":"test","stop_number":1,"poi_id":1,"message":"Vertel me een kort verhaal."}'
```

**Output**

```json
{"header":"Stop 1 — Hidden Gem 1","reply":"(stub) Story for Hidden Gem 1. You said: Vertel me een kort verhaal."}
```

**Check**

- ✅ Header format = `Stop {n} — {POI name}`

---

## B) Security controls

### B1) 500 chars cap (expect 400)

**Command**

```bash
python3 - <<'PY'
import requests

msg ="a" * 501
r = requests.post("<http://localhost:8000/chat/stop>",
    json={"route_id":"test","stop_number": 1,"poi_id": 1,"message": msg},timeout=10,
)print("status:", r.status_code)print(r.text)
PY
```

**Output**

```
status: 400
{"detail":"Message too long (max 500 chars)."}
```

**Check**

- ✅ 500 chars cap enforced

---

### B2a) chat/stop rate limit (10 req/min/IP)

**Command**

```bash
python3 - <<'PY'
import requests

url ="<http://localhost:8000/chat/stop>"
payload = {"route_id":"test","stop_number": 1,"poi_id": 1,"message":"ping"}for iin range(1, 15):
    r = requests.post(url, json=payload,timeout=10)print(i, r.status_code, r.text)
PY
```

**Output**

```
(…)
10 200 ...
11 429 {"detail":"Even wachten en opnieuw proberen."}
12 429 {"detail":"Even wachten en opnieuw proberen."}
13 429 {"detail":"Even wachten en opnieuw proberen."}
14 429 {"detail":"Even wachten en opnieuw proberen."}
```

**Check**

- ✅ 429 returned + message matches spec

---

### B2b) routes/generate rate limit (3 req/min/IP)

**Command**

```bash
python3 - <<'PY'
import requests
url="<http://localhost:8000/routes/generate>"
payload={"theme":"Culture","distance_km":2}for iin range(1, 8):
    r = requests.post(url, json=payload,timeout=10)print(i, r.status_code)
PY
```

**Output**

```
1 200
2 200
3 200
4 429
5 429
6 429
7 429
```

**Check**

- ✅ 429 returned after 3 requests

---

### B3) No persistent chat logs (metrics only)

**Note**

- ✅ Geen chat content wordt weggeschreven (geen DB writes / files).
- ✅ Logging is beperkt tot status/latency/error; geen message content.

---

## Decision

- M4 gate: ✅ PASS
- Completed: A) ✅, B) ✅
- Signed-off by: Tom (Security) + Tom (Backend) + Tom (Project Lead)
- Date: 2026-02-19
- Notes: Rate limiter = in-memory (dev/MVP), no persistence.

## 4.5.1 Doel

Per milestone vastleggen:

- wat de **gate** is (objectieve “pass/fail” criteria)
- welke **evidence** vereist is
- wie **sign-off** geeft

Resultaat: geen discussie achteraf, geen “bij mij werkt het”, geen scope creep.

## 4.5.2 Sign-off Policy (locked)

Een milestone is pas “Done” als:

1. alle gate checks groen zijn
2. evidence is toegevoegd
3. sign-off is gegeven door de juiste rol

Geen sign-off = milestone blijft “In Review”.

- **Partial sign-off is toegestaan per sub-gate** (bv. M3-A backend), maar milestone blijft “In Review” tot alle sub-gates groen zijn.

## 4.5.3 Gate Matrix (M0–M4)

### M0 - Platform boots

**Gate**

- Docker runtime start (postgres + backend + n8n)
- `GET /health` = 200 OK
- n8n UI reachable

**Required evidence**

- terminal output/screenshot: compose services gestart (postgres/backend/n8n)
- bewijs: `GET /health` response = 200
- screenshot: n8n UI bereikbaar

**Sign-off**

- Project Lead + 1 team reviewer

---

### M1 - Database ready

**Gate**

- `./scripts/migrate.sh` runs zonder errors
- schemas `raw` en `app` bestaan
- tables bestaan: `app.pois`, `app.routes`, `app.route_stops`
- backend kan connecteren naar Postgres

**Required evidence**

- migrate script output (zonder errors)
- bewijs schema `raw` en `app` bestaan
- bewijs tabellen bestaan: `app.pois`, `app.routes`, `app.route_stops`
- (optioneel) simpele `SELECT` op `app.pois` die geen error geeft

**Sign-off**

- Database owner + Project Lead

---

### M2 - Data pipeline ready

**Gate**

- `./scripts/seed.sh` runs zonder errors
- `app.pois` bevat data (count > 0)
- `GET /pois` retourneert data

**Required evidence**

- seed script output (zonder errors)
- bewijs `app.pois` count > 0
- sample response van `GET /pois`

**Sign-off**

- Data/DB owner + Backend owner

---

### M3 - Route generation works

**Gate**

- `POST /routes/generate` levert route payload volgens contract
- polyline + genummerde stops werken in UI
- hard cap: max 5 POIs enforced

**Required evidence**

- **A) Backend:** sample request/response van `POST /routes/generate` + bewijs max 5 stops enforced
- **B) Frontend:** UI screenshot met polyline zichtbaar + stops genummerd 1..N

**Required evidence**

- sample request/response van `POST /routes/generate`
- UI screenshot: polyline zichtbaar + stops genummerd
- bewijs max 5 stops enforced (response of UI proof)

**Sign-off**

- Backend owner + Frontend owner

---

### M4 - Chat per stop + security checks

**Gate**

- `POST /chat/stop` werkt met correcte header context
- max message length 500 chars enforced
- rate limiting actief:
    - routes/generate 3 req/min/IP
    - chat/stop 10 req/min/IP
- geen persistente chat logs (logging = metrics only)

**Sub-gates (M4)**

- **A) Chat functional (API):** correcte header context + response werkt
- **B) Security controls:** 500 chars cap + rate limiting + no chat persist

**Required evidence**

- **A) Chat functional:** sample request/response `POST /chat/stop` met correcte header context
- **B) Security controls:** bewijs 400 bij >500 chars + bewijs 429 bij rate limit + bevestiging “no persistent chat logs”

**Sign-off**

- Security owner + Backend owner + Project Lead

---

## 4.5.4 Sign-off Log (template)

Per milestone:

- Milestone: Mx
- Date:
- Reviewer(s):
- Evidence links:
- Decision: ✅ Approved / ❌ Changes required
- Notes:

## 4.5.5 Evidence Archive (per milestone)

### Evidence - M0 (Platform boots)

**A) Compose services running**

- output van: docker compose ps

```bash
student@Device-01:~/dev/theGame$ docker compose ps
NAME               IMAGE              COMMAND                  SERVICE    CREATED          STATUS          PORTS
thegame-backend    thegame-backend    "uvicorn app.main:ap…"   backend    8 seconds ago    Up 7 seconds    0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp
thegame-n8n        n8nio/n8n:latest   "tini -- /docker-ent…"   n8n        12 minutes ago   Up 12 minutes   0.0.0.0:5678->5678/tcp, [::]:5678->5678/tcp
thegame-postgres   postgres:15        "docker-entrypoint.s…"   postgres   12 minutes ago   Up 12 minutes   0.0.0.0:5432->5432/tcp, [::]:5432->5432/tcp
```

**B) Health check**

Plak hier (exact):

- command: curl -i [http://localhost:8000/health](http://localhost:8000/health)

```bash
student@Device-01:~/dev/theGame$ curl -i <http://localhost:8000/health>
HTTP/1.1 200 OK
date: Wed, 18 Feb 2026 20:00:24 GMT
server: uvicorn
content-length: 15
content-type: application/json
```

student@Device-01:

**C) n8n UI reachable**

Plak hier:

- screenshot van: [http://localhost:5678](http://localhost:5678/)

**D) Decision**

- M0 gate: PASS
- Signed-off by: Tom
- Date: 2026-02-18

---

### Evidence - M1 (Database ready)

(placeholder - wordt ingevuld bij M1)

**A) migrate output**

output van:  `./scripts/migrate.sh`

```bash
[migrate] running /home/student/dev/theGame/db/migrations/001_init.sql
CREATE SCHEMA
CREATE SCHEMA
CREATE TABLE
CREATE TABLE
CREATE TABLE
[migrate] done
```

**B) schema/table existence proof**

command: `docker exec -it thegame-postgres psql -U thegame -d thegame -c "\\\\dn”`

output:

```bash
      List of schemas
  Name  |       Owner
--------+-------------------
 app    | thegame
 public | pg_database_owner
 raw    | thegame
(3 rows)
```

**C) (optioneel) simple SELECT proof**

command: `docker exec -it thegame-postgres psql -U thegame -d thegame -c "\\\\dt app.*"`

output:

```bash
           List of relations
 Schema |    Name     | Type  |  Owner
--------+-------------+-------+---------
 app    | pois        | table | thegame
 app    | route_stops | table | thegame
 app    | routes      | table | thegame
(3 rows)
```

**D) Decision**

- M1 gate: PASS
- Signed-off by: Tom
- Date: 2026-02-18

---

### Evidence - M2 (Data pipeline ready)

**A) Seed output**

```
[seed] inserting minimal POIs into app.pois (idempotent)
INSERT 0 0
[seed] done
```

**B) Count proof (app.pois > 0)**

Command :`docker exec -it thegame-postgres psql -U thegame -d thegame -c "SELECT count(*) FROM app.pois;”`

```
 count
-------
     2
(1 row)
```

**C) API proof (GET /pois)**

Command: `curl -i <http://localhost:8000/pois`>

Output (200 + body):

```json
[{"id":1,"source_id":"seed-001","name":"Hidden Gem 1","lat":50.8466,"lng":4.3528,"theme":"Culture","short_description":"Seed POI for M2","practical_info":null},{"id":2,"source_id":"seed-002","name":"Hidden Gem 2","lat":50.845,"lng":4.36,"theme":"Food","short_description":"Seed POI for M2","practical_info":"Try the local spot"}]
```

**D) Decision**

- M2 gate: PASS
- Signed-off by: Tom
- Date: 2026-02-18

---

## **Evidence — M3 (Route generation works)**

### Evidence — M3 (Route generation works)

**A) API proof — POST /routes/generate**

- Doel: bewijzen dat endpoint bestaat en payload volgens contract teruggeeft.
- **Backend contract** (API response + hard cap)

Command: `curl -i -X POST <http://localhost:8000/routes/generate> \\\\   -H"Content-Type: application/json" \\\\   -d'{"theme":"Culture","distance_km":2}'`

Output:

```bash
{
  "route_id": "962f065f-2ce1-4274-b250-2adbf09948a0",
  "theme": "Culture",
  "distance_km": 2.0,
  "duration_min": null,
  "coordinates": [
    { "lat": 50.8466, "lng": 4.3528 }
  ],
  "stops": [
    {
      "stop_number": 1,
      "poi_id": 1,
      "name": "Hidden Gem 1",
      "lat": 50.8466,
      "lng": 4.3528
    }
  ]
}
```

B) UI proof — Polyline + numbered stops

**Doel**

Bewijzen dat de frontend:

- de route **tekent als polyline**
- de stops **nummering 1..N** correct toont

**Evidence (required)**

- **UI rendering** (polyline + numbering)
- Screenshot van map view met:
    - polyline zichtbaar
    - stop markers zichtbaar met labels **1..N**
    - (optioneel) actieve filter badge zichtbaar

**Where**

- Voeg hier screenshot toe (upload in Notion)

**Notes (optional)**

- Route generated via `POST /routes/generate` (theme=Culture)

**C) Hard cap proof — max 5 stops enforced**

Implementation proof:

- DB query uses `LIMIT 5` when selecting stops for a route.

Command: `curl -s -X POST <http://localhost:8000/routes/generate> \\\\ -H "Content-Type: application/json" \\\\ -d '{"theme":"Culture","distance_km":10}' | python3 -c "import sys, json; d=json.load(sys.stdin); print('stops=', len(d['stops']))"`

Output:

```bash
stops= 1
```

**D) Decision**

M3 gate: **IN PROGRESS**

Reason: **UI proof (B) pending**

- M3 gate: **IN PROGRESS**
- A) done
- B) Pending
- Signed-off by: __
- Date: __

---

## 

## Evidence — M4 (Chat per stop + security checks)

**Status**

- Done

---

## A) Chat functional (API)

**Command**

```bash
curl -i -X POST <http://localhost:8000/chat/stop> \\\\
  -H"Content-Type: application/json" \\\\
  -d'{"route_id":"test","stop_number":1,"poi_id":1,"message":"Vertel me een kort verhaal."}'
```

**Output**

```json
{"header":"Stop 1 — Hidden Gem 1","reply":"(stub) Story for Hidden Gem 1. You said: Vertel me een kort verhaal."}
```

**Check**

- ✅ Header format = `Stop {n} — {POI name}`

---

## B) Security controls

### B1) 500 chars cap (expect 400)

**Command**

```bash
python3 - <<'PY'
import requests

msg ="a" * 501
r = requests.post("<http://localhost:8000/chat/stop>",
    json={"route_id":"test","stop_number": 1,"poi_id": 1,"message": msg},timeout=10,
)print("status:", r.status_code)print(r.text)
PY
```

**Output**

```
status: 400
{"detail":"Message too long (max 500 chars)."}
```

**Check**

- ✅ 500 chars cap enforced

---

### B2a) chat/stop rate limit (10 req/min/IP)

**Command**

```bash
python3 - <<'PY'
import requests

url ="<http://localhost:8000/chat/stop>"
payload = {"route_id":"test","stop_number": 1,"poi_id": 1,"message":"ping"}for iin range(1, 15):
    r = requests.post(url, json=payload,timeout=10)print(i, r.status_code, r.text)
PY
```

**Output**

```
(…)
10 200 ...
11 429 {"detail":"Even wachten en opnieuw proberen."}
12 429 {"detail":"Even wachten en opnieuw proberen."}
13 429 {"detail":"Even wachten en opnieuw proberen."}
14 429 {"detail":"Even wachten en opnieuw proberen."}
```

**Check**

- ✅ 429 returned + message matches spec

---

### B2b) routes/generate rate limit (3 req/min/IP)

**Command**

```bash
python3 - <<'PY'
import requests
url="<http://localhost:8000/routes/generate>"
payload={"theme":"Culture","distance_km":2}for iin range(1, 8):
    r = requests.post(url, json=payload,timeout=10)print(i, r.status_code)
PY
```

**Output**

```
1 200
2 200
3 200
4 429
5 429
6 429
7 429
```

**Check**

- ✅ 429 returned after 3 requests

---

### B3) No persistent chat logs (metrics only)

**Note**

- ✅ Geen chat content wordt weggeschreven (geen DB writes / files).
- ✅ Logging is beperkt tot status/latency/error; geen message content.

---

## Decision

- M4 gate: ✅ PASS
- Completed: A) ✅, B) ✅
- Signed-off by: Tom (Security) + Tom (Backend) + Tom (Project Lead)
- Date: 2026-02-19
- Notes: Rate limiter = in-memory (dev/MVP), no persistence.