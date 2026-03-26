## 1. Types

- [x] 1.1 Extend `AggregatedRow` in `src/types/thread/weeklyOrder.ts` with optional fields: `inventory_cones?: number`, `sl_can_dat?: number`, `additional_order?: number`, `total_final?: number`

## 2. Backend — Validation Schema

- [x] 2.1 Add `EnrichInventorySchema` to `server/validation/weeklyOrder.ts`: validates `summary_rows` as array of objects with required `thread_type_id` (number) and `total_cones` (number), with passthrough for other fields

## 3. Backend — Enrich Endpoint

- [x] 3.1 Add `POST /api/weekly-orders/enrich-inventory` route in `server/routes/weeklyOrder.ts` (BEFORE `/:id` routes to avoid param conflict): validate body with `EnrichInventorySchema`, extract unique thread_type_ids, query `thread_inventory` with `status=AVAILABLE` and `.in('thread_type_id', ids)` selecting `thread_type_id, is_partial`, aggregate counts per thread_type_id (full_cones + partial_cones), merge into each summary row computing `inventory_cones`, `sl_can_dat = max(0, total_cones - inventory_cones)`, `additional_order = 0`, `total_final = sl_can_dat`, return enriched rows

## 4. Frontend Service

- [x] 4.1 Add `enrichInventory(rows: AggregatedRow[]): Promise<AggregatedRow[]>` method to `src/services/weeklyOrderService.ts`: POST to `/api/weekly-orders/enrich-inventory` with `{ summary_rows: rows }`, return response data

## 5. Composable — Enrich Integration

- [x] 5.1 In `src/composables/thread/useWeeklyOrderCalculation.ts`, import `weeklyOrderService` and after `aggregateResults(successResults)` in `calculateAll()`, call `weeklyOrderService.enrichInventory(aggregatedResults.value)` and assign result back to `aggregatedResults.value`. Wrap in try/catch so enrich failure doesn't break calculation (fallback: keep unenriched rows).
- [x] 5.2 Add `updateAdditionalOrder(threadTypeId: number, value: number)` method: find row in `aggregatedResults.value` by thread_type_id, set `additional_order = value`, recalculate `total_final = (row.sl_can_dat || 0) + value`. Export this method.

## 6. Summary Table — New Columns

- [x] 6.1 In `ResultsSummaryTable.vue`, add 4 new column definitions after `total_cones`: "Tồn kho KD" (`inventory_cones`), "SL cần đặt" (`sl_can_dat`), "Đặt thêm" (`additional_order`), "Tổng chốt" (`total_final`). Format: 0/undefined → "—", positive → vi-VN locale.
- [x] 6.2 Add emit `update:additional-order` and `q-popup-edit` template for "Đặt thêm" column with number input (type="number", min=0). On save, emit `(threadTypeId, newValue)`.

## 7. Page — Wiring & Export

- [x] 7.1 In `src/pages/thread/weekly-order/index.vue`, pass `@update:additional-order="handleUpdateAdditionalOrder"` to `ResultsSummaryTable`, where handler calls `updateAdditionalOrder(threadTypeId, value)` from composable.
- [x] 7.2 In `handleExport()`, add 4 new columns to Excel worksheet: `{ header: 'Tồn kho KD', key: 'inventory_cones' }`, `{ header: 'SL cần đặt', key: 'sl_can_dat' }`, `{ header: 'Đặt thêm', key: 'additional_order' }`, `{ header: 'Tổng chốt', key: 'total_final' }`. Map values from aggregatedResults, use empty string for 0/undefined.

## 8. Verification

- [x] 8.1 Verify save flow: existing `saveResults()` passes `aggregatedResults` as `summary_data` — enriched fields (inventory_cones, sl_can_dat, additional_order, total_final) persist in JSONB automatically. No code change needed.
- [x] 8.2 Verify load flow (Option A): `loadResults()` returns saved `summary_data` with snapshot values. `handleLoadWeek` already sets these on `aggregatedResults` via existing flow — NO enrich call on load. Confirm old saved results without new fields display "—" gracefully.
