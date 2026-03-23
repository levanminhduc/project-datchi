## 1. Database Migration

- [x] 1.1 Create migration: INSERT `reserve_priority` = `partial_first` into `system_settings` (ON CONFLICT DO NOTHING)
- [x] 1.2 Create migration: ALTER `fn_reserve_for_week` to read `reserve_priority` from system_settings and ORDER BY `is_partial` ASC or DESC accordingly. Default to `partial_first` if key missing
- [x] 1.3 Create migration: ALTER `fn_borrow_thread` to read `reserve_priority` and apply same ORDER BY logic
- [x] 1.4 Create migration: ALTER `fn_reserve_from_stock` to read `reserve_priority` and apply same ORDER BY logic
- [x] 1.5 Create migration: ALTER `fn_return_cones_with_movements` — in full-return UPDATE add `reserved_week_id = NULL, original_week_id = NULL`. In partial-return INSERT for new cone ensure `reserved_week_id = NULL, original_week_id = NULL` ← (verify: all 3 reserve functions read setting correctly, return function clears both week fields in both full and partial paths)

## 2. Backend — Enrich Endpoint

- [x] 2.1 In `server/routes/weeklyOrder.ts` enrich-inventory handler: query `partial_cone_ratio` from `system_settings` (default 0.3 if missing)
- [x] 2.2 Change inventory aggregation to track `fullMap` and `partialMap` separately instead of single `inventoryMap`
- [x] 2.3 Compute enriched fields: `full_cones`, `partial_cones`, `inventory_cones` (raw = full + partial), `equivalent_cones` (full + partial * ratio). Change `sl_can_dat = max(0, total_cones - equivalent_cones)` ← (verify: sl_can_dat uses equivalent_cones not inventory_cones, ratio fetched from DB not hardcoded)

## 3. Frontend — Types

- [x] 3.1 Update `AggregatedRow` in `src/types/thread/weeklyOrder.ts`: add `full_cones?: number`, `partial_cones?: number`, `equivalent_cones?: number`

## 4. Frontend — Summary Table

- [x] 4.1 In `src/components/thread/weekly-order/ResultsSummaryTable.vue`: add columns "Cuộn nguyên" (full_cones), "Cuộn lẻ" (partial_cones), "Tồn kho QĐ" (equivalent_cones) after "Tồn kho KD"
- [x] 4.2 Update Excel export in `src/pages/thread/weekly-order/index.vue`: add full_cones, partial_cones, equivalent_cones columns to worksheet ← (verify: all 4 new columns render correctly with vi-VN formatting, Excel export includes new columns)

## 5. Frontend — Settings Page

- [x] 5.1 In `src/pages/settings.vue`: add reserve priority selector with options "Ưu tiên cuộn lẻ" (partial_first) / "Ưu tiên cuộn nguyên" (full_first). Read/write via existing settings service ← (verify: setting persists after page reload, fn_reserve_for_week uses updated value)
