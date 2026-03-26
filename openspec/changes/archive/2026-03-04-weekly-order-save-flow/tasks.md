## 1. Backend - Check Name Endpoint

- [x] 1.1 Add `GET /weekly-orders/check-name` route in `server/routes/weeklyOrder.ts`
- [x] 1.2 Validate query param `name` is present (trim whitespace), return 400 if missing/empty
- [x] 1.3 Query `thread_order_weeks` by `week_name`, return `{ exists, week? }` ← (verify: endpoint returns correct format, handles missing param, trims input)
- [x] 1.4 Ensure existing create/update routes also trim `week_name` before persist ← (verify: consistent normalization across all name operations)

## 2. Frontend Service

- [x] 2.1 Add `checkWeekNameExists(name: string)` function in `src/services/weeklyOrderService.ts`
- [x] 2.2 Return type: `{ exists: boolean, week?: { id, week_name, status } }` ← (verify: service function matches API response)

## 3. Frontend UI - Button Relocation

- [x] 3.1 Remove "Lưu" button from WeekInfoCard slot in `index.vue` (lines 29-37)
- [x] 3.2 Add "Lưu tuần" button in Result Actions area, before "Xác nhận tuần"
- [x] 3.3 Set disable condition: `!hasResults`
- [x] 3.4 Verify button order: [Lưu tuần] [Xác nhận tuần] [Xuất Excel] ← (verify: buttons in correct order, disable states work)

## 4. Frontend Logic - Save Flow Fix

- [x] 4.1 In `handleSave()`, after `createWeek()` succeeds, set `selectedWeek.value = created`
- [x] 4.2 Ensure `resultsSaved = true` is set after both create and update paths
- [x] 4.3 Verify "Xác nhận tuần" enables immediately after save (for non-CONFIRMED weeks only) ← (verify: can confirm without reload)

## 5. Frontend Logic - Duplicate Name Check

- [x] 5.1 Add `@blur` handler on week name input in WeekInfoCard (emit event to parent)
- [x] 5.2 In `index.vue`, handle blur event: call `checkWeekNameExists()` with trimmed name
- [x] 5.3 Self-match bypass: if `matchedWeek.id === selectedWeek?.id`, skip dialog
- [x] 5.4 Graceful degradation: if API fails, silently continue (no error toast)
- [x] 5.5 If exists (and not self-match), show dialog with "Tuần X đã tồn tại" message
- [x] 5.6 Dialog option "Tải và cập nhật": call `handleLoadWeek(existingWeek.id)`
- [x] 5.7 Dialog option "Đổi tên mới": close dialog, focus name input ← (verify: blur triggers check, self-match bypassed, API failure handled, dialog works)

## 6. Manual Testing

- [ ] 6.1 Test: Enter data → Calculate → Lưu → Xác nhận (no reload needed)
- [ ] 6.2 Test: Enter existing week name → blur → dialog appears → choose Load → data replaced
- [ ] 6.3 Test: Enter existing week name → blur → dialog appears → choose Rename → focus on input
- [ ] 6.4 Test: Save without calculation → Lưu button disabled
- [ ] 6.5 Test: Edit current week, blur without changing name → no dialog (self-match)
- [ ] 6.6 Test: Disconnect network → blur → no error, save still validates
- [ ] 6.7 Test: Load CONFIRMED week → edit → save → confirm button stays disabled ← (verify: all scenarios pass)
