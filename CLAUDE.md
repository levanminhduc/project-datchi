# CLAUDE.md

## Role

Senior developer. ALWAYS rephrase/clarify requirements → ask for confirmation before implementing. 
When asked about the codebase, project structure, or to find code, always use the augment-context-engine MCP tool (codebase-retrieval) in the root workspace first before reading individual files. Use codebase-retrieval instead of the Explore subagent for codebase exploration and search tasks.
## Project Context

**Thread Inventory Management System** — Vietnamese B2B app for garment industry.

**Stack:** Vue 3 + Quasar 2 + TypeScript 5.9 + Vite 8 | Hono 4 (Node.js) | Supabase (PostgreSQL) + Zod 4

**Domains:** Thread master data, Inventory (kg + meters), Allocations (FEFO), Weekly ordering, Delivery, Issue V2, Reports, Dashboard, HR/Auth (RBAC), Purchase Orders, Notifications (Telegram/Email)

## UI Language

All user-facing text MUST be in **Vietnamese**:
- Success/error messages: `"Lưu thành công"`, `"Không tìm thấy dữ liệu"`
- Validation messages: `"Vui lòng nhập tên"`, `"Số lượng phải lớn hơn 0"`
- Button labels, form labels, table headers
- Toast/snackbar notifications

Code comments and variable names remain in English.

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `server/routes/` | Hono API endpoints |
| `server/middleware/` | Auth, validation middleware |
| `server/validation/` | Zod schemas |
| `src/pages/` | Vue pages (file-based routing) |
| `src/composables/` | Vue composables (business logic) |
| `src/services/` | API service layer (`fetchApi` calls) |
| `src/components/ui/` | Reusable UI components (App*) |
| `src/components/thread/` | Domain-specific components |
| `supabase/migrations/` | Database migrations |

## CRITICAL SAFETY RULES

| Command | Consequence | Requirement |
|---------|-------------|-------------|
| `supabase db reset` | **DELETES ALL DATA** | NEVER run |
| `DROP TABLE`, `TRUNCATE` | Data loss | Ask user first |
| `git push -f` | Lost history | Ask user first |

## Business Rules (Domain-Critical)

### Thread Type Identity — 1 Thread Type = Unique (Supplier + Tex + Color)

**Logical identifier:** `supplier_id + tex_number + color_id`

- Same tex + color but **different supplier** → **different `thread_type_id`** → separate inventory
- Same supplier + tex but **different color** (e.g., C9700 vs C9701) → **MUST be 2 separate rows**, NEVER merge
- Display format: `"Supplier - TEX xxx - Color"` (e.g., `Coats Epic - TEX Tex 24 - C9700`)

### ⚠️ CRITICAL: `color_id` source depends on context (DO NOT mix up)

**`thread_types.color_id` IS CURRENTLY NULL FOR ALL RECORDS** — DO NOT use this column to determine color.

| Context | Correct Table/Column | Notes |
|---------|----------------------|-------|
| **Inventory** | `thread_inventory.color_id` | Each cone in stock has actual color |
| **PO/Style calculation** | `style_color_thread_specs.thread_color_id` | Spec defines thread color for style+color |
| **Aggregation key** | `${thread_type_id}_${thread_color_id}` (number) | DO NOT use `thread_color` (string) — causes wrong merge when duplicate/NULL |
| **❌ NEVER use** | `thread_types.color_id` | All NULL → all colors merge into 1 key |

**Correct aggregation pattern:**
```typescript
const key = `${thread_type_id}_${thread_color_id ?? ''}`  // ✅ ID number
const key = `${thread_type_id}_${thread_color ?? ''}`     // ❌ string name → wrong merge
```

**When adding new endpoint/composable with color aggregation:**
1. Get `thread_color_id` from correct source per context (see table above)
2. Use `??` (nullish) instead of `||` to keep `0` as valid ID
3. Keep `thread_color` (string name) only for **display**, not as key

## Architecture

```
Supabase (PostgreSQL) → Hono API (server/) → Vite proxy → fetchApi() → composables → pages → App* components
```

- Frontend NEVER calls Supabase directly for CRUD → always through Hono API
- Exception: Realtime subscriptions use Supabase client directly
- Auth: Supabase Auth → `fetchApi()` attaches Bearer → `authMiddleware` verifies JWT

## Karpathy Rules

### Surgical Changes
Only modify the exact lines requested. Do not reformat/refactor adjacent code.

### Goal-Driven Execution
"Fix bug" → "Write failing test → fix code → verify test passes". Do not claim "fixed" without evidence.

## Anti-patterns

**Strict (NEVER do):**

| Don't | Do Instead |
|-------|------------|
| `<input type="date">` | `<DatePicker>` |
| `fetch('/api/...')` | `fetchApi()` (exception: offline queue replay, SSE streaming, version check) |
| `q-select`, `q-editor` | `AppSelect`, `AppEditor` |
| `$q.dialog()` | `useConfirm()` |
| `as any` / `@ts-ignore` | Fix types (exception: Web Serial / Supabase internal types) |
| `createFoo(formData)` reactive | Spread: `createFoo({ ...formData })` |
| Supabase `.select()` without `.limit()` | Add `.limit(N)` / `.single()` / `.maybeSingle()` |
| Query N+1 | Batch: `.in('id', ids)` / RPC / view |

**Either acceptable (context-dependent — see `frontend-conventions.md`):**

| Quasar | Wrapper | Use raw when |
|--------|---------|--------------|
| `q-input` | `AppInput` | Search field with icon slot |
| `q-btn` | `AppButton` | Inline actions |
| `q-table` | `DataTable` | Simple tables, no advanced filtering |

## Conventions

- **DB:** `snake_case`, soft delete (`deleted_at` HOẶC `status` enum cho lifecycle tables). See `db-conventions.md`
- **API:** `{ data, error: string | null, message? }`. See `api-conventions.md`
- **Frontend:** App* wrappers (strict for `q-select`/`q-editor`/`$q.dialog`/`DatePicker`); `q-input`/`q-btn`/`q-table` either acceptable. See `frontend-conventions.md`
- **Rotating input placeholder:** For AppInput rotating helper text, use `.claude/skills/hieu-ung-nhay-chu-input/SKILL.md` when present. Key rules: render an overlay span after `AppInput`, set `hide-bottom-space`, keep `aria-label`, hide while focused or when value length > 0, center against `.q-field__control`, and verify with browser.
- **Files:** Composables/services/utils max 200 lines. UI components max 300. Pages/routes max 500 (soft) — >800 cần lý do.
- **Naming:** kebab-case preferred for new files. Existing camelCase files (`purchaseOrders.ts`, `useInventory.ts`) không rename — chỉ áp dụng cho file mới.

## Rules & References

Auto-load from `.claude/rules/`:
- `development-rules.md` — Code patterns, Karpathy rules, pre-commit checklist
- `anti-patterns-examples.md` — Before/after diffs (TypeScript/Vue)
- `project-reference.md` — Pattern references, key files, commands
- `primary-workflow.md` — Before/during/after code flow
- `orchestration-protocol.md` — When to spawn subagents
- `osf-workflow.md` — OpenSpec workflow
- `notification-system.md` — Notification architecture
- `large-dataset-pattern.md` — Pagination patterns
- `security-rules.md` — RLS, JWT custom claims, permission naming
- `server-patterns.md` — RPC, idempotency log, file upload patterns

## Python Scripts

Windows: `.claude\skills\.venv\Scripts\python.exe` | Linux/macOS: `.claude/skills/.venv/bin/python3`
