## Context

The thread loan system (`thread_order_loans`) was built as part of the weekly-order-reserve-inventory change. It tracks when one WO week borrows cones from another. Currently:

- `fn_borrow_thread()` creates loans by moving cones (changing `reserved_week_id`)
- `fn_auto_return_loans()` automatically returns surplus cones to lender weeks when NCC delivers
- `fn_receive_delivery()` triggers auto-return after creating new cones
- Loans have `status` column: ACTIVE or SETTLED
- SETTLED is set when auto-return returns enough cones in a single delivery event

**Current gap**: No partial return tracking (`returned_cones`), no manual return capability, no per-event return history. The SETTLED condition (`v_returned_this_loan >= v_loan.quantity_cones`) only considers the current auto-return batch, not cumulative returns across multiple events.

**Existing code**:
- DB: `thread_order_loans` table, `fn_auto_return_loans()`, `fn_loan_detail_by_thread_type()`
- Backend: `server/routes/weeklyOrder.ts` (loan routes at lines 800+)
- Frontend: `src/pages/thread/loans.vue`, `src/pages/thread/weekly-order/[id].vue` (loan tab), `src/components/thread/weekly-order/LoanDialog.vue`
- Types: `src/types/thread/weeklyOrder.ts` (ThreadOrderLoan, LoanDashboardSummary, LoanDetailByType)
- Service: `src/services/weeklyOrderService.ts` (loan methods)

## Goals / Non-Goals

**Goals:**
- Track partial returns with `returned_cones` column on `thread_order_loans`
- Allow manual return via FIFO selection from borrower's RESERVED_FOR_ORDER cones
- Record every return event (auto + manual) in `thread_loan_return_logs`
- Fix SETTLED condition to use cumulative `returned_cones` (not single-batch count)
- Show return progress and history in both `loans.vue` and `weekly-order/[id].vue`

**Non-Goals:**
- Changing the auto-return trigger mechanism (still triggered by delivery receipt)
- Adding new permissions (uses existing `thread.allocations.view`)
- Undo/reverse a return after it's been made
- Bulk manual return across multiple loans at once

## Decisions

### D1: Manual return cone selection — RESERVED_FOR_ORDER from borrower (FIFO)

**Decision**: `fn_manual_return_loan()` selects cones with `status = 'RESERVED_FOR_ORDER' AND reserved_week_id = loan.to_week_id AND thread_type_id = loan.thread_type_id`, ordered by `received_date ASC` (FIFO).

**Rationale**: Auto-return already handles AVAILABLE cones. Manual return means the borrower deliberately returns from their own reserves. This always has cones available (borrower is holding them), unlike AVAILABLE-only approach which may find 0 cones. The two mechanisms complement each other:
- AUTO: surplus AVAILABLE cones → lender (triggered by delivery)
- MANUAL: borrower's RESERVED cones → lender (triggered by user)

**Alternative rejected**: Option A (AVAILABLE only) — may fail if no free cones exist. Option C (both) — unnecessarily complex two-step logic.

### D2: Return history table — separate `thread_loan_return_logs`

**Decision**: New table rather than embedding in `thread_order_loans`.

**Rationale**: One loan can have multiple return events (3 auto-returns + 1 manual). A separate log table naturally supports N events per loan. Fields: `loan_id`, `cones_returned`, `return_type` (AUTO|MANUAL), `returned_by`, `notes`, `created_at`.

### D3: SETTLED condition fix — cumulative check

**Decision**: Change `fn_auto_return_loans` and `fn_manual_return_loan` to check: `(loan.returned_cones + newly_returned) >= loan.quantity_cones`.

**Rationale**: Current code checks `v_returned_this_loan >= v_loan.quantity_cones` which ignores prior partial returns. Example: borrow 10, manual return 6, then auto return 4 → current logic says `4 >= 10 = FALSE` (stays ACTIVE). Fixed logic: `6 + 4 >= 10 = TRUE` (correctly SETTLED).

### D4: Manual return cone reassignment

**Decision**: Selected cones get `reserved_week_id = loan.from_week_id` (lender week). Status stays `RESERVED_FOR_ORDER`.

**Rationale**: Cones move from borrower's reserve to lender's reserve — exactly the reverse of `fn_borrow_thread()`.

### D5: UI placement — both locations

**Decision**: Manual return button + history display in both `loans.vue` (global view) and `weekly-order/[id].vue` (per-week view).

**Rationale**: `loans.vue` for manager oversight across all weeks, `weekly-order/[id].vue` for per-week operators. Same components reused (`ManualReturnDialog`, `LoanDetailDialog`).

### D6: History UI — expandable preview + dialog

**Decision**: Expandable row shows 3 most recent return logs inline. Click "Xem đầy đủ" opens `LoanDetailDialog` with full history + manual return action.

**Rationale**: Quick preview without navigation, full detail when needed.

## Risks / Trade-offs

- **[Risk] Race condition on manual return** → Mitigation: `SELECT ... FOR UPDATE` row lock on loan record in `fn_manual_return_loan()`. Second user gets validation error "Chỉ có thể trả tối đa N cuộn".
- **[Risk] Backfill `returned_cones` for existing SETTLED loans** → Mitigation: Migration sets `returned_cones = quantity_cones` for existing SETTLED loans, `returned_cones = 0` for ACTIVE. No return logs backfilled (history starts from this change).
- **[Risk] Manual return reduces borrower's available cones** → Mitigation: This is intentional — user manually triggers it, understands the impact. UI shows clear warning "Tuần X sẽ mất N cuộn".
- **[Trade-off] No undo for returns** → Accepted: Returns are physical cone movements. Reversal would require a new borrow operation.
