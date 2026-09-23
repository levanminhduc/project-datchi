---
paths:
  - "supabase/**"
  - "server/db/**"
---

# Database & Migration Rules

## Naming

- Tables: `snake_case` · Views: `v_` prefix · Functions/RPCs: `fn_` prefix
- Enum values: ALL UPPERCASE (`'PENDING'`, `'AVAILABLE'`)
- Migrations: `supabase/migrations/{timestamp}_{action}_{table}.sql`

## Required Columns (every new table)

- `created_at TIMESTAMPTZ DEFAULT now()`
- `updated_at TIMESTAMPTZ DEFAULT now()`
- Soft delete — pick one: `deleted_at TIMESTAMPTZ` (master data), `status` enum (lifecycle tables), none (log/audit tables).

## Migration Rules

- Schema changes ONLY via migration files — never ad-hoc DDL on the live DB.
- Migrations must be additive: no `DROP TABLE`/`TRUNCATE`/`DELETE FROM` without explicit user confirmation.
- Check current schema before writing: `PGPASSWORD=postgres psql -h 127.0.0.1 -p 5432 -U postgres -d datchi -c "\d table_name"`.
- Never drop `colors_name_key` (UNIQUE on `colors.name`) — `fn_receive_delivery` reverse-looks-up `color_id` via it.

## RPC vs Direct Query

| Situation | Use |
|-----------|-----|
| Multi-step atomic (lock + update + insert + log) | RPC (`fn_*`) |
| Business logic across multiple tables | RPC |
| Dynamic WHERE + heavy pre-aggregation | RPC |
| Simple single-table CRUD | `query()` / `SqlBuilder` |

Key RPCs: `fn_dept_allocate` (FEFO allocation), `fn_receive_delivery`, `fn_issue_cones_with_movements`, `fn_reserve_from_stock`, `fn_batch_borrow_thread`, `fn_cone_summary_filtered`.

Call pattern:

```typescript
const rows = await query<T>('SELECT * FROM fn_cone_summary_filtered($1, $2)', [warehouseId, supplierId])
```

## Enums in Code

TypeScript enums mirror DB enums in `src/types/thread/enums.ts`: `ConeStatus`, `AllocationStatus`, `MovementType`, `RecoveryStatus`, `POStatus`, `OrderWeekStatus`, `DeliveryStatus`. Adding a DB enum value requires updating the TS enum too.
