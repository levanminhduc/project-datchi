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

**Key principle:** Frontend NEVER calls Supabase directly. Always through Hono API.

## Schema Overview

- **39 tables**, 2 views, 20 functions, 30 enums
- **Key domains:** Thread Master Data, Inventory (dual UoM: kg + meters), Allocations (FEFO), Recovery, Batch operations, Weekly ordering, Reports, HR/Auth

## Conventions

### Database
- Tables: `snake_case` with `created_at`, `updated_at`, `deleted_at` (soft delete)
- Views: `v_` prefix, Functions: `fn_` prefix
- Enums: ALL UPPERCASE values (e.g., 'PENDING', 'ACTIVE', not 'pending')
- All migrations in `supabase/migrations/`

### API (Hono)
- Response format: `{ success, data?, error?, message? }`
- Use `fetchApi()` wrapper, never raw `fetch()`
- Validation with Zod schemas

### Frontend
- Use `AppInput`, `AppSelect`, `AppBtn` (not raw `q-*` components)
- Use `useSnackbar()` for toasts: `snackbar.success()`, `snackbar.error()`
- DatePicker with `DD/MM/YYYY` format (not native date input)
- Excel export with ExcelJS (not CSV)

## Anti-patterns

| Don't | Do Instead |
|-------|------------|
| `<input type="date">` | `<DatePicker>` component |
| CSV export | XLSX with ExcelJS |
| `fetch()` directly | `fetchApi()` wrapper |
| Supabase from frontend | API call through Hono |
| `q-input`, `q-select` | `AppInput`, `AppSelect` |
| Hardcode Vietnamese in logic | Use constants/i18n |

## Pattern References

| Pattern | Example File | Notes |
|---------|--------------|-------|
| Excel Export | `src/composables/useReports.ts` | Dynamic import ExcelJS |
| DatePicker | `src/components/ui/pickers/DatePicker.vue` | DD/MM/YYYY format |
| App Components | `src/components/ui/inputs/` | AppInput, AppSelect wrappers |
| Notifications | `src/composables/useSnackbar.ts` | Toast helpers |
| API Service | `src/services/threadService.ts` | fetchApi pattern |

## Multi-Agent (khi cần)

Dùng team khi task ảnh hưởng ≥3 layers (DB + Backend + Frontend).

| Agent | Nhiệm vụ |
|-------|----------|
| db-agent | Migration, RPC functions |
| backend-agent | Hono routes, validation |
| frontend-agent | Vue pages, components, services |

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
