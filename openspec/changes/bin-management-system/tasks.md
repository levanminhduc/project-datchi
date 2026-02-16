## 1. Database — Tables, Views, Migration

- [ ] 1.1 Create migration: `bins` table (bin_id, bin_code, color_id FK, location, status, notes, warehouse_id FK, timestamps, soft delete)
- [ ] 1.2 Create migration: `bin_items` table (id, bin_id FK, thread_type_id FK, qty_cones, is_partial, source_type, timestamps) with unique constraint on (bin_id, thread_type_id, is_partial)
- [ ] 1.3 Create migration: `bin_transactions` table (id, bin_id FK, operation, thread_type_id, qty_cones, is_partial, source_type, reference_type, reference_id, location_from, location_to, performed_by, notes, created_at)
- [ ] 1.4 Create migration: replace `v_stock_summary` view to query `bin_items` instead of `thread_stock`
- [ ] 1.5 Create migration: data migration script — for each `thread_stock` record, create UNASSIGNED bin per warehouse+color and populate `bin_items` ← (verify: migration runs without errors, v_stock_summary returns same totals as before, UNASSIGNED bins created correctly)

## 2. Backend — Types & Validation

- [ ] 2.1 Create `server/types/bin.ts` — interfaces for Bin, BinItem, BinTransaction, API response types
- [ ] 2.2 Create `server/validation/bin.ts` — Zod schemas: CreateBinSchema, AddStockToBinSchema, RemoveStockFromBinSchema, MoveBinSchema, ReceiveDeliveryToBinSchema

## 3. Backend — Bins CRUD Route

- [ ] 3.1 Create `server/routes/bins.ts` — GET /api/bins (list with filters: color, location, status)
- [ ] 3.2 GET /api/bins/:code (get bin by code with bin_items and thread_type details)
- [ ] 3.3 POST /api/bins (create bin, auto-generate bin_code BIN-NNNNN)
- [ ] 3.4 PATCH /api/bins/:id (update location, notes)
- [ ] 3.5 POST /api/bins/:id/move (relocate bin, create MOVE transaction)
- [ ] 3.6 POST /api/bins/:id/retire (set status=RETIRED, validate empty)
- [ ] 3.7 POST /api/bins/:id/stock-in (add cones, validate color match, upsert bin_items, create IN transaction)
- [ ] 3.8 POST /api/bins/:id/stock-out (remove cones, validate qty, decrement/delete bin_items, create OUT transaction)
- [ ] 3.9 GET /api/bins/stock-availability (query total stock by thread_type_id from bin_items) ← (verify: all bin routes work, color validation enforced, transactions logged correctly)

## 4. Backend — Integrate bins into Issue V2

- [ ] 4.1 Modify `getStockAvailability()` in `issuesV2.ts` to query `bin_items` SUM(qty_cones) grouped by is_partial, instead of counting `thread_inventory` rows
- [ ] 4.2 Modify `deductStock()` in `issuesV2.ts` to decrement `bin_items` (FEFO by earliest bin_transaction IN date), create OUT transactions
- [ ] 4.3 Modify return endpoint in `issuesV2.ts` — accept `bin_id` parameter, add stock back to `bin_items`, create IN transaction with source_type=RETURN
- [ ] 4.4 Update form-data and validate-line endpoints to use new `getStockAvailability()` ← (verify: issue create/confirm/return flow works end-to-end with bin_items as source of truth)

## 5. Backend — Integrate bins into Delivery Receiving

- [ ] 5.1 Modify `POST /deliveries/:deliveryId/receive` in `weeklyOrder.ts` — accept bin_id or bin creation params, write to `bin_items` instead of `thread_stock`, create IN transaction with source_type=NEW, reference_type=DELIVERY
- [ ] 5.2 Support split receiving (multiple bins per delivery) ← (verify: delivery receiving creates bin_items correctly, bin_transactions logged, delivery status updated)

## 6. Backend — Register route & deprecate stock.ts

- [ ] 6.1 Register bins route in `server/index.ts`
- [ ] 6.2 Deprecate `server/routes/stock.ts` (keep temporarily but mark deprecated, redirect key endpoints to bins)

## 7. Frontend — Types & Service

- [ ] 7.1 Create `src/types/thread/bin.ts` — TypeScript types matching backend interfaces
- [ ] 7.2 Create `src/services/binService.ts` — API client: listBins, getBin, createBin, updateBin, moveBin, retireBin, stockIn, stockOut, getStockAvailability

## 8. Frontend — Bin Management Page

- [ ] 8.1 Create `src/pages/thread/bins.vue` — list page with filters (color, location, status), create bin dialog, print QR button
- [ ] 8.2 Create `src/pages/thread/bins/[code].vue` — detail page showing bin info + bin_items table + transaction history
- [ ] 8.3 Add bin pages to router and navigation menu ← (verify: bin list/detail pages render correctly, CRUD operations work from UI)

## 9. Frontend — Bin QR Labels

- [ ] 9.1 Create `src/components/qr/BinQrLabel.vue` — label template for bins (bin_code, color name, QR code)
- [ ] 9.2 Add print QR labels action on bins list page (reuse QrPrintDialog with BinQrLabel)
- [ ] 9.3 Handle QR scan result — when scanned code matches BIN-NNNNN pattern, navigate to bin detail page

## 10. Frontend — Modify Delivery Receiving UI

- [ ] 10.1 Modify delivery receiving dialog/form — add bin selection (scan QR or select from list) and "create new bin" option
- [ ] 10.2 Support split receiving UI — allow distributing received quantity across multiple bins ← (verify: receiving flow works with bin selection, new bin creation inline, split across bins)

## 11. Frontend — Modify Issue V2 UI

- [ ] 11.1 Modify issue return flow — add bin selection for returned cones (scan QR or select from list)
- [ ] 11.2 Update stock availability display to reflect bin-based totals ← (verify: full issue lifecycle works — create, add lines, confirm deducts from bins, return adds back to bins)

## 12. Cleanup & Final Verification

- [ ] 12.1 Update `src/services/stockService.ts` — deprecate or redirect to binService
- [ ] 12.2 Update dashboard service if it references `thread_stock` directly
- [ ] 12.3 Run type-check (`npm run type-check`) and fix any TypeScript errors ← (verify: no type errors, no references to thread_stock in active code, all flows work end-to-end)
