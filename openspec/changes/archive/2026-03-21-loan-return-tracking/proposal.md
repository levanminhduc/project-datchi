## Why

The thread loan system (`thread_order_loans`) tracks borrowing between weekly order weeks but lacks:
1. **Partial return tracking** — No `returned_cones` column. When 10 cones are borrowed and 6 returned, the system only knows ACTIVE vs SETTLED, not the partial progress.
2. **Manual return capability** — Returns only happen automatically via `fn_auto_return_loans()` when NCC delivers surplus. No way for users to manually trigger returns.
3. **Return history** — No audit trail of individual return events. Cannot answer "when was each return made, how many cones, by whom?"

These gaps cause: misleading UI ("Trả X cuộn cho 0 khoản mượn đã thanh toán" when partial returns exist), inability to manually settle loans when auto-return conditions aren't met, and no accountability trail for loan management.

## What Changes

- Add `returned_cones` column to `thread_order_loans` for partial return tracking
- Create `thread_loan_return_logs` table for per-event return history
- Create `fn_manual_return_loan()` DB function — user enters quantity, system selects cones from borrower's RESERVED_FOR_ORDER inventory (FIFO), reassigns to lender week
- Update `fn_auto_return_loans()` to write return logs and maintain `returned_cones` counter; fix SETTLED logic to account for cumulative returns
- Add API endpoint `POST /api/weekly-orders/:weekId/loans/:loanId/manual-return`
- Add API endpoint `GET /api/weekly-orders/loans/:loanId/return-logs`
- Add `ManualReturnDialog` component — quantity input + notes, validates against remaining debt
- Add `LoanDetailDialog` component — full loan info + return history timeline
- Update `loans.vue` — add "Đã trả" column to summary, expandable return log preview in loan list, manual return button for ACTIVE loans
- Update `weekly-order/[id].vue` loan tab — add "Đã trả" column, manual return button, click-to-open detail dialog
- Update `fn_loan_detail_by_thread_type()` to include `returned_cones` in response
- Add `returned_cones` to `LoanDashboardSummary` aggregate query

## Capabilities

### New Capabilities
- `manual-loan-return`: Manual return of borrowed cones — user specifies quantity, system FIFO-selects from borrower's reserved inventory, reassigns to lender, logs the event
- `loan-return-history`: Per-event return audit trail — records each auto/manual return with timestamp, quantity, actor, and notes

### Modified Capabilities
- `thread-loan-management`: Add `returned_cones` tracking to loans, fix SETTLED condition to use cumulative returns, update summary dashboard with return progress

## Impact

- **Database**: New table `thread_loan_return_logs`, new column on `thread_order_loans`, new function `fn_manual_return_loan()`, updated functions `fn_auto_return_loans()` and `fn_loan_detail_by_thread_type()`
- **Backend**: New routes in `server/routes/weeklyOrder.ts`, new Zod validation schema
- **Frontend types**: Update `ThreadOrderLoan` interface (add `returned_cones`), add `LoanReturnLog` type, add `ManualReturnDTO`
- **Frontend services**: New methods in `weeklyOrderService.ts`
- **Frontend composables**: Update loan-related composables if any
- **Frontend pages**: `loans.vue`, `weekly-order/[id].vue`
- **Frontend components**: New `ManualReturnDialog.vue`, new `LoanDetailDialog.vue`
- **Permission**: Uses existing `thread.allocations.view`
