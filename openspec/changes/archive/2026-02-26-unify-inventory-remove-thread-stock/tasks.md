## 1. Database Migration — Data Migration Function

- [x] 1.1 Create migration file `supabase/migrations/20260227000001_unify_inventory_remove_thread_stock.sql`
- [x] 1.2 Implement `fn_stock_to_inventory()` SQL function: for each `thread_stock` record, create `lots` record + INSERT N `thread_inventory` cones (full + partial) with `cone_id='MIG-{stock_id}-{seq}'`, `status='AVAILABLE'`, `quantity_meters` from `thread_types.meters_per_cone` (full) or `meters_per_cone * fn_get_partial_cone_ratio()` (partial). Handle NULL lot_number as `MIG-LOT-{stock_id}`. Make idempotent (skip if MIG- cones already exist). Handle lot_number uniqueness: if `lots.lot_number` already exists (same lot_number used across multiple thread_stock records with different thread_type_id or warehouse_id), append `-{stock_id}` suffix to make unique. Preserve `received_date`, `expiry_date`, and `notes` from thread_stock → carry `received_date` and `expiry_date` to each cone, carry `notes` to `lots.notes`, carry `expiry_date` to `lots.expiry_date`.
- [x] 1.3 Add SQL verification assertions after migration: compare per-key (thread_type_id, warehouse_id) full and partial totals — SUM of qty_full_cones/qty_partial_cones from `thread_stock` grouped by (thread_type_id, warehouse_id) vs COUNT of migrated cones with `cone_id LIKE 'MIG-%'` grouped by (thread_type_id, warehouse_id, is_partial). Use `RAISE EXCEPTION` on any mismatch to abort migration. Also verify global totals as final cross-check.
- [x] 1.4 Call `SELECT fn_stock_to_inventory()` in migration to execute data migration ← (verify: cone count assertion passes, all thread_stock data preserved)

## 2. Database Migration — Recreate View (code-safe: no DROP TABLE yet)

- [x] 2.1 DROP VIEW `v_stock_summary` (depends on thread_stock — safe to drop since view is read-only)
- [x] 2.2 CREATE VIEW `v_stock_summary` aggregating from `thread_inventory`: JOIN thread_types + colors + warehouses, COUNT FILTER by is_partial, only count status IN ('AVAILABLE','RECEIVED','INSPECTED','SOFT_ALLOCATED','HARD_ALLOCATED'), include total_equivalent_cones using fn_get_partial_cone_ratio() ← (verify: v_stock_summary query returns correct data, matches old view column names)

## 3. Backend — Rewrite Delivery Receive

- [x] 3.1 Update `ReceiveDeliverySchema` in `server/routes/weeklyOrder.ts` (inline Zod schema) to add optional `expiry_date` field (z.string().optional())
- [x] 3.2 Rewrite `POST /api/weekly-orders/deliveries/:deliveryId/receive` in `server/routes/weeklyOrder.ts`: query `thread_types.meters_per_cone`, create `lots` record (with `supplier_id` from delivery), INSERT N `thread_inventory` cones with `cone_id='DLV-{timestamp}-{seq}'`, `status='AVAILABLE'`, `lot_id`, `lot_number`, `received_date`, `expiry_date`. Keep existing delivery status update logic unchanged. ← (verify: created cones visible to issuesV2.getStockAvailability(), realtime subscription fires on thread_inventory)

## 4. Backend — Rewrite Stock APIs

- [x] 4.1 Rewrite `GET /api/stock` in `server/routes/stock.ts`: query `thread_inventory` aggregated by (thread_type_id, warehouse_id, lot_number) WHERE status IN active statuses, COUNT is_partial for qty_full/qty_partial. Preserve response shape.
- [x] 4.2 Rewrite `GET /api/stock/summary` in `server/routes/stock.ts`: aggregate from `thread_inventory` by thread_type_id, COUNT full/partial cones WHERE status IN ('AVAILABLE','RECEIVED','INSPECTED'). Preserve response shape.
- [x] 4.3 Rewrite `POST /api/stock/deduct` in `server/routes/stock.ts`: use FEFO pattern from issuesV2.ts — SELECT cones ORDER BY expiry_date ASC NULLS LAST, received_date ASC, LIMIT N; UPDATE status='HARD_ALLOCATED'. Return `deducted_from` array grouped by lot_number.
- [x] 4.4 Rewrite `POST /api/stock/return` in `server/routes/stock.ts`: create new `thread_inventory` cones with `cone_id='RTN-{timestamp}-{seq}'`, `status='AVAILABLE'`. Create or find `lots` record. Preserve response shape. ← (verify: all 4 stock endpoints work end-to-end, response shapes unchanged from frontend perspective)

## 5. Backend — Cleanup Types and Interfaces

- [x] 5.1 Remove `StockRow` interface from `server/routes/stock.ts` (no longer maps to thread_stock table)
- [x] 5.2 Update `DeductionResult` interface if needed to reflect lot-grouped response from thread_inventory

## 6. Frontend — Update Types and Delivery Receive Contract

- [x] 6.1 Update `src/types/thread/stock.ts`: remove `ThreadStockRow` (no longer maps to thread_stock), keep `ThreadStockSummary`, `AddStockDTO`, `DeductStockDTO`, `ReturnStockDTO` (API contract unchanged). Update `DeductStockResponse` if response shape changes.
- [x] 6.2 Update `ReceiveDeliveryDTO` type (if exists in `src/types/thread/weeklyOrder.ts`) to add optional `expiry_date?: string` field
- [x] 6.3 Update delivery receive service/dialog in `src/pages/thread/weekly-order/deliveries.vue` to include optional `expiry_date` input field and handle updated response shape (cone_ids array)
- [x] 6.4 Verify `src/services/stockService.ts` methods still work with new response shapes (should require no changes if API contract preserved) ← (verify: frontend inventory page, issues V2 page, weekly order deliveries tab all function correctly)

## 7. Database Migration — Drop thread_stock (AFTER code deployed)

- [ ] 7.1 Re-run `fn_stock_to_inventory()` to catch any delta writes to `thread_stock` that occurred between Phase 1 migration and Phase 2 code cutover. The function is idempotent — it skips already-migrated records.
- [ ] 7.2 Re-run per-key verification assertions (same as Task 1.3) to confirm delta sync is complete.
- [ ] 7.3 Create separate migration file `supabase/migrations/20260227000002_drop_thread_stock.sql` that: DROP FUNCTION `fn_migrate_inventory_to_stock()`, DROP FUNCTION `fn_stock_to_inventory()`, DROP TABLE `thread_stock` CASCADE. This runs AFTER backend code no longer references thread_stock AND delta sync confirmed. ← (verify: no remaining code references to thread_stock table before running this migration)

## 8. Verification

- [ ] 8.1 Verify Issue V2 can see and deduct stock received via Delivery Receive (the core bug fix)
- [ ] 8.2 Verify Weekly Order enrichment counts delivery-received stock correctly
- [ ] 8.3 Verify Cone Summary (inventory page) shows delivery-received cones
- [ ] 8.4 Verify realtime subscriptions fire when delivery receive creates cones ← (verify: complete end-to-end flow — delivery receive → cone visible in inventory page → Issue V2 can deduct → recovery works on deducted cone)
