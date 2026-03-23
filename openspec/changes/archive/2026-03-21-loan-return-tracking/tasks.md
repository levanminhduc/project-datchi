## 1. Database Migration — Schema Changes

- [x] 1.1 Add `returned_cones INTEGER NOT NULL DEFAULT 0` column to `thread_order_loans`
- [x] 1.2 Backfill: SET `returned_cones = quantity_cones` WHERE `status = 'SETTLED'`, SET `returned_cones = 0` WHERE `status = 'ACTIVE'`
- [x] 1.3 Create `thread_loan_return_logs` table: `id SERIAL PK`, `loan_id FK`, `cones_returned INTEGER NOT NULL`, `return_type VARCHAR(10) CHECK IN ('AUTO','MANUAL')`, `returned_by VARCHAR(100) NOT NULL`, `notes TEXT NULL`, `created_at TIMESTAMPTZ DEFAULT NOW()` ← (verify: table created, FK constraint exists, CHECK constraint on return_type)

## 2. Database Migration — Functions

- [x] 2.1 Create `fn_manual_return_loan(p_loan_id INTEGER, p_quantity INTEGER, p_returned_by VARCHAR, p_notes TEXT DEFAULT NULL)`: SELECT loan FOR UPDATE, validate quantity <= (quantity_cones - returned_cones), find RESERVED_FOR_ORDER cones (borrower week + thread_type, FIFO by received_date), update cones reserved_week_id to lender, increment returned_cones, set SETTLED if full, insert return log, return JSON result
- [x] 2.2 Update `fn_auto_return_loans()`: after each loan's return batch, UPDATE `returned_cones += v_returned_this_loan`, INSERT into `thread_loan_return_logs` (return_type='AUTO', returned_by='system'), fix SETTLED condition to `(returned_cones + v_returned_this_loan) >= quantity_cones`
- [x] 2.3 Update `fn_loan_detail_by_thread_type()`: add `borrowed_returned_cones` (SUM returned_cones WHERE to_week_id = p_week_id) and `lent_returned_cones` (SUM returned_cones WHERE from_week_id = p_week_id) to response ← (verify: fn_manual_return_loan handles race condition with FOR UPDATE, fn_auto_return_loans SETTLED condition uses cumulative check, return logs inserted for both auto and manual)

## 3. Backend — Types & Validation

- [x] 3.1 Add `returned_cones` to `ThreadOrderLoan` interface in `server/types/weeklyOrder.ts`
- [x] 3.2 Create Zod schema `manualReturnSchema` in `server/validation/`: `{ quantity: z.number().int().positive(), notes: z.string().optional() }`
- [x] 3.3 Add `LoanReturnLog` interface to `server/types/weeklyOrder.ts`: `{ id, loan_id, cones_returned, return_type, returned_by, notes, created_at }`

## 4. Backend — API Routes

- [x] 4.1 Add `POST /:weekId/loans/:loanId/manual-return` route in `server/routes/weeklyOrder.ts` — validate body with manualReturnSchema, call `fn_manual_return_loan()` via supabase RPC, return result. Place BEFORE generic `/:id` routes
- [x] 4.2 Add `GET /loans/:loanId/return-logs` route — query `thread_loan_return_logs` WHERE loan_id, order by created_at DESC ← (verify: route order correct — specific routes before generic, auth middleware applied, Zod validation on manual-return)

## 5. Frontend — Types & Service

- [x] 5.1 Add `returned_cones` to `ThreadOrderLoan` in `src/types/thread/weeklyOrder.ts`
- [x] 5.2 Add `LoanReturnLog` type: `{ id, loan_id, cones_returned, return_type: 'AUTO'|'MANUAL', returned_by, notes, created_at }`
- [x] 5.3 Add `ManualReturnDTO` type: `{ quantity: number, notes?: string }`
- [x] 5.4 Add `ManualReturnResult` type: `{ success, returned, remaining, settled }`
- [x] 5.5 Add `manualReturnLoan(weekId, loanId, dto)` method to `weeklyOrderService.ts`
- [x] 5.6 Add `getLoanReturnLogs(loanId)` method to `weeklyOrderService.ts`

## 6. Frontend — ManualReturnDialog Component

- [x] 6.1 Create `src/components/thread/weekly-order/ManualReturnDialog.vue` — props: `loan: ThreadOrderLoan`, `modelValue: boolean`. Show loan context (from→to week, thread type, borrowed/returned/remaining). Input for quantity (max = remaining), optional notes textarea
- [x] 6.2 Validation: quantity > 0 AND quantity <= (quantity_cones - returned_cones), disable submit when invalid
- [x] 6.3 Submit: call `weeklyOrderService.manualReturnLoan()`, on success emit `returned` event + snackbar.success, on error snackbar.error + stay open ← (verify: dialog shows correct remaining, validation prevents over-return, submit calls API and handles success/error)

## 7. Frontend — LoanDetailDialog Component

- [x] 7.1 Create `src/components/thread/weekly-order/LoanDetailDialog.vue` — props: `loanId: number`, `modelValue: boolean`. Fetch loan + return logs on open
- [x] 7.2 Header section: loan direction (from→to), thread type, quantities (borrowed, returned/total, remaining), status badge
- [x] 7.3 Return history timeline: list all logs newest-first, icon (robot=AUTO, wrench=MANUAL), timestamp, cones count, actor, notes
- [x] 7.4 Loading state (spinner), error state ("Lỗi tải lịch sử" + retry), empty state ("Chưa có lần trả nào")
- [x] 7.5 "Trả thủ công" button (only for ACTIVE) that opens ManualReturnDialog, refresh logs on return ← (verify: dialog loads logs correctly, handles all states, manual return button hidden for SETTLED, refreshes after return)

## 8. Frontend — Update loans.vue

- [x] 8.1 Add "Đã trả" column to summary table (Section 1): aggregate SUM(returned_cones) per week — update `fn_loan_dashboard_summary` or add client-side aggregation
- [x] 8.2 Add "Đã trả" column to loan list table (Section 2): show "X/Y" format (returned_cones/quantity_cones)
- [x] 8.3 Add "Trả thủ công" button column for ACTIVE loans → opens ManualReturnDialog
- [x] 8.4 Add expandable row with return log preview (3 most recent) + "Xem đầy đủ" link → opens LoanDetailDialog
- [x] 8.5 Replace `q-table` (current anti-pattern) in loan list section with `DataTable` component ← (verify: summary shows aggregate returned_cones, loan rows show X/Y progress, manual return button works, expandable preview loads logs, DataTable used instead of q-table)

## 9. Frontend — Update weekly-order/[id].vue Loan Tab

- [x] 9.1 Add "Đã trả" column to loan tab table: show "X/Y" format
- [x] 9.2 Add "Trả thủ công" button for ACTIVE loans → opens ManualReturnDialog
- [x] 9.3 Make loan rows clickable → opens LoanDetailDialog
- [x] 9.4 Refresh loan data after manual return ← (verify: loan tab shows returned progress, manual return works from weekly order page, detail dialog opens on click)

## 10. Frontend — Update LoanDetailByType

- [x] 10.1 Add `borrowed_returned_cones` and `lent_returned_cones` to `LoanDetailByType` interface
- [x] 10.2 Update detail columns in `loans.vue` expandable week breakdown to show return progress per thread type ← (verify: thread-type breakdown includes return data, all types compile with npm run type-check)
