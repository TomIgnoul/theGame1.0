# Decision Log

## DEC-2026-001 - Canonical MVP POI storytelling via `/api/gems/:id/story`

Date: 2026-03-21

Decision:
- The canonical MVP storytelling flow is per-POI, triggered from the POI detail drawer through `POST /api/gems/:id/story`.
- The endpoint is cache-first and keyed by `gem_id + theme + language + prompt_version`.
- Story prompts must use only project-owned POI facts from the backend model and dataset-backed practical info when available.
- The UI keeps story generation button-triggered rather than auto-loading on detail open.

Why:
- This matches the strongest implemented contract in the repo and avoids mixing POI storytelling with the not-yet-built route-stop chat flow.
- It keeps the first AI feature narrow, testable, and easier to reason about.
- It supports guardrails against hallucinated practical info while still allowing a useful narrative layer.

Implementation notes:
- Added theme/language validation on `POST /api/gems/:id/story`.
- Added prompt building in `backend/src/modules/stories/story.prompt.ts`.
- Added timeout handling and cache source metadata in the story service.
- Added a simple in-memory rate limiter for the story endpoint.
- Added practical info rendering and fallback messaging in the POI detail drawer.

Caveats:
- Real-provider behavior has not yet been smoke-tested against a live OpenAI key in this branch.
- The rate limiter is in-memory, so it is per-process and not shared across multiple backend instances.

Tomorrow:
1. Run a real `POST /api/gems/:id/story` smoke test against a seeded POI with a valid `OPENAI_API_KEY`.
2. Decide whether the current in-memory limiter is sufficient for MVP or should be replaced with a shared/store-backed limiter before production.
3. If the smoke test reveals prompt quality issues, tune the prompt and bump `PROMPT_VERSION`.
