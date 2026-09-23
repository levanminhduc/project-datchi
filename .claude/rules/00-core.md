# Core Rules (always loaded)

These rules are binding for every task in this repository. Path-scoped rules in this directory add layer-specific detail; `.claude/docs/` holds extended reference material.

## Data Safety (absolute)

- **NEVER delete data rows.** Only `UPDATE`/`INSERT`. Soft-delete via `deleted_at` or status enum.
- `DELETE FROM`, `TRUNCATE`, `DROP TABLE/DATABASE/SCHEMA` — forbidden without explicit user confirmation (a PreToolUse hook also gates these).
- **NEVER run `supabase db reset`** — it wipes all data. Use migrations to change schema.
- `git push -f` / `--force` — ask user first.

## Thread Domain Invariants

- **1 thread type = Supplier (NCC) + Tex number + Thread color.** Never merge inventory across this boundary. Different supplier or different color = separate thread type, separate inventory.
- **`thread_types.color_id` is NULL for all records** — never use it as a color source. Use `thread_inventory.color_id` for stock, `style_color_thread_specs.thread_color_id` for PO specs.
- **Audit trail:** every stock-changing action (issue, receive, return, transfer, allocate) must log to `thread_movements` or use an RPC that logs internally. Never mutate inventory without a movement record.
- **Dual UoM:** every movement must update both `quantity_meters` and `weight_grams`.

## Schema Changes

- Migrations only: new tables, enums, columns → create a `.sql` file in `supabase/migrations/` named `{timestamp}_{action}_{table}.sql`. Never `ALTER` the live DB ad-hoc.

## Language

- **All user-facing text in Vietnamese** — messages, labels, toasts, validation, buttons (`"Lưu thành công"`, `"Vui lòng nhập tên"`).
- Code identifiers and dev logs in English.
- **No code comments** — code must be self-explanatory.

## Pre-Code Checklist

Before writing any code:

1. **Read the file you'll modify** — understand current patterns, imports, route order.
2. **Check DB schema** — `\d table_name` via psql or read migration files; never guess column names (e.g. `thread_types` has `name`/`code`, NOT `thread_name`/`thread_code`).
3. **Hono route order** — specific routes before generic (`/:id/action` before `/:id`); Hono matches by registration order.
4. **Confirm requirements** — rephrase the request and ask the user to confirm before starting.

## Surgical Changes

Only modify the exact lines the request requires. Do NOT reformat adjacent code, add unrelated type annotations, refactor unmentioned components, or "improve" imports/names in passing. Self-test: any diff line that doesn't trace to the request is a violation.

## Pre-Commit

```bash
npm run lint          # ESLint --fix
npm run type-check    # vue-tsc --build --force
```

- Commit format: `feat:` / `fix:` / `refactor:` / `chore:` — message in Vietnamese is fine.
- Never commit `.env`, API keys, credentials, `JWT_SIGNING_SECRET`.
- Commit/push only when the user asks.
