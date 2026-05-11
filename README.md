# The Game — Hidden Gems Brussels

## Overview

**The Game — Hidden Gems Brussels** is a map-first web application that helps users discover alternative places in Brussels through themed walking routes, interactive map exploration, and AI-assisted storytelling.

The MVP focuses on a complete discovery flow:

    choose a theme
    choose a walking distance
    generate a route
    view route stops
    open gem details
    read AI-generated story/context
    collect evidence for project validation

The project was built as part of **The Game** school project, with a strong focus on:

- MVP delivery
- traceability
- AI-assisted development
- automation
- evidence-driven validation
- clear documentation

## Project Goal

The goal is to help locals, tourists, and students discover interesting places in Brussels without manually searching through blogs, lists, and scattered sources.

The application combines:

- structured gem/POI data
- route generation
- map-based exploration
- AI storytelling
- project evidence automation

## MVP Status

This project is considered **MVP complete** and ready for school delivery.

The current version demonstrates the core product concept and includes the supporting project governance artifacts needed to defend the delivery.

MVP status:

- Interactive frontend exists.
- Backend API exists.
- PostgreSQL database runs locally through Docker.
- Route generation flow exists.
- Route proof helper UI exists for M3-B validation.
- AI story/chat foundation exists.
- Admin and analytics foundations exist.
- n8n automation exists for evidence generation.
- Project evidence is stored under `docs/evidence/`.

## Core Features

### 1. Theme-Based Discovery

Users can explore Brussels gems based on themes.

Supported MVP themes include project-defined categories such as:

- Culture
- Art
- War
- Museum
- Food / Beverages / Leisure depending on dataset mapping

### 2. Route Configuration

Users can configure a route based on:

- selected theme
- target distance
- route shape
- start point

The route configuration UI also supports M3-B route proof by making the validation goal visible:

    Route proof: the route is shown as a line with numbered stops.

### 3. Route Rendering

The frontend supports route result rendering with:

- route result panel
- ordered stops
- explicit stop numbering
- route proof helper text

This supports the milestone evidence for:

- `FR-11` — route is visualized as a line
- `FR-12` — stops are numbered and shown in order

### 4. Gem Details

Users can open gem details and view contextual information about a selected place.

Gem detail features include:

- title
- theme
- practical information
- story content
- AI-assisted context where available

### 5. AI Story / Chat Foundation

The backend contains an AI story and chat foundation.

The goal is to provide local, POI-specific explanations and storytelling while keeping practical information controlled by available project data.

### 6. Admin and Analytics Foundation

The backend includes admin-oriented foundations such as:

- admin authentication
- analytics overview endpoints
- analytics timeseries endpoints
- analytics breakdown endpoints
- pearl owner management
- pearl creation foundation

These features support later expansion beyond the MVP.

### 7. Evidence Automation With n8n

The project includes an n8n workflow that generates evidence files automatically.

Evidence flow:

    feature completed
    → evidence payload sent to n8n
    → n8n formats Markdown evidence
    → n8n writes the file into docs/evidence/
    → evidence file is committed to Git

This supports traceability, Definition of Done checks, and teacher review.

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- Zustand
- Vitest
- ESLint

### Backend

- Node.js
- Express
- TypeScript
- PostgreSQL
- pg
- dotenv
- tsx
- ESLint

### Database

- PostgreSQL 16
- Docker volume for persistence
- SQL migrations

### Automation

- n8n
- Docker Compose
- local workflow execution
- evidence file generation

### Tooling

- Git
- GitHub
- Cursor / Codex
- Docker Compose
- npm workspaces

## Repository Structure

    theGame1.0/
    ├── backend/
    │   ├── src/
    │   │   ├── app.ts
    │   │   ├── server.ts
    │   │   ├── config/
    │   │   ├── db/
    │   │   ├── middleware/
    │   │   └── modules/
    │   └── package.json
    │
    ├── frontend/
    │   ├── src/
    │   │   ├── api/
    │   │   ├── components/
    │   │   ├── features/
    │   │   ├── routes/
    │   │   └── types/
    │   └── package.json
    │
    ├── db/
    │
    ├── docs/
    │   ├── evidence/
    │   ├── mcd.md
    │   └── traceability.md
    │
    ├── n8n/
    │   └── workflows/
    │
    ├── scripts/
    │
    ├── docker-compose.yml
    ├── package.json
    └── package-lock.json

## Local Runtime

The local runtime uses Docker Compose.

Services:

- `db` — PostgreSQL database
- `n8n` — automation workflow runner

n8n has access to the repository through a mounted workspace so it can write evidence files into `docs/evidence/`.

## Prerequisites

Install:

- Node.js 20 or newer for the frontend
- Node.js 18 or newer for the backend
- npm
- Docker
- Docker Compose

Recommended:

- Cursor
- GitHub account
- n8n local account
- Optional local AI runtime if testing AI features

## Installation

Clone the repository:

    git clone https://github.com/TomIgnoul/theGame1.0.git
    cd theGame1.0

Install dependencies:

    npm install

Start Docker services:

    docker compose up -d

Check running services:

    docker compose ps

Expected services:

    db
    n8n

## Environment Variables

The backend requires at least:

    DATABASE_URL=postgresql://postgres:postgres@localhost:5432/thegame
    PORT=8080

Optional variables:

    ADMIN_API_KEY=your-admin-key
    ADMIN_PORTAL_PASSPHRASE=your-admin-passphrase
    AI_PROVIDER=ollama
    OLLAMA_BASE_URL=http://localhost:11434
    OLLAMA_MODEL=llama3.2
    GOOGLE_ROUTES_API_KEY=your-google-routes-key

The frontend can optionally use:

    VITE_API_BASE_URL=http://localhost:8080

If not configured, the frontend API client defaults to:

    http://localhost:8080

## Database Migration

Run migrations:

    npm run db:migrate

or:

    bash ./scripts/migrate.sh

## Development

Start backend:

    npm run dev -w backend

Start frontend:

    npm run dev -w frontend

Or run the main development command:

    npm run dev

Frontend default:

    http://localhost:5173

Backend default:

    http://localhost:8080

n8n default:

    http://localhost:5678

## Available npm Scripts

From the root:

    npm run dev:db
    npm run dev:backend
    npm run dev:frontend
    npm run dev
    npm run build
    npm run lint
    npm run db:migrate

Frontend:

    npm run dev -w frontend
    npm run build -w frontend
    npm run test -w frontend
    npm run lint -w frontend

Backend:

    npm run dev -w backend
    npm run build -w backend
    npm run test -w backend
    npm run lint -w backend

## API Overview

Backend base URL:

    http://localhost:8080

Main endpoints:

    GET  /api/health
    GET  /api/gems
    GET  /api/gems/:id
    POST /api/routes
    POST /api/chat
    POST /api/gems/:id/story
    POST /api/analytics/events

Admin endpoints:

    POST /api/admin/auth/login
    POST /api/admin/auth/logout
    GET  /api/admin/analytics/overview
    GET  /api/admin/analytics/timeseries
    GET  /api/admin/analytics/breakdowns
    GET  /api/admin/pearl-owners
    POST /api/admin/pearl-owners
    POST /api/admin/pearls
    POST /api/admin/datasets/sync

## Health Check

Check backend health:

    curl http://localhost:8080/api/health

Expected response:

    {
      "ok": true,
      "db": true
    }

## Example Route Request

    curl -X POST http://localhost:8080/api/routes \
      -H "Content-Type: application/json" \
      -d '{
        "theme": "Culture",
        "kmTarget": 5,
        "shape": "loop",
        "start": {
          "lat": 50.8467,
          "lng": 4.3525
        },
        "end": null
      }'

## Testing

Run frontend tests:

    npm run test -w frontend

Run backend tests:

    npm run test -w backend

Run frontend lint:

    npm run lint -w frontend

Run backend lint:

    npm run lint -w backend

Run builds:

    npm run build -w frontend
    npm run build -w backend

Run all workspace builds:

    npm run build

## Evidence Workflow

The project includes an n8n workflow for generating evidence files.

Workflow file:

    n8n/workflows/feature-evidence-logger-v0.1.json

Workflow structure:

    Webhook
    → Code
    → Read/Write Files from Disk
    → Respond to Webhook

The workflow receives a JSON payload and writes a Markdown evidence file into:

    docs/evidence/

Usage documentation:

    docs/evidence/feature-evidence-logger-usage.md
    docs/evidence/evidence-workflow-quick-guide.md

Payload template:

    docs/evidence/evidence-payload-template.json

## Example Evidence Flow

After finishing a feature:

1. Validate the feature.
2. Commit the feature code.
3. Send an evidence payload to n8n.
4. n8n writes an evidence file into `docs/evidence/`.
5. Review the generated Markdown file.
6. Commit the evidence file.
7. Link the evidence in the PR or traceability notes.

Example production webhook call:

    curl -X POST http://localhost:5678/webhook/feature-evidence \
      -H "Content-Type: application/json" \
      -d '{
        "feature": "M3-B Route Proof Helper UI",
        "milestone": "M3-B",
        "fr_ids": ["FR-11", "FR-12"],
        "nfr_ids": [],
        "summary": "Added a frontend helper text that makes route rendering proof visible.",
        "result": "PASS",
        "evidence_type": "frontend implementation + tests",
        "evidence_url": "frontend/src/components/route-config/RouteConfigPanel.tsx",
        "commit_url": "GitHub commit or PR URL",
        "lesson_learned": "Small UI proof text makes acceptance criteria easier to validate."
      }'

## Evidence Directory

Evidence files are stored in:

    docs/evidence/

This directory is the project audit trail.

It proves:

- what was built
- why it was needed
- which requirement it supports
- how it was validated
- where the implementation can be found

## Traceability

The project uses traceability to connect:

    Goal
    → Requirement
    → Design
    → Implementation
    → Validation
    → Evidence

Important traceability files:

    docs/mcd.md
    docs/traceability.md
    docs/evidence/

Example:

    FR-11 / FR-12
    → route rendering UI
    → frontend/src/components/route-config/RouteConfigPanel.tsx
    → frontend tests/build validation
    → docs/evidence/2026-05-10-m3-b-m3-b-route-proof-helper-ui.md

## Key Project Documents

Main context document:

    docs/mcd.md

Traceability:

    docs/traceability.md

Evidence directory:

    docs/evidence/

n8n workflow exports:

    n8n/workflows/

## Definition of Done

A feature is considered done when:

- implementation is complete
- relevant tests pass
- lint/build checks pass
- no unrelated files are included
- the feature is linked to requirements where applicable
- evidence exists in `docs/evidence/`
- the change is committed and pushed
- the PR or delivery notes reference the evidence

## MVP Delivery Notes

This MVP focuses on proving the full concept rather than delivering a production-grade tourism platform.

Completed MVP strengths:

- working frontend/backend structure
- route configuration and proof UI
- API foundation for gems, routes, chat, stories, analytics, and admin workflows
- Docker-based local runtime
- PostgreSQL persistence
- n8n-based evidence automation
- project governance through documentation and traceability

Known post-MVP opportunities:

- stronger Google Maps route visualization
- richer data ingestion
- improved route quality
- real deployment
- Notion evidence index automation
- automatic GitHub PR evidence linking
- stronger UX polish
- multilingual story support
- audio guide support

## Security and Privacy Notes

MVP security controls include:

- backend-controlled API access
- environment-based configuration
- admin routes protected by admin session/passphrase or admin key depending on route
- chat message length validation
- rate limiting for story/chat endpoints
- no automatic Git commits from n8n
- no secrets stored in evidence files

Do not commit:

- API keys
- `.env` files
- private tokens
- raw sensitive chat logs
- personal data unless required and reviewed

## Working With Git

Recommended flow:

    git switch main
    git pull origin main
    git switch -c feature/<feature-name>

After implementation:

    git status
    npm run test -w frontend
    npm run lint -w frontend
    npm run build -w frontend
    git add <changed-files>
    git commit -m "<clear commit message>"

Generate and commit evidence:

    git add docs/evidence/<generated-evidence-file>.md
    git commit -m "Add evidence for <feature-name>"

Push:

    git push -u origin feature/<feature-name>

## Project Value

This project demonstrates more than code.

It demonstrates:

- software design thinking
- structured MVP execution
- frontend/backend integration
- automation with n8n
- AI-assisted workflow
- traceability
- evidence-based delivery
- professional Git workflow
- documentation discipline

## Final Status

The project is ready for MVP delivery.

The current version proves the main concept:

    Brussels hidden gems
    → theme-based exploration
    → route generation
    → route proof UI
    → gem details and AI context
    → evidence-backed delivery workflow

The codebase also includes the supporting documentation and automation needed to defend the project during review.
