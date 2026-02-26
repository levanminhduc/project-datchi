## Context

The Dat Chi Thread Inventory System currently maintains two parallel inventory tables:

- **`thread_inventory`** (V1): Individual cone tracking with barcode, 11-status lifecycle, FEFO index, dual UoM (cones + meters), audit trail, realtime subscriptions. Used by Issue V2, Weekly Order enrichment, Allocation, Recovery, Cone Summary.
- **`thread_stock`** (V2): Aggregate quantity tracking per (thread_type_id, warehouse_id, lot_number). No barcode, no status, no FEFO, no audit. Used only by Delivery Receive and `/api/stock` deduct/return endpoints.

The critical problem: Delivery Receive writes to `thread_stock`, but all outbound flows (Issue V2, Weekly Order, Allocation) read from `thread_inventory`. This means delivery-received stock is invisible to the deduction system.

**Current routing:**
- `POST /api/stock` (manual entry) → `thread_inventory` cones
- `POST /weekly-orders/deliveries/:id/receive` → `thread_stock` aggregate
- `POST /api/stock/deduct` → UPDATE `thread_stock` qty
- `POST /api/stock/return` → UPDATE/INSERT `thread_stock`
- Issue V2 deductStock → UPDATE `thread_inventory` status
- Issue V2 getStockAvailability → SELECT `thread_inventory` WHERE status='AVAILABLE'

## Goals / Non-Goals

**Goals:**
- Eliminate `thread_stock` table entirely — single source of truth in `thread_inventory`
- Delivery Receive creates individual cones in `thread_inventory` + `lots` record (matching manual entry pattern)
- Stock deduct/return APIs operate on `thread_inventory` using FEFO (matching Issue V2 pattern)
- `v_stock_summary` view recreated from `thread_inventory`
- Migrate existing `thread_stock` data to `thread_inventory` cones before dropping table
- All realtime subscriptions work for delivery-received stock (already subscribe to `thread_inventory`)

**Non-Goals:**
- Changing Issue V2, Recovery, Allocation, or Cone Summary logic (already correct)
- Adding `supplier_id` column to `thread_inventory` (separate concern)
- Modifying `thread_order_items` to add `thread_type_id` FK (separate concern)
- Changing frontend UI layout or adding new pages

## Decisions

### D1: Unify on `thread_inventory` (not `thread_stock`)

**Choice:** Keep `thread_inventory`, remove `thread_stock`.

**Rationale:** `thread_inventory` is a superset — it supports everything `thread_stock` does plus barcode tracking, FEFO, status lifecycle, recovery, audit trail, and realtime subscriptions. All downstream consumers (Issue V2, Weekly Order, Allocation, Recovery) already read from `thread_inventory`. Switching them to `thread_stock` would require massive rewrites and lose functionality.

**Alternatives considered:**
- Keep both tables with sync trigger → adds complexity, dual-write risks, no single source of truth
- Keep `thread_stock`, migrate everything to it → would lose individual cone tracking, FEFO, status lifecycle, recovery capability

### D2: Delivery Receive creates individual cones (not aggregate)

**Choice:** Delivery Receive follows exact same pattern as `POST /api/stock` manual entry — create `lots` record then insert N individual `thread_inventory` cones.

**Rationale:** Consistent with manual entry pattern. Cones immediately visible to Issue V2, Weekly Order enrichment, realtime subscriptions. Each cone gets a barcode for warehouse tracking.

**Trade-off:** Receiving 100 cones creates 100 DB rows instead of 1. Acceptable — `POST /api/stock` already does this for manual entry without performance issues. Batch INSERT handles it efficiently.

### D3: Stock deduct/return reuse FEFO pattern from Issue V2

**Choice:** `POST /api/stock/deduct` will SELECT individual cones ordered by FEFO, then UPDATE status to `HARD_ALLOCATED` (same as `issuesV2.ts deductStock()`). `POST /api/stock/return` will INSERT new cones with `status = 'AVAILABLE'`.

**Rationale:** Single deduction pattern across all flows. Existing FEFO index `idx_thread_inventory_fefo` already optimized for this.

**Alternative considered:** Extract shared `deductStock` helper used by both stock.ts and issuesV2.ts → good idea but adds coupling. Keep duplicated for now; extract as future refactor if needed.

### D4: Data migration with `fn_stock_to_inventory()` SQL function

**Choice:** Create a SQL function that converts each `thread_stock` record into `lots` + N `thread_inventory` cones. Run as part of migration before dropping `thread_stock`.

**Rationale:** Must preserve existing inventory data. SQL function is atomic and can be verified before dropping table.

**Logic:**
- For each `thread_stock` record: create `lots` (lot_number, thread_type_id, warehouse_id, expiry_date)
- INSERT `qty_full_cones` cones with `is_partial=false`, `status='AVAILABLE'`
- INSERT `qty_partial_cones` cones with `is_partial=true`, `status='AVAILABLE'`
- `cone_id` generated as `MIG-{thread_stock.id}-{seq}` for traceability
- `quantity_meters` from `thread_types.meters_per_cone` (full) or `meters_per_cone * partial_cone_ratio` (partial)

### D5: Recreate `v_stock_summary` from `thread_inventory`

**Choice:** DROP and recreate `v_stock_summary` view to aggregate from `thread_inventory` instead of `thread_stock`.

**SQL pattern:**
```sql
SELECT thread_type_id, warehouse_id,
  COUNT(*) FILTER (WHERE NOT is_partial AND status IN ('AVAILABLE','RECEIVED','INSPECTED','SOFT_ALLOCATED','HARD_ALLOCATED')) AS total_full_cones,
  COUNT(*) FILTER (WHERE is_partial AND status IN ('AVAILABLE','RECEIVED','INSPECTED','SOFT_ALLOCATED','HARD_ALLOCATED')) AS total_partial_cones
FROM thread_inventory
GROUP BY thread_type_id, warehouse_id
```

### D6: API response shapes preserved

**Choice:** Keep same response structure for `GET /api/stock`, `GET /api/stock/summary`, `POST /api/stock/deduct`, `POST /api/stock/return`. Internal implementation changes, but API contract stays the same.

**Rationale:** No frontend breaking changes. `stockService.ts` methods continue to work without modification.

## Risks / Trade-offs

| Risk | Severity | Mitigation |
|------|----------|------------|
| Data loss during migration | High | `fn_stock_to_inventory()` runs BEFORE `DROP TABLE`. Verify cone count matches `thread_stock` totals. Migration is idempotent (uses `cone_id` with `MIG-` prefix to avoid duplicates). |
| Performance: more rows in `thread_inventory` | Low | Existing FEFO indexes handle queries efficiently. `POST /api/stock/summary` aggregation adds minimal overhead. |
| Delivery Receive slower (N inserts vs 1) | Low | Batch INSERT is fast. Manual entry already creates N cones without issues. Typical delivery is 10-50 cones. |
| `POST /api/stock/deduct` response shape changes | Medium | Keep `deducted_from` array in response. Each entry maps to a lot. Frontend contract unchanged. |
| Concurrent deduction race conditions | Medium | Same risk as current Issue V2 — FEFO SELECT + UPDATE is not atomic. Acceptable for current traffic volume. |

## Migration Plan

**Order of operations (phased for zero-downtime):**

**Phase 1 — Migrate data + recreate view (Migration 1):**
1. Run `fn_stock_to_inventory()` — creates cones in `thread_inventory` for all `thread_stock` data
2. Verify with SQL assertions: total full/partial cones match. RAISE EXCEPTION on mismatch to abort.
3. DROP VIEW `v_stock_summary`
4. CREATE VIEW `v_stock_summary` (from `thread_inventory`)

**Phase 2 — Deploy updated backend routes:**
5. Deploy updated `stock.ts` (reads `thread_inventory` instead of `thread_stock`)
6. Deploy updated `weeklyOrder.ts` (delivery receive creates cones in `thread_inventory`)
7. Deploy frontend updates (ReceiveDeliveryDTO, response shape alignment)

**Phase 3 — Drop dead table (Migration 2, after code cutover confirmed):**
8. Re-run `fn_stock_to_inventory()` to catch any delta writes during Phase 1→2 window (idempotent — skips existing)
9. Re-run per-key verification assertions (same as Phase 1 step 2) to confirm delta sync complete
10. DROP FUNCTION `fn_migrate_inventory_to_stock()`
11. DROP FUNCTION `fn_stock_to_inventory()`
12. DROP TABLE `thread_stock` CASCADE

**Rollback:** Phase 1 is non-destructive — `thread_stock` remains. Phase 2 is code deployment (standard rollback). Phase 3 is destructive but runs only after code cutover is confirmed. Recommend: take DB snapshot before Phase 3.

## Open Questions

- None critical. The approach is straightforward — all consuming code already uses `thread_inventory`.
