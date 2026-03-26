## 1. Database Migration

- [x] 1.1 Add `COMPLETED` to `weekly_order_status` enum: `ALTER TYPE weekly_order_status ADD VALUE IF NOT EXISTS 'COMPLETED' AFTER 'CANCELLED'` (check if enum name is correct via `\dT+` in psql)
- [x] 1.2 Add `WEEK_COMPLETED` to `movement_type` enum in the same migration
- [x] 1.3 Create `thread_order_item_completions` table: `id SERIAL PRIMARY KEY`, `item_id INTEGER NOT NULL REFERENCES thread_order_items(id) ON DELETE CASCADE`, `completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`, `completed_by VARCHAR NOT NULL`, `UNIQUE(item_id)`
- [x] 1.4 Create `fn_complete_week_and_release(p_week_id INTEGER, p_performed_by VARCHAR)` RPC function:
  - Lock week row with `SELECT ... FOR UPDATE`, verify status = 'CONFIRMED'
  - Verify all items have completions (JOIN thread_order_item_completions)
  - Auto-settle active loans: `UPDATE thread_order_loans SET status='SETTLED', returned_cones=quantity_cones WHERE (from_week_id=p_week_id OR to_week_id=p_week_id) AND status='ACTIVE'`
  - Release own cones (original_week_id IS NULL or = p_week_id): SET status='AVAILABLE', clear reserved_week_id + original_week_id
  - Return borrowed cones (original_week_id IS NOT NULL AND ≠ p_week_id): check original week status, if CONFIRMED → re-reserve (reserved_week_id=original_week_id, clear original_week_id), else → AVAILABLE
  - INSERT movements for all affected cones (type=WEEK_COMPLETED)
  - UPDATE week status to COMPLETED
  - RETURN jsonb summary: released_own, returned_borrowed, settled_loans ← (verify: RPC handles all edge cases from surplus-release spec — own cones, borrowed cones, settled loans, concurrent lock, atomic rollback)
- [x] 1.5 Grant `EXECUTE` on the new function to `service_role`, revoke from `PUBLIC`

## 2. Backend Types

- [x] 2.1 Add `'COMPLETED'` to `WeeklyOrderStatus` type in `server/types/weeklyOrder.ts`
- [x] 2.2 Add `'WEEK_COMPLETED'` to `MovementType` type in `server/types/thread.ts`
- [x] 2.3 Add `ThreadOrderItemCompletion` interface in `server/types/weeklyOrder.ts`: `{ id: number, item_id: number, completed_at: string, completed_by: string }`

## 3. Backend Validation

- [x] 3.1 Add `'COMPLETED'` to `UpdateStatusSchema` enum in `server/validation/weeklyOrder.ts`
- [x] 3.2 Add `COMPLETED: []` to `VALID_STATUS_TRANSITIONS` in `server/routes/weeklyOrder.ts` and add `'COMPLETED'` to `CONFIRMED`'s array

## 4. Backend API Endpoints

- [x] 4.1 Add `POST /api/weekly-orders/:id/items/:itemId/complete` in `server/routes/weeklyOrder.ts`: verify week is CONFIRMED, verify item belongs to week, upsert into `thread_order_item_completions`
- [x] 4.2 Add `DELETE /api/weekly-orders/:id/items/:itemId/complete` in `server/routes/weeklyOrder.ts`: verify week is CONFIRMED (not COMPLETED), delete from `thread_order_item_completions`
- [x] 4.3 Add `GET /api/weekly-orders/:id/completions` in `server/routes/weeklyOrder.ts`: return all completions for a week (used by frontend to show checkboxes)
- [x] 4.4 Add `GET /api/weekly-orders/:id/surplus-preview` in `server/routes/weeklyOrder.ts`: count RESERVED_FOR_ORDER cones where `reserved_week_id = id`, return `{ total_cones: N, can_release: boolean }` (can_release = all items completed AND status = CONFIRMED)
- [x] 4.5 Add `POST /api/weekly-orders/:id/release-surplus` in `server/routes/weeklyOrder.ts`: verify week is CONFIRMED, verify all items completed, call `fn_complete_week_and_release` RPC, return summary ← (verify: all 5 endpoints registered BEFORE `/:id` generic route, correct auth permissions, matches spec scenarios)

## 5. Backend — Block Issue V2 for Completed Combos

- [x] 5.1 Add helper function `isComboCompletedInAllWeeks(poId, styleId, styleColorId)` in `server/routes/issuesV2.ts`: query `thread_order_items` joined with `thread_order_weeks`, check if ALL weeks containing this combo have status COMPLETED (and at least one exists). Return boolean.
- [x] 5.2 Add guard in Issue V2 validate endpoint (POST `/:id/lines/validate`): if `isComboCompletedInAllWeeks` returns true → return error "PO-Style-Màu này đã hoàn tất xuất trong tất cả tuần đặt hàng"
- [x] 5.3 Add guard in Issue V2 add-line endpoint (POST `/:id/lines`): same check as 5.2 before creating line
- [x] 5.4 Add guard in Issue V2 confirm endpoint (POST `/:id/confirm`): for each line, check `isComboCompletedInAllWeeks`, collect errors ← (verify: all 3 Issue V2 endpoints block completed combos, over-quota bypass not possible)

## 6. Frontend Types

- [x] 6.1 Add `COMPLETED = 'COMPLETED'` to `OrderWeekStatus` enum in `src/types/thread/enums.ts`
- [x] 6.2 Add `ThreadOrderItemCompletion` interface in `src/types/thread/weeklyOrder.ts`

## 7. Frontend Service

- [x] 7.1 Add methods to `src/services/weeklyOrderService.ts`:
  - `markItemComplete(weekId, itemId)` → POST
  - `unmarkItemComplete(weekId, itemId)` → DELETE
  - `getCompletions(weekId)` → GET
  - `getSurplusPreview(weekId)` → GET
  - `releaseSurplus(weekId)` → POST

## 8. Frontend — Weekly Order Detail Page

- [x] 8.1 In `src/pages/thread/weekly-order/[id].vue` — add completion state: `completions` ref (Map<itemId, completion>), `completionLoading` ref, `loadCompletions()` function
- [x] 8.2 Add completion checkboxes to Overview tab item list: each PO-Style-Color item shows a checkbox, checked if completion exists. Toggle calls `markItemComplete` / `unmarkItemComplete`. Disabled if week is not CONFIRMED.
- [x] 8.3 Add "Trả dư" button in page header (next to existing buttons): visible only when `week.status === 'CONFIRMED'`, disabled until all items have completions. Show progress text "X/Y hoàn tất".
- [x] 8.4 Implement preview dialog: on "Trả dư" click → call `getSurplusPreview` → show `QDialog` with "Sẽ trả X cuộn về Khả dụng. Bạn chắc chắn?" → confirm calls `releaseSurplus` → update week status → snackbar success
- [x] 8.5 Handle COMPLETED status in UI: disable all edit actions (items, loans, reservations, status changes), show "Đã hoàn tất" badge ← (verify: page shows checkboxes, button enables correctly, preview dialog works, COMPLETED state locks all actions)

## 9. Frontend — Weekly Order List Page

- [x] 9.1 In `src/pages/thread/weekly-order/index.vue` — add COMPLETED status to status badge color map and status label map (e.g., green "Hoàn tất")

## 10. Testing & Verification

- [x] 10.1 Run `npm run type-check` — fix any TypeScript errors
- [x] 10.2 Run `npm run lint` — fix any lint errors ← (verify: type-check and lint pass with zero errors)
