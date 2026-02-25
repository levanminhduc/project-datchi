# CLAUDE.md

## CRITICAL SAFETY RULES

| Dangerous Command           | Consequence               | Requirement             |
| --------------------------- | ------------------------- | ----------------------- |
| `supabase db reset`         | **DELETES ALL DATA**      | NEVER run automatically |
| `DROP TABLE`, `TRUNCATE`    | Permanent data loss       | Must ask user first     |
| `DELETE FROM ... WHERE 1=1` | Deletes all records       | Must ask user first     |
| `supabase migration repair` | Changes migration history | Ask user first          |
| Force push (`git push -f`)  | Lost commit history       | Ask user first          |

Before migrations, backup: `pg_dump -h 127.0.0.1 -p 54322 -U postgres -d postgres > backup.sql`

## Project Context

**Thread Inventory Management System (Hệ thống Quản lý Kho Chỉ)** - Vietnamese-language business app for garment industry.

**Stack:** Vue 3 + Quasar 2 + TypeScript + Vite | Hono backend | Supabase (PostgreSQL)

**Domains:** Thread master data, Inventory (dual UoM: kg + meters), Allocations (FEFO), Recovery, Batch operations, Weekly ordering, Reports

## Architecture

```
Supabase (PostgreSQL)
    ↓
Hono API (server/) → supabaseAdmin (bypasses RLS)
    ↓
Service Layer (src/services/) → fetchApi wrapper
    ↓
Composables (src/composables/) → state + logic + useSnackbar
    ↓
Pages/Components → Real-time via useRealtime
```

**Key principle:** Frontend NEVER calls Supabase directly cho CRUD. Always through Hono API. Exception: Realtime subscriptions qua useRealtime composable.

## Schema Overview

- **40 tables**, 1 view, 21 functions, 17 enums
- **Key domains:** Thread Master Data, Inventory (dual UoM: kg + meters), Allocations (FEFO), Recovery, Batch operations, Weekly ordering, Reports, HR/Auth

## Conventions

### Database
- Tables: `snake_case` with `created_at`, `updated_at`, `deleted_at` (soft delete)
- Views: `v_` prefix, Functions: `fn_` prefix
- Enums: ALL UPPERCASE values (e.g., 'PENDING', 'ACTIVE', not 'pending')
- All migrations in `supabase/migrations/`

### API (Hono)
- Response format: `{ data: T|null, error: string|null, message?: string }`
- Use `fetchApi()` wrapper, never raw `fetch()`
- `fetchApi()` auto-attaches `Authorization: Bearer <token>` from `localStorage('auth_access_token')`
- Global auth via `except()` in `server/index.ts` — whitelists `/api/auth/login` and `/api/auth/refresh`
- Per-route authorization via `requirePermission()` — ROOT bypasses all checks
- Validation with Zod schemas

### Frontend
- Use `AppInput`, `AppSelect`, `AppButton` (not raw `q-*` components)
- Use `useSnackbar()` for toasts: `snackbar.success()`, `snackbar.error()`
- DatePicker with `DD/MM/YYYY` format (not native date input)
- Excel export with ExcelJS (not CSV)

## Anti-patterns

| Don't | Do Instead |
|-------|------------|
| `<input type="date">` | `<DatePicker>` component |
| CSV export | XLSX with ExcelJS |
| `fetch()` directly | `fetchApi()` wrapper (exception: authService, useOfflineSync) |
| Supabase from frontend | API call through Hono |
| `q-input`, `q-select` | `AppInput`, `AppSelect` |
| Hardcode Vietnamese in logic | Use constants/i18n |
| Thêm auth middleware backend mà không check frontend | Kiểm tra `fetchApi()` có gửi `Authorization` header |

## Pattern References

| Pattern | Example File | Notes |
|---------|--------------|-------|
| Excel Export | `src/composables/useReports.ts` | Dynamic import ExcelJS |
| DatePicker | `src/components/ui/pickers/DatePicker.vue` | DD/MM/YYYY format |
| App Components | `src/components/ui/inputs/` | AppInput, AppSelect wrappers |
| Notifications | `src/composables/useSnackbar.ts` | Toast helpers |
| API Service | `src/services/threadService.ts` | fetchApi pattern |

## Multi-Agent / Swarm

Dùng team khi task ảnh hưởng ≥2 layers hoặc ≥8 tasks. **Chỉ Opus mới spawn teammates** — Sonnet không có swarm.

| Điều kiện | Mode |
|-----------|------|
| ≤ 7 tasks, 1 layer | Sonnet single agent |
| ≥ 8 tasks hoặc ≥ 2 layers | Opus swarm (TeamCreate + spawn teammates) |

| Agent | Nhiệm vụ | Conventions |
|-------|----------|-------------|
| db-agent | Migration, RPC functions | `.claude/skills/new-db/SKILL.md` |
| backend-agent | Hono routes, validation | `.claude/skills/new-be/SKILL.md` |
| frontend-agent | Vue pages, components, services | `.claude/skills/new-fe/SKILL.md` |

Xem `AGENTS.md` cho chi tiết swarm flow + teammate prompt template.

## Key Files

| Purpose | Location |
|---------|----------|
| API routes | `server/routes/` |
| Services | `src/services/` |
| Composables | `src/composables/` |
| Types | `src/types/` |
| Components | `src/components/` |
| Pages | `src/pages/` |
| Migrations | `supabase/migrations/` |
