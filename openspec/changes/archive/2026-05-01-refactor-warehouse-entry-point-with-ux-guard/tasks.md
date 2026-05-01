## 1. Pre-flight Checks

- [ ] 1.1 Verify `audit-trail-warehouse-ids-snapshot` is deployed and stable in production (check that `thread_order_results.warehouse_ids` column exists: `\d thread_order_results` in psql)
- [x] 1.2 Read `src/pages/thread/weekly-order/index.vue` lines 607–757 in full to confirm line numbers for the three write paths before making any edits
- [x] 1.3 Read `src/composables/thread/useWeeklyOrderCalculation.ts` lines 420–481 to confirm `calculateAll` signature and `lastCalculatedAt` export
- [x] 1.4 Confirm `canCalculate` computed is exported from `useWeeklyOrderCalculation` (line ~385 in `index.vue` destructuring)

## 2. Remove Auto-save from Checkbox Toggle

- [x] 2.1 In `src/pages/thread/weekly-order/index.vue`, remove the `saveWarehouseFilter` call inside `handleWarehouseFilterChange` (lines 607–615). Keep only the `hasResults`/`lastModifiedAt` block (lines 617–619). Result: function becomes a 4-line local-state-only handler
- [x] 2.2 In the AppSelect for "Lọc kho tồn" (line 175 template), confirm `@update:model-value="handleWarehouseFilterChange"` still calls the trimmed handler — no template change required, just verify binding is intact after script edit ← (verify: open Network tab in browser, toggle a warehouse checkbox — no PUT /warehouses request should fire)

## 3. Remove Auto-save from handleSave

- [x] 3.1 In `src/pages/thread/weekly-order/index.vue`, remove the unconditional `await weeklyOrderService.saveWarehouseFilter(selectedWeek.value.id, selectedWarehouseIds.value)` call at line 730 (inside the `if (selectedWeek.value)` existing-week branch)
- [x] 3.2 Remove the conditional `await weeklyOrderService.saveWarehouseFilter(created.id, selectedWarehouseIds.value)` block at lines 748–750 (inside the new-week branch) ← (verify: open Network tab, click "Lưu Đơn Hàng" — no PUT /warehouses request should fire)

## 4. Add Single Write Path Inside handleCalculate

- [x] 4.1 In `src/pages/thread/weekly-order/index.vue`, inside `handleCalculate` (line 622), add a `saveWarehouseFilter` call at the top of the function body, BEFORE the snapshot map construction. Guard with `if (selectedWeek.value?.id && selectedWarehouseIds.value.length > 0)`. If the call throws, surface via `snackbar.error('Lưu bộ lọc kho thất bại')` and re-throw to abort calculation
- [x] 4.2 Wrap the new block in a try/catch that calls `snackbar.error` and returns early (abort calculateAll) if `saveWarehouseFilter` rejects
- [x] 4.3 Verify that `weeklyOrderService` is imported at the top of the `<script setup>` block (already used at line 610, so this is a confirmation step only) ← (verify: open Network tab, click "Tính toán" — PUT /warehouses fires BEFORE the enrich-inventory POST call; check request order in Network waterfall)

## 5. Disable Tính Toán for Unsaved New Week with Non-empty Warehouse Selection

- [x] 5.1 In `src/pages/thread/weekly-order/index.vue`, add a computed `canCalculateWithWarehouse` that is `false` when `!selectedWeek.value?.id && selectedWarehouseIds.value.length > 0`. This extends the existing `canCalculate` disable check without altering the composable
- [x] 5.2 In the "Tính toán" AppButton template (line 144), add `:disable="!canCalculate || hasOverLimitEntries || canCalculateWithWarehouse"` (surgical change — only the disable binding changes)
- [x] 5.3 Add an `AppTooltip` inside the "Tính toán" button for this case: `v-if="canCalculateWithWarehouse"` with text "Vui lòng lưu tuần trước khi tính toán khi đã chọn kho" ← (verify: create new form without saving, select a warehouse → Tính toán button is disabled with tooltip; clear warehouse selection → Tính toán button re-enables)

## 6. Add lastCalculatedWarehouseIds State

- [x] 6.1 In `src/pages/thread/weekly-order/index.vue`, in the local state block (around line 450), add: `const lastCalculatedWarehouseIds = ref<number[] | null>(null)`
- [x] 6.2 In `handleCalculate`, after a successful `saveWarehouseFilter` + `calculateAll` sequence completes (after `applyDeliveryDateToResults` and the snapshot restore loop), set: `lastCalculatedWarehouseIds.value = [...selectedWarehouseIds.value]`
- [x] 6.3 Reset `lastCalculatedWarehouseIds.value = null` inside `handleSave`'s post-save reset block (the `if (!options?.skipReset)` branch at line 758) so loading a new week clears the guard ← (verify: after handleSave resets the form, `lastCalculatedWarehouseIds` is null — guard banner hidden)

## 7. Add isWarehouseChangedSinceCalc Computed

- [x] 7.1 In `src/pages/thread/weekly-order/index.vue`, in the Computed section, add:
  ```typescript
  const isWarehouseChangedSinceCalc = computed(() => {
    if (lastCalculatedWarehouseIds.value === null) return false
    if (selectedWeek.value?.status === 'CONFIRMED') return false
    const a = [...lastCalculatedWarehouseIds.value].sort((x, y) => x - y).join(',')
    const b = [...selectedWarehouseIds.value].sort((x, y) => x - y).join(',')
    return a !== b
  })
  ``` ← (verify: after a successful calculation, toggle a warehouse checkbox → `isWarehouseChangedSinceCalc` becomes true; click Tính toán again → becomes false)

## 8. Add Warning Banner to Template

- [x] 8.1 In `src/pages/thread/weekly-order/index.vue` template, immediately after the existing `q-banner` for `calculationWarnings` (after line 240), add a new `q-banner` block:
  ```html
  <q-banner
    v-if="isWarehouseChangedSinceCalc"
    rounded
    class="bg-warning text-white q-mb-md"
  >
    <template #avatar>
      <q-icon name="warehouse" color="white" />
    </template>
    Bạn đã thay đổi lọc kho. Vui lòng nhấn <strong>Tính toán</strong> lại trước khi xác nhận.
  </q-banner>
  ``` ← (verify: banner appears immediately when checkbox is toggled after a calculation; banner disappears after recalculation; banner is NOT shown on a CONFIRMED week)

## 9. Disable Xác Nhận Button When Warehouse Selection Is Stale

- [x] 9.1 In `src/pages/thread/weekly-order/index.vue` template, update the "Xác Nhận Đặt Hàng" AppButton `:disable` binding (line 296) from:
  `:disable="!hasResults || selectedWeek?.status === OrderWeekStatus.CONFIRMED"`
  to:
  `:disable="!hasResults || selectedWeek?.status === OrderWeekStatus.CONFIRMED || isWarehouseChangedSinceCalc"`
- [x] 9.2 Add an `AppTooltip` inside the "Xác Nhận Đặt Hàng" button for the warehouse-changed case: `v-if="isWarehouseChangedSinceCalc"` with text "Vui lòng tính toán lại sau khi thay đổi kho." ← (verify: calculate → change warehouse → Xác nhận button is disabled with correct tooltip; recalculate → button re-enables)

## 10. Type Check and Lint

- [x] 10.1 Run `npm run type-check` from project root — resolve any TypeScript errors introduced by new refs/computed
- [x] 10.2 Run `npm run lint` from project root — resolve any ESLint errors ← (verify: both commands exit with code 0, no errors)

## 11. Manual Verification — Single Entry-point

- [ ] 11.1 Open browser DevTools Network tab. Load a DRAFT week. Toggle warehouse checkbox 5 times rapidly. Confirm: zero PUT requests to `/api/weekly-orders/*/warehouses` appear in the network log
- [ ] 11.2 Click "Lưu Đơn Hàng". Confirm: no PUT `/warehouses` request in network log
- [ ] 11.3 Click "Tính toán". Confirm: PUT `/warehouses` fires FIRST (before the enrich-inventory batch call) in the Network waterfall ← (verify: screenshot or manual note of Network waterfall order)

## 12. Manual Verification — UX Guard

- [ ] 12.1 Load a DRAFT week. Click "Tính toán" (wait for completion). Verify: no banner visible, "Xác nhận" enabled
- [ ] 12.2 Toggle one warehouse checkbox (add or remove). Verify: warning banner appears immediately with text "Bạn đã thay đổi lọc kho. Vui lòng nhấn Tính toán lại trước khi xác nhận." and "Xác nhận" button is disabled
- [ ] 12.3 Click "Tính toán" again. Verify: banner disappears, "Xác nhận" re-enables
- [ ] 12.4 Load a CONFIRMED week. Verify: warehouse banner is NOT shown regardless of any selection change ← (verify: all 4 sub-scenarios pass)

## 13. Stress Test — Race Condition Elimination

- [ ] 13.1 Open a DRAFT week that has calculation results. Open browser DevTools Console. Rapidly toggle warehouse checkboxes 10+ times, then immediately click "Xác nhận". Verify: no 400 errors in console or Network tab from the backend. The "Xác nhận" button should be disabled if the guard is active, so clicking it should be a no-op ← (verify: zero 400 errors; UI guard prevented premature confirm)

## 14. Regression Tests

- [ ] 14.1 Full flow — new week: Enter week name → Add PO and items → Lưu (creates week) → Select warehouses → Tính toán → Verify results load → Lưu kết quả → Xác nhận. Confirm success snackbar and week transitions to CONFIRMED
- [ ] 14.2 Full flow — load existing DRAFT week: Open history → Load a DRAFT week → Change warehouse selection → Tính toán → Confirm banner gone → Xác nhận → Confirm success
- [ ] 14.3 Remove PO from CONFIRMED week: Load a CONFIRMED week → Remove a PO → Verify `fn_re_reserve_after_remove_po` runs (check DB `thread_reservations` updated) and no frontend error ← (verify: all 3 regression scenarios pass without errors)
