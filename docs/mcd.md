# MCD — Hidden Gems Brussels Map

**Version:** 1.1  
**Date:** 2026-03-01  
**Status:** Build baseline (pre-repo)

**Locked constraints**
- KM range: **1–15**
- Gems per route: **6–10** (default 8)
- Route tolerance: **±10%**
- Route retries: **max 2**
- Routes are **stateless**
- Stories are **simple HTTP**
- Database: **PostgreSQL**

## 🎯 1. Overview & Goals

**Project Vision**:

Build a **map-first web app** for Brussels that lets users discover “hidden gems” through **theme-based exploration** and **personalized walking routes**. The app combines **Open Data Brussels locations** with an **AI storytelling layer** so the experience is more than a generic map directory.

**Target Users**:

- **Tourists (short-stay)**: want a ready-to-walk route that fits their time and interests.
- **Locals (weekend explorers)**: want alternative places beyond mainstream attractions.
- **Students / small groups**: want thematic walks (culture, art, war, beverages, leisure) with a narrative hook.

### **Core Features (MVP, prioritized)**:

1. **User Inputs (Route Config)**
    - Select **Theme** (predefined list)
    - Select **Distance (km)** (user chooses within bounds)
    - Select **Route Shape**: `Loop` or `A→B`
    - Select **Start point** on map (user-selected). Map default center: **Grand Place, Brussels** + optional **Use my location**
2. **Interactive Map (Google Maps API)**
    - Display gem pins
    - Render the generated route on the map
3. **Gem Detail Pages**
    - AI-generated story (clearly labeled as AI-generated)
    - Practical info (from dataset + internal model)
4. **AI Itinerary Builder**
    - Generates an ordered set of gems + walking route matching: theme + distance + shape + start/end

### **Explicit boundaries (MVP exclusions)**:

- No accounts/login, no social features, no payments, no offline mode, no multi-city support.

### **Success Criteria (definition of “done”)**:

- **E2E flow works**: Theme + Distance + Start + Shape → route generated → displayed on map → user can open gem detail and see story + info.
- **Routing quality**: route distance is within **±10%** of the user target (based on `kmTarget`).
- **Resilience**: graceful fallbacks for: no gems found, Maps API error, AI generation failure, geolocation denied.
- **Performance targets (initial)**:
    - Map initial load **≤ 3s** on standard laptop + stable connection.
    - Route generation response **≤ 10s** under normal conditions.
    - Cached story fetch **≤ 300ms**; uncached story timeout **≤ 20s**.
- **Data integrity**: Open Data ingestion produces valid “Gem” records with location fields usable for mapping.

### **Business Context**:

This solves a clear discovery gap: mainstream tourist content misses niche places. The app’s differentiator is **curated themed discovery + walkable route personalization + story layer** (not a generic directory). Using **Open Data Brussels** reduces content acquisition friction and keeps the model scalable. After MVP, you expand value by **adding your own curated gems** to increase uniqueness and quality.

## 📘 Glossary (quick)
- **Stateless route**: route results are not saved server-side; refreshing the page requires regenerating.
- **Waypoint**: a stop along the route (in this project: a gem).
- **Polyline**: encoded line string representing the route geometry for map display.
- **Upsert**: insert a new record or update it if it already exists.
- **Bounding box**: rough rectangular area filter to reduce candidate gems before routing.

---

---

## 🏗️ 2. Technical Architecture

### **Frontend**:

- **React 18 + TypeScript** (UI + type safety)
- **Vite** (fast dev/build loop)
- **Routing**: React Router (page flow: map → gem detail)
- **State**: Zustand *or* React Context (keep it lightweight; this is not a fintech)
- **Data fetching**: TanStack Query (cache + retries + clean async state)
- **Maps**: Google Maps JavaScript API (map, markers, route overlay)
- **Styling**: TailwindCSS (only if you already use it; otherwise don’t add tool sprawl)

### **Backend**:

- **Node.js (18+) + Express** (thin API layer; protects keys and centralizes business logic)
- **Database**:
    - **PostgreSQL** (gems, story cache, dataset provenance)
- **ORM (optional but sane)**: Prisma (schema clarity + migrations)
- **Core services**:
    - Data ingestion + normalization (Open Data Brussels → `Gem` schema)
    - Route generation orchestration (calls Google routing API, enforces limits)
    - Story generation orchestration (calls AI provider, caches output)
- **Auth**: none for MVP; if you need admin actions later, start with an **admin API key** header. JWT can wait.

### **APIs**:

- **Open Data Brussels** (dataset source for gems)
- **Google Maps JavaScript API** (frontend map rendering)
- **Google Routes API** (walking route computation; backend only)
- **Browser Geolocation API** (optional “Use my location”; fallback to map click)
- **AI Text Generation API,** OpenAI (model TBD)
- *(Future)* Text-to-speech API for audio stories (not MVP unless already implemented)

### **Infrastructure**:

- **Secrets**: `.env` + backend-only keys; restrict Google keys (referrer/IP + quotas)
- **Local dev**: run frontend + backend concurrently; optional Docker Compose if using Postgres
- **CI/CD**: GitHub Actions (lint + typecheck + tests + build on PR)
- **Hosting (MVP)**: keep it simple
    - Frontend: Vercel/Netlify
    - Backend: Render/Fly.io/Railway
    - DB: managed Postgres if you go that route
- **Cost controls** (non-negotiable): enforce km bounds + waypoint caps + request throttling so routing doesn’t explode in cost.

### **Technology Justification**:

- **React + Node** matches your team’s skills and maximizes delivery speed.
- **Backend is mandatory** if you care about key security, quota control, and not turning the frontend into a security leak.
- **Open Data Brussels + your own Gem schema** keeps ownership clean and sets you up for manual curation later.
- **Minimal infra wins** for a school MVP: Docker/AWS/Redis/JWT are optional complexity—only add when the repo proves you need it.

## 📋 3. Detailed Implementation

Purpose: granular feature definitions for reliable build execution (human + AI).

### Database Schema (PostgreSQL)

```sql
-- PostgreSQL baseline schema
-- UUIDs: pgcrypto provides gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Dataset provenance (Open Data Brussels + future sources)
CREATE TABLE datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  source_url TEXT NOT NULL,          -- dataset page/API endpoint
  license_url TEXT,                  -- dataset license reference
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2) Gems (project-owned normalized records)
CREATE TABLE gems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id),
  external_id TEXT,                  -- original id in dataset (if any)

  title TEXT NOT NULL,
  theme TEXT NOT NULL,               -- MVP: single theme per gem
  description_short TEXT,

  address TEXT,
  latitude NUMERIC(9,6) NOT NULL,
  longitude NUMERIC(9,6) NOT NULL,

  practical_info JSONB,              -- hours/contact/website/etc if available (project-owned/open-data)
  source_type TEXT NOT NULL CHECK (source_type IN ('open_data', 'manual')),

  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE (dataset_id, external_id)
);

CREATE INDEX idx_gems_theme ON gems(theme);
CREATE INDEX idx_gems_lat_lng ON gems(latitude, longitude);

-- 3) Cached AI stories (avoid regenerating per request)
CREATE TABLE gem_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gem_id UUID REFERENCES gems(id) ON DELETE CASCADE,

  theme TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  prompt_version TEXT NOT NULL DEFAULT 'v1',

  story_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE (gem_id, theme, language, prompt_version)
);

-- 4) Optional: route request logs (debugging only; can be disabled)
CREATE TABLE route_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  theme TEXT NOT NULL,
  km_target NUMERIC(5,2) NOT NULL,
  shape TEXT NOT NULL CHECK (shape IN ('loop', 'a_to_b')),

  start_lat NUMERIC(9,6) NOT NULL,
  start_lng NUMERIC(9,6) NOT NULL,
  end_lat NUMERIC(9,6),
  end_lng NUMERIC(9,6),

  gems_selected JSONB,               -- array of gem UUIDs
  km_result NUMERIC(6,2),
  status TEXT NOT NULL DEFAULT 'created', -- created|ok|failed
  error_message TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_route_logs_created_at ON route_logs(created_at);
```

**Constraints**

- `latitude/longitude` are mandatory for mapping.
- `theme` is mandatory for MVP.
- `gems(source_type)` enforces open-data vs manual.
- `gem_stories` is cached uniquely by `(gem_id, theme, language, prompt_version)`.

---

### API Endpoints (stateless routes, simple HTTP)

**Base:** `/api`

**Auth:** none for MVP. Admin sync uses `x-admin-key` header.

### Health

**GET `/api/health`**

Returns service health and database connectivity.

**Response**
```json
{ "ok": true, "db": true }
```

### Gems

**GET `/api/gems?theme=:theme`**

Returns minimal gem list for map pins.

**Errors**
- `400` invalid theme value (if theme is provided but not in allowed set)

**Response**

```json
{
  "items": [
    {
      "id":"uuid",
      "title":"string",
      "theme":"Art",
      "latitude":50.8466,
      "longitude":4.3528,
      "address":"string|null",
      "practicalInfo": {}
    }
  ]
}
```

**GET `/api/gems/:id`**

Returns full gem record.

**Errors**
- `400` invalid ID format
- `404` gem not found

**Response**

```json
{
  "id":"uuid",
  "title":"string",
  "theme":"Art",
  "descriptionShort":"string|null",
  "address":"string|null",
  "latitude":50.8466,
  "longitude":4.3528,
  "practicalInfo": {},
  "sourceType":"open_data"
}
```

### Route generation (stateless)

**POST `/api/routes`**

Generates a route and returns polyline + selected gems. No persistence required.

**Request**

```json
{
  "theme":"Art",
  "kmTarget":7,
  "shape":"loop",
  "start": { "lat":50.8466, "lng":4.3528 },
  "end":null
}
```

**Response**

```json
{
  "shape":"loop",
  "kmTarget":7,
  "kmResult":6.8,
  "gems": [
    { "id":"uuid", "title":"..." }
  ],
  "polyline":"encoded_polyline_string",
  "warnings": []
}
```

**Notes**
- Backend may retry route computation up to `ROUTE_MAX_RETRIES=2` by adjusting gem count within 6–10.

**Errors**
- `400` invalid input (km out of bounds, missing end for A→B, invalid coords)
- `502` upstream routing failure (Google error)
- `503` no route found within constraints (including `INSUFFICIENT_GEMS` when < 6 candidates)

### AI story

**POST `/api/gems/:id/story`**

Returns cached story if available, otherwise generates and stores it.

**Request**

```json
{ "theme":"Art", "language":"en" }
```

**Response**

```json
{
  "gemId":"uuid",
  "theme":"Art",
  "language":"en",
  "promptVersion":"v1",
  "storyText":"..."
}
```

**Errors**

- `404` gem not found
- `502` upstream AI failure (provider error)
- `503` generation timeout

### Data sync (team/admin only)

**POST `/api/admin/datasets/sync`**

- Requires header: `x-admin-key: <secret>`
- Fetches configured Open Data Brussels datasets and upserts normalized gems.

**Errors**
- `401` missing or invalid admin key

**Response**

```json
{
  "datasetsSynced":1,
  "gemsUpserted":250,
  "gemsDeactivated":12
}
```

---

### UI Components (hierarchy, props, state)

### Component hierarchy (MVP)

```jsx
<AppLayout>
<MapPage>
<RouteConfigPanel>
<ThemeSelect/>
<DistanceInput/>
<ShapeToggle/>            // loop | a_to_b
<StartPointControl/>      // map click + "Use my location"
<EndPointControl/>        // only if shape=a_to_b
<GenerateRouteButton/>
</RouteConfigPanel>

<MapView>
<GemMarkers/>
<RouteOverlay/>
</MapView>

<GemDetailDrawer>
<GemHeader/>
<GemPracticalInfo/>
<StoryPanel/>             // AI story + status + retry
</GemDetailDrawer>
</MapPage>
</AppLayout>
```

### Key props/state (TypeScript contracts)

```ts
type RouteShape = "loop" | "a_to_b";
type LatLng = { lat: number; lng: number };

interface GemPin {
  id: string;
  title: string;
  theme: string;
  latitude: number;
  longitude: number;
  address?: string | null;
}

interface RouteConfigState {
  theme: string;
  kmTarget: number;
  shape: RouteShape;
  start: LatLng | null;
  end: LatLng | null; // required only for a_to_b
}

interface RouteResultState {
  kmTarget: number;
  kmResult: number;
  shape: RouteShape;
  gems: Array<{ id: string; title: string }>;
  polyline: string;
  warnings: string[];
}

interface StoryState {
  status: "idle" | "loading" | "ready" | "error";
  text?: string;
  error?: string;
}
```

**State management rule**

- RouteConfig is owned at `MapPage` level.
- `RouteResultState` is derived after route generation.
- `selectedGemId` drives `GemDetailDrawer` and story fetch.

---

### Business Logic (algorithms, validation, workflows)

### Validation rules (hard)

- `kmTarget` must be within bounds: KM_MIN (1) ≤ kmTarget ≤ KM_MAX (15)
- `shape=loop` → `end` must be null/ignored.
- `shape=a_to_b` → `end` is required.
- Coordinates must be valid lat/lng ranges.
- Enforce waypoint cap (cost control): **MAX_GEMS** config.
- Gems selected must be within bounds: MIN_GEMS (6) ≤ gems ≤ MAX_GEMS (10)

```tsx
Config constants:
- KM_MIN = 1
- KM_MAX = 15
- MIN_GEMS = 6
- MAX_GEMS = 10
- DEFAULT_GEMS = 8
- ROUTE_TOLERANCE_PERCENT = 10
- ROUTE_MAX_RETRIES = 2
- DEFAULT_SHAPE = "loop"
- DEFAULT_THEME = "Culture"
- DEFAULT_MAP_CENTER = { lat: 50.8467, lng: 4.3525 } // Grand Place
```

### Workflow 1 — Dataset ingestion (Open Data → Gems)

1. Fetch dataset(s) and capture dataset license URL into `datasets.license_url`
2. Map raw records to `Gem` schema
3. Validate presence of coordinates; skip invalid rows
4. Assign/normalize theme:
    - If dataset contains categories → map to your theme list
    - Else → default theme or mark as “Decision Needed”
5. Upsert into `gems` table (by dataset_id + external_id)
6. Mark previously ingested gems missing from latest sync as `is_active=false` (optional)

### Workflow 2 — Route generation (stateless)

Inputs: `theme, kmTarget, shape, start, end?`

1. Load candidate gems by theme (and `is_active=true`). If fewer than **MIN_GEMS (6)** candidates exist, return `503` with error code `INSUFFICIENT_GEMS`.
2. Pre-filter by radius/bounding box around start (fast pruning)
3. Select a subset of gems (N) based on heuristic:
    - nearest gems to start OR
    - nearest to corridor (start→end for A→B)
4. Call Google routing API for walking route:
    - waypoints = selected gems
    - enforce waypoint cap
5. Check `kmResult` vs `kmTarget`:
    - if outside tolerance, adjust N and retry (max 2 tries)
6. Return `polyline + ordered gems + kmResult + warnings`

### Workflow 3 — Story generation (cached)

1. Check `gem_stories` for `(gemId, theme, language, promptVersion)`
2. If exists → return cached
3. Else:
    - Build prompt using only project-owned facts (title, location, open-data fields)
    - Call AI provider
    - Store in `gem_stories`
    - Return story
4. Failure behavior:
    - return error + allow retry
    - never fabricate “practical info” fields

---

### Integration Points (external services)

- **Open Data Brussels → Backend ingestion**
    - HTTP fetch from dataset endpoints
    - Normalize to `Gem` schema
    - Persist into PostgreSQL
- **Google Maps JS API → Frontend**
    - Render map
    - Display markers
    - Draw route overlay from encoded polyline
- **Google routing API → Backend**
    - Compute walking routes
    - Return distance + polyline
    - Apply cost controls (waypoint cap, request limits)
- **Browser Geolocation → Frontend**
    - Optional “Use my location”
    - On failure/deny → fallback to map click start
- **AI provider → Backend**
    - Generate story text
    - Cache in `gem_stories`
    - Backend calls AI provider, caches in `gem_stories`, prompt versioned
    - Return to frontend via HTTP

---

## 📁 4. File Structure & Organization

### **Project Layout**

```
hidden-gems-brussels/
├─ README.md
├─ .gitignore
├─ .env.example                 # template only (no secrets)
├─ docker-compose.yml            # Postgres local dev
├─ docs/
│  ├─ MCD.md                     # single source of truth
│  ├─ traceability.md
│  ├─ decision-log.md
│  └─ api-contracts.md           # request/response examples
├─ data/
│  ├─ raw/                       # downloaded Open Data Brussels files
│  ├─ mappings/                  # theme mapping tables (csv/json)
│  └─ normalized/                # optional exports for debugging
├─ backend/
│  ├─ package.json
│  ├─ src/
│  │  ├─ app.ts                  # express app init
│  │  ├─ server.ts               # boot + listen
│  │  ├─ config/
│  │  │  ├─ env.ts               # env parsing/validation
│  │  │  └─ constants.ts         # km bounds, caps, prompt version
│  │  ├─ db/
│  │  │  ├─ index.ts             # db connection
│  │  │  ├─ schema.sql           # reference schema (or migrations)
│  │  │  └─ migrations/          # if using migration tool
│  │  ├─ modules/
│  │  │  ├─ gems/
│  │  │  │  ├─ gems.routes.ts
│  │  │  │  ├─ gems.controller.ts
│  │  │  │  ├─ gems.service.ts
│  │  │  │  └─ gems.repo.ts
│  │  │  ├─ routes/
│  │  │  │  ├─ routes.routes.ts
│  │  │  │  ├─ routes.controller.ts
│  │  │  │  ├─ routes.service.ts
│  │  │  │  └─ routing.provider.ts   # google routes integration
│  │  │  ├─ stories/
│  │  │  │  ├─ stories.routes.ts
│  │  │  │  ├─ stories.controller.ts
│  │  │  │  ├─ stories.service.ts
│  │  │  │  └─ ai.provider.ts        # ai integration
│  │  │  └─ admin/
│  │  │     ├─ admin.routes.ts
│  │  │     └─ sync.service.ts        # open data ingestion
│  │  ├─ shared/
│  │  │  ├─ http/
│  │  │  │  ├─ errors.ts              # error types + mapper
│  │  │  │  └─ validate.ts            # request validation
│  │  │  ├─ logging/
│  │  │  └─ utils/
│  │  └─ tests/
│  │     ├─ unit/
│  │     └─ integration/
│  └─ scripts/
│     └─ sync-datasets.ts        # manual dataset sync script
├─ frontend/
│  ├─ package.json
│  ├─ index.html
│  ├─ vite.config.ts
│  ├─ src/
│  │  ├─ main.tsx
│  │  ├─ App.tsx
│  │  ├─ routes/                 # React Router pages
│  │  │  └─ MapPage.tsx
│  │  ├─ components/
│  │  │  ├─ map/
│  │  │  │  ├─ MapView.tsx
│  │  │  │  ├─ GemMarkers.tsx
│  │  │  │  └─ RouteOverlay.tsx
│  │  │  ├─ route-config/
│  │  │  │  ├─ RouteConfigPanel.tsx
│  │  │  │  ├─ ThemeSelect.tsx
│  │  │  │  ├─ DistanceInput.tsx
│  │  │  │  ├─ ShapeToggle.tsx
│  │  │  │  ├─ StartPointControl.tsx
│  │  │  │  └─ EndPointControl.tsx
│  │  │  └─ gem-detail/
│  │  │     ├─ GemDetailDrawer.tsx
│  │  │     ├─ GemPracticalInfo.tsx
│  │  │     └─ StoryPanel.tsx
│  │  ├─ store/                  # Zustand/Context store
│  │  ├─ api/                    # typed API client
│  │  ├─ types/
│  │  ├─ hooks/
│  │  └─ tests/
└─ .github/
   └─ workflows/
      └─ ci.yml                  # lint/typecheck/test/build (later)
```

### **Naming Conventions**

- **Files/folders**: `kebab-case` for folders, `PascalCase.tsx` for React components
    - e.g. `GemDetailDrawer.tsx`, `route-config/`
- **TypeScript**:
    - Types/interfaces: `PascalCase` (`Gem`, `RouteRequest`)
    - Functions/variables: `camelCase` (`generateRoute`, `kmTarget`)
    - Constants: `UPPER_SNAKE_CASE` (`MAX_GEMS_PER_ROUTE`)
- **Backend modules**:
    - `.routes.ts` (Express router wiring)
    - `.controller.ts` (HTTP boundary)
    - `.service.ts` (business logic)
    - `.repo.ts` (DB queries)

### **Code Organization**

- **Separation of concerns is enforced**:
    - Frontend: UI components do not contain business logic for routing/AI.
    - Backend: business logic lives in services; controllers are thin.
- **Single source of truth for configs**:
    - `backend/src/config/constants.ts` for km bounds, tolerance, waypoint caps, promptVersion.
- **Testing**:
    - Backend: unit tests for selection logic + integration tests for endpoints.
    - Frontend: minimal component tests + one E2E smoke test later (optional).

### **Environment Setup**

**Local dependencies**

- Node.js 18+
- PostgreSQL (via Docker Compose recommended)

**Environment variables**

- Frontend:
    - `VITE_GOOGLE_MAPS_API_KEY` (restricted by HTTP referrer)
- Backend:
    - `DATABASE_URL`
    - `GOOGLE_ROUTES_API_KEY` (backend-only)
    - `AI_PROVIDER` (e.g., openai)
    - `OPENAI_API_KEY` (backend-only)
    - `ADMIN_API_KEY`
    - `KM_MIN`, `KM_MAX` (optional; can be constants)
    - `MIN_GEMS`, `MAX_GEMS`, `DEFAULT_GEMS`
    - `ROUTE_TOLERANCE_PERCENT`
    - `ROUTE_MAX_RETRIES`
    - `PROMPT_VERSION`

---

## 🔨 5. Task Breakdown & Implementation Plan

### Phase 1: Foundation (Week 1) — “Runway”

**1.1 Project Setup**

- Monorepo: `/frontend`, `/backend`, `/docs`, `/data`
- React 18 + TS + Vite
- Node + Express + TS
- ESLint/Prettier + scripts
- **Acceptance**: `dev` runs frontend+backend; `lint` passes
- **Dependencies**: none
- **Complexity**: Low
- **Files**: scaffold + docs

**1.2 Database Setup (PostgreSQL)**

- `docker-compose.yml` Postgres
- DB connection + `/api/health`
- Schema/migrations: `datasets`, `gems`, `gem_stories`, optional `route_logs`
- **Acceptance**: migrations apply clean; health shows DB ok
- **Dependencies**: 1.1
- **Complexity**: Medium
- **Files**: `/backend/src/db/*`

**1.3 Config + Environment**

- `.env.example` complete
- Backend env validation
- Constants locked in code:
    - `KM_MIN=1`, `KM_MAX=15`
    - `MIN_GEMS=6`, `MAX_GEMS=10`, `DEFAULT_GEMS=8`
- **Acceptance**: app fails fast on missing env; bounds enforced
- **Dependencies**: 1.1
- **Complexity**: Low
- **Files**: `/backend/src/config/*`

---

### Phase 2: Core Features (Week 2–3) — “MVP slice”

**2.1 Open Data Ingestion**

- Select dataset(s) + document them in `/docs`
- Sync service: fetch → normalize → upsert gems
- Admin endpoint: `POST /api/admin/datasets/sync` (x-admin-key)
- **Acceptance**: sync populates DB with valid lat/lng; invalid skipped
- **Dependencies**: 1.2, 1.3
- **Complexity**: Medium
- **Files**: `/backend/src/modules/admin/*`, `/data/*`, `/docs/*`

**2.2 Gems API**

- `GET /api/gems?theme=...` (pins)
- `GET /api/gems/:id` (detail)
- **Acceptance**: correct data + 404 handling
- **Dependencies**: 2.1
- **Complexity**: Low–Medium
- **Files**: `/backend/src/modules/gems/*`

**2.3 Map UI + Pins**

- Google Maps integration
- Render markers from `GET /api/gems`
- Theme filter wired end-to-end
- **Acceptance**: map loads; markers display; theme filter works
- **Dependencies**: 2.2
- **Complexity**: Medium
- **Files**: `/frontend/src/components/map/*`, `/frontend/src/routes/MapPage.tsx`

**2.4 Route Generation API (stateless, capped)**

- `POST /api/routes`
- Enforce:
    - km bounds 1–15
    - gems count 6–10
- Candidate selection + Google routing call + polyline
- Retry strategy max 2 (adjust gem count within 6–10)
- **Acceptance**: returns route + kmResult; fails gracefully when impossible
- **Dependencies**: 2.2, 1.3
- **Complexity**: High
- **Files**: `/backend/src/modules/routes/*`

**2.5 Route Config UI + Route Overlay**

- Inputs: theme/km/shape/start/end
- Start by map click + optional geolocation
- Calls `/api/routes` and draws polyline
- **Acceptance**: loop and A→B both work; km input validated
- **Dependencies**: 2.3, 2.4
- **Complexity**: High
- **Files**: `/frontend/src/components/route-config/*`, `/frontend/src/components/map/RouteOverlay.tsx`

**2.6 Gem Detail + AI Story (cached)**

- Gem detail drawer/modal
- `POST /api/gems/:id/story` generates or returns cached story
- Story panel with retry + clear AI label
- **Acceptance**: click gem → detail + story visible; cache hit works
- **Dependencies**: 2.2, 1.2, 1.3
- **Complexity**: Medium–High
- **Files**: `/backend/src/modules/stories/*`, `/frontend/src/components/gem-detail/*`

✅ **End of Phase 2 = MVP shippable**

---

### Phase 3: Advanced Features (Week 4) — “Better quality”

**3.1 Improved routing quality**

- Corridor-aware selection for A→B
- Better distance targeting while staying within 6–10 gems
- **Acceptance**: routes closer to target more often
- **Dependencies**: 2.4
- **Complexity**: Medium–High

**3.2 Manual gems (admin add)**

- Insert manual gems into `gems` (source_type=manual)
- Admin-only endpoint (no UI required)
- **Acceptance**: manual gem appears and is routable
- **Dependencies**: 1.2, 2.2
- **Complexity**: Medium

---

### Phase 4: Polish (Week 5) - “Deploy-ready”

**4.1 UX hardening**

- Empty states + loading + error UX
- **Acceptance**: no dead ends; clear user guidance
- **Dependencies**: MVP complete
- **Complexity**: Medium

**4.2 Quality gates + tests**

- Integration tests for `/gems`, `/routes`, `/story`
- CI: lint + typecheck + tests + build
- **Acceptance**: CI green required on PR
- **Dependencies**: 1–2 complete
- **Complexity**: Medium

**4.3 Deployment**

- Deploy FE + BE + DB
- Runbook: env vars + dataset sync + key restriction checklist
- **Acceptance**: deployed app runs full MVP flow
- **Dependencies**: 4.2
- **Complexity**: Medium

---

## 🔗 6. Integration & Dependencies

Purpose: map connections, requirements, and failure behavior so implementation stays predictable.

### **Internal Dependencies**

**Frontend**

- `RouteConfigPanel` → produces **RouteConfig state** (theme, km, shape, start/end)
- `MapPage` depends on:
    - `GET /api/gems` to render markers
    - `POST /api/routes` to render route overlay
    - `GemDetailDrawer` to show selected gem + story
- `GemMarkers` depends on gem list; emits `onSelectGem(gemId)`
- `GemDetailDrawer` depends on:
    - `GET /api/gems/:id` for practical info
    - `POST /api/gems/:id/story` for story

**Backend**

- `gems.controller` → `gems.service` → `gems.repo` → PostgreSQL
- `routes.controller` → `routes.service`
    - depends on `gems.repo` (candidate gems)
    - depends on `routing.provider` (Google routing call)
- `stories.controller` → `stories.service`
    - depends on `gems.repo` (gem facts)
    - depends on `stories.repo` (cache read/write)
    - depends on `ai.provider` (AI generation)
- `admin.sync` depends on:
    - dataset fetcher (Open Data Brussels)
    - normalization mapper
    - `gems.repo` upsert logic

---

### **External Services**

**Open Data Brussels**

- Purpose: source of initial gems
- Integration: backend sync job downloads dataset(s) and normalizes into `gems`
- Requirements:
    - dataset selection documented
    - license references stored in `datasets.license_url`

**Google Maps JavaScript API (Frontend)**

- Purpose: interactive map, markers, route overlay
- Integration: frontend loads Maps JS SDK using `VITE_GOOGLE_MAPS_API_KEY`
- Requirements:
    - key restricted by HTTP referrer
    - avoid storing/caching Google-returned content beyond what is allowed

**Google Routes API (Backend)**

- Purpose: compute walking route and return polyline + distance
- Integration: backend calls Routes with `GOOGLE_ROUTES_API_KEY`
- Requirements:
    - enforce caps: km 1–15, gems 6–10
    - limit retries (max 2)
    - apply response shaping (field masks) + quotas

**Browser Geolocation API (Frontend, optional)**

- Purpose: convenience start point
- Integration: `navigator.geolocation` → set start coords
- Requirements:
    - fallback to map click start
    - do not store user location (session-only)

**AI Text Generation Provider (Backend)**

- Purpose: generate story text for gem detail
- Integration: backend prompt built from project-owned facts → AI API call → cache in `gem_stories`
- Requirements:
    - strict “no invented practical info”
    - caching by gem/theme/language/promptVersion
    - timeouts + retry policy (max 1 user-triggered retry)

---

### **Data Flow**

**Flow A — Load map + gems**

1. Frontend loads map (Google Maps JS)
2. Frontend calls `GET /api/gems?theme=...`
3. Backend queries `gems` table and returns pins
4. Frontend renders markers

**Flow B — Generate route (stateless)**

1. User sets theme + km + shape + start (+ end if A→B)
2. Frontend calls `POST /api/routes`
3. Backend:
    - validates inputs (km 1–15, shape rules)
    - loads candidate gems by theme
    - selects 6–10 gems (default 8)
    - calls Google Routes API to compute route
    - evaluates result vs kmTarget; retries max 2 by adjusting gem count within 6–10
4. Backend returns polyline + ordered gems + kmResult
5. Frontend draws route overlay + optionally highlights selected gems

**Flow C — Gem detail + story**

1. User clicks gem marker
2. Frontend calls `GET /api/gems/:id` (facts/practical info)
3. Frontend calls `POST /api/gems/:id/story`
4. Backend:
    - checks `gem_stories` cache
    - if miss: builds prompt from gem facts → AI call → stores story
5. Frontend displays story (with AI label) + practical info

**Flow D — Data sync (admin)**

1. Team triggers `POST /api/admin/datasets/sync` with `x-admin-key`
2. Backend fetches dataset(s) → normalizes → upserts `gems` and updates `datasets.last_synced_at`
3. Logs count of inserts/updates/deactivations

---

### **Error Handling**

**General rules**

- Fail fast on invalid inputs (400) with clear error codes
- Treat external calls as unreliable; wrap with timeouts and mapped errors
- Never block the UI without feedback: always show loading + actionable error

**Frontend error handling**

- Gems load fails → show “Couldn’t load gems” + retry
- Route generation fails → keep markers visible, show error + suggestions:
    - reduce km, switch shape, move start point
- Story fails → show fallback message + “Retry story” button
- Geolocation denied/unavailable → show “Select start point on map” (no drama)

**Backend error mapping**

- `400 Bad Request`:
    - km outside 1–15
    - shape invalid
    - missing end for A→B
    - invalid coordinates
- `404 Not Found`:
    - gem id does not exist
- `429 Too Many Requests`:
    - rate limit hit (AI or Google) → return with “try later” message
- `502 Bad Gateway`:
    - upstream failure from Google/AI
- `503 Service Unavailable`:
    - route cannot be computed within constraints (no candidates / no path)

**Resilience controls**

- Route API:
    - candidate pruning
    - waypoint cap enforced
    - retries max 2
- AI story:
    - cache-first
    - hard timeout
    - no automatic infinite retries (user-triggered only)

---

## 🧪 7. Testing & Validation Strategy

Purpose: ship a stable MVP with a 2-person team without over-engineering.

### **Unit Tests**

**Goal:** verify core logic in isolation (fast, cheap, reliable).

**Backend (highest ROI)**

- **Route selection logic**
    - candidate filtering (theme + is_active)
    - gem selection returns **6–10** items
    - loop vs A→B validation logic
    - km bounds enforcement (**1–15 km**)
    - retry logic stops after max 2 attempts
- **Story prompt builder**
    - uses only gem (no fabricated practical info)
    - consistent prompt versioning
- **Normalization mapper (open data → Gem)**
    - skips invalid coordinates
    - maps/normalizes theme correctly (or flags unknown)

**Frontend (minimal, targeted)**

- `RouteConfigPanel` validation:
    - disables generate when start missing
    - requires end when A→B
    - km input clamped to 1–15
- `StoryPanel` state transitions:
    - idle → loading → ready / error

**Acceptance (unit layer):**

- Unit tests run in <30s locae validators and selectors covered.

---

### **Integration Tests**

**Goal:** prove API endpoints work with a real database and real request/response contracts.

**Backend integration tests (must-have)**

- `GET /api/gems?theme=...`
    - returns only active gems
    - returns expected shape for map pins
- `GET /api/gems/:id`
    - 200 for valid id, 404 for invalid
- `POST /api/routes`
    - 400 for invalid inputs (km out of range, missing end for A→B)
    - 200 returns: `polyline`, `kmResult`, `gems[]` ze between 6–10
    - does not persist route state (stateless)
- `POST /api/gems/:id/story`
    - cache hit returns without calling provider (mock provider)
    - cache miss stores in `gem_stories`
    - 404 for unknown gem

**Admin sync**

- `POST /api/admin/datasets/sync` with correct `x-admin-key`:
    - upserts gems
    - sets `datasets.last_synced_at`
- wrong key:
    - returns 401/403

**Data contracts**

- Snapshot test for responses to prevent breaking frontend.

**Acceptance (integration layer):*
- Tests run against local Postgres (docker-compose).
- API contract breaks are caught before merge.

---

### **End-to-End Tests**

**Goal:** validate the user journey as the user experiences it.

**E2E MVP flow (must-have smoke test)**

1. Load app → map visible
2. Select theme
3. Select km (within 1–15)
4. Select shape loop or A→B
5. Click map to set start (+ optionally set end)
6. Generate route → polyline appears + gems list visible
7. Click a marker → detail opens
8. Story loads (or cached) wn with AI label

**E2E edge-case flows (nice-to-have)**

- Geolocation denied → fallback to map click
- No gems found → user gets actionable message
- Routing failure → error shown, app still usable
- AI fails → story panel shows retry

**Acceptance (E2E layer):**

- One green “happy path” run is required before release.
- E2E runs can be manual initially if automation is too heavy, but must follow a written checklist.

---

### **Performance Tests**

**Goal:** ensure the app feels responsive alow cost/quota.

**Frontend**

- First meaningful map render: target **≤ 3 seconds** on normal laptop + stable connection (baseline)
- Marker rendering remains responsive with typical dataset size (**Decision Needed:** expected gem count; start with “<1000 pins”)
- Prevent re-render storms (memoization where needed)

**Backend**

- `/api/gems` response time: target **≤ 300ms** with warm DB
- `/api/routes` latency: target **≤ 10s** in normal conditions
- `/api/gems/:id/story`:
    - cached: **≤ 3 uncached: depends on provider; show loading state; enforce timeout

**Load test scope (lightweight)**

- 20 concurrent users calling `/api/gems` + `/api/routes` at low frequency
- Ensure no crashes, sensible error handling, and no uncontrolled retries

**Cost controls validation**

- Verify route logic never exceeds waypoint cap (max 10)
- Verify retry logic max 2

---

### **Acceptance Criteria (Feature-level validation)**

Use this format: **Given / When / Then**. This becomes your Definition-of-Done proof.

**Feature: Theme filtering**

- Given the map is loaded
    
    When the user selects theme “Art”
    
    Then only gems with theme “Art” are shown as pins
    

**Feature: Distance bounds**

- Given the user enters km < 1
    
    When they attempt to generate a route
    
    Then the UI clamps/blocks and shows a message “Distance must be 1–15 km”
    

**Feature: Shape = Loop**

- Given shape is “Loop” and start point is selected
    
    When the user generates a route
    
    en the route starts and ends at (or near) the start point and end input is ignored
    

**Feature: Shape = A→B**

- Given shape is “A→B”
    
    When the user has not selected an end point
    
    Then route generation is blocked with a clear prompt to select an end point
    

**Feature: Stateless route**

- Given a route was generated
    
    When the user refreshes the page
    
    Then the route is not persisted and must be generated again
    

**Feature: Gems per route cap**

- Given the erates a route
    
    When the backend selects gems
    
    Then the returned gems list size is between **6 and 10**
    

**Feature: AI story caching**

- Given a story was generated for gem X with theme Y
    
    When the user opens the same gem again
    
    Then the story is returned from cache (faster) and content is consistent
    

**Feature: AI failure fallback**

- Given the AI provider is unavailable
    
    When the user requests a story
    
    Then the UI shows a readable fallback error and a retry button, without breaking the app
    

**Feature: Routing failure fallback**

- Given the routing API fails
    
    When the user generates a route
    
    Then the UI shows an error and still allows changing inputs and retrying
    

---

## 🚀 8. Deployment & Operations

Purpose: production readiness without enterprise overkill (school MVP).

### **Environment Configuration**

**Development**

- Local Postgres via `docker-compose`
- Frontend + backend run concurrently
- Debug logging enabl
- Mock/stub mode available for AI/Routing (optional but useful for testing)

```text
Production defaults:
- ROUTE_TOLERANCE_PERCENT=10
- KM_MIN=1
- KM_MAX=15
- MIN_GEMS=6
- MAX_GEMS=10
- DEFAULT_GEMS=8
- ROUTE_MAX_RETRIES=2
```

**Production**

- Separate env vars and keys
- Debug logs disabled (keep info/warn/error)
- Strict rate limits enabled
- Safe defaults enforced:
    - `KM_MIN=1`, `KM_MAX=15`
    - `MIN_GEMS=6`, `MAX_GEMS=10`, `DEFAULT_GEMS=8`
    - route retry cap = 2
    - story timeout + no auto-retry loops

**Required env vars**

- Frontend: `VITE_GOOGLE_MAPS_API_KEY`
- Backend:
    - `DATABASE_URL`
    - `GOOGLE_ROUTES_API_KEY`
    - `AI_API_KEY`
    - `ADMIN_API_KEY`
    - `KM_MIN`, `KM_MAX`
    - `MIN_GEMS`, `MAX_GEMS`, `DEFAULT_GEMS`
    - `ROUTE_TOLERANCE_PERCENT`
    - `ROUTE_MAX_RETRIES`
    - `PROMPT_VERSION`

---

### **Deployment Process**

**Baseline deployment model (recommended)**

- **Frontend**: Vercel/Netlify (static build + env vars)
- **Backend**: Render/Fly.io/Railway (Node service + env vars)
- **Database**: managed Postgres (same platform or separate)

**Deployment steps**

1. Provision Postgres and set `DATABASE_URL`
2. Deploy backend with env vars set
3. Run migrations on deploy (or manual migration step)
4. Deploy frontend with correct Maps key
5. Lock down keys (referrer/IP restrictions + quotas)
6. Run admin sync once: `POST /api/admin/datasets/sync`
7. Execute MVP smoke test checklist (end-to-end)

**CI/CD (minimal but real)**

- On Pull Request:
    - lint + typecheck
    - unit + integration tests
    - build frontend + backend
- On merge to `main`:
    - deploy backend
    - deploy frontend
    - (optional) run migrations step

---

### **Monitoring**

**What to monitor**

- Backend:
    - request rate and error rate (4xx/5xx)
    - latency for:
        - `GET /api/gems`
        - `POST /api/routes`
        - `POST /api/gems/:id/story`
    - external failures:
        - Google routing errors (count + status codes)
        - AI provider errors/timeouts
    - DB health:
        - connection failures
        - slow queries (if any)
- Frontend:
    - page load failures
    - map initialization failure events
    - route generation failures (client-side)
    - story fetch failures

**How**

- Start simple:
    - structured backend logs (JSON logs recommended)
    - basic platform metrics dashboard
- Optional upgrade:
    - error tracking (Sentry) if time allows

**Alerting (MVP)**

- Not needed for school MVP, but log everything needed to debug:
    - correlation id per request
    - upstream error payload summaries
    - route warnings returned to client

---

### **Scaling Considerations**

You don’t need “scale architecture” now, but avoid design traps.

**Primary scaling pressure points**

1. **Routing cost/latency** (external API)
2. **AI generation cost/latency** (external API)
3. **Gem dataset size** (pins and queries)

**Controls (already baked in)**

- hard caps: **6–10 gems**, **1–15 km**, **retry max 2**
- cache stories in `gem_stories`
- use lightweight gem r map pins (don’t send full records)
- pre-filter candidates by bounding box/radius to reduce computation

**If usage grows**

- add server-side caching for `GET /api/gems?theme=...`
- add scheduled ingestion (daily/weekly)
- add pagination/clustered markers if pins become heavy
- consider precomputing “theme clusters” by area

---

### **Maintenance Tasks**

**Daily/Weekly**

- Monitor API quotas (Google + AI)
- Validate dataset license/availability (Open Data Brussels)
- Check sync success + record  after ingestion

**Regular**

- Run dataset sync (manual trigger for MVP; scheduled later)
- Rotate keys if exposed (rare but must be documented)
- Review story prompt versioning:
    - if prompt changes materially, bump `PROMPT_VERSION` to prevent cache confusion

**Data quality maintenance**

- Validate coordinates for new datasets
- Validate theme mapping table updates
- Deactivate broken/invalid gems (`is_active=false`)

**Operational runbook (minimum docs)**

- How to set env vars
- How to run migrations
- How to trigger dataset sync
- How to troubleshoot: Maps not loading / routes failing / AI failing

---



## 🧾 Appendix A — Traceability Matrix (baseline)

| Goal | Requirement | Implementation task(s) | Verification evidence |
|---|---|---|---|
| Theme-based discovery | Theme selection + filtering | 2.2 Gems API, 2.3 Map UI + Pins | Integration test: `GET /api/gems?theme=...`; Demo: theme changes pins |
| Distance-based personalization | Distance bounds 1–15 | 2.5 Route Config UI + Route OverlI validation test: km clamped 1–15; Demo: km affects route |
| Map-first exploration | Map render + pin click | 2.3 Map UI + Pins, 2.6 Gem Detail | Manual smoke test: pins clickable, detail opens |
| Walking itinerary | Stateless routing (6–10 gems, ±10%, retries max 2) | 2.4 Route Generation API | Integration test: `POST /api/routes` returns 6–10 gems; error handling tests |
| Story layer | Cached AI story (no invented practical info) | 2.6 Gem Detail + AI Story | Integration test: story cache hit/m acceptance: story labeled AI-generated |
| Data pipeline | Open data ingestion + provenance | 2.1 Open Data Ingestion | Sync report + DB rows; license_url stored in `datasets` |

## ✅ MCD Quality Checklist (Quality Gate)

### ✅ Completeness Check

- [ ]  All 8 MCD sections exist and are filled with project-specific content (no generic SaaS placeholders).
- [ ]  MVP scope is explicit (what’s in / out) and matches the execution plan.
- [ ]  Success criteria are measurable and include at minimum:
    - ge: **1–15 km**
    - Gems per route: **6–10** (default 8)
    - Route distance tolerance: **10%**
- [ ]  Technical architecture identifies **frontend**, **backend**, **DB**, and **external services** with clear ownership of responsibilities.
- [ ]  Database schema includes:
    - `datasets`, `gems`, `gem_stories`
    - keys/constraints and indexes for theme + coordinates
- [ ]  API endpoints include routes + request/response schemas for:
    - `GET /api/gems`
    - `POST /api/routes` (stateless)
    - T /api/gems/:id/story`
    - `POST /api/admin/datasets/sync`
- [ ]  Task breakdown is phase-based, each task has:
    - deliverable, acceptance criteria, dependencies, complexity, impacted files
- [ ]  Integrations & dependencies are mapped (Open Data, Google Maps, Google Routes, AI provider, geolocation).

### ✅ Clarity Check

- [ ]  A short glossary exists defining core terms (e.g., polyline, waypoint, stateless, upsert).
- [ ]  Code snippets are syntactically correct (SQL/JSON) and consistent with the osen DB (PostgreSQL).
- [ ]  API schemas explicitly list required fields and validation rules:
    - Loop vs A→B behavior
    - required `end` for A→B
    - km bounds enforcement
- [ ]  Database relationships are explicit:
    - `datasets → gems`
    - `gems → gem_stories`
- [ ]  File structure matches the architecture and clearly separates:
    - frontend UI
    - backend controllers/services/repos
    - data ingestion
    - docs (MCD, decision log, traceability)

### ✅ Actionability Check

- [ ] can build the MVP vertical slice without guessing:
    - route config → route generation → map overlay → gem detail → story
- [ ]  Acceptance criteria are testable using Given/When/Then or equivalent.
- [ ]  Error conditions are specified and handled:
    - no gems found
    - routing API failure / quota
    - AI generation failure / timeout
    - geolocation denied/unavailable
- [ ]  Integration protocols are clear:
    - which service is called by frontend vs backend
    - where keys live and how restricted
- [ ]  Performance targets are quantified (fill values):
    - Map load target: **3 seconds**
    - Route generation target: **10 seconds**
    - Cached story target: **300 ms**
    - Uncached story timeout: **20 seconds**

### ✅ Change Control Gate (Recommended)

- [ ]  Any change to requirements/architecture updates:
    - MCD section(s)
    - decision log (if a decision changed)
    - traceability matrix rows affected
- [ ]  PR includes proof:
    - which acceptance criteria were validated
  - what tests were run
    - what integration points were touched

---

## MCD Creation Workflow

### Step 1: Research Phase (Targeted, not broad)

**Goal:** collect only the constraints and patterns that can break your MVP if ignored.

**Use GPT-5.2 for deep research on:**

- **Google Maps platform constraints** (map rendering vs routing APIs, quotas, key restrictions, caching limits)
- **Open Data Brussels** dataset selection + licensing per dataset
- **Routing patterns for walking itineraries** (waypoint caps, distance targeting heuristics)
- **AI story generation guardrails** (no fabricated practical info, caching strategy, prompt versioning)
- **MVP-quality testing practices** (route generation + caching + failure handling)

**Output of Step 1 must be:**

- A short “Constraints & Guardrails” list (max 1 page)
- A “Decisions Needed” list (to eliminate ambiguity)
- A minimal benchmark set (map load, route latency, story timeout)

✅ In your case: we already did most of this. The only missing reseacts are:

- **chosen dataset URLs**
- **chosen AI provider/model**
- **final numeric performance thresholds** (if you want them hard)

---

### Step 2: Structure Creation (8 sections, methodical)

**Goal:** fill the MCD template in execution order.

You already followed the correct order. Lock it like this:

1. Overview & Goals ✅
2. Technical Architecture ✅
3. Detailed Implementation ✅
4. File Structure ✅
5. Task Breakdown ✅ (locked: km 1–15, gems 6–10)
6. Integrations & Dependencies ✅
7. Testing & Validation ✅
8. Deployment & Operations ✅

Add 2 supporting pages under `/docs`:

- `decision-log.md`
- `traceability.md`

---

### Step 3: Validation & Refinement (Gate-based)

**Goal:** catch gaps before code.

**Peer Review (team of 2)**

- Each person runs the **MCD Quality Checklist** and marks failures.

**Technical Review**

- Verify the highest-risk parts:
    - key security (backend-only for Routes + AI)
    - cost control (caps + retries)
    - licensing/provenance tracking (datasets e)

**Feasibility Check**

- Confirm Phase 2 results in an MVP demo after Week 2–3 (not Week 5).

**Agent Test (mandatory)**

- Run a test prompt:
    - “Build Phase 1 + 2.1 + 2.2 using this MCD.”
- If the agent asks more than ~5 clarification questions, your MCD still has gaps.

---

### Step 4: Living Document Maintenance (Non-negotiable)

**Goal:** keep MCD aligned with reality, prevent drift.

**Version Control**

- Store MCD in repo under `/docs/MCD.md` (even before code exists).

**Update Rules*very new feature PR must update:
    - MCD sections impacted
    - decision log (if decision changed)
    - traceability row(s)

**Context Refresh**

- After each phase, add:
    - “What we learned”
    - “What changed”
    - “What remains open”

**Team Sync**

- Weekly 10-minute checkpoint:
    - decisions made
    - scope changes
    - risks observed

---

## Common MCD Mistakes to Avoid (Project-Specific)

### ❌ Too Generic

**BAD:** “Build a map app with routes and AI stories.”

**GOOD* “Build a React + TypeScript web app that lets users select **Theme** and **Distance (1–15 km)**, choose **Route Shape (Loop or A→B)**, set **Start point (map click + optional geolocation)**, and generate a **stateless walking route** that includes **6–10 gems** from **Open Data Brussels**, displayed on **Google Maps**, with a **cached AI-generated story** per gem.”

---

### ❌ Missing Implementation Details

**BAD:** “Users can generate routes.”

**GOOD:**

“Users generate routes via `PO /api/routes` with required fields:

- `theme` (enum)
- `kmTarget` (number, **1–15**)
- `shape` (`loop` | `a_to_b`)
- `start` `{lat,lng}`
- `end` required only when `shape=a_to_b`

Backend enforces:

- gem cap **6–10** (default 8)
- retry max 2 (adjusting gem count within cap)
    
    Response includes:
    
- `polyline` (encoded)
- `kmResult`
- `gems[]` (ordered)
    
    Failures return:
    
- 400 (validation)
- 502/503 (routing upstream / no route)”

---

### ❌ Unclear Success Criteria

**BAD:*pp should be fast and stable.”

**GOOD:**

- Map initial render **≤ 3 seconds**
- Route generation response **≤ 10 seconds** under normal conditions
- Cached story fetch **≤ 300 ms**
- Uncached story request times out at **≤ 20 seconds** and shows a retry option
- End-to-end demo flow works 5 times in a row without manual fixes:
    
    theme + km + start + shape → route drawn → gem detail → story visible
    

*(If you don’t want these numbers yet, mark them explicitly as “Decision Nee — don’t leave them vague.)*

---

### ❌ Missing Dependencies

**BAD:** “Add gem detail pages.”

**GOOD:**

“Add gem detail pages depends on:

- Gems ingestion + normalized schema (`gems` table with lat/lng and practical_info)
- `GET /api/gems/:id` endpoint
- AI story caching (`gem_stories` table)
    
    Integrates with:
    
- Map markers (marker click opens detail)
- Story generation endpoint (`POST /api/gems/:id/story`)
- Error handling (AI fail → fallback + retry)”

---
