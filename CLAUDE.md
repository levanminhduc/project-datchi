# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Codebase Search — Context Engine First

Whenever you need to look at the codebase or find information in it (where something lives, how a flow works, project structure, context before an edit), call the context-engine MCP tool `mcp__codebase-retrieval__codebase-retrieval` first, asking in natural language. Use it before Grep, Glob, Read, or any search subagent (including Explore), and tell subagents to do the same.

When you know the file but not the line range, use `mcp__codebase-retrieval__file-retrieval` to get the relevant snippets with line numbers, then Read those ranges before editing.

Fall back to Grep only for a complete list of occurrences (rename/refactor), Glob only for file paths by pattern, and Read only when you already know the exact location. If the context engine errors or is not indexed, say so in one line, then fall back.

## 1. Project Overview

Thread Inventory Management System for Vietnamese garment manufacturing (B2B).
Tracks thread cones from purchase order through delivery, allocation, issue to production, and recovery.
Core invariant: a thread type identity = exact combination of Supplier (NCC) + Tex number + Thread color — never merge inventory across this boundary.

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Vue 3 + Quasar 2 | 3.5.21 + 2.17.10 |
| Language | TypeScript | 5.9.2 |
| Build | Vite | 8.0.11 |
| Backend | Hono on Node.js (tsx) | 4.11.5 + 4.21.0 |
| Database | PostgreSQL 17 (pg driver) | local `127.0.0.1:5432/datchi` |
| Validation | Zod | 4.3.6 |
| State | Pinia | 3.0.4 |
| Auth | jose (JWT HS256) + bcrypt | self-signed, no external auth service |
| Realtime | LISTEN/NOTIFY + SSE | PostgreSQL native |
| Storage | Filesystem (STORAGE_DIR) | guide images saved locally |
| Testing | Playwright | 1.58.2 |
| AI assistant | `server/ai-tools` (tools) + separate repo `ai-assistant-service` (FastAPI, model loop) | Claude Sonnet 5.5 default |

## 3. Dev Commands

```bash
npm install             # Install dependencies
npm run dev             # Frontend only (Vite :5173)
npm run server          # Backend only (Hono :3000)
npm run dev:all         # Both concurrently

npm run type-check      # vue-tsc --build --force
npm run lint            # ESLint --fix
npm run build           # type-check + vite build

npm run e2e             # Playwright headless
npm run e2e:ui          # Playwright UI mode
npm run e2e:headed      # Playwright headed
npm run test:ai         # AI tools + chat-assistant tests (stubbed DB)

psql -h 127.0.0.1 -p 5432 -U postgres -d datchi   # Connect to DB (local credentials: postgres:postgres)
PGPASSWORD=postgres psql -h 127.0.0.1 -p 5432 -U postgres -d datchi -c "SELECT 1;"   # Non-interactive DB query example
npm run db:seed         # Seed master data (local only)
```

## 4. Binding Rules — `.claude/rules/`

Project rules live in `.claude/rules/` and are auto-loaded by Claude Code:

| Rule file | Scope | Covers |
|-----------|-------|--------|
| `00-core.md` | always loaded | Data safety, thread identity, migrations, Vietnamese UI, surgical changes, pre-code/pre-commit checklists |
| `frontend.md` | `src/**` | App* wrappers, fetchApi, TypeScript rules, pagination, realtime |
| `backend.md` | `server/**` | Response format, route order, Zod, pg query patterns, idempotency |
| `database.md` | `supabase/**`, `server/db/**` | Naming, required columns, migration rules, RPC catalog |
| `thread-domain.md` | thread pages/composables, `server/routes/**` | Identity, color_id sources, cone lifecycle, dual UoM, key flows |
| `auth.md` | auth middleware/services | JWT, permissions, auth-change checklist |
| `weekly-order.md` | `server/routes/weekly-order/**` + related | Flow, `thread_color` string exception, route order gotcha |

Dangerous shell commands (`DELETE FROM`, `TRUNCATE`, `DROP`, `supabase db reset`, `git push -f`) are additionally gated by a PreToolUse hook (`.claude/hooks/block-dangerous.cjs`).

## 5. Extended Reference — `.claude/docs/`

Deeper explanations and examples (read on demand):

| File | When to read |
|------|-------------|
| `.claude/docs/architecture.md` | Request flow, layer responsibilities, DB client, dir structure |
| `.claude/docs/thread-domain.md` | Thread identity rules, cone lifecycle, FEFO, dual UoM, color ID gotchas |
| `.claude/docs/database-rpcs-migrations.md` | Writing queries, calling RPCs, migration rules |
| `.claude/docs/frontend-conventions.md` | Component wrappers, fetchApi, TypeScript rules, pagination, realtime (SSE) |
| `.claude/docs/backend-api.md` | Response format, route order, validation, error handling, pg query patterns |
| `.claude/docs/auth-permissions.md` | JWT sign/verify (jose), requirePermission, adding permissions |
| `.claude/docs/weekly-order-issue-recovery.md` | Weekly order flow, Issue V2, recovery, loans, schema exceptions |
| `.claude/docs/safety-and-workflow.md` | Dangerous commands, surgical changes, pre-commit checklist |

## 6. AI Assistant (chatbot)

Flow: Vue → `POST /api/chat-assistant/query` → `ai-assistant-service` `POST /v1/chat` (sibling repo `../ai-assistant-service`) → model picks tools → service calls back `GET /api/ai/tools` / `POST /api/ai/tools/:name` with the asker's `Authorization` + `X-Internal-Token` (`CHATBOT_INTERNAL_TOKEN`). The model prompt lives in two places: `SERVICE_RULES` in the service's `app/agent.py` (generic) and `server/ai-tools/instructions.ts` (datchi glossary + tool routing hints).

Adding a tool:

1. Create `server/ai-tools/tools/<name>.ts` with `defineTool({ name, description, permissions, input, run })`. Tools read data only through `ctx.get(path, zodSchema)`, which calls existing GET endpoints as the asker — no direct SQL, no writes.
2. Add each new path regex to `ALLOWED_PATHS` in `server/ai-tools/internal-fetch.ts`; register the tool in `server/ai-tools/registry.ts`.
3. `permissions` must cover every endpoint the tool (and the tools it depends on for IDs) calls, so the tool is hidden when it would 403.
4. Description and field explanations in Vietnamese; add routing hints to `instructions.ts` when the model must chain tools.
5. Tests in `server/ai-tools/tools/*.test.ts` via `buildAiTestApp` + `withStubbedPool` (stubs `pool.query`, `pool.connect` throws); add the file to `test:ai` in `package.json`.
6. In `ai-assistant-service`, regenerate `tests/datchi_tools.json` from `AI_TOOLS` and update the tool count asserted in the provider tests.

Prod: container `ai-assistant` in `docker-compose.ghcr.yml`, setup and troubleshooting in `DEPLOY.md` (sections 2.6, 6.3, 8).
