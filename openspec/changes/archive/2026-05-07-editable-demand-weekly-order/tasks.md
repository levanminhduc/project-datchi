## 1. Type Update

- [x] 1.1 Add `demand_note?: string | null` field to `AggregatedRow` interface in `src/types/thread/weeklyOrder.ts` ← (verify: type-check passes, no downstream type errors)

## 2. Backend Fixes

- [x] 2.1 Update `server/routes/weekly-order/enrich-helper.ts`: change `sl_can_dat` formula to use `(row.quota_cones ?? row.total_cones)` instead of `row.total_cones`
- [x] 2.2 Update `server/routes/weekly-order/save-results.ts`: if incoming row has `quota_cones != null` (user override), preserve it — do NOT overwrite with calculated value. If incoming row has `quota_cones == null`, leave it null — do NOT synthesize a calculated value. Persist `demand_note` from incoming data alongside quota_cones. Log warning if `quota_cones != null && quota_cones > total_cones && !demand_note`. ← (verify: saved summary_data retains user quota_cones override, non-overridden rows keep quota_cones null, enrich uses override for sl_can_dat)

## 3. Composable Recalculation

- [x] 3.1 Update `updateQuotaCones()` in `src/composables/thread/useWeeklyOrderCalculation.ts`: change signature to accept `(threadTypeId, value: number | null, threadColorId, demandNote: string | null)`. If value is null, set `row.quota_cones = null` (clear override). Otherwise set `row.quota_cones = value`. Store `row.demand_note = demandNote`. Recalculate: `effectiveCones = row.quota_cones != null ? row.quota_cones : row.total_cones`, `row.sl_can_dat = Math.max(0, Math.ceil(effectiveCones - (row.equivalent_cones || 0)))`, `row.total_final = row.sl_can_dat + (row.additional_order || 0)`. Use `!= null` checks, not truthiness. ← (verify: sl_can_dat and total_final update immediately, clearing sets null and reverts to total_cones)

## 4. ResultsSummaryTable UI

- [x] 4.1 Update "Nhu Cầu" column in `src/components/thread/weekly-order/ResultsSummaryTable.vue`: add `body-cell-total_cones` template slot with popup-edit (similar to existing `additional_order` pattern). Display `quota_cones ?? total_cones`. When `quota_cones` differs from `total_cones`, show inline `{quota_cones} (gốc: {total_cones})` with `text-orange` class. Only editable when `!readonly`.
- [x] 4.2 Add "Ghi chú" column after "Tổng chốt": display `demand_note` field. Add popup-edit for the note. When quota_cones > total_cones and note is empty, show visual indicator (e.g., red border or warning icon).
- [x] 4.3 Update demand popup to include inline note input when increasing: if new value > total_cones, show note textarea in the same popup and disable "Lưu" until note is non-empty. Emit signature `(threadTypeId: number, value: number | null, threadColorId: number | null, demandNote: string | null)`. Clearing value (empty input) emits `value = null` (revert to calculated). Numeric 0 = valid override. ← (verify: popup-edit works, mandatory note enforced on increase, clearing reverts correctly, display format correct for overridden vs normal values)

## 5. Page Integration

- [x] 5.1 Update `handleUpdateQuotaCones` in `src/pages/thread/weekly-order/index.vue`: update signature to `(threadTypeId: number, value: number | null, threadColorId: number | null, demandNote: string | null)`. Pass all 4 params to composable's `updateQuotaCones()`. Remove the debounced `weeklyOrderService.updateQuotaCones()` API call entirely — quota changes persist only through the save/confirm flow (JSONB summary_data).
- [x] 5.2 Update `handleLoadWeek` in `src/pages/thread/weekly-order/index.vue`: restore `quota_cones` and `demand_note` from saved summary_data, then recalculate `sl_can_dat` and `total_final` for each row with an override
- [x] 5.3 Update `handleCalculate` in `src/pages/thread/weekly-order/index.vue`: snapshot both `quota_cones` AND `demand_note` before recalc, restore both after, then recalculate `sl_can_dat` and `total_final` using the override value (not the enrich-computed value). ← (verify: load saved week restores overrides correctly, recalculate preserves overrides + notes, save persists quota_cones + demand_note in summary_data JSONB)

## 6. Verification

- [x] 6.1 Run `npm run type-check` — no TypeScript errors
- [x] 6.2 Run `npm run lint` — no ESLint errors ← (verify: full build passes, all scenarios from spec work end-to-end)
