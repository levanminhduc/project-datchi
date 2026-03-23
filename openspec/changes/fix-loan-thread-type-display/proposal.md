## Why

The thread/loans page displays thread types using `code + name` (e.g., "CHI-40-TRA Chỉ Polyester TEX40 Trắng") instead of the project-standard identity format `"NCC - TEX xxx - Màu"` (e.g., "Coats Việt Nam - TEX 40 - Trắng"). Per CLAUDE.md, a thread type is uniquely identified by Supplier + Tex + Color. The current display makes it impossible to distinguish threads with the same tex/color from different suppliers.

## What Changes

- Backend `/loans/all` endpoint: expand `thread_types` select to include `tex_number`, supplier name (via `suppliers`), and color name (via `colors`)
- RPC `fn_loan_detail_by_thread_type`: add `supplier_name` to output by joining `suppliers` table
- Frontend `loans.vue`: update loan list column and detail-by-type columns to display `"NCC - TEX xxx - Màu"` format
- Frontend `LoanDialog.vue`: update thread selection table to show `"NCC - TEX xxx - Màu"` instead of separate code/name columns
- Type definition `ThreadOrderLoan.thread_type`: extend to include `tex_number`, `supplier`, and `color` nested objects

## Capabilities

### New Capabilities
- `loan-thread-display`: Standardize thread type display across loans page and dialogs to follow project identity convention (Supplier - TEX - Color)

### Modified Capabilities

## Impact

- **Backend**: `server/routes/weeklyOrder.ts` — `/loans/all` endpoint select clause
- **Database**: `fn_loan_detail_by_thread_type` RPC function — new migration to add supplier join
- **Frontend**: `src/pages/thread/loans.vue` — loan list columns, detail-by-type columns
- **Frontend**: `src/components/thread/weekly-order/LoanDialog.vue` — thread selection table columns and data loading
- **Types**: `src/types/thread/weeklyOrder.ts` — `ThreadOrderLoan` interface, `LoanDetailByType` interface
