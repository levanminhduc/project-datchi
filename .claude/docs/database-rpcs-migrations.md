---
description: DB conventions, migration rules, RPC catalog, query patterns
---

# Database, RPCs & Migrations

## Naming Conventions

- Tables: `snake_case`
- Views: `v_` prefix (`v_cone_summary`)
- Functions/RPCs: `fn_` prefix (`fn_dept_allocate`)
- Enums: ALL UPPERCASE (`'PENDING'`, `'ACTIVE'`, `'AVAILABLE'`)
- Migrations: `{timestamp}_{action}_{table}.sql`

## Required Columns

Every table needs:
- `created_at TIMESTAMPTZ DEFAULT now()`
- `updated_at TIMESTAMPTZ DEFAULT now()`

Soft delete — choose one pattern:
- `deleted_at TIMESTAMPTZ` — master data (thread_types, styles, employees, suppliers, colors)
- `status` enum — lifecycle tables (thread_inventory, thread_allocations, lots)
- None — log/audit tables (thread_audit_log, issue_operations_log)

## Migration Rules

```bash
psql -h 127.0.0.1 -p 5432 -U postgres -d datchi   # Connect to DB
\d table_name                                       # Check schema before writing queries
```

Migration files live in `supabase/migrations/`. Apply with standard psql or migration tooling.

**NEVER run destructive commands** (`DROP TABLE`, `TRUNCATE`, `DELETE FROM`) without explicit user confirmation.

After creating a new table or function:
```sql
-- No PostgREST cache to worry about anymore — direct SQL access
```

## Key RPCs (~70 total, prefix fn_*)

| RPC | Purpose |
|-----|---------|
| `fn_cone_summary_filtered` | Pre-aggregated cone summary with dynamic WHERE |
| `fn_dept_allocate` | Atomic FEFO department allocation |
| `fn_receive_delivery` | Atomic receive delivery + create cones |
| `fn_issue_cones_with_movements` | Atomic issue + movement log |
| `fn_batch_borrow_thread` | Batch loan creation |
| `fn_reserve_from_stock` | Reserve cones for weekly order |
| `fn_get_tex_options_by_supplier` | Dropdown: tex options per supplier |
| `fn_get_supplier_unique_tex` | Dropdown: unique tex per supplier |

### When to use RPC vs direct query

| Situation | Use |
|-----------|-----|
| Multi-step atomic (lock + update + insert + log) | RPC (PostgreSQL function) |
| Business logic crossing multiple tables | RPC |
| Dynamic WHERE + large pre-aggregation | RPC |
| Simple single-table CRUD | Direct SQL via `query()` or `SqlBuilder` |
| Batch fetch by IDs | `WHERE id = ANY($1::int[])` |

### RPC call pattern

```typescript
import { query } from '../db/query'

const rows = await query<ConeSummary>(
  'SELECT * FROM fn_cone_summary_filtered($1, $2)',
  [warehouseId, supplierId]
)
```

## Query Patterns

```typescript
import { query, queryOne, queryCount } from '../db/query'
import { SqlBuilder } from '../db/sql-builder'

// Pagination
const rows = await query<T>('SELECT * FROM table ORDER BY id LIMIT $1 OFFSET $2', [limit, offset])
const total = await queryCount('SELECT COUNT(*) as count FROM table WHERE ...')

// Single record
const row = await queryOne<T>('SELECT * FROM table WHERE id = $1', [id])

// Batch fetch — no N+1
const rows = await query<T>('SELECT * FROM table WHERE id = ANY($1::int[])', [ids])

// SqlBuilder — fluent dynamic queries
const builder = new SqlBuilder('thread_inventory')
  .select('*')
  .eq('status', 'AVAILABLE')
  .isNull('deleted_at')
  .order({ column: 'created_at', ascending: false })
  .limit(25)
  .offset(0)
const { sql, params } = builder.build()
```

## Idempotency Log

Table: `issue_operations_log`

Use for endpoints with side effects (create movements, update inventory) that can be retried:

```typescript
const idempotencyKey = c.req.header('Idempotency-Key') || crypto.randomUUID()
const existing = await queryOne(
  'SELECT id, response_json FROM issue_operations_log WHERE idempotency_key = $1',
  [idempotencyKey]
)
if (existing) return c.json(existing.response_json)
// ... process ...
await query(
  'INSERT INTO issue_operations_log (idempotency_key, response_json) VALUES ($1, $2)',
  [idempotencyKey, JSON.stringify(result)]
)
```

## Enums in Code

See `src/types/thread/enums.ts` for TypeScript enums mirroring DB enums:
`ConeStatus`, `AllocationStatus`, `MovementType`, `RecoveryStatus`, `POStatus`, `OrderWeekStatus`, `DeliveryStatus`
