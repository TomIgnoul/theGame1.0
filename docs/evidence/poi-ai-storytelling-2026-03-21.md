# POI AI Storytelling - 2026-03-21

## What We Implemented

- Hardened `POST /api/gems/:id/story` with request validation for `theme` and `language`.
- Added cache/source metadata so the client can tell whether a story came from cache or a fresh generation.
- Added a dedicated prompt builder that uses only project-owned POI facts and dataset-backed practical info.
- Added timeout handling for story generation.
- Added a simple in-memory rate limiter for the story endpoint.
- Updated the POI detail drawer to:
  - show practical info when present
  - show a fallback label when practical info is missing
  - allow English/Dutch story selection
  - show clearer story loading, error, and cache/fresh-result messaging
- Added prompt-builder tests.

## Verification

- `npm run lint -w backend`
- `npm run build -w backend`
- `npm run test -w backend`
- `npm run lint -w frontend`
- `npm run build -w frontend`

## Caveats

- No live OpenAI smoke test was run during this pass, so prompt quality and provider behavior still need one real request check.
- The story rate limiter is in-memory only. It protects a single backend process but is not shared across multiple instances.

## Tomorrow

1. Run one seeded-POI smoke test against the real provider and capture the request/response as evidence.
2. Review the generated story for factuality, tone, and length; bump `PROMPT_VERSION` if the prompt changes materially.
3. Decide whether rate limiting stays in-memory for MVP or moves to a shared/store-backed approach before production rollout.
