## 1. Database Migration

- [x] 1.1 Create migration file with `fn_warehouse_breakdown(p_thread_type_id, p_statuses)` — GROUP BY warehouse_id, JOIN warehouses, string_agg(DISTINCT location)
- [x] 1.2 Add `fn_supplier_breakdown(p_thread_type_id, p_statuses)` in same migration — COALESCE(lot.supplier, type.supplier), GROUP BY effective supplier
- [x] 1.3 Add `NOTIFY pgrst, 'reload schema'` at end of migration

## 2. Backend Route Refactor

- [x] 2.1 Refactor route `/summary/by-cone/:threadTypeId/warehouses` in `server/routes/inventory.ts` — replace fetch-all + for-loop with `Promise.all([rpc('fn_warehouse_breakdown'), rpc('fn_supplier_breakdown')])`
- [x] 2.2 Map RPC results to existing response format `{ data: ConeWarehouseBreakdown[], supplier_breakdown: SupplierBreakdown[] }`

## 3. Verification

- [x] 3.1 Type-check: `npm run type-check`
- [x] 3.2 Lint: `npm run lint`
- [x] 3.3 Manual test: click summary row → verify breakdown dialog loads fast with correct data
