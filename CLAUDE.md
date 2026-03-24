# CLAUDE.md

## Role

Senior developer for this project. Responsibilities:
- **LUÔN** enhance/diễn giải lại yêu cầu → hỏi xác nhận trước khi bắt đầu làm
- Analyze requirements, delegate to sub-agents, ensure delivery matches specs + architecture
- Spawn subagents for testing, review, finalization
- Use `mcp__auggie__codebase-retrieval` FIRST for all codebase searches before reading files

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
psql -h 127.0.0.1 -p 55321 -U postgres -d postgres  # Direct DB access
supabase migration up                                  # Apply new migrations (SAFE)
```

## CRITICAL SAFETY RULES

| Dangerous Command           | Consequence               | Requirement             |
| --------------------------- | ------------------------- | ----------------------- |
| `supabase db reset`         | **DELETES ALL DATA**      | NEVER run automatically |
| `DROP TABLE`, `TRUNCATE`    | Permanent data loss       | Must ask user first     |
| `DELETE FROM ... WHERE 1=1` | Deletes all records       | Must ask user first     |
| `supabase migration repair` | Changes migration history | Ask user first          |
| Force push (`git push -f`)  | Lost commit history       | Ask user first          |

## Project Context

**Thread Inventory Management System (Hệ thống Quản lý Kho Chỉ)** — Vietnamese B2B app for garment industry.

**Stack:** Vue 3 + Quasar 2 + TypeScript 5.9 + Vite 8 | Hono 4 (Node.js via tsx) | Supabase (PostgreSQL) + Zod 4

**Domains:** Thread master data, Inventory (kg + meters dual UoM), Allocations (FEFO), Recovery, Batch ops, Weekly ordering, Issue V2, Reports, HR/Auth (RBAC), Purchase Orders, Reconciliation, Thread Calculation, Sub-Arts, Style Colors, Styles

**Environment:** Copy `.env.example` → `.env`. Required: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `VITE_API_URL`. Vite proxies `/api` → `http://localhost:3000`.

## Business Rules (Domain-Critical)

### Thread Type Identity — 1 Loại Chỉ = Unique (NCC + Tex + Màu)

```
thread_types: supplier_id (NCC) + tex_number (Tex) + color_id (Màu)
```

- Cùng tex + màu nhưng **khác NCC** → **khác `thread_type_id`** → kho riêng biệt
- Unique constraint: `(supplier_id, tex_number, color_id)`
- Summary views group by `thread_type_id + color_id`
- Display: `"NCC - TEX xxx - Màu"`

## Architecture

```
Supabase (PostgreSQL)
    ↓ supabaseAdmin (service_role, bypasses RLS)
Hono API (server/) ← authMiddleware (JWT via jose)
    ↓ /api/* routes
Vite proxy (/api → localhost:3000)
    ↓
src/services/ → fetchApi() (auto Bearer token + 401 refresh)
    ↓
src/composables/ → state + logic + useSnackbar
    ↓
src/pages/ → file-based routing (unplugin-vue-router)
    ↓
src/components/ui/ → App* wrappers over Quasar
```

**Key principles:**
- Frontend NEVER calls Supabase directly for CRUD → always through Hono API
- Exception: Realtime subscriptions (`useRealtime`) use Supabase client directly
- Two clients: `src/lib/supabase.ts` (anon key) | `server/db/supabase.ts` (service_role)

**Auth flow:** Supabase Auth → `fetchApi()` attaches Bearer → `authMiddleware` verifies JWT → claims: `employee_id`, `employee_code`, `is_root`, `roles` → `requirePermission()` (ROOT bypasses) → 401 auto-refresh (single-flight)

## Conventions

### Anti-patterns (NEVER do)

| Don't | Do Instead |
|-------|------------|
| `<input type="date">` | `<DatePicker>` component |
| CSV export | XLSX with ExcelJS |
| `fetch('/api/...')` directly | `fetchApi()` wrapper |
| Supabase CRUD from frontend | API call through Hono |
| `q-input`, `q-select`, `q-table` | `AppInput`, `AppSelect`, `DataTable` |
| Hardcode Vietnamese in logic | Use constants/i18n |
| Auth middleware change without frontend check | Verify `fetchApi()` sends `Authorization` header |
| Guess column names | `\d table_name` or read migrations |
| Raw `q-table` anywhere | `DataTable` (`src/components/ui/tables/`) |
| Supabase `.select()` without `.limit()` | LUÔN thêm `.limit(N)` hoặc `.single()` / `.maybeSingle()` |
| Query N+1 (loop gọi DB từng record) | **TUYỆT ĐỐI KHÔNG.** Batch: `.in('id', ids)` / RPC / view |

### Database
- Tables: `snake_case` + `created_at`, `updated_at`, `deleted_at` (soft delete)
- Views: `v_` prefix | Functions: `fn_` prefix | Enums: ALL UPPERCASE (`'PENDING'`, `'ACTIVE'`)
- **Supabase PostgREST default limit = 1000 rows.** Mọi `.select()` trả nhiều rows PHẢI có `.limit(N)` hoặc `.single()` / `.range()`. Không có → âm thầm cắt data, gây sai lệch nghiêm trọng.

### API (Hono)
- Response: `{ data: T|null, error: string|null, message?: string }`
- Route order: specific (`/:id/return-logs`) BEFORE generic (`/:id`)
- Validation: Zod schemas in `server/validation/`

### Frontend
- Components: `AppInput`, `AppSelect`, `AppButton` (not raw `q-*`)
- Tables: `DataTable` — listing, dialog, inline — không dùng `q-table` trực tiếp
- Toasts: `useSnackbar()` → `snackbar.success()` / `snackbar.error()`
- Dates: `DatePicker` with `DD/MM/YYYY` (not `<input type="date">`)
- All user-facing messages in Vietnamese

## Pattern References

| Pattern | File | Notes |
|---------|------|-------|
| Server-side pagination | `src/pages/thread/inventory.vue` + `useInventory.ts` | Reference cho mọi trang large data |
| Excel Export | `src/composables/useReports.ts` | Dynamic import ExcelJS |
| DatePicker | `src/components/ui/pickers/DatePicker.vue` | DD/MM/YYYY |
| API Service | `src/services/threadService.ts` | fetchApi pattern |
| Auth middleware | `server/middleware/auth.ts` | JWT + permission guards |
| Zod validation | `server/validation/` | Request body schemas |
| Cone Summary | `src/composables/useConeSummary.ts` | Pre-aggregated view + RPC |
| Realtime | `src/composables/useRealtime.ts` | Smart filter + debounce |

## Large Dataset Architecture

**KHÔNG load toàn bộ data vào frontend.** Pattern chuẩn: server-side pagination.

```
DataTable @request → composable.handleTableRequest()
→ service.getPaginated({ page, pageSize, sortBy, descending })
→ Hono: range(offset, offset+pageSize-1) + { count: 'exact' }
→ DB: LIMIT/OFFSET + COUNT(*)
```

- Default 25 rows/page, options `[10, 25, 50, 100]`, backend cap `100`
- Pre-aggregated views: `v_cone_summary` (no filter) | `fn_cone_summary_filtered()` (dynamic WHERE)
- Batch fetch: `BATCH_SIZE = 1000`, loop với `.range(offset, offset+999)`
- Realtime: subscribe → smart filter → debounced refresh (100ms) | Search: 300ms debounce

## Key Files

| Purpose | Location |
|---------|----------|
| API routes | `server/routes/` |
| Auth middleware | `server/middleware/auth.ts` |
| Zod schemas | `server/validation/` |
| Supabase clients | `server/db/supabase.ts` (backend) · `src/lib/supabase.ts` (frontend) |
| fetchApi wrapper | `src/services/api.ts` |
| Services | `src/services/` |
| Composables | `src/composables/` |
| UI Components | `src/components/ui/` |
| Domain Components | `src/components/thread/` |
| Pages | `src/pages/` (file-based routing) |
| Migrations | `supabase/migrations/` |

## Workflows & Rules

Rules auto-load from `.claude/rules/`:
- `development-rules.md` — Code patterns, pre-commit checklist
- `primary-workflow.md` — Before/during/after code flow
- `orchestration-protocol.md` — When to spawn subagents
- `spx-workflow.md` — OpenSpec plan/apply/verify
- `team-coordination-rules.md` — Agent team file ownership
- `documentation-management.md` — Doc update triggers

**SPX:** `/spx-ff` (plan+artifacts) → `/spx-apply` (implement) → `/spx-verify` (verify)

**Hook Response Protocol** — When blocked by `@@PRIVACY_PROMPT@@`:
1. Parse JSON between `@@PRIVACY_PROMPT_START@@` / `@@PRIVACY_PROMPT_END@@`
2. Use `AskUserQuestion` with question data
3. "Yes" → `bash cat "filepath"` | "No" → continue

**Python Scripts (Skills):** Windows: `.claude\skills\.venv\Scripts\python.exe` | Linux/macOS: `.claude/skills/.venv/bin/python3`

**Modularization:** Max 200 lines/file → split if exceeded. kebab-case. Not for: Markdown, config, env files.

**Docs:** `./docs/` — project-overview-pdr, code-standards, codebase-summary, design-guidelines, deployment-guide, system-architecture, project-roadmap.
