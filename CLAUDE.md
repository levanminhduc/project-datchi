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

## SPX Subagent Auto-Spawn Rules

Khi dùng SPX workflow, **BẮT BUỘC** spawn các agent chuyên biệt thay vì tự làm:

### Agent Mapping theo SPX Phase

| SPX Phase | Agent | Khi nào spawn |
|-----------|-------|---------------|
| `/spx-plan` | `spx-researcher` | Cần research best practices, so sánh libraries, security advisories |
| `/spx-plan` | `spx-doc-lookup` | Cần tra cứu API docs cho library cụ thể (Vue, Quasar, Hono, Supabase...) |
| `/spx-plan` | `spx-plan-verifier` | Sau khi brainstorm xong, verify exploration coverage trước khi tạo artifacts |
| `/spx-ff` | `spx-uiux-designer` | Feature có UI mới cần design system, color, typography |
| `/spx-apply` | `spx-doc-lookup` | Implement code dùng API chưa quen |
| `/spx-apply-with-log` | `spx-log-analyzer` | Sau khi run app, phân tích log file cho memory leaks, flow completeness |
| `/spx-verify` | `spx-verifier` | Verify implementation matches artifacts (completeness, correctness, coherence) |

### Agent Details

| Agent | Model | Mục đích | Output |
|-------|-------|----------|--------|
| `spx-researcher` | sonnet | Web search cho technical info, best practices, comparisons | Research report với citations |
| `spx-doc-lookup` | sonnet | Tra official docs cho API/function signature, params, examples | Doc lookup result với code examples |
| `spx-uiux-designer` | sonnet | Scan codebase + research trends → design recommendations | Design report với color palette, typography, specs |
| `spx-plan-verifier` | **opus** | Verify exploration depth, detect conventions, find ambiguity | Verification report với coverage % |
| `spx-verifier` | sonnet | Verify implementation vs artifacts (tasks/specs/design) | Verification report với CRITICAL/WARNING/SUGGESTION |
| `spx-log-analyzer` | sonnet | Analyze runtime logs cho bugs, leaks, incomplete flows | Analysis report với evidence quotes |

### Spawn Patterns

**Trong `/spx-plan`:**
```
1. User request feature mới
2. Spawn `spx-researcher` nếu cần external research
3. Spawn `spx-doc-lookup` nếu cần library docs
4. Brainstorm solution
5. Spawn `spx-plan-verifier` để verify coverage
6. Nếu coverage < 90% → explore thêm theo recommendations
7. Tạo artifacts khi ready
```

**Trong `/spx-ff` với UI:**
```
1. Spawn `spx-uiux-designer` với product type, audience, mood
2. Nhận design report
3. Incorporate vào design.md
```

**Trong `/spx-apply`:**
```
1. Implement tasks
2. Spawn `spx-doc-lookup` khi cần API reference
3. Sau khi xong → spawn `spx-verifier` hoặc dùng `/spx-verify`
```

**Sau `/spx-apply-with-log`:**
```
1. App chạy và tạo log file
2. Spawn `spx-log-analyzer` với log path
3. Fix issues từ report
```

### Lưu ý quan trọng

- **`spx-plan-verifier` dùng Opus** — heavy verification cần model mạnh
- **Agents report only** — không modify files, chỉ trả findings
- **Always cite sources** — `spx-researcher` và `spx-doc-lookup` phải có URLs
- **Evidence-based** — `spx-log-analyzer` và `spx-verifier` phải quote actual content
- **Parallel khi có thể** — spawn `spx-researcher` + `spx-doc-lookup` cùng lúc nếu cần cả hai

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
