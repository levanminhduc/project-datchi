# CLAUDE.md

## Role & Codebase Search

When asked about the codebase, project structure, or to find code, always use the augment-context-engine MCP tool (codebase-retrieval) in the root workspace first before reading individual files.


Your role: analyze requirements, delegate to sub-agents, ensure quality delivery matching specs and architecture.

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

# Database
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres  # Direct DB access
supabase migration up                                  # Apply new migrations (SAFE)
```

## Environment Setup

Copy `.env.example` to `.env`. Required: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `VITE_API_URL`.
Vite proxies `/api` → `http://localhost:3000` — no CORS in development.

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

**Domains:** Thread master data, Inventory (dual UoM: kg + meters), Allocations (FEFO), Recovery, Batch operations, Weekly ordering, Issue V2, Reports, HR/Auth (RBAC)

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

## Auth Flow

1. Frontend authenticates via Supabase Auth → 2. `fetchApi()` attaches Bearer token → 3. Backend `authMiddleware` verifies JWT (HS256/RS256) → 4. JWT claims: `employee_id`, `employee_code`, `is_root`, `roles` → 5. `requirePermission()` checks role hierarchy; ROOT bypasses → 6. On 401, `fetchApi()` auto-refreshes (single-flight)

## Conventions

### Database
- Tables: `snake_case` with `created_at`, `updated_at`, `deleted_at` (soft delete)
- Views: `v_` prefix, Functions: `fn_` prefix
- Enums: ALL UPPERCASE values (`'PENDING'`, `'ACTIVE'`)

### API (Hono)
- Response format: `{ data: T|null, error: string|null, message?: string }`
- Use `fetchApi()` wrapper, never raw `fetch()` (exception: authService, useOfflineSync)
- Validation with Zod schemas (`server/validation/`)
- Route order: specific routes (`/:id/return-logs`) BEFORE generic routes (`/:id`)

### Frontend
- Use `AppInput`, `AppSelect`, `AppButton` (not raw `q-*` components)
- Use `useSnackbar()` for toasts: `snackbar.success()`, `snackbar.error()`
- DatePicker with `DD/MM/YYYY` format (not native date input)
- Excel export with ExcelJS (not CSV). All user-facing messages in Vietnamese

### File-Based Routing
Pages in `src/pages/` auto-generate routes via `unplugin-vue-router`. Dynamic params use `[id]` convention.

## Large Dataset Architecture (Inventory Pattern)

Trang inventory là reference pattern cho mọi trang có dữ liệu lớn. **KHÔNG load toàn bộ data vào frontend.**

### Server-Side Pagination (Bắt buộc cho listing)
```
q-table @request → composable.handleTableRequest() → service.getPaginated({ page, pageSize, sortBy, descending })
→ Hono route: range(offset, offset + pageSize - 1) + { count: 'exact' }
→ DB: LIMIT/OFFSET + COUNT(*)
```
- Default 25 rows/page, options `[10, 25, 50, 100]`, backend cap `100`
- Ref: `src/pages/thread/inventory.vue` + `useInventory.ts` + `server/routes/inventory.ts`

### DB Indexes (Thiết kế theo query pattern)
- **Partial indexes** cho filter phổ biến: `WHERE status = 'AVAILABLE'`, `WHERE is_partial = TRUE`
- **Composite index** cho business logic: FEFO `(is_partial DESC, expiry_date ASC, received_date ASC) WHERE status = 'AVAILABLE'`
- **Aggregation index**: `(thread_type_id, status, is_partial)` cho summary view
- **Pagination index**: `(received_date DESC, thread_type_id, warehouse_id, status)` cho listing

### Pre-Aggregated Views + RPC (Cho summary/dashboard)
- `v_cone_summary` — PostgreSQL VIEW, dùng khi không filter
- `fn_cone_summary_filtered()` — RPC function, dùng khi cần WHERE động (warehouse/supplier)
- Ref: `supabase/migrations/20260314100000_create_v_cone_summary.sql`

### Batch Fetch (Khi cần ALL records — stocktake/export)
```typescript
const BATCH_SIZE = 1000
while (hasMore) { query.range(offset, offset + BATCH_SIZE - 1); offset += BATCH_SIZE }
```

### Realtime + Debounce
- Supabase Realtime subscribe table changes → **smart filter** (chỉ refresh khi match current view) → **debounced refresh** (100ms)
- Search input: 300ms debounce tại component level

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

## Key Files

| Purpose | Location |
|---------|----------|
| API routes | `server/routes/` (26 route handlers) |
| Auth middleware | `server/middleware/auth.ts` |
| Zod schemas | `server/validation/` (7 schemas) |
| Supabase clients | `server/db/supabase.ts` (backend), `src/lib/supabase.ts` (frontend) |
| fetchApi wrapper | `src/services/api.ts` |
| Services | `src/services/` (30 API clients) |
| Composables | `src/composables/` (45 composables) |
| Types | `src/types/` (37 type files) |
| UI Components | `src/components/ui/` (67 components in 16 categories) |
| Domain Components | `src/components/thread/` (47 components) |
| Pages | `src/pages/` (49 pages, file-based routing) |
| Migrations | `supabase/migrations/` (83 migrations) |
| Vite config | `vite.config.mts` |
| Playwright tests | `tests/e2e/*.spec.ts` |

## Workflows

Rules auto-load from `.claude/rules/`:
- `development-rules.md` — Code patterns, pre-commit checklist
- `primary-workflow.md` — Before/during/after code flow
- `orchestration-protocol.md` — When to spawn subagents
- `spx-workflow.md` — OpenSpec plan/apply/verify
- `team-coordination-rules.md` — Agent team file ownership (path-scoped)
- `documentation-management.md` — Doc update triggers (path-scoped)

**SPX quick ref:** `/spx-ff` (plan+artifacts) → `/spx-apply` (implement) → `/spx-verify` (verify)

## Hook Response Protocol

When blocked by privacy-block hook (`@@PRIVACY_PROMPT@@`):
1. Parse JSON between `@@PRIVACY_PROMPT_START@@` and `@@PRIVACY_PROMPT_END@@`
2. Use `AskUserQuestion` with the question data
3. "Yes, approve access" → `bash cat "filepath"` | "No, skip this file" → continue

## Python Scripts (Skills)

Use venv Python: **Linux/macOS:** `.claude/skills/.venv/bin/python3` | **Windows:** `.claude\skills\.venv\Scripts\python.exe`

## Modularization

- Max 200 lines/file → modularize if exceeded
- kebab-case naming, check existing modules first
- Not for: Markdown, plain text, bash scripts, config files

## Documentation Structure

Docs in `./docs/`: project-overview-pdr, code-standards, codebase-summary, design-guidelines, deployment-guide, system-architecture, project-roadmap. See `documentation-management.md` rule for update triggers.
