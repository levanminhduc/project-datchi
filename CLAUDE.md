# CLAUDE.md

## Role & Responsibilities

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
- `fetchApi()` gets token from Supabase session and auto-refreshes on 401 using single-flight pattern
- Token refresh: `getRefreshedSession()` in `api.ts` — handles concurrent 401s with single refresh request
- Auth errors trigger centralized logout via `isLoggingOut` flag (no multiple toasts/redirects)
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
| API routes | `server/routes/` |
| Services | `src/services/` |
| Composables | `src/composables/` |
| Types | `src/types/` |
| Components | `src/components/` |
| Pages | `src/pages/` |
| Migrations | `supabase/migrations/` |

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
