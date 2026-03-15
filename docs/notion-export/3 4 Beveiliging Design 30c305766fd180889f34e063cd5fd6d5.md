# 3.4 Beveiliging Design

### Context

De MVP werkt **zonder user accounts/login**. Daardoor moet de beveiliging vooral komen uit **API-hardening** en **strikte secret handling**, zodat misbruik en kosten (Maps/LLM) beheersbaar blijven en er geen privacy-risico ontstaat.

---

### Security scope (assets)

We beveiligen:

- **API keys** (Maps + LLM)
- **Backend endpoints** (route/chat = kost-gevoelig)
- **Database** (POI’s + routes)
- **n8n** (kan scripts triggeren → high impact)

---

### NFR-S1 — Secrets management (server-side, fail-fast)

**Doel:** geen keys in frontend of repo.

Controls:

- API keys staan uitsluitend in **backend env vars** via `.env` (Docker Compose).
- `.env` staat in `.gitignore`; `.env.example` bevat enkel placeholders.
- Backend doet **startup validation**: ontbrekende `MAPS_API_KEY` of `LLM_API_KEY` = **app start niet** (fail-fast).

Acceptatie:

- Geen secrets in Git of frontend bundle.
- Backend start enkel wanneer vereiste keys aanwezig zijn.

---

### NFR-S4 — Rate limiting (FastAPI, in-memory)

**Doel:** misbruik en onverwachte kosten voorkomen.

Controls:

- Rate limiting op:
    - `POST /routes/generate`
    - `POST /chat/stop`
- Implementatie in **FastAPI** (middleware/dependency), **in-memory counters** (MVP).
- Bij overschrijding: **HTTP 429** met duidelijke boodschap.

Policy (MVP):

- Chat: **10 requests/min/IP**
- Routes: **3 requests/min/IP**
- Message length limit: **max 500 chars**

Acceptatie:

- Overschrijding geeft 429.
- Backend blijft stabiel onder spam.

---

### NFR-S2 — Data minimization & logging policy (geen chatlogs)

**Doel:** privacy-by-design, geen opslag van chatinhoud.

Controls:

- **Geen persistente opslag** van chatberichten of AI-antwoorden in de database.
- Logging is **metrics-only**:
    - endpoint, status code, latency, error type, timestamp
- Logging bevat **geen request bodies** en geen PII.

Acceptatie:

- Geen chat tables/collections aanwezig.
- Logs bevatten geen chatinhoud.

---

### Extra low-effort controls (MVP)

- Input validation:
    - `theme` whitelist (War/Museum/Streetart/Food/Culture)
    - grenzen voor `distance_km` en `duration_min` (min/max)
- CORS beperken tot de frontend origin (dev ruimer, later strikter).
- **n8n beschermen** met basic auth en lokaal-only access.