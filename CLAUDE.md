# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Codebase Search — Priority #1 (ALWAYS)

**The context-engine MCP tool (`codebase-retrieval`) is ALWAYS the #1 priority for finding code, understanding the codebase, or exploring project structure.** Use it FIRST — before Grep, Glob, Read, or any subagent (including Explore). Only fall back to Grep when you need a complete list of ALL occurrences (rename/refactor), Glob when you only need file paths by pattern, or Read when you already know the exact file and location.

When you need to read a specific file but don't know the exact line range, use the file-retrieval MCP tool instead of reading the entire file. Describe what information you need and it returns only the relevant snippets with line numbers. Use the Read tool with the returned line ranges (expanded as needed) to get current content before making edits.

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
