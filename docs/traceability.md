# Traceability Matrix - The Game

Baseline snapshot: March 22, 2026.

## 1. Purpose

This document tracks traceability across the project lifecycle:

`FR/NFR -> design -> implementation -> validation -> milestone gate`

It is a living project artifact, derived from the traceability template and adapted to the current repository structure.

## 2. Source Of Truth

- Requirements and acceptance criteria:
  `docs/notion-export/2 Specificaties 30c305766fd18093b050c454027604ab.md`
- Database design:
  `docs/notion-export/3 2 Database Design (PostgreSQL) 30c305766fd180e4b5f3e8bc3fb955f8.md`
- UI design:
  `docs/notion-export/3 5 UI Design 30c305766fd180b8aa7ad8c2f14e9d78.md`
- API contracts:
  `docs/notion-export/3 7 API Contracts 30c305766fd1801ab208eb87bbc38778.md`
- Decision log:
  `docs/decision-log.md`
- Operational guidance:
  `docs/runbook.md`

## 3. Status Legend

- `NOT STARTED`: no meaningful implementation found
- `PARTIAL`: implemented in part, but not fully aligned to requirement/design
- `IMPLEMENTED`: present in code and broadly aligned
- `VERIFIED`: implemented and backed by explicit validation evidence
- `BLOCKED`: cannot progress without a design or scope decision

## 4. Functional Requirements Traceability

| FR ID | Requirement Summary | Gherkin Reference | Design Reference | Implementation Reference | Validation Evidence | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| FR-01 | Show POIs as pins on an interactive Brussels map | `Scenario: Filter op een thema` | `3 5 UI Design` | `frontend/src/components/map/MapView.tsx`<br>`frontend/src/components/map/GemMarkers.tsx`<br>`backend/src/app.ts` (`GET /api/gems`) | Manual map smoke test | IMPLEMENTED | Requires seeded gems and Google Maps key for full map mode |
| FR-02 | Offer theme filters | `Scenario: Filter op een thema` | `3 5 UI Design` | `frontend/src/components/route-config/RouteConfigPanel.tsx`<br>`frontend/src/constants.ts` | Manual UI check | PARTIAL | Theme selector exists, but current theme taxonomy does not match baseline list exactly |
| FR-03 | Filter pins dynamically by selected theme | `Scenario: Filter op een thema` | `3 5 UI Design`<br>`3 7 API Contracts` | `frontend/src/components/map/MapView.tsx`<br>`backend/src/modules/gems/gems.repo.ts` | Manual filter check | PARTIAL | Dynamic filtering works, but UX does not yet match the full scenario notes in the source spec |
| FR-04 | Allow POI selection via pin or map list | `Scenario: POI detailpagina openen en content tonen` | `3 5 UI Design` | `frontend/src/components/map/GemMarkers.tsx`<br>`frontend/src/store/gemDetailStore.ts` | Manual click-through | PARTIAL | Pin selection exists; map list selection is not implemented |
| FR-05 | Show a detail page for the selected POI | `Scenario: POI detailpagina openen en content tonen` | `3 5 UI Design` | `frontend/src/components/gem-detail/GemDetailDrawer.tsx`<br>`backend/src/app.ts` (`GET /api/gems/:id`) | Manual detail view check | IMPLEMENTED | Implemented as a drawer instead of a separate page |
| FR-06 | Show at least name and location on the detail view | `Scenario: POI detailpagina openen en content tonen` | `3 5 UI Design` | `frontend/src/components/gem-detail/GemDetailDrawer.tsx` | Manual detail content check | IMPLEMENTED | Address is shown when present in dataset |
| FR-07 | Show an AI story for the selected POI | `Scenario: POI detailpagina openen en content tonen` | `3 5 UI Design`<br>`3 7 API Contracts` | `frontend/src/components/gem-detail/GemDetailDrawer.tsx`<br>`backend/src/modules/stories/stories.service.ts`<br>`backend/src/modules/stories/story.prompt.ts`<br>`backend/src/app.ts` (`POST /api/gems/:id/story`) | Manual story generation check<br>`npm run test -w backend` | IMPLEMENTED | Story is generated on demand, uses a prompt builder with POI facts only, and returns cache metadata |
| FR-08 | Show practical info only when dataset-backed, otherwise show not found or uncertain | `Scenario: Praktische info ontbreekt in dataset` | `3 5 UI Design` | `frontend/src/components/gem-detail/GemDetailDrawer.tsx`<br>`backend/src/modules/gems/gems.repo.ts` | Manual detail view check | IMPLEMENTED | Drawer renders dataset-backed practical info and shows a fallback label when no practical info is present |
| FR-09 | Collect user input for theme plus time and/or distance | `Scenario: Route genereren en tonen op kaart` | `3 5 UI Design`<br>`3 7 API Contracts` | `frontend/src/components/route-config/RouteConfigPanel.tsx` | Manual route setup check | PARTIAL | Theme and distance exist; time input is not implemented |
| FR-10 | Generate a walking route from user input | `Scenario: Route genereren en tonen op kaart`<br>`Scenario: Geen route mogelijk binnen criteria` | `3 7 API Contracts` | `backend/src/modules/routes/routes.service.ts`<br>`backend/src/modules/routes/routing.provider.ts`<br>`backend/src/app.ts` (`POST /api/routes`) | Manual route generation check | IMPLEMENTED | Route selection, distance constraints, and retry behavior are present |
| FR-11 | Visualize the route as a line on the map | `Scenario: Route genereren en tonen op kaart` | `3 5 UI Design` | `frontend/src/components/map/RouteOverlay.tsx`<br>`frontend/src/components/map/MapView.tsx` | Manual map overlay check | IMPLEMENTED | Fallback preview mode also renders a route line |
| FR-12 | Number stops and show them in order | `Scenario: Route genereren en tonen op kaart` | `3 5 UI Design` | `backend/src/modules/routes/routes.service.ts` | None recorded | PARTIAL | Ordered gems are returned by backend, but the UI does not yet show a numbered stop list or numbered route markers |
| FR-13 | Offer a "Start wandeling" action | `Scenario: Route genereren en tonen op kaart` | `3 5 UI Design` | `frontend/src/components/route-config/RouteConfigPanel.tsx` | Manual route UI check | PARTIAL | A minimal start-walk CTA now exists after route generation, but the broader route-view UX is still incomplete |
| FR-14 | Load seed data from open data Brussels or a preloaded export | Operational data seed flow | `3 2 Database Design`<br>`3 7 API Contracts` | `backend/src/modules/admin/sync.service.ts`<br>`backend/src/app.ts` (`POST /api/admin/datasets/sync`) | Manual sync via runbook | IMPLEMENTED | Current sync targets one Brussels cultural dataset |
| FR-15 | Limit MVP to 5 POIs as a hard cap | Scope guard | `2 Specificaties` | None found | None recorded | BLOCKED | Current route logic targets 6-10 gems, which conflicts with this requirement and needs a decision-log entry |
| FR-16 | Show a chatbox for each route stop so the user can ask about that specific POI | `Scenario: Chatbox openen voor een specifieke route-stop` | `3 5 UI Design` | None found | None recorded | NOT STARTED | The shipped POI-drawer chatbot does not satisfy this yet because it is gem-scoped, drawer-based, and not tied to ordered route stops |
| FR-16a | Auto-load POI context into the route-stop chatbox | `Scenario: Chatbox openen voor een specifieke route-stop`<br>`Scenario: Chat blijft bruikbaar bij ontbrekende POI-context` | `3 5 UI Design`<br>`3 7 API Contracts` | None found | None recorded | NOT STARTED | Current MVP chat loads POI context by `gemId`, but route-stop chat behavior and route-linked persistence are still out of scope |
| FR-17 | Capture analytics events for route generation, route failure, route start, POI detail open, filter apply, story generation, stop chat open, and stop chat send | `GH-AN-05`<br>`GH-AN-06` | `3 1 Architectuur`<br>`3 2 Database Design (PostgreSQL)`<br>`3 7 API Contracts` | `backend/src/app.ts`<br>`backend/src/modules/analytics/service.ts`<br>`frontend/src/components/route-config/RouteConfigPanel.tsx`<br>`frontend/src/features/chat/ChatPanel.tsx` | `TC-AN-INT-01`<br>`TC-AN-INT-02`<br>`TC-AN-INT-03` | VERIFIED | All scoped analytics event types now have explicit automated coverage across backend-triggered and allowlisted frontend-triggered flows |
| FR-18 | Persist analytics data in dedicated storage separated from chat content | `GH-AN-05`<br>`GH-AN-06`<br>`GH-AN-07` | `3 1 Architectuur`<br>`3 2 Database Design (PostgreSQL)` | `db/migrations/002_analytics_events.sql`<br>`backend/src/modules/analytics/repo.ts`<br>`backend/src/modules/analytics/service.ts` | `TC-AN-INT-03`<br>`TC-AN-INT-04`<br>`TC-AN-SEC-01` | VERIFIED | Analytics events persist to dedicated `analytics_events` storage, and automated tests now prove chat/story content is excluded from analytics persistence and failure logging |
| FR-19 | Expose read-only analytics data via backend API to the admin portal | `GH-AN-01`<br>`GH-AN-02` | `3 1 Architectuur`<br>`3 5 UI Design`<br>`3 7 API Contracts` | `backend/src/app.ts`<br>`backend/src/modules/analytics/read.service.ts`<br>`backend/src/modules/analytics/read.repo.ts`<br>`backend/src/modules/admin/auth.ts`<br>`frontend/src/routes/AdminPage.tsx`<br>`frontend/src/api/client.ts` | `TC-AN-API-03`<br>`TC-AN-API-04`<br>`TC-AN-UI-01`<br>`TC-AN-UI-02` | VERIFIED | Read-only overview, timeseries, and breakdown endpoints now back the shipped `/admin` portal flow via the frontend BFF client |
| FR-20 | Show KPI cards for route generations, route starts, route failures, POI detail views, and chat sends | `GH-AN-01` | `3 5 UI Design`<br>`3 6 UI ↔ API Mapping` | `backend/src/app.ts`<br>`backend/src/modules/analytics/read.service.ts`<br>`backend/src/modules/analytics/read.repo.ts`<br>`frontend/src/routes/AdminPage.tsx`<br>`frontend/src/components/admin/AdminDashboardPage.tsx`<br>`frontend/src/components/admin/AnalyticsKpiCards.tsx` | `TC-AN-API-04`<br>`TC-AN-UI-02` | VERIFIED | KPI cards now render from `/api/admin/analytics/overview` in the admin dashboard shell |
| FR-21 | Show time-based graphs for route generations and route starts | `GH-AN-01`<br>`GH-AN-03` | `3 5 UI Design`<br>`3 6 UI ↔ API Mapping` | `backend/src/app.ts`<br>`backend/src/modules/analytics/read.service.ts`<br>`backend/src/modules/analytics/read.repo.ts`<br>`frontend/src/routes/AdminPage.tsx`<br>`frontend/src/components/admin/AnalyticsTimeseriesChart.tsx` | `TC-AN-API-04`<br>`TC-AN-UI-02`<br>`TC-AN-UI-05` | VERIFIED | The admin portal renders a simple stable timeseries chart from `/api/admin/analytics/timeseries`, and the shared filter refresh is covered in UI tests |
| FR-22 | Show breakdown graphs by theme and POI | `GH-AN-01`<br>`GH-AN-03` | `3 5 UI Design`<br>`3 6 UI ↔ API Mapping` | `backend/src/app.ts`<br>`backend/src/modules/analytics/read.service.ts`<br>`backend/src/modules/analytics/read.repo.ts`<br>`frontend/src/routes/AdminPage.tsx`<br>`frontend/src/components/admin/AnalyticsBreakdownChart.tsx` | `TC-AN-API-04`<br>`TC-AN-UI-02`<br>`TC-AN-UI-05` | VERIFIED | Theme and POI breakdown charts now render from `/api/admin/analytics/breakdowns` |
| FR-23 | Support analytics filtering by date range and theme where applicable | `GH-AN-03` | `3 5 UI Design`<br>`3 6 UI ↔ API Mapping`<br>`3 7 API Contracts` | `backend/src/app.ts`<br>`backend/src/modules/analytics/read.service.ts`<br>`frontend/src/routes/AdminPage.tsx`<br>`frontend/src/components/admin/AnalyticsFilters.tsx`<br>`frontend/src/api/client.ts` | `TC-AN-API-04`<br>`TC-AN-API-06`<br>`TC-AN-API-07`<br>`TC-AN-UI-05` | VERIFIED | The admin filter bar refreshes overview, timeseries, and breakdown queries with one shared filter set, and invalid filter inputs are explicitly rejected |
| FR-24 | Handle loading, empty, and error states in the admin portal | `GH-AN-01`<br>`GH-AN-02`<br>`GH-AN-04` | `3 5 UI Design`<br>`3 6 UI ↔ API Mapping` | `backend/src/app.ts`<br>`backend/src/modules/analytics/read.service.ts`<br>`frontend/src/routes/AdminPage.tsx`<br>`frontend/src/components/admin/AdminLoginPage.tsx`<br>`frontend/src/components/admin/AdminDashboardPage.tsx`<br>`frontend/src/components/admin/AdminErrorState.tsx`<br>`frontend/src/components/admin/AdminEmptyState.tsx` | `TC-AN-API-03`<br>`TC-AN-API-05`<br>`TC-AN-UI-01`<br>`TC-AN-UI-03`<br>`TC-AN-UI-04` | VERIFIED | The portal handles unauthorized, loading, empty, and backend-error states in the UI without exposing stale analytics data |
| FR-25 | Restrict the admin portal and analytics endpoints to authorized admin/stakeholder access | `GH-AN-02` | `3 1 Architectuur`<br>`3 8 Decicion log` | `backend/src/app.ts`<br>`backend/src/modules/admin/auth.ts` | `TC-AN-API-01`<br>`TC-AN-API-02`<br>`TC-AN-API-03`<br>`TC-AN-UI-01` | VERIFIED | v1 access control uses a shared env passphrase, backend-issued httpOnly cookie, and enforced session checks on analytics reads |
| FR-26 | Keep the analytics portal read-only | `GH-AN-01`<br>`GH-AN-02` | `3 5 UI Design`<br>`3 7 API Contracts`<br>`3 8 Decicion log` | `backend/src/app.ts`<br>`backend/src/modules/analytics/read.service.ts`<br>`frontend/src/routes/AdminPage.tsx`<br>`frontend/src/components/admin/AdminDashboardPage.tsx` | `TC-AN-API-04`<br>`TC-AN-UI-02` | VERIFIED | The shipped `/admin` experience exposes read-only analytics only and provides no create, edit, or delete controls |

## 5. Non-Functional Requirements Traceability

| NFR ID | Category | Design Reference | Implementation Reference | Validation Method | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| NFR-S1 | Secrets | `2 Specificaties`<br>`docs/runbook.md` | `backend/src/config/env.ts`<br>`docs/runbook.md`<br>`frontend/src/components/map/MapView.tsx` | Config review | PARTIAL | Backend secrets are env-based, but the frontend still uses a browser Maps key and must rely on platform restrictions |
| NFR-S2 | Data minimization | `2 Specificaties` | `backend/src/db/schema.sql`<br>`frontend/src/features/chat/useChat.ts` | Schema review | PARTIAL | No persistent POI chat logs exist; the chatbot transcript is local frontend state only, while route logs are still modeled in schema and unused |
| NFR-S4 | Abuse control | `2 Specificaties` | `backend/src/app.ts`<br>`backend/src/middleware/simpleRateLimit.ts` | API review | PARTIAL | Both `/api/gems/:id/story` and `/api/chat` now have in-memory rate limits; route generation still has no rate limiting |
| NFR-S5 | Admin access control | `2 Specificaties`<br>`3 1 Architectuur`<br>`3 5 UI Design`<br>`3 8 Decicion log` | `backend/src/app.ts`<br>`backend/src/modules/admin/auth.ts`<br>`frontend/src/routes/AdminPage.tsx`<br>`frontend/src/components/admin/AdminLoginPage.tsx` | `TC-AN-API-01`<br>`TC-AN-API-02`<br>`TC-AN-API-03`<br>`TC-AN-UI-01` | VERIFIED | Linked GH: `GH-AN-02`. Analytics reads require the backend-issued admin session via shared env passphrase + httpOnly cookie, and the frontend gates the portal behind that auth state |
| NFR-S6 | Analytics data minimization | `2 Specificaties`<br>`3 1 Architectuur`<br>`3 2 Database Design (PostgreSQL)` | `db/migrations/002_analytics_events.sql`<br>`backend/src/modules/analytics/service.ts` | `TC-AN-INT-03`<br>`TC-AN-SEC-01` | VERIFIED | Linked GH: `GH-AN-06`. Analytics storage excludes chat bodies, AI answers, request bodies, and direct PII, and failure logs are scrubbed down to event type + source |
| NFR-P1 | Analytics read performance | `2 Specificaties`<br>`3 7 API Contracts` | `backend/src/modules/analytics/read.repo.ts`<br>`backend/src/db/schema.sql`<br>`db/migrations/002_analytics_events.sql` | None recorded | PARTIAL | Linked GH: `GH-AN-01`, `GH-AN-03`. Read queries and supporting indexes exist, but the formal performance threshold is still a decision-needed gap |
| NFR-R1 | Analytics failure isolation | `2 Specificaties`<br>`3 1 Architectuur` | `backend/src/app.ts`<br>`backend/src/modules/analytics/service.ts` | `TC-AN-INT-04`<br>`TC-AN-SEC-01` | VERIFIED | Linked GH: `GH-AN-07`. Route generation and chat responses continue even when analytics persistence fails, and failure logs stay scrubbed |
| NFR-G1 | Governance / traceability updates | `2 Specificaties`<br>`3 8 Decicion log` | `docs/traceability.md`<br>`docs/notion-export/3 1 Architectuur 30c305766fd1801499d8ee93c2091515.md`<br>`docs/notion-export/3 5 UI Design 30c305766fd180b8aa7ad8c2f14e9d78.md`<br>`docs/notion-export/3 6 UI ↔ API Mapping 30c305766fd1803ba2aff1030dbf9122.md`<br>`docs/notion-export/3 7 API Contracts 30c305766fd1801ab208eb87bbc38778.md`<br>`.github/pull_request_template.md` | `TC-AN-DOC-01` | VERIFIED | Linked GH: `GH-AN-01` to `GH-AN-07`. Traceability now carries explicit `TC-AN-*` mappings, and the PR template prompts authors to cite those IDs cleanly |

## 6. Gherkin Coverage Mapping

Use formal `GH-XX` identifiers where they exist in the source requirements document. Legacy scenarios without IDs continue to use scenario titles as the canonical reference.

| Scenario | Linked FR | Current Coverage | Validation Evidence | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| `Scenario: Filter op een thema` | FR-02, FR-03 | Theme selection and filtered gem fetch exist | Manual UI check | PARTIAL | Missing exact baseline theme list and explicit active badge behavior |
| `Scenario: Filter levert geen resultaten` | FR-02, FR-03 | Empty-state handling is limited | Manual fallback-map check | PARTIAL | Fallback map shows a message, but full map mode lacks a dedicated no-results UX |
| `Scenario: POI detailpagina openen en content tonen` | FR-04, FR-05, FR-06, FR-07, FR-08 | Drawer opens, practical info is shown or marked missing, and story generation is on demand | Manual click-through | IMPLEMENTED | Implemented as a drawer rather than a separate full-screen page |
| `Scenario: Praktische info ontbreekt in dataset` | FR-08 | Drawer shows an explicit dataset-missing fallback label | Manual detail view check | IMPLEMENTED | Fallback wording is now present in the POI detail drawer |
| `Scenario: Route genereren en tonen op kaart` | FR-09, FR-10, FR-11, FR-12, FR-13 | Route request, polyline, summary, and a minimal start-walk CTA exist | Manual route run | PARTIAL | Time input and numbered stop display are still missing |
| `Scenario: Geen route mogelijk binnen criteria` | FR-10 | API and UI surface an error | Manual failure check | PARTIAL | Error state exists, but no recovery suggestion is shown yet |
| `Scenario: Chatbox openen voor een specifieke route-stop` | FR-16, FR-16a | No route-stop implementation found | None recorded | NOT STARTED | Current POI-drawer chatbot is a separate MVP extension and not route-stop scoped |
| `Scenario: Chat blijft bruikbaar bij ontbrekende POI-context` | FR-16, FR-16a | No route-stop implementation found | None recorded | NOT STARTED | Current chat validates `gemId` and does not support missing-context route chat |
| `GH-AN-01` Authorised admin sees KPI cards and graphs | FR-19, FR-20, FR-21, FR-22, FR-24, FR-26 | Backend overview/timeseries/breakdowns APIs now drive the shipped `/admin` KPI cards and charts behind admin auth | `TC-AN-API-04`<br>`TC-AN-UI-02` | VERIFIED | Frontend tests cover KPI and chart rendering from the mock admin analytics contract |
| `GH-AN-02` Unauthorised access is blocked | FR-19, FR-24, FR-25, FR-26 | Admin login/logout flow exists, analytics reads reject missing/invalid sessions, and the frontend shows the login surface when unauthorized | `TC-AN-API-03`<br>`TC-AN-UI-01` | VERIFIED | The portal does not render analytics data when the admin session is missing or invalid |
| `GH-AN-03` Date range filter refreshes metrics consistently | FR-21, FR-22, FR-23 | Overview, timeseries, and breakdowns share the same validated `from` / `to` / `theme` filter set and the portal refreshes them together | `TC-AN-API-04`<br>`TC-AN-API-06`<br>`TC-AN-API-07`<br>`TC-AN-UI-05` | VERIFIED | Shared filter validation is covered at both API and UI levels |
| `GH-AN-04` Empty analytics dataset shows stable empty state | FR-24 | Analytics endpoints return zero-value or empty-array payloads with `hasData=false`, and the portal renders a stable empty state instead of crashing | `TC-AN-API-05`<br>`TC-AN-UI-03` | VERIFIED | Backend and frontend empty-state handling are both covered |
| `GH-AN-05` Route success/fail/start create analytics records | FR-17, FR-18 | Route success/failure capture is implemented, and the route-start signal is ingested through the allowlisted frontend analytics path | `TC-AN-INT-01` | VERIFIED | Route success, failure, and start analytics records now have explicit automated coverage |
| `GH-AN-06` Story/chat interactions are counted without storing chat content | FR-17, FR-18 | POI detail, filter, story, chat-open, and chat-send analytics are wired, and chat/story content is excluded from analytics storage | `TC-AN-INT-02`<br>`TC-AN-INT-03`<br>`TC-AN-SEC-01` | VERIFIED | Automated tests cover the counted interactions and prove content is not copied into analytics writes or failure logs |
| `GH-AN-07` Analytics write failure does not break the primary user flow | FR-18 | Analytics writes are fire-and-forget with safe backend logging, and route/chat flows ignore analytics persistence failures | `TC-AN-INT-04`<br>`TC-AN-SEC-01` | VERIFIED | Route generation and chat responses are explicitly covered by failure-isolation tests |

## 7. Database Entity Traceability

| Entity | Defined In | Linked FR / NFR | Implementation Reference | Validation Evidence | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `datasets` | `3 2 Database Design` | FR-14 | `backend/src/db/schema.sql`<br>`backend/src/modules/admin/sync.service.ts` | Manual sync review | IMPLEMENTED | Stores provenance and sync timestamp |
| `gems` | `3 2 Database Design` | FR-01 to FR-06, FR-14 | `backend/src/db/schema.sql`<br>`backend/src/modules/gems/gems.repo.ts` | Manual API review | IMPLEMENTED | Theme and coordinate indexes exist |
| `gem_stories` | `3 2 Database Design` | FR-07 | `backend/src/db/schema.sql`<br>`backend/src/modules/stories/stories.service.ts` | Manual story generation check | IMPLEMENTED | Cache table is actively used |
| `route_logs` | `3 2 Database Design` | FR-10, NFR-S2 | `backend/src/db/schema.sql` | None recorded | NOT STARTED | Table exists in schema, but current route flow does not write to it |
| `analytics_events` | `3 2 Database Design` | FR-17, FR-18, FR-20, FR-21, FR-22, FR-23<br>NFR-S6, NFR-P1 | `db/migrations/002_analytics_events.sql`<br>`backend/src/db/schema.sql`<br>`backend/src/modules/analytics/repo.ts`<br>`backend/src/modules/analytics/read.repo.ts` | `npm run test -w backend` | PARTIAL | Storage schema, indexes, write-side persistence, and read-side aggregation queries now exist, but the formal performance target is still unresolved |

## 8. API Endpoint Traceability

| Endpoint | Method | Source Reference | Linked FR / NFR | Implementation Reference | Validation Evidence | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/api/health` | `GET` | `docs/runbook.md` | Operational | `backend/src/app.ts` | Manual health check | IMPLEMENTED | Operational endpoint; not tied to a product FR |
| `/api/gems` | `GET` | `3 7 API Contracts` | FR-01, FR-02, FR-03 | `backend/src/app.ts`<br>`backend/src/modules/gems/gems.repo.ts` | Manual API check | IMPLEMENTED | Theme validation is present |
| `/api/gems/:id` | `GET` | `3 7 API Contracts` | FR-04, FR-05, FR-06, FR-17 | `backend/src/app.ts`<br>`backend/src/modules/gems/gems.repo.ts` | Manual API check | IMPLEMENTED | UUID validation, 404 handling, and POI-detail analytics capture are present |
| `/api/routes` | `POST` | `3 7 API Contracts` | FR-09, FR-10, FR-11, FR-12, FR-17, FR-18<br>NFR-S4, NFR-R1 | `backend/src/app.ts`<br>`backend/src/modules/routes/routes.service.ts`<br>`backend/src/modules/analytics/service.ts` | `npm run test -w backend` | IMPLEMENTED | Route success/failure analytics are captured without blocking the primary response |
| `/api/gems/:id/story` | `POST` | `3 7 API Contracts` | FR-07, FR-08, FR-17, FR-18<br>NFR-S4 | `backend/src/app.ts`<br>`backend/src/modules/stories/stories.service.ts`<br>`backend/src/modules/stories/story.prompt.ts`<br>`backend/src/modules/analytics/service.ts`<br>`backend/src/middleware/simpleRateLimit.ts` | Manual story generation<br>`npm run test -w backend` | IMPLEMENTED | Theme/language validation, timeout handling, cache metadata, in-memory rate limiting, and story analytics capture are present |
| `/api/chat` | `POST` | MVP extension aligned to `docs/codex-handoff-chatbot.md` | FR-17, FR-18<br>NFR-S2, NFR-S4, NFR-R1 | `backend/src/app.ts`<br>`backend/src/modules/chat/aiService.ts`<br>`backend/src/modules/chat/promptService.ts`<br>`backend/src/modules/analytics/service.ts`<br>`backend/src/modules/ai/aiRuntime.ts`<br>`backend/src/middleware/simpleRateLimit.ts` | `npm run test -w backend` | IMPLEMENTED | Stateless POI chat by `gemId` now records send analytics without persisting chat content and without blocking the response |
| `/api/analytics/events` | `POST` | `3 7 API Contracts` | FR-17, FR-18<br>NFR-S6, NFR-R1 | `backend/src/app.ts`<br>`backend/src/modules/analytics/service.ts` | `npm run test -w backend` | IMPLEMENTED | Allowlisted frontend analytics ingest accepts only safe event types and rejects unknown payloads with `400` |
| `/api/admin/auth/login` | `POST` | `3 7 API Contracts` | FR-19, FR-25, FR-26<br>NFR-S5 | `backend/src/app.ts`<br>`backend/src/modules/admin/auth.ts` | `npm run test -w backend` | IMPLEMENTED | Shared env passphrase is validated server-side and a backend-issued httpOnly cookie is returned on success |
| `/api/admin/auth/logout` | `POST` | `3 7 API Contracts` | FR-25, FR-26<br>NFR-S5 | `backend/src/app.ts`<br>`backend/src/modules/admin/auth.ts` | `npm run test -w backend` | IMPLEMENTED | Clears the admin session cookie without exposing analytics data |
| `/api/admin/analytics/overview` | `GET` | `3 7 API Contracts` | FR-19, FR-20, FR-23, FR-24, FR-25, FR-26<br>NFR-S5, NFR-P1 | `backend/src/app.ts`<br>`backend/src/modules/analytics/read.service.ts`<br>`backend/src/modules/analytics/read.repo.ts` | `npm run test -w backend` | IMPLEMENTED | Read-only KPI endpoint validates `from` / `to` / `theme`, requires admin auth, and returns empty-state-friendly zero payloads |
| `/api/admin/analytics/timeseries` | `GET` | `3 7 API Contracts` | FR-19, FR-21, FR-23, FR-24, FR-25, FR-26<br>NFR-S5, NFR-P1 | `backend/src/app.ts`<br>`backend/src/modules/analytics/read.service.ts`<br>`backend/src/modules/analytics/read.repo.ts` | `npm run test -w backend` | IMPLEMENTED | Read-only timeseries endpoint returns graph-ready daily buckets and keeps empty datasets stable |
| `/api/admin/analytics/breakdowns` | `GET` | `3 7 API Contracts` | FR-19, FR-22, FR-23, FR-24, FR-25, FR-26<br>NFR-S5, NFR-P1 | `backend/src/app.ts`<br>`backend/src/modules/analytics/read.service.ts`<br>`backend/src/modules/analytics/read.repo.ts` | `npm run test -w backend` | IMPLEMENTED | Read-only breakdown endpoint returns theme and POI aggregates behind admin-session auth |
| `/api/admin/datasets/sync` | `POST` | `3 7 API Contracts`<br>`docs/runbook.md` | FR-14<br>NFR-S1 | `backend/src/app.ts`<br>`backend/src/modules/admin/sync.service.ts` | Manual admin sync | IMPLEMENTED | Protected by `x-admin-key` |

## 9. Frontend Traceability

| Page / Component | Source Reference | Linked FR | API Dependency | Validation Evidence | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `frontend/src/routes/MapPage.tsx` | `3 5 UI Design` | FR-01 to FR-13 | `/api/gems`, `/api/routes`, `/api/gems/:id`, `/api/gems/:id/story` | Manual smoke test | IMPLEMENTED | Main user surface |
| `frontend/src/components/map/MapView.tsx` | `3 5 UI Design` | FR-01, FR-03, FR-11 | `/api/gems` | Manual map test | IMPLEMENTED | Supports Google Maps and fallback preview mode |
| `frontend/src/components/map/GemMarkers.tsx` | `3 5 UI Design` | FR-01, FR-04 | `/api/gems` | Manual pin selection | IMPLEMENTED | Marker click opens detail drawer |
| `frontend/src/components/map/RouteOverlay.tsx` | `3 5 UI Design` | FR-11 | `/api/routes` | Manual route overlay test | IMPLEMENTED | Polyline rendering only |
| `frontend/src/components/route-config/RouteConfigPanel.tsx` | `3 5 UI Design` | FR-02, FR-09, FR-10, FR-13, FR-17 | `/api/routes`, `/api/analytics/events` | Manual route config test | PARTIAL | Time input is still missing, but the panel now emits filter/start analytics and shows a minimal Start Walk CTA |
| `frontend/src/components/gem-detail/GemDetailDrawer.tsx` | `3 5 UI Design` | FR-05, FR-06, FR-07, FR-08, FR-17 | `/api/gems/:id`, `/api/gems/:id/story`, `/api/chat`, `/api/analytics/events` | Manual detail, story, and chat test | IMPLEMENTED | Drawer shows story controls plus the POI-scoped chatbot panel that triggers chat-open analytics |
| `frontend/src/features/chat/ChatPanel.tsx` | MVP extension aligned to `docs/codex-handoff-chatbot.md` | FR-17, NFR-S2, NFR-S4 | `/api/chat`, `/api/analytics/events` | Manual POI chat test | IMPLEMENTED | Provider-agnostic POI chat UI keeps transcripts local-only and emits allowlisted chat-open analytics |
| `frontend/src/routes/AdminPage.tsx` | `3 5 UI Design`<br>`3 6 UI ↔ API Mapping` | FR-19 to FR-26 | `/api/admin/auth/login`, `/api/admin/auth/logout`, `/api/admin/analytics/overview`, `/api/admin/analytics/timeseries`, `/api/admin/analytics/breakdowns` | `npm run test -w frontend` | IMPLEMENTED | Orchestrates admin session checks, login/logout, shared filters, and analytics query refresh |
| `frontend/src/components/admin/AdminLoginPage.tsx` | `3 5 UI Design` | FR-19, FR-24, FR-25, FR-26 | `/api/admin/auth/login` | `npm run test -w frontend` | IMPLEMENTED | Read-only portal entry screen for the shared admin passphrase flow |
| `frontend/src/components/admin/AdminDashboardPage.tsx` | `3 5 UI Design` | FR-20, FR-21, FR-22, FR-23, FR-24, FR-26 | `/api/admin/auth/logout`, `/api/admin/analytics/overview`, `/api/admin/analytics/timeseries`, `/api/admin/analytics/breakdowns` | `npm run test -w frontend` | IMPLEMENTED | Dashboard shell coordinates filter, loading, empty, error, and success states |
| `frontend/src/components/admin/AnalyticsKpiCards.tsx` | `3 5 UI Design` | FR-20, FR-24, FR-26 | `/api/admin/analytics/overview` | `npm run test -w frontend` | IMPLEMENTED | Renders the five required analytics summary cards |
| `frontend/src/components/admin/AnalyticsTimeseriesChart.tsx` | `3 5 UI Design` | FR-21, FR-23, FR-24, FR-26 | `/api/admin/analytics/timeseries` | `npm run test -w frontend` | IMPLEMENTED | Simple stable chart for route generations and route starts |
| `frontend/src/components/admin/AnalyticsBreakdownChart.tsx` | `3 5 UI Design` | FR-22, FR-23, FR-24, FR-26 | `/api/admin/analytics/breakdowns` | `npm run test -w frontend` | IMPLEMENTED | Shared chart component for theme and POI breakdown views |
| `frontend/src/components/admin/AnalyticsFilters.tsx` | `3 5 UI Design` | FR-23, FR-24, FR-26 | `/api/admin/analytics/overview`, `/api/admin/analytics/timeseries`, `/api/admin/analytics/breakdowns` | `npm run test -w frontend` | IMPLEMENTED | Applies one shared date/theme filter set across all admin analytics views |
| `frontend/src/components/admin/AdminErrorState.tsx` | `3 5 UI Design` | FR-24, FR-26 | `/api/admin/analytics/overview`, `/api/admin/analytics/timeseries`, `/api/admin/analytics/breakdowns` | `npm run test -w frontend` | IMPLEMENTED | Presents recoverable backend errors without exposing write controls |
| `frontend/src/components/admin/AdminEmptyState.tsx` | `3 5 UI Design` | FR-24, FR-26 | `/api/admin/analytics/overview`, `/api/admin/analytics/timeseries`, `/api/admin/analytics/breakdowns` | `npm run test -w frontend` | IMPLEMENTED | Shows a stable empty analytics state with the active filter context |

## 10. Decision Log Impact Mapping

| Decision | Summary | Impacted Areas | Follow-up |
| --- | --- | --- | --- |
| `DEC-2026-001` | Canonicalize MVP POI storytelling through `POST /api/gems/:id/story` with cache-first behavior and project-owned-facts prompting | FR-07, FR-08, NFR-S4, `/api/gems/:id/story`, `GemDetailDrawer`, `stories.service` | Revisit real-provider smoke testing and production-grade/shared rate limiting before production rollout |
| `DEC-2026-002` | Standardize the default MVP AI runtime on Ollama for POI story generation and POI chat, without requiring a paid OpenAI key | `/api/gems/:id/story`, `/api/chat`, `GemDetailDrawer`, `ChatPanel`, `aiRuntime`, `runbook` | Verify local Ollama setup from a clean machine and revisit shared rate limiting before production rollout |
| `DEC-2026-015` | Lock the post-MVP analytics/admin portal track with backend-issued admin sessions via shared env passphrase + httpOnly cookie | FR-17 to FR-26, NFR-S5, NFR-S6, NFR-P1, NFR-R1, NFR-G1, future analytics endpoints/admin portal | Approve the analytics read-performance threshold before implementation starts |

| DEC ID | Related FR | Related NFR | Affected Layer | Impact Summary | Approved |
| --- | --- | --- | --- | --- | --- |
| `DEC-YYYY-###` |  |  |  |  |  |

## 11. Milestone Gate Checklist

### M1 - Requirements Baseline

- [x] Functional requirements are listed in the source requirements document
- [x] Acceptance scenarios exist in Given / When / Then form
- [x] Non-functional requirements are listed
- [ ] Sign-off trail is recorded in `docs/decision-log.md`

### M2 - Design Complete

- [x] FRs are mappable to design references
- [x] DB design references exist
- [x] API contract references exist
- [ ] All requirement-to-design mismatches are resolved

### M3 - Build Complete

- [ ] All FRs are implemented
- [x] Core API endpoints exist
- [x] Core schema entities exist
- [ ] Automated tests exist for covered flows
- [ ] All route and detail flows are fully aligned to Gherkin scenarios

### M4 - Release Ready

- [ ] Every active FR has explicit validation evidence
- [ ] All active NFRs are validated
- [ ] No `BLOCKED` items remain
- [ ] Decision log and traceability matrix are current

## 12. Traceability Integrity Rules

1. Every product-facing requirement must link to at least one implementation reference and one validation path.
2. Operational endpoints or entities may link to an NFR or runbook entry instead of a product FR.
3. Use formal `GH-XX` identifiers where present; otherwise use scenario titles as fallback keys for legacy scenarios.
4. Any requirement, design, or scope change after baseline sign-off must update this file and add a decision-log entry when the change is non-trivial.
5. Any PR that changes behavior should update this matrix in the same branch as the code change.

## 13. Analytics QA Test Cases

| Test Case ID | Coverage Summary | Automated Evidence | Linked FR / NFR / GH |
| --- | --- | --- | --- |
| `TC-AN-API-01` | Admin login succeeds and issues the session cookie | `backend/src/app.admin.analytics.test.ts` -> `POST /api/admin/auth/login succeeds and sets an admin session cookie` | FR-25, NFR-S5, `GH-AN-02` |
| `TC-AN-API-02` | Admin login rejects an invalid passphrase | `backend/src/app.admin.analytics.test.ts` -> `POST /api/admin/auth/login rejects an invalid passphrase` | FR-25, NFR-S5, `GH-AN-02` |
| `TC-AN-API-03` | Unauthorized analytics access is blocked | `backend/src/app.admin.analytics.test.ts` -> `GET /api/admin/analytics/overview blocks requests without an admin session` | FR-19, FR-24, FR-25, NFR-S5, `GH-AN-02` |
| `TC-AN-API-04` | Authorized admin analytics responses match the overview, timeseries, and breakdown contracts | `backend/src/app.admin.analytics.test.ts` -> `admin analytics endpoints return contract-compliant payloads for an authorized admin` | FR-19, FR-20, FR-21, FR-22, FR-23, FR-26, `GH-AN-01`, `GH-AN-03` |
| `TC-AN-API-05` | Empty analytics datasets return stable API payloads | `backend/src/app.admin.analytics.test.ts` -> `admin analytics endpoints return stable empty-state-friendly payloads` | FR-24, `GH-AN-04` |
| `TC-AN-API-06` | Invalid date filters are rejected | `backend/src/app.admin.analytics.test.ts` -> `admin analytics endpoints validate date filters` | FR-23, `GH-AN-03` |
| `TC-AN-API-07` | Invalid theme filters are rejected | `backend/src/app.admin.analytics.test.ts` -> `admin analytics endpoints validate theme filters` | FR-23, `GH-AN-03` |
| `TC-AN-INT-01` | Route success, route failure, and route start create analytics entries | `backend/src/app.analytics.test.ts` -> `POST /api/analytics/events accepts route_started with safe metadata only`; `route generation records route_generated analytics on success`; `route generation failures emit route_generation_failed analytics events` | FR-17, FR-18, `GH-AN-05` |
| `TC-AN-INT-02` | POI detail, filter apply, and stop chat open analytics entries are created without chat content | `backend/src/app.analytics.test.ts` -> `POST /api/analytics/events accepts allowlisted frontend analytics writes`; `GET /api/gems/:id records poi_detail_opened analytics events`; `POST /api/analytics/events accepts stop_chat_opened without chat content` | FR-17, `GH-AN-06` |
| `TC-AN-INT-03` | Story generation and chat send analytics are counted without storing generated story text or chat bodies | `backend/src/app.analytics.test.ts` -> `POST /api/gems/:id/story records story_generated analytics without storing story text`; `chat analytics never persist chat message content` | FR-17, FR-18, NFR-S6, `GH-AN-06` |
| `TC-AN-INT-04` | Analytics write failures do not block the primary route and chat flows | `backend/src/app.analytics.test.ts` -> `route generation still succeeds when analytics persistence fails`; `chat responses still succeed when analytics persistence fails` | FR-18, NFR-R1, `GH-AN-07` |
| `TC-AN-SEC-01` | Analytics failure logs exclude sensitive payloads and retain only safe identifiers | `backend/src/app.analytics.test.ts` -> `analytics write failure logs only event type and source` | FR-18, NFR-S6, NFR-R1, `GH-AN-06`, `GH-AN-07` |
| `TC-AN-UI-01` | The admin portal shows the login screen when unauthorized and opens the dashboard after a valid login | `frontend/src/routes/AdminPage.test.tsx` -> `shows the login screen when the admin session is unauthorized`; `submits the admin passphrase and opens the dashboard after login succeeds` | FR-19, FR-24, FR-25, NFR-S5, `GH-AN-02` |
| `TC-AN-UI-02` | The admin dashboard renders KPI cards and charts from valid analytics data | `frontend/src/routes/AdminPage.test.tsx` -> `renders KPI cards and charts from mock API data` | FR-19, FR-20, FR-21, FR-22, FR-26, `GH-AN-01` |
| `TC-AN-UI-03` | The admin portal renders a stable empty state | `frontend/src/routes/AdminPage.test.tsx` -> `renders a clean empty state for a dataset without analytics rows` | FR-24, `GH-AN-04` |
| `TC-AN-UI-04` | The admin portal renders the backend error state and supports retry | `frontend/src/routes/AdminPage.test.tsx` -> `renders an admin error state and retries analytics queries` | FR-24, `GH-AN-01` |
| `TC-AN-UI-05` | Applying a new date range refreshes the admin analytics queries consistently | `frontend/src/routes/AdminPage.test.tsx` -> `refreshes analytics queries when the date filter is applied` | FR-21, FR-22, FR-23, `GH-AN-03` |
| `TC-AN-DOC-01` | Governance artifacts and PR prompts include analytics traceability and test-case evidence hooks | `docs/traceability.md`; `.github/pull_request_template.md` review | NFR-G1 |
