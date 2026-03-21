# Traceability Matrix - The Game

Baseline snapshot: March 21, 2026.

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
| FR-13 | Offer a "Start wandeling" action | `Scenario: Route genereren en tonen op kaart` | `3 5 UI Design` | None found | None recorded | NOT STARTED | No start-walk action currently exists in frontend |
| FR-14 | Load seed data from open data Brussels or a preloaded export | Operational data seed flow | `3 2 Database Design`<br>`3 7 API Contracts` | `backend/src/modules/admin/sync.service.ts`<br>`backend/src/app.ts` (`POST /api/admin/datasets/sync`) | Manual sync via runbook | IMPLEMENTED | Current sync targets one Brussels cultural dataset |
| FR-15 | Limit MVP to 5 POIs as a hard cap | Scope guard | `2 Specificaties` | None found | None recorded | BLOCKED | Current route logic targets 6-10 gems, which conflicts with this requirement and needs a decision-log entry |
| FR-16 | Show a chatbox for each route stop so the user can ask about that specific POI | `Scenario: Chatbox openen voor een specifieke route-stop` | `3 5 UI Design` | None found | None recorded | NOT STARTED | No route-stop chat UI or API exists yet |
| FR-16a | Auto-load POI context into the route-stop chatbox | `Scenario: Chatbox openen voor een specifieke route-stop`<br>`Scenario: Chat blijft bruikbaar bij ontbrekende POI-context` | `3 5 UI Design`<br>`3 7 API Contracts` | None found | None recorded | NOT STARTED | Depends on FR-16 and an additional chat-oriented backend surface |

## 5. Non-Functional Requirements Traceability

| NFR ID | Category | Design Reference | Implementation Reference | Validation Method | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| NFR-S1 | Secrets | `2 Specificaties`<br>`docs/runbook.md` | `backend/src/config/env.ts`<br>`docs/runbook.md`<br>`frontend/src/components/map/MapView.tsx` | Config review | PARTIAL | Backend secrets are env-based, but the frontend still uses a browser Maps key and must rely on platform restrictions |
| NFR-S2 | Data minimization | `2 Specificaties` | `backend/src/db/schema.sql` | Schema review | PARTIAL | No persistent chat logs exist, but route logs are modeled and chat is not implemented yet |
| NFR-S4 | Abuse control | `2 Specificaties` | `backend/src/app.ts`<br>`backend/src/middleware/simpleRateLimit.ts` | API review | PARTIAL | The story endpoint now has an in-memory rate limit; route generation still has no rate limiting |

## 6. Gherkin Coverage Mapping

The source requirements document does not currently assign formal `GH-XX` identifiers. Until those exist, use scenario titles as the canonical reference.

| Scenario | Linked FR | Current Coverage | Validation Evidence | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| `Scenario: Filter op een thema` | FR-02, FR-03 | Theme selection and filtered gem fetch exist | Manual UI check | PARTIAL | Missing exact baseline theme list and explicit active badge behavior |
| `Scenario: Filter levert geen resultaten` | FR-02, FR-03 | Empty-state handling is limited | Manual fallback-map check | PARTIAL | Fallback map shows a message, but full map mode lacks a dedicated no-results UX |
| `Scenario: POI detailpagina openen en content tonen` | FR-04, FR-05, FR-06, FR-07, FR-08 | Drawer opens, practical info is shown or marked missing, and story generation is on demand | Manual click-through | IMPLEMENTED | Implemented as a drawer rather than a separate full-screen page |
| `Scenario: Praktische info ontbreekt in dataset` | FR-08 | Drawer shows an explicit dataset-missing fallback label | Manual detail view check | IMPLEMENTED | Fallback wording is now present in the POI detail drawer |
| `Scenario: Route genereren en tonen op kaart` | FR-09, FR-10, FR-11, FR-12, FR-13 | Route request, polyline, and summary exist | Manual route run | PARTIAL | Time input, numbered stop display, and start-walk action are still missing |
| `Scenario: Geen route mogelijk binnen criteria` | FR-10 | API and UI surface an error | Manual failure check | PARTIAL | Error state exists, but no recovery suggestion is shown yet |
| `Scenario: Chatbox openen voor een specifieke route-stop` | FR-16, FR-16a | No implementation found | None recorded | NOT STARTED | Not yet started |
| `Scenario: Chat blijft bruikbaar bij ontbrekende POI-context` | FR-16, FR-16a | No implementation found | None recorded | NOT STARTED | Not yet started |

## 7. Database Entity Traceability

| Entity | Defined In | Linked FR / NFR | Implementation Reference | Validation Evidence | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `datasets` | `3 2 Database Design` | FR-14 | `backend/src/db/schema.sql`<br>`backend/src/modules/admin/sync.service.ts` | Manual sync review | IMPLEMENTED | Stores provenance and sync timestamp |
| `gems` | `3 2 Database Design` | FR-01 to FR-06, FR-14 | `backend/src/db/schema.sql`<br>`backend/src/modules/gems/gems.repo.ts` | Manual API review | IMPLEMENTED | Theme and coordinate indexes exist |
| `gem_stories` | `3 2 Database Design` | FR-07 | `backend/src/db/schema.sql`<br>`backend/src/modules/stories/stories.service.ts` | Manual story generation check | IMPLEMENTED | Cache table is actively used |
| `route_logs` | `3 2 Database Design` | FR-10, NFR-S2 | `backend/src/db/schema.sql` | None recorded | NOT STARTED | Table exists in schema, but current route flow does not write to it |

## 8. API Endpoint Traceability

| Endpoint | Method | Source Reference | Linked FR / NFR | Implementation Reference | Validation Evidence | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/api/health` | `GET` | `docs/runbook.md` | Operational | `backend/src/app.ts` | Manual health check | IMPLEMENTED | Operational endpoint; not tied to a product FR |
| `/api/gems` | `GET` | `3 7 API Contracts` | FR-01, FR-02, FR-03 | `backend/src/app.ts`<br>`backend/src/modules/gems/gems.repo.ts` | Manual API check | IMPLEMENTED | Theme validation is present |
| `/api/gems/:id` | `GET` | `3 7 API Contracts` | FR-04, FR-05, FR-06 | `backend/src/app.ts`<br>`backend/src/modules/gems/gems.repo.ts` | Manual API check | IMPLEMENTED | UUID validation and 404 handling exist |
| `/api/routes` | `POST` | `3 7 API Contracts` | FR-09, FR-10, FR-11, FR-12<br>NFR-S4 | `backend/src/app.ts`<br>`backend/src/modules/routes/routes.service.ts` | Manual route generation | IMPLEMENTED | No rate limiting yet |
| `/api/gems/:id/story` | `POST` | `3 7 API Contracts` | FR-07, FR-08<br>NFR-S4 | `backend/src/app.ts`<br>`backend/src/modules/stories/stories.service.ts`<br>`backend/src/modules/stories/story.prompt.ts`<br>`backend/src/middleware/simpleRateLimit.ts` | Manual story generation<br>`npm run test -w backend` | IMPLEMENTED | Theme/language validation, timeout handling, cache metadata, and in-memory rate limiting are present |
| `/api/admin/datasets/sync` | `POST` | `3 7 API Contracts`<br>`docs/runbook.md` | FR-14<br>NFR-S1 | `backend/src/app.ts`<br>`backend/src/modules/admin/sync.service.ts` | Manual admin sync | IMPLEMENTED | Protected by `x-admin-key` |

## 9. Frontend Traceability

| Page / Component | Source Reference | Linked FR | API Dependency | Validation Evidence | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `frontend/src/routes/MapPage.tsx` | `3 5 UI Design` | FR-01 to FR-13 | `/api/gems`, `/api/routes`, `/api/gems/:id`, `/api/gems/:id/story` | Manual smoke test | IMPLEMENTED | Main user surface |
| `frontend/src/components/map/MapView.tsx` | `3 5 UI Design` | FR-01, FR-03, FR-11 | `/api/gems` | Manual map test | IMPLEMENTED | Supports Google Maps and fallback preview mode |
| `frontend/src/components/map/GemMarkers.tsx` | `3 5 UI Design` | FR-01, FR-04 | `/api/gems` | Manual pin selection | IMPLEMENTED | Marker click opens detail drawer |
| `frontend/src/components/map/RouteOverlay.tsx` | `3 5 UI Design` | FR-11 | `/api/routes` | Manual route overlay test | IMPLEMENTED | Polyline rendering only |
| `frontend/src/components/route-config/RouteConfigPanel.tsx` | `3 5 UI Design` | FR-02, FR-09, FR-10 | `/api/routes` | Manual route config test | PARTIAL | Missing time input and start-walk action |
| `frontend/src/components/gem-detail/GemDetailDrawer.tsx` | `3 5 UI Design` | FR-05, FR-06, FR-07, FR-08 | `/api/gems/:id`, `/api/gems/:id/story` | Manual detail and story test | IMPLEMENTED | Drawer now shows practical info fallback messaging, story language selection, and cache/source messaging |

## 10. Decision Log Impact Mapping

| Decision | Summary | Impacted Areas | Follow-up |
| --- | --- | --- | --- |
| `DEC-2026-001` | Canonicalize MVP POI storytelling through `POST /api/gems/:id/story` with cache-first behavior and project-owned-facts prompting | FR-07, FR-08, NFR-S4, `/api/gems/:id/story`, `GemDetailDrawer`, `stories.service` | Revisit real-provider smoke testing and production-grade/shared rate limiting before production rollout |

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
3. Use scenario titles as traceability keys until formal `GH-XX` identifiers are introduced in the requirements source.
4. Any requirement, design, or scope change after baseline sign-off must update this file and add a decision-log entry when the change is non-trivial.
5. Any PR that changes behavior should update this matrix in the same branch as the code change.
