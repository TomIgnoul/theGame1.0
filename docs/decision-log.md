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
- Real-provider behavior had not yet been smoke-tested in this branch when the decision was first recorded.
- The rate limiter is in-memory, so it is per-process and not shared across multiple backend instances.

Tomorrow:
1. Run a real `POST /api/gems/:id/story` smoke test against a seeded POI with the configured AI runtime.
2. Decide whether the current in-memory limiter is sufficient for MVP or should be replaced with a shared/store-backed limiter before production.
3. If the smoke test reveals prompt quality issues, tune the prompt and bump `PROMPT_VERSION`.

## DEC-2026-002 - Use Ollama as the default MVP AI runtime for POI story + POI chat

Date: 2026-03-22

Decision:
- The default MVP runtime for both `POST /api/gems/:id/story` and `POST /api/chat` is Ollama, called through a shared backend AI runtime module.
- The default local path must not require `OPENAI_API_KEY`; backend config now uses `AI_PROVIDER=ollama`, `OLLAMA_BASE_URL`, and `OLLAMA_MODEL`.
- The POI chatbot remains stateless and gem-scoped for MVP: requests carry `gemId`, chat transcripts stay in frontend state only, and no chat/session rows are persisted.
- The public HTTP contracts remain stable while the provider swap stays internal to the backend.

Why:
- This matches the chatbot handoff requirement and removes the paid-provider dependency from the default MVP path.
- It keeps story generation and chat on one simple local runtime, which makes local development and demos easier.
- It avoids mixing the shipped POI-drawer chatbot with the older, still-unbuilt route-stop chat requirement.

Implementation notes:
- Added `backend/src/modules/ai/aiRuntime.ts` as the shared Ollama transport.
- Refactored story generation and POI chat to call the shared runtime instead of the OpenAI SDK.
- Updated backend env handling and `.env.example` to use Ollama-centered defaults.
- Removed the backend `openai` dependency.
- Updated the runbook, traceability matrix, MCD, evidence note, and chatbot handoff doc to reflect the implemented feature set.

Caveats:
- Local Ollama availability is now the main runtime dependency for story generation and chat.
- The current rate limiter remains in-memory and per process.

Next:
1. Verify story generation and POI chat on a clean local setup with Ollama running and `llama3.2` pulled.
2. Decide whether the in-memory rate limiter is sufficient for MVP or should move to a shared/store-backed approach before production.
3. Tune prompt quality only after local runtime verification, bumping `PROMPT_VERSION` for material story prompt changes.
