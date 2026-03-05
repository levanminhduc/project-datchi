# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Role & Responsibilities
When asked about the codebase, project structure, or to find code, always use the augment-context-engine MCP tool (codebase-retrieval) in the root workspace first before reading individual files.

Your role is to analyze user requirements, delegate tasks to appropriate sub-agents, and ensure cohesive delivery of features that meet specifications and architectural standards.

## Workflows

- Primary workflow: `./.claude/rules/primary-workflow.md`
- Development rules: `./.claude/rules/development-rules.md`
- Orchestration protocols: `./.claude/rules/orchestration-protocol.md`
- Documentation management: `./.claude/rules/documentation-management.md`
- SPX (OpenSpec) workflow: `./.claude/rules/spx-workflow.md`
- Team coordination: `./.claude/rules/team-coordination-rules.md`

**IMPORTANT:** Analyze the skills catalog and activate the skills that are needed for the task during the process.
**IMPORTANT:** You must follow strictly the development rules in `./.claude/rules/development-rules.md` file.
**IMPORTANT:** Before you plan or proceed any implementation, always read the `./README.md` file first to get context.
**IMPORTANT:** Sacrifice grammar for the sake of concision when writing reports. List any unresolved questions at the end.

## Commands

```bash
# Development
npm run dev          # Frontend only (Vite, port 5173)
npm run server       # Backend only (Hono via tsx, port 3000)
npm run dev:all      # Both frontend + backend concurrently

# Build & checks
npm run build        # Runs type-check + vite build
npm run type-check   # vue-tsc --build --force
npm run lint         # ESLint with --fix

# Testing
npm run e2e          # Playwright (headless)
npm run e2e:ui       # Playwright with UI mode
npm run e2e:headed   # Playwright headed browser
# Tests live in tests/e2e/*.spec.ts

# Database
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres  # Direct DB access
supabase migration up                                  # Apply new migrations (SAFE)
pg_dump -h 127.0.0.1 -p 54322 -U postgres -d postgres > backup.sql  # Backup before migrations
```

## Environment Setup

Copy `.env.example` to `.env`. Required variables:
- `VITE_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` — Supabase URL (default: `http://127.0.0.1:54321`)
- `VITE_SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Backend admin client (bypasses RLS)
- `SUPABASE_JWT_SECRET` — For HS256 JWT verification (optional if using RS256/JWKS)
- `VITE_API_URL` — API base URL (default: `http://localhost:3000`, proxied via Vite in dev)

Vite dev server proxies `/api` requests to `http://localhost:3000` — no CORS issues in development.

## CRITICAL SAFETY RULES

| Dangerous Command           | Consequence               | Requirement             |
| --------------------------- | ------------------------- | ----------------------- |
| `supabase db reset`         | **DELETES ALL DATA**      | NEVER run automatically |
| `DROP TABLE`, `TRUNCATE`    | Permanent data loss       | Must ask user first     |
| `DELETE FROM ... WHERE 1=1` | Deletes all records       | Must ask user first     |
| `supabase migration repair` | Changes migration history | Ask user first          |
| Force push (`git push -f`)  | Lost commit history       | Ask user first          |

## Project Context

**Thread Inventory Management System (Hệ thống Quản lý Kho Chỉ)** — Vietnamese-language business app for garment industry.

**Stack:** Vue 3 + Quasar 2 + TypeScript 5.9 + Vite 7 | Hono 4 backend (Node.js via tsx) | Supabase (PostgreSQL) + Zod 4 validation

**Domains:** Thread master data, Inventory (dual UoM: kg + meters), Allocations (FEFO), Recovery, Batch operations, Weekly ordering, Issue V2 (xuất/trả chỉ), Reports, HR/Auth (RBAC)

## Architecture

```
Supabase (PostgreSQL)
    ↓ supabaseAdmin (service_role key, bypasses RLS)
Hono API (server/) ← authMiddleware (JWT verify via jose)
    ↓ /api/* routes
Vite proxy (/api → localhost:3000)
    ↓
Service Layer (src/services/) → fetchApi() wrapper (auto token + 401 refresh)
    ↓
Composables (src/composables/) → state + logic + useSnackbar
    ↓
Pages (src/pages/) → file-based routing via unplugin-vue-router
    ↓
UI Components (src/components/ui/) → App* wrappers over Quasar
```

**Key principles:**
- Frontend NEVER calls Supabase directly for CRUD — always through Hono API
- Exception: Realtime subscriptions via `useRealtime` composable use Supabase client directly
- Two Supabase clients: `src/lib/supabase.ts` (frontend, anon key) and `server/db/supabase.ts` (backend, `supabaseAdmin` with service_role)

### Auth Flow
1. Frontend authenticates via Supabase Auth (`src/lib/supabase.ts`)
2. `fetchApi()` (`src/services/api.ts`) attaches `Authorization: Bearer <access_token>` to all API calls
3. Backend `authMiddleware` (`server/middleware/auth.ts`) verifies JWT (HS256 via secret or RS256/ES256 via JWKS)
4. JWT contains custom claims: `employee_id`, `employee_code`, `is_root`, `roles` (set by Supabase `custom_access_token_hook`)
5. `requirePermission()` checks against `employee_roles → role_permissions → permissions` hierarchy; ROOT bypasses all
6. On 401, `fetchApi()` auto-refreshes token via `getRefreshedSession()` (single-flight pattern to prevent concurrent refreshes)

### File-Based Routing
Pages in `src/pages/` auto-generate routes via `unplugin-vue-router`. Route structure mirrors directory layout (e.g., `src/pages/thread/weekly-order/index.vue` → `/thread/weekly-order`). Dynamic params use `[id]` convention.

## Conventions

### Database
- Tables: `snake_case` with `created_at`, `updated_at`, `deleted_at` (soft delete)
- Views: `v_` prefix, Functions: `fn_` prefix
- Enums: ALL UPPERCASE values (e.g., `'PENDING'`, `'ACTIVE'`, not `'pending'`)
- All migrations in `supabase/migrations/`

### API (Hono)
- Response format: `{ data: T|null, error: string|null, message?: string }`
- Use `fetchApi()` wrapper, never raw `fetch()` (exception: authService, useOfflineSync)
- Validation with Zod schemas (`server/validation/`)
- Route order matters: specific routes (`/:id/return-logs`) BEFORE generic routes (`/:id`)
- Per-route authorization via `requirePermission()` — ROOT bypasses all checks

### Frontend
- Use `AppInput`, `AppSelect`, `AppButton` (not raw `q-*` components)
- Use `useSnackbar()` for toasts: `snackbar.success()`, `snackbar.error()`
- DatePicker with `DD/MM/YYYY` format (not native date input)
- Excel export with ExcelJS (not CSV)
- All user-facing messages in Vietnamese

## Anti-patterns

| Don't | Do Instead |
|-------|------------|
| `<input type="date">` | `<DatePicker>` component |
| CSV export | XLSX with ExcelJS |
| `fetch()` directly | `fetchApi()` wrapper |
| Supabase from frontend (CRUD) | API call through Hono |
| `q-input`, `q-select` | `AppInput`, `AppSelect` |
| Hardcode Vietnamese in logic | Use constants/i18n |
| Add auth middleware without checking frontend | Verify `fetchApi()` sends `Authorization` header |
| Guess column names | Check schema with `\d table_name` or read migrations |

## Pattern References

| Pattern | Example File | Notes |
|---------|--------------|-------|
| Excel Export | `src/composables/useReports.ts` | Dynamic import ExcelJS |
| DatePicker | `src/components/ui/pickers/DatePicker.vue` | DD/MM/YYYY format |
| App Components | `src/components/ui/inputs/` | AppInput, AppSelect wrappers |
| Notifications | `src/composables/useSnackbar.ts` | Toast helpers |
| API Service | `src/services/threadService.ts` | fetchApi pattern |
| Auth middleware | `server/middleware/auth.ts` | JWT verify + permission guards |
| Zod validation | `server/validation/` | Request body schemas |

## SPX Workflow

Xem chi tiết tại `./.claude/rules/spx-workflow.md`

**Quick reference:**
- `/spx-ff` → Fast-forward: plan + artifacts trong 1 bước
- `/spx-apply` → Implement tasks
- `/spx-verify` → Verify implementation

**Codebase search:** LUÔN dùng `mcp__auggie__codebase-retrieval` làm công cụ tìm kiếm chính.

## Key Files

| Purpose | Location |
|---------|----------|
| API routes | `server/routes/` (25 route handlers) |
| Auth middleware | `server/middleware/auth.ts` |
| Zod schemas | `server/validation/` |
| Supabase clients | `server/db/supabase.ts` (backend), `src/lib/supabase.ts` (frontend) |
| fetchApi wrapper | `src/services/api.ts` |
| Services | `src/services/` (28 API clients) |
| Composables | `src/composables/` (46 composables) |
| Types | `src/types/` |
| UI Components | `src/components/ui/` (67 components in 13 categories) |
| Domain Components | `src/components/thread/` |
| Pages | `src/pages/` (file-based routing) |
| Migrations | `supabase/migrations/` |
| Vite config | `vite.config.mts` |
| Playwright tests | `tests/e2e/*.spec.ts` |

## Hook Response Protocol

### Privacy Block Hook (`@@PRIVACY_PROMPT@@`)

When a tool call is blocked by the privacy-block hook, the output contains a JSON marker between `@@PRIVACY_PROMPT_START@@` and `@@PRIVACY_PROMPT_END@@`. **You MUST use the `AskUserQuestion` tool** to get proper user approval.

**Required Flow:**
1. Parse the JSON from the hook output
2. Use `AskUserQuestion` with the question data from the JSON
3. Based on user's selection:
   - **"Yes, approve access"** → Use `bash cat "filepath"` to read the file (bash is auto-approved)
   - **"No, skip this file"** → Continue without accessing the file

## Python Scripts (Skills)

When running Python scripts from `.claude/skills/`, use the venv Python interpreter:
- **Linux/macOS:** `.claude/skills/.venv/bin/python3 scripts/xxx.py`
- **Windows:** `.claude\skills\.venv\Scripts\python.exe scripts\xxx.py`

**IMPORTANT:** When scripts of skills failed, don't stop, try to fix them directly.

## Modularization

- If a code file exceeds 200 lines of code, consider modularizing it
- Check existing modules before creating new
- Analyze logical separation boundaries (functions, classes, concerns)
- Use kebab-case naming with long descriptive names (self-documenting for LLM tools)
- After modularization, continue with main task
- When not to modularize: Markdown files, plain text files, bash scripts, configuration files, etc.

## Documentation Structure

```
./docs
├── project-overview-pdr.md
├── code-standards.md
├── codebase-summary.md
├── design-guidelines.md
├── deployment-guide.md
├── system-architecture.md
└── project-roadmap.md
```
