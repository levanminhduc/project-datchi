## 1. Fix frontend aggregate meters_per_cone (Issue 5)

- [x] 1.1 In `src/composables/thread/useWeeklyOrderCalculation.ts` L218, change `meters_per_cone: calc.meters_per_cone ?? null` to `meters_per_cone: cb.meters_per_cone ?? calc.meters_per_cone ?? null` ← (verify: aggregate uses color-level meters_per_cone when available, falls back to base spec)

## 2. Fix RPC nested calculation_data parsing (Issue 1)

- [x] 2.1 Create migration `supabase/migrations/20260306000001_fix_reserve_functions_nested_parse.sql` replacing `fn_confirm_week_with_reserve`: parse 3 levels (style_result → calculations → color_breakdown), aggregate thread_type_id + total_cones correctly, handle specs without color_breakdown by using base calc total_meters/meters_per_cone
- [x] 2.2 In same migration, replace `fn_receive_delivery`: fix shortage calculation to parse nested calculation_data with same 3-level logic ← (verify: both RPCs correctly parse nested calculation_data, handle no-color-breakdown edge case, reserve correct number of cones)

## 3. PO import auto-create style (Issue 3)

- [x] 3.1 In `server/routes/import.ts` parse phase (~L763): when style_code not found in styleMap, set status to `new_style` instead of pushing to errorRows. Store style_code on the row for execute phase.
- [x] 3.2 In `server/routes/import.ts` execute phase (~L874): before creating po_items, check if row status is `new_style` → INSERT into `styles` (style_code, style_name = style_code) → use returned id. Deduplicate: create each style_code only once per batch.
- [x] 3.3 In `src/pages/thread/purchase-orders/import.vue` preview table: add info-colored q-badge "Mới" next to style_code cell for rows with status `new_style` ← (verify: unknown styles auto-created, preview shows "Mới" tag, duplicate style_codes in batch handled correctly)
