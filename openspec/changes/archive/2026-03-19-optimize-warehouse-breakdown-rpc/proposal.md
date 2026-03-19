## Why

Warehouse breakdown dialog (`/summary/by-cone/:threadTypeId/warehouses`) fetches ALL individual cones (2000+ rows × 3 JOINs) then aggregates in Node.js loop. With 20,000 cones, this causes 500-2000ms response time and ~200KB network transfer. Replacing with PostgreSQL aggregate functions reduces to ~20-50ms and ~1KB.

## What Changes

- Add `fn_warehouse_breakdown(p_thread_type_id)` — SQL function aggregating cones by warehouse
- Add `fn_supplier_breakdown(p_thread_type_id)` — SQL function aggregating cones by supplier (COALESCE lot/type supplier)
- Refactor BE route to call 2 RPC functions in parallel via `Promise.all` instead of fetching raw rows + JS loop
- Remove ~80 lines of client-side aggregation code, replace with ~20 lines of RPC calls
- API response format unchanged — FE has zero changes

## Capabilities

### New Capabilities
- `warehouse-breakdown-rpc`: PostgreSQL aggregate functions for warehouse/supplier breakdown, replacing client-side aggregation

### Modified Capabilities

## Impact

- `supabase/migrations/` — 1 new migration file (2 functions)
- `server/routes/inventory.ts` — edit route `/summary/by-cone/:threadTypeId/warehouses`
- Frontend — NO changes (same API contract)
- Existing index `idx_thread_inventory_summary(thread_type_id, status, is_partial)` already supports the query pattern
