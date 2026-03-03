## 1. Database Schema

- [x] 1.1 Add `RESERVED_FOR_ORDER` to cone_status enum (migration)
- [x] 1.2 Add `reserved_week_id` and `original_week_id` columns to thread_inventory
- [x] 1.3 Create `thread_order_loans` table with: quantity_cones, quantity_meters NUMERIC(12,4), created_by NOT NULL, created_at, updated_at, deleted_at
- [x] 1.4 Add trigger `update_thread_order_loans_updated_at` using fn_update_updated_at_column()
- [x] 1.5 Add DB constraints: `chk_loan_self_borrow CHECK (from_week_id <> to_week_id)`, `chk_loan_qty_positive CHECK (quantity_cones > 0)`, `chk_loan_meters_nonneg CHECK (quantity_meters >= 0 OR quantity_meters IS NULL)`
- [x] 1.6 Create indexes for reserved_week_id and loans FKs ← (verify: schema matches design.md D13, migrations run, soft-delete convention followed)

## 2. Update Types & Enums (BE + FE)

- [x] 2.1 Update `ConeStatus` type in `server/types/thread.ts` to include RESERVED_FOR_ORDER
- [x] 2.2 Update `ConeStatus` enum in `src/types/thread/enums.ts`
- [x] 2.3 Add `ThreadOrderLoan` type in BE and FE types
- [x] 2.4 Add `ReservationSummary` type: `{ thread_type_id, needed, reserved, shortage }`
- [x] 2.5 Add Zod schemas for loan endpoints in `server/validation/weeklyOrder.ts` ← (verify: types compile without errors, schemas validate correctly)

## 3. Reserve Functions (RPC)

- [x] 3.1 Create `fn_reserve_for_week(week_id, thread_type_id, quantity)` - reserves AVAILABLE cones with FEFO, uses FOR UPDATE SKIP LOCKED, returns `{reserved, skipped_locked, shortage}`
- [x] 3.2 Create `fn_release_week_reservations(week_id)` - releases all reserved cones for a week, checks active loans first (raise exception if loans exist)
- [x] 3.3 Create `fn_borrow_thread(from_week, to_week, thread_type_id, qty, reason, p_user)` - atomic borrow with row locking per D14: lock candidate cones FOR UPDATE SKIP LOCKED, fail if moved < requested
- [x] 3.4 Create `fn_confirm_week_with_reserve(week_id)` - atomic confirm per D8: lock week row FOR UPDATE, aggregate summary by thread_type_id, reserve all types, update status to CONFIRMED only if all succeed ← (verify: all RPC functions work correctly with edge cases, concurrent requests)

## 4. Modify fn_allocate_thread

- [x] 4.1 Add optional `p_week_id` parameter to fn_allocate_thread signature
- [x] 4.2 Update WHERE clause to include RESERVED_FOR_ORDER status
- [x] 4.3 Add logic to set original_week_id when allocating reserved cones
- [x] 4.4 Add auto-loan record when p_week_id provided and differs from cone's reserved_week_id; quantity_meters = SUM(allocated_cones.quantity_meters)
- [x] 4.5 Add reverse transition logic per D9: on cancel/split, if cone has original_week_id and target week valid → restore RESERVED_FOR_ORDER, else → AVAILABLE ← (verify: allocation works for both statuses, loan auto-recorded, reverse transitions correct)

## 5. Propagate week_id to allocation RPC

Target: Modify `server/routes/allocations.ts` where fn_allocate_thread is called, and `server/routes/weeklyOrder.ts` where allocations are created

- [x] 5.1 Add `week_id` column to `thread_allocations` table (nullable FK to thread_order_weeks), with index
- [x] 5.2 Modify WO allocation creation in `POST /api/weekly-orders/:id/results` (`weeklyOrder.ts:1852`) to persist `week_id = :weekId` when inserting allocation rows. Keep existing `order_id = "WO-{weekId}-{style_code}-{spec_id}"` format for display (order_id is NOT authoritative for week resolution)
- [x] 5.3 Modify `POST /api/allocations/:id/execute` in `allocations.ts:464` to pass `p_week_id` from allocation.week_id to fn_allocate_thread RPC
- [x] 5.4 Modify `POST /api/allocations/:id/ready` in `allocations.ts:774` similarly to pass p_week_id
- [x] 5.5 Modify allocation cancel handler to call fn_allocate_thread reverse logic (restore RESERVED_FOR_ORDER if applicable) ← (verify: WO-origin allocations have week_id populated, allocation execution passes p_week_id to RPC, auto-loan triggers correctly, cancel restores reservation)

## 6. Weekly Order Confirm/Cancel (Modify existing PATCH route)

- [x] 6.1 Modify `PATCH /api/weekly-orders/:id/status` handler: when status=CONFIRMED, call `fn_confirm_week_with_reserve` (atomic per D8)
- [x] 6.2 Add retry/backoff logic if skipped_locked > 0: retry up to 3 times with 100ms delay (per D12)
- [x] 6.3 Return response with `{ data: { week, reservation_summary[] }, error }` format
- [x] 6.4 When status=CANCELLED, check for active loans first (D10): query thread_order_loans for from_week_id OR to_week_id = :id AND deleted_at IS NULL. If exist → return error "Không thể hủy khi còn khoản mượn/cho mượn chưa thanh toán"
- [x] 6.5 When no active loans, call fn_release_week_reservations ← (verify: atomic confirm, retry works, cancel blocked if loans exist)

## 7. Delivery Receipt Auto-Reserve

- [x] 7.1 Create `fn_receive_delivery(delivery_id, received_qty, warehouse_id, received_by)` RPC per D11: lock delivery row FOR UPDATE, increment received_quantity atomically, create cones, calculate shortage, auto-reserve, return summary
- [x] 7.2 Modify `POST /api/weekly-orders/deliveries/:deliveryId/receive` to call fn_receive_delivery instead of manual read-modify-write
- [x] 7.3 Return `{ cones_created, cones_reserved, remaining_shortage }` in response ← (verify: atomic receive, no lost-update, auto-reserve works)

## 8. Loan Management Endpoints

Note: Soft-delete filter `.is('deleted_at', null)` applies ONLY to `thread_order_loans` table (Task 8.2). Reservations endpoint (Task 8.3) queries `thread_inventory` which has no deleted_at column.

- [x] 8.1 Create `POST /api/weekly-orders/:id/loans` - call fn_borrow_thread (atomic per D14), get created_by from auth context (NOT from client)
- [x] 8.2 Create `GET /api/weekly-orders/:id/loans` - loan history (given and received) from thread_order_loans, filter deleted_at IS NULL
- [x] 8.3 Create `GET /api/weekly-orders/:id/reservations` - reserved cones list from thread_inventory WHERE reserved_week_id = :id (no deleted_at filter - table has no soft-delete) ← (verify: manual borrow works atomically, loan history excludes soft-deleted records, auth enforced)

## 9. Frontend Services & Composables

- [x] 9.1 Add loan/reservation methods to `weeklyOrderService.ts`: createLoan, getLoans, getReservations
- [x] 9.2 Update `updateStatus` to handle new response shape: `{ data: { week, reservation_summary } }`
- [x] 9.3 Create `useWeeklyOrderReservations` composable for reservation state with refetch capability
- [x] 9.4 Extend `useWeeklyOrder` composable with loan methods ← (verify: services call correct endpoints, response shape handled correctly)

## 10. Frontend - Weekly Order Detail Page

Target: Create new `src/pages/thread/weekly-order/[id].vue` for detail view (index.vue is list page)

- [x] 10.1 Create route `src/pages/thread/weekly-order/[id].vue` with tabs for: Overview, Reservations, Loans, Deliveries
- [x] 10.2 Add navigation from index.vue list to detail page on row click
- [x] 10.3 Show per-thread-type reservation status {needed, reserved, shortage} on Overview tab
- [x] 10.4 Add expandable section to view reserved cone list on Reservations tab
- [x] 10.5 Add realtime subscription or refetch on focus for reservation/loan data ← (verify: routing works, reservation status shows correctly, data stays fresh)

## 11. Frontend - Loan Dialog

- [x] 11.1 Create `LoanDialog.vue` component (select target WO via AppSelect, thread type, quantity, reason via AppInput)
- [x] 11.2 Integrate loan dialog into detail page Loans tab (button "Mượn chỉ" using AppButton)
- [x] 11.3 Display loan history (given/received) as DataTable on Loans tab ← (verify: full UI flow works end-to-end, uses AppInput/AppSelect/AppButton)

## 12. Testing & Validation

- [ ] 12.1 Test atomic confirm with multiple thread types (all succeed or all rollback)
- [ ] 12.2 Test concurrent confirm requests (retry/backoff for SKIP LOCKED)
- [ ] 12.3 Test cancel blocked when active loans exist
- [ ] 12.4 Test delivery receipt atomic receive + auto-reserve (no lost-update)
- [ ] 12.5 Test concurrent delivery receives (row locking works)
- [ ] 12.6 Test manual borrow atomic with row locking (no over-borrow)
- [ ] 12.7 Test allocation cancel restores RESERVED_FOR_ORDER if applicable
- [ ] 12.8 Test soft-deleted loan records excluded from GET endpoints
- [ ] 12.9 Verify existing issue flow still works with reserved cones ← (verify: all spec scenarios pass, no regression in existing flows, race conditions handled)
