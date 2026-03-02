# Hidden Gems Brussels — Runbook

## Environment setup

1. Copy `backend/.env.example` to `backend/.env`
2. Set required variables:
   - `DATABASE_URL` — PostgreSQL connection string
   - `ADMIN_API_KEY` — Secret for admin sync (POST /api/admin/datasets/sync)
   - `GOOGLE_ROUTES_API_KEY` or `GOOGLE_MAPS_API_KEY` — For route computation (Directions API)
   - `OPENAI_API_KEY` — For AI story generation

3. Frontend: create `frontend/.env` with:
   - `VITE_API_BASE_URL` — Backend API URL (e.g. http://localhost:8080)
   - `VITE_GOOGLE_MAPS_API_KEY` — For map display
  
## Local development

1. Install dependencies: `npm install`
2. Start dev: `npm run dev`
3. Start Postgres: `docker-compose up -d db`
4. Run migrations: `npm run db:migrate`
5. Sync datasets (once): `curl -X POST http://localhost:8080/api/admin/datasets/sync -H "x-admin-key: YOUR_KEY"`
6. Start dev: `npm run dev` (runs backend + frontend)

## Deployment

1. Provision Postgres and set `DATABASE_URL`
2. Deploy backend (Render/Fly.io/Railway) with env vars
3. Run migrations (manual or on deploy)
4. Sync datasets via admin endpoint
5. Deploy frontend (Vercel/Netlify) with `VITE_API_BASE_URL` and `VITE_GOOGLE_MAPS_API_KEY`
6. Restrict API keys (referrer, IP, quotas)

## Troubleshooting

- **Health db: false** — Check DATABASE_URL and Postgres is running
- **Route generation fails** — Ensure GOOGLE_ROUTES_API_KEY is set; check Directions API is enabled
- **Story generation fails** — Ensure OPENAI_API_KEY is set; check OpenAI quota
- **Map not loading** — Ensure VITE_GOOGLE_MAPS_API_KEY is set; check Maps JavaScript API is enabled
