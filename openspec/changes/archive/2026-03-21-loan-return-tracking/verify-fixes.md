## [2026-03-20] Round 1 (from spx-apply auto-verify)

### spx-arch-verifier
- Fixed: POST `/:weekId/loans/:loanId/manual-return` permission changed from `thread.allocations.view` to `thread.allocations.manage` — write operation requires write permission (server/routes/weeklyOrder.ts)

### spx-uiux-verifier
- Fixed: Added `loanLogErrors` Set to track fetch failures separately from empty data; added error state UI with "Lỗi tải lịch sử" + "Thử lại" button; refactored `toggleLoanExpand` to use shared `fetchLoanLogs()` helper; added `retryLoadLogs()` function (src/pages/thread/loans.vue)

## [2026-03-20] Round 2 (from spx-apply auto-verify re-run)

### spx-uiux-verifier
- Fixed: `LoanDetailDialog.loadLogs()` silently set `logs = []` on error — users saw "Chưa có lần trả nào" which was indistinguishable from genuine empty state. Added `logError` ref; `loadLogs()` now sets `logError = true` on failure; added error state UI block with "Lỗi tải lịch sử" + "Thử lại" button between the spinner and empty-state blocks (src/components/thread/weekly-order/LoanDetailDialog.vue)

### Notes
- Summary q-table in loans.vue: intentionally kept as `q-table` — tasks 8.1-8.5 only require DataTable for the loan list section (Section 2). Summary table has complex nested expand rows that are incompatible with DataTable wrapper and is not in scope for this change.
- W-001/W-002 from arch-verifier: summary table q-table and LoanDetailDialog.loadLoan() fallback are acknowledged non-critical items; summary table DataTable migration is a separate future task.
