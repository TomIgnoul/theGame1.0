# Hidden Gems Brussels — Runbook

## Environment setup

1. Copy `backend/.env.example` to `backend/.env`
2. Set required variables:
   - `DATABASE_URL` — PostgreSQL connection string
   - `ADMIN_API_KEY` — Secret for admin sync (POST /api/admin/datasets/sync)
   - `ADMIN_PORTAL_PASSPHRASE` — Shared passphrase for `POST /api/admin/auth/login` and the signed admin session cookie
   - `GOOGLE_ROUTES_API_KEY` or `GOOGLE_MAPS_API_KEY` — For route computation (Directions API)
   - `AI_PROVIDER=ollama` — Default local AI runtime selector for POI story + POI chat
   - `OLLAMA_BASE_URL=http://localhost:11434` — Ollama base URL; remote endpoints with or without `/api` are accepted
   - `OLLAMA_API_KEY` — Optional for secured remote Ollama-compatible endpoints
   - `OLLAMA_MODEL=llama3.2` — Local model name used for POI story + POI chat
   - `PROMPT_VERSION=v1` — Story cache version key

3. Frontend: create `frontend/.env` with:
   - `VITE_API_BASE_URL` — Backend API URL (e.g. http://localhost:8080)
   - `VITE_GOOGLE_MAPS_API_KEY` — For map display
  
## Local development

1. Install dependencies: `npm install`
2. Start Postgres: `docker-compose up -d db`
3. Ensure Ollama is running locally
4. Pull the default model once: `ollama pull llama3.2`
5. Run migrations: `npm run db:migrate`
6. Sync datasets (once): `curl -X POST http://localhost:8080/api/admin/datasets/sync -H "x-admin-key: YOUR_KEY"`
7. Log into the admin analytics API:
   - `curl -i -X POST http://localhost:8080/api/admin/auth/login -H "Content-Type: application/json" -d '{"passphrase":"YOUR_ADMIN_PORTAL_PASSPHRASE"}'`
8. Fetch admin analytics with the returned cookie:
   - `curl http://localhost:8080/api/admin/analytics/overview?from=2026-04-01&to=2026-04-07 --cookie "thegame_admin_session=..."`
9. Start dev: `npm run dev` (runs backend + frontend)

## Local AI verification

1. Confirm Ollama is reachable:
   - `curl http://localhost:11434/api/tags`
2. Generate a POI story from the backend:
   - `curl -X POST http://localhost:8080/api/gems/<GEM_ID>/story -H "Content-Type: application/json" -d '{"theme":"Art","language":"en"}'`
3. Send a POI chat message:
   - `curl -X POST http://localhost:8080/api/chat -H "Content-Type: application/json" -d '{"gemId":"<GEM_ID>","message":"What makes this place interesting?"}'`
4. If either request fails with an Ollama-unavailable error, verify the Ollama app/service is running and the configured model exists locally.
5. For a secured remote Ollama-compatible endpoint, set `OLLAMA_BASE_URL` to the remote host, set `OLLAMA_API_KEY`, and keep `AI_PROVIDER=ollama` or `AI_PROVIDER=ollama_cloud`.

## Deployment

1. Provision Postgres and set `DATABASE_URL`
2. Deploy backend (Render/Fly.io/Railway) with env vars
3. Run migrations (manual or on deploy)
4. Sync datasets via admin endpoint
5. Deploy frontend (Vercel/Netlify) with `VITE_API_BASE_URL` and `VITE_GOOGLE_MAPS_API_KEY`
6. Ensure the deployed backend can reach its configured Ollama runtime
7. Restrict API keys (referrer, IP, quotas)

## Troubleshooting

- **Health db: false** — Check DATABASE_URL and Postgres is running
- **Route generation fails** — Ensure GOOGLE_ROUTES_API_KEY is set; check Directions API is enabled
- **Story or chat generation fails** — Ensure Ollama is reachable, `OLLAMA_BASE_URL` is correct, the configured `OLLAMA_MODEL` exists on that host, and `OLLAMA_API_KEY` is set when the endpoint requires authentication
- **Map not loading** — Ensure VITE_GOOGLE_MAPS_API_KEY is set; check Maps JavaScript API is enabled
