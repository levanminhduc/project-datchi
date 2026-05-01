## 1. Database Migration

- [x] 1.1 Create migration file `supabase/migrations/{YYYYMMDDHHMMSS}_add_warehouse_ids_to_thread_order_results.sql` with timestamp greater than `20260430140000`
- [x] 1.2 Add `ALTER TABLE thread_order_results ADD COLUMN warehouse_ids INTEGER[] DEFAULT NULL;`
- [x] 1.3 Add `COMMENT ON COLUMN thread_order_results.warehouse_ids IS 'Snapshot kho đã chọn lúc lưu kết quả tính toán. NULL = tuần cũ chưa snapshot. {} = chọn rỗng = áp dụng tất cả kho khi reserve. {3,5} = đã chọn kho 3 và 5.';`
- [x] 1.4 Add `NOTIFY pgrst, 'reload schema';` at end of migration file
- [x] 1.5 Run `supabase migration up` and verify no errors ← (verify: `\d thread_order_results` shows `warehouse_ids integer[]` column; `SELECT COUNT(*) FROM thread_order_results WHERE warehouse_ids IS NULL` equals the pre-migration count of existing rows)

## 2. Backend — Save Results Route

- [x] 2.1 Open `server/routes/weekly-order/save-results.ts` and read lines 91–122 for current context
- [x] 2.2 In the upsert payload (lines 111–119), add `warehouse_ids: warehouseIds` as a new field after `summary_data` — reuse the `warehouseIds` variable already declared on line 97 (no new DB query)
- [x] 2.3 Run `npm run type-check` to confirm no TypeScript errors ← (verify: upsert call compiles without error; `warehouseIds` array is correctly typed as `number[]`; Supabase client accepts `INTEGER[]` column)

## 3. Frontend Types

- [x] 3.1 Open `src/types/thread/weeklyOrder.ts` and locate the `WeeklyOrderResults` interface (line 69)
- [x] 3.2 Add field `warehouse_ids?: number[] | null` to `WeeklyOrderResults` interface after `calculated_at`
- [x] 3.3 Run `npm run type-check` to confirm no TypeScript errors ← (verify: all existing consumers of `WeeklyOrderResults` still compile; new optional field does not break any destructuring or assignment)

## 4. Frontend UI — Warehouse Filter Label

- [x] 4.1 Open `src/pages/thread/weekly-order/index.vue` and locate the `AppSelect` for warehouse filter (around line 159)
- [x] 4.2 Change `label="Lọc kho tồn"` to `label="Kho rút tồn (áp dụng khi xác nhận)"`
- [x] 4.3 Change the hint text inside `<q-item-section class="text-caption text-grey">` from `Không chọn = tất cả kho` to `Trống = sẽ rút từ tất cả kho khi xác nhận đơn hàng`
- [x] 4.4 Run `npm run type-check` and `npm run lint` ← (verify: page renders with updated label text and hint text in Vietnamese; no lint errors; no TypeScript errors)

## 5. End-to-End Verification

- [ ] 5.1 Start dev server (`npm run dev:all`) and navigate to weekly-order page — confirm new label and hint text display correctly
- [ ] 5.2 Create or open a DRAFT week, select warehouses 3 and 5, run calculation and save — query `SELECT warehouse_ids FROM thread_order_results WHERE week_id = X` — expect `{3,5}`
- [ ] 5.3 Create or open a DRAFT week with no warehouse selection, run calculation and save — query same — expect `{}` (empty array, NOT NULL)
- [x] 5.4 Confirm that existing weeks still have `warehouse_ids IS NULL` (pre-migration rows untouched)
- [ ] 5.5 Confirm week with reserves: select warehouses, confirm week — verify reserve cones were pulled from junction (not limited to snapshot) by checking `fn_confirm_week_with_reserve` behavior is unchanged ← (verify: reserve summary counts match expected values based on all selected junction warehouses; no regression in existing reserve flow)
