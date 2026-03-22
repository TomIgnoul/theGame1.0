# AI Chatbot Handoff - Open Model Runtime Only

## Project context

- Frontend: React + Vite
- Backend: Express + Node
- Database: Postgres
- Repo: npm workspace monorepo
- Other services: Google Maps / Routes
- Current focus: story chatbot MVP

## Hard requirement

The chatbot must not depend on a paid OpenAI API key for MVP.

Refactor or implement the chatbot using a local open model runtime.

## Runtime choice

Use Ollama as the default local runtime.

### Runtime facts to respect

- Ollama serves a local API by default at `http://localhost:11434/api`.
- The backend should call Ollama's native chat API.
- Ollama supports local open models such as `llama3.2` and `gemma3`.
- Prefer the native Ollama API, not OpenAI billing.

## Non-goals

Do not:
- require `OPENAI_API_KEY`
- use paid OpenAI API calls for MVP
- introduce MCP
- introduce RAG/vector DB
- introduce agents or autonomous workflows
- overengineer abstractions

## Target architecture

Frontend chat UI
-> Express backend `/api/chat`
-> backend prompt/context builder
-> backend calls local Ollama runtime
-> backend returns response
-> frontend renders reply

Postgres stores app data if needed, but not the model.

## Required backend behavior

Implement or refactor the backend so that:
1. Chat replies come from a local Ollama runtime.
2. The backend uses environment variables like:
   - `AI_PROVIDER=ollama`
   - `OLLAMA_BASE_URL=http://localhost:11434`
   - `OLLAMA_MODEL=llama3.2`
3. No `OPENAI_API_KEY` is required for the default MVP path.
4. If Ollama is unavailable, return a clean developer-facing error message.
5. Keep the code modular so a future provider swap remains possible.

## Preferred implementation shape

### Backend

Create or refactor toward the current repo conventions:
- `backend/src/app.ts` for route registration
- `backend/src/modules/ai/aiRuntime.ts`
- `backend/src/modules/chat/aiService.ts`
- `backend/src/modules/chat/promptService.ts`

Expected backend responsibilities:
- validate request payload
- build story-aware prompt/context
- call Ollama native chat API
- normalize reply shape for frontend
- keep chat stateless for MVP

### Frontend

Create or refactor toward:
- `frontend/src/features/chat/ChatPanel.tsx`
- `frontend/src/features/chat/useChat.ts`
- `frontend/src/features/chat/types.ts`

Expected frontend responsibilities:
- render message list
- send message to backend
- handle loading/error state
- remain provider-agnostic

## Initial API contract

### `POST /api/chat`

#### Request

```json
{
  "message": "string",
  "sessionId": "string?",
  "gemId": "string"
}
```

#### Response

```json
{
  "reply": "string",
  "sessionId": "string"
}
```

## Ollama integration requirements

Use the native Ollama chat API.

Expected outbound request shape from backend to Ollama:

```json
{
  "model": "llama3.2",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ]
}
```

The backend should extract the assistant text from the Ollama response and return a simplified reply object to the frontend.

## Story chatbot intent

This is not a generic assistant.

The chatbot should behave like a story-aware guide inside the Hidden Gems / Brussels experience.

The prompt strategy should:
- stay aligned with the story feature
- use app context when available
- avoid pretending to know missing facts
- prefer concise, usable responses for MVP

## What I want you to do

Inspect the current monorepo structure.
Find the current chatbot/OpenAI-specific implementation.
Replace or refactor it so the default path uses Ollama local runtime.
Remove the requirement that `OPENAI_API_KEY` must be present for MVP.
Keep changes minimal and clean.
Show the file plan before large edits.

After implementation, explain:
- what changed
- which files were added/edited
- which env vars are now required
- how to run the chatbot locally
- what still remains optional for later

## Acceptance criteria

The task is complete when:
- the frontend can send a chat message
- the backend can answer using local Ollama
- no paid OpenAI key is required for the MVP path
- the implementation is documented clearly
- the code fits the current monorepo conventions

## Local setup assumptions

Assume Ollama is installed locally and running.

Default local values:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

## Output expectations

Before coding:
- summarize current chatbot-related files
- propose the smallest clean implementation plan

After coding:
- provide a concise change summary
- provide local run/test instructions
- call out any gaps or risks honestly

## Cursor prompt variant

```text
Read docs/codex-handoff-chatbot.md and inspect the repository.

Refactor the chatbot so the MVP uses a local open model runtime through Ollama, not a paid OpenAI API key.

Requirements:
- no OPENAI_API_KEY required for the default path
- use OLLAMA_BASE_URL and OLLAMA_MODEL env vars
- call Ollama native chat API from the Express backend
- keep frontend provider-agnostic
- keep the changes small, modular, and consistent with repo conventions
- show file plan before major edits
- explain exactly what changed after implementation
```
