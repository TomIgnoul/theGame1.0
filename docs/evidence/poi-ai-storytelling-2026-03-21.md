# POI AI Storytelling - 2026-03-21

Updated: 2026-03-22

## What We Implemented

- Hardened `POST /api/gems/:id/story` with request validation for `theme` and `language`.
- Added cache/source metadata so the client can tell whether a story came from cache or a fresh generation.
- Added a dedicated prompt builder that uses only project-owned POI facts and dataset-backed practical info.
- Added timeout handling for story generation.
- Added a simple in-memory rate limiter for the story endpoint.
- Added `POST /api/chat` as a stateless, POI-scoped chatbot endpoint keyed by `gemId`.
- Added a shared Ollama-backed AI runtime so both story generation and POI chat use the same local provider path.
- Updated the POI detail drawer to:
  - show practical info when present
  - show a fallback label when practical info is missing
  - allow English/Dutch story selection
  - show clearer story loading, error, and cache/fresh-result messaging
  - show a POI-scoped chat panel with local-only transcript state
- Added prompt-builder tests.
- Removed the backend `openai` dependency for the default MVP path.

## Verification

- `npm run lint -w backend`
- `npm run build -w backend`
- `npm run test -w backend`
- `npm run lint -w frontend`
- `npm run build -w frontend`

## Caveats

- No live Ollama smoke test was run during this pass, so prompt quality and provider behavior still need one real local request check.
- The story rate limiter is in-memory only. It protects a single backend process but is not shared across multiple instances.
- The chat rate limiter is also in-memory only and shares the same single-process limitation.

## Tomorrow

1. Run one seeded-POI story smoke test and one POI chat smoke test against the local Ollama runtime and capture the request/response as evidence.
2. Review the generated story for factuality, tone, and length; bump `PROMPT_VERSION` if the prompt changes materially.
3. Decide whether rate limiting stays in-memory for MVP or moves to a shared/store-backed approach before production rollout.
