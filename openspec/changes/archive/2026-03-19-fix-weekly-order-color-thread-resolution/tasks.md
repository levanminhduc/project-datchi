## 1. Database — Backfill Migration

- [x] 1.1 Create migration `backfill_style_color_thread_specs` that inserts missing entries: for each `style_thread_spec` joined with `style_colors` (same style_id), insert into `style_color_thread_specs` (style_thread_spec_id, color_id, thread_type_id) using parent's thread_type_id as default. Use `ON CONFLICT (style_thread_spec_id, color_id) DO NOTHING`. Skip deleted styles.

## 2. Backend — Calculation Warning

- [x] 2.1 In `buildCalculation()` (`server/routes/threadCalculation.ts`), detect when `colorSpec?.thread_type_id` is null and fallback to `spec.thread_type_id`. Collect warnings per color: `"Mã hàng {style_code}: màu {color_name} chưa có định mức chỉ chi tiết, dùng loại chỉ mặc định"`
- [x] 2.2 Add `warnings?: string[]` field to `CalculationResult` interface (both `server/routes/threadCalculation.ts` and `src/types/thread/threadCalculation.ts`). Populate from buildCalculation warnings.
- [x] 2.3 In `calculate-batch` endpoint, aggregate warnings from all items into the batch response.

## 3. Frontend — Display Warnings in Weekly Order

- [x] 3.1 Update `useWeeklyOrderCalculation.ts`: collect warnings from `perStyleResults` into a reactive `calculationWarnings` ref. Expose in composable return.
- [x] 3.2 In weekly order results page, display warning banner (q-banner type="warning") above results table when `calculationWarnings` is non-empty. List each warning.
- [x] 3.3 In aggregated results table, highlight rows where thread_type_id is a TEX-level base type (from warnings). Add amber background + tooltip: "Loại chỉ chung (chưa phân theo màu cuộn)"

## 4. Frontend — Style Spec Management UI Enforcement

- [x] 4.1 Identify the style thread spec create/edit UI component (likely in `src/components/thread/` or `src/pages/`). Read current implementation.
- [x] 4.2 When creating/editing a thread spec for a style with garment colors: show color mapping section listing each style_color with a thread_type selector, pre-filled with base thread_type.
- [x] 4.3 On save, ensure `style_color_thread_specs` entries are created/updated for each garment color alongside the parent `style_thread_spec`.
- [x] 4.4 When editing existing spec with incomplete mappings, highlight missing colors with warning indicator.

## 5. Verification

- [x] 5.1 Run `npm run type-check` and `npm run lint` — fix errors (type-check passes; lint has pre-existing dep issue unrelated to this change)
- [ ] 5.2 Test: create weekly order with style that has complete color specs → verify separate rows per colored thread in "Tổng hợp" (manual test)
- [ ] 5.3 Test: style with incomplete color specs → verify warning banner appears and fallback rows are highlighted (manual test)
