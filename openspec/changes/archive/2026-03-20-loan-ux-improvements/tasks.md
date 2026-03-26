## 1. Enhance fn_auto_return_loans to Return Detail Array

- [x] 1.1 Modify `fn_auto_return_loans` in new migration: add `v_details` JSONB array, append `{ loan_id, from_week_id, cones_returned, fully_settled }` per loan processed
- [x] 1.2 Update return value to include `details` key alongside existing `settled` and `returned_cones`
- [x] 1.3 Join `thread_order_weeks` to include `from_week_name` in each detail entry ← (verify: fn_auto_return_loans returns detail array, existing fn_receive_delivery still works with extended return)

## 2. Create fn_loan_detail_by_thread_type RPC

- [x] 2.1 Create migration with `fn_loan_detail_by_thread_type(p_week_id INTEGER)` — returns per-thread-type: thread_type_id, thread_code, thread_name, color_name, borrowed_cones, lent_cones, ncc_ordered, ncc_received, ncc_pending
- [x] 2.2 Source data from `thread_order_deliveries` LEFT JOIN `thread_order_loans` (active only), joined with `thread_types` for code/name/color ← (verify: RPC returns correct data for week with mixed loan/no-loan thread types)

## 3. Backend API Enhancements

- [x] 3.1 Update `POST /deliveries/:deliveryId/receive` response mapping in `weeklyOrder.ts` to pass through `auto_return.details` from RPC result (currently only passes `auto_return` as opaque JSON — verify it reaches frontend)
- [x] 3.2 Add `GET /api/weekly-orders/:weekId/loan-detail-by-type` endpoint calling `fn_loan_detail_by_thread_type`
- [x] 3.3 Enhance delivery overview query in `GET /api/weekly-orders/:weekId/deliveries` to include per-delivery `borrowed_in` and `lent_out` aggregates from `thread_order_loans` ← (verify: receive endpoint returns full auto_return details, new endpoints return correct data)

## 4. Frontend Types & Services

- [x] 4.1 Update `ReceiveDeliveryResponse` type in `deliveryService.ts` to include `auto_return: { settled, returned_cones, details }` and `cones_reserved`, `remaining_shortage` fields
- [x] 4.2 Add `AutoReturnDetail` type: `{ loan_id, from_week_id, from_week_name, cones_returned, fully_settled }`
- [x] 4.3 Add `getLoanDetailByType(weekId)` method to `weeklyOrderService.ts`
- [x] 4.4 Update `DeliveryRecord` type to include optional `borrowed_in` and `lent_out` fields

## 5. Receive Result Dialog Component

- [x] 5.1 Create `ReceiveResultDialog.vue` in `src/components/thread/weekly-order/` — shows cones_created, cones_reserved, remaining_shortage, auto_return details list
- [x] 5.2 Auto-return section: conditionally render when `auto_return.returned_cones > 0`, show per-loan detail rows with week name and cone count
- [x] 5.3 Integrate into `deliveries.vue`: after `confirmReceive()` success, open result dialog instead of just snackbar ← (verify: result dialog shows correct breakdown, auto-return section visible when loans settled, dismiss refreshes list)

## 6. Delivery Tracking Loan Context Columns

- [x] 6.1 Modify `deliveries.vue` tracking table: add "Đã mượn" and "Cho mượn" columns from `borrowed_in`/`lent_out` fields
- [x] 6.2 Conditionally hide borrow columns when no week has any active loans (check if all values are 0)
- [x] 6.3 Update `loadTrackingData()` to use enhanced delivery response with loan aggregates ← (verify: borrow columns show correct values, hidden when no loans exist)

## 7. Loan Dashboard Thread-Type Breakdown

- [x] 7.1 Add expandable row to loan summary table in `loans.vue` — on click, fetch `fn_loan_detail_by_thread_type` for that week
- [x] 7.2 Display per-thread-type breakdown: thread code, name, color, borrowed cones, lent cones, NCC pending
- [x] 7.3 Cache breakdown data per week to avoid re-fetch on collapse/expand ← (verify: expand shows correct per-thread-type data, collapse/re-expand uses cache, all thread types with deliveries shown)

## 8. Validation

- [ ] 8.1 Test receive delivery with active loans → verify result dialog shows auto-return details
- [ ] 8.2 Test receive delivery with no loans → verify result dialog shows only basic info, no auto-return section
- [ ] 8.3 Test delivery tracking columns show correct borrowed/lent values
- [ ] 8.4 Test loan dashboard expand shows per-thread-type breakdown ← (verify: all spec scenarios pass, no regression in existing receive flow)
