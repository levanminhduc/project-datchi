## Issues Accepted & Fixed

### ISSUE-1 (Spec contradiction unfiltered vs filtered): ACCEPTED + FIXED
- `specs/warehouse-breakdown-rpc/spec.md` Requirement rewritten:
  - Split into 2 explicit paths: **unfiltered** (no `warehouse_id`) keeps `Promise.all(fn_warehouse_breakdown, fn_supplier_breakdown)`; **filtered** (`warehouse_id` provided) calls `fn_warehouse_breakdown` + re-derived supplier query (NOT `fn_supplier_breakdown`), MAY run concurrently via `Promise.all`.
  - "Parallel execution" scenario narrowed to unfiltered path explicitly.
  - "Response format unchanged" scenario clarified to apply both paths.

### ISSUE-2 (Supplier re-derivation semantic parity underspecified): ACCEPTED + FIXED
- `specs/warehouse-breakdown-rpc/spec.md` "Optional warehouse_id filter" scenario added explicit clause: re-derived `supplier_breakdown` SHALL preserve SAME aggregation semantics as `fn_supplier_breakdown` aside from warehouse scoping (same status set, same metrics, same `deleted_at IS NULL`, same color matching).
- `tasks.md` 2.4 expanded with concrete pinning derived from reading the RPC source (`supabase/migrations/20260321172100_add_color_id_to_breakdown_functions.sql`) AND the current route caller (`server/routes/inventory.ts:480-496`):
  - **Status filter:** EXACT `usableStatuses` array `['RECEIVED','INSPECTED','AVAILABLE','SOFT_ALLOCATED','HARD_ALLOCATED','RESERVED_FOR_ORDER']`
  - **Joins:** `LEFT JOIN lots → suppliers ls`, `JOIN thread_types tt`, `LEFT JOIN suppliers ts ON ts.id = tt.supplier_id`
  - **Group key:** `COALESCE(ls.id, ts.id)` (lot supplier priority, fallback thread_type supplier — exact RPC rule)
  - **Metrics:** `COUNT FILTER (NOT is_partial)`, `COUNT FILTER (is_partial)`, `SUM(quantity_meters) FILTER (is_partial)`
  - **Color matching:** `(p_color_id IS NULL OR ti.color_id = p_color_id)` — same logic
- `tasks.md` 2.5 verify case (b) explicit raw-SQL comparison; case (d) supplier across 2 warehouses; bonus check for COALESCE rule.
- `tasks.md` 2.6 code comment now mentions "MIRROR semantics fn_supplier_breakdown".

## Issues Disputed
None — both round-2 issues accepted as valid.

## Your Turn
Re-review using the same output format. Keep prior accepted points closed unless regression exists.
