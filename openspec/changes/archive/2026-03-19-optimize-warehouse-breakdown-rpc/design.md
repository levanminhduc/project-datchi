## Context

Route `/api/inventory/summary/by-cone/:threadTypeId/warehouses` fetches ALL individual cones for a thread type (up to 2000+ rows with 3 nested JOINs), then aggregates in a Node.js for-loop to build warehouse breakdown and supplier breakdown maps. This is the slowest endpoint on the inventory page.

Existing pattern: `fn_cone_summary_filtered` already does DB-level aggregation for the summary tab. We apply the same pattern here.

Existing index `idx_thread_inventory_summary(thread_type_id, status, is_partial)` supports the query.

## Goals / Non-Goals

**Goals:**
- Replace client-side aggregation with 2 PostgreSQL RPC functions
- Reduce response time from 500-2000ms to 20-50ms
- Maintain exact same API response format (zero FE changes)
- Call both functions in parallel via `Promise.all`

**Non-Goals:**
- Changing the dialog UI or adding new data to the breakdown
- Optimizing the summary tab query (already uses `v_cone_summary`)
- Adding caching or materialized views
- Changing the FE composable or service layer

## Decisions

### 1. Two separate functions vs one combined function
**Decision:** Two functions (`fn_warehouse_breakdown`, `fn_supplier_breakdown`)
**Rationale:** PostgreSQL cannot return 2 different table shapes from 1 function. JSON return adds parsing complexity. Two functions are clean, testable, and run in parallel with no latency penalty.
**Alternative:** Single function returning JSON `{ warehouses: [...], suppliers: [...] }` — rejected due to added complexity and harder testing.

### 2. Supplier resolution via COALESCE
**Decision:** `COALESCE(lot_supplier.id, type_supplier.id)` in SQL
**Rationale:** Matches existing JS logic: `const supplier = lotSupplier || typeSupplier`. Moving this to SQL eliminates the need to transfer raw cone data.

### 3. Location field handling
**Decision:** `string_agg(DISTINCT location, ', ')` grouped by warehouse
**Rationale:** Current code takes random last-written location per warehouse (incorrect). Aggregating distinct locations gives complete picture. NULL locations are excluded by PostgreSQL automatically.

### 4. Statuses parameter
**Decision:** Default array in function signature, overridable from BE
**Rationale:** Matches `fn_cone_summary_filtered` pattern. Default covers common case, BE code stays minimal.

## Risks / Trade-offs

- [Scanning same rows twice] → Negligible cost; index scan is fast, GROUP BY is the expensive part and it's different for each function. Parallel execution makes total time = max(fn1, fn2).
- [Schema reload needed] → Run `NOTIFY pgrst, 'reload schema'` at end of migration to ensure PostgREST picks up new functions.
- [Migration on production] → `CREATE FUNCTION` is non-destructive, no data changes, instant rollback via `DROP FUNCTION`.
