## Why

Users who perform manual stock entries (via "Nhap Thu Cong") currently have no way to review past entries. When discrepancies arise or auditing is needed, there is no traceable history of who entered what and when. Adding a manual entry history view provides accountability and traceability for manual stock operations.

## What Changes

- Add a `created_by_employee_id` column to the `lots` table to track which employee created each manual entry
- Modify `POST /api/stock` to persist the authenticated employee's ID when creating lots
- Add `GET /api/stock/manual-history` endpoint returning paginated manual entry lots (prefix `MC-LOT-%`)
- Add `getManualEntryHistory()` method to `stockService.ts`
- Add `ManualEntryHistoryDialog.vue` component with a server-side paginated table
- Add a "Lich su nhap" button on the inventory page (gated by `canReceive` permission)

## Capabilities

### New Capabilities
- `manual-entry-history`: View paginated history of manual stock entries, showing date, thread type, warehouse, cone counts, lot number, supplier, and the employee who created the entry.

### Modified Capabilities
- `manual-stock-entry`: The `POST /api/stock` handler now also persists `created_by_employee_id` from JWT claims when creating a lot record. This is a backward-compatible addition (column is nullable).

## Impact

- **Database**: New nullable column `created_by_employee_id` on `lots` table (FK to `employees.id`). Non-breaking -- existing rows get NULL.
- **Backend**: `server/routes/stock.ts` -- modified POST handler + new GET endpoint. New Zod schema for query params.
- **Frontend**: `src/services/stockService.ts` -- new method. New dialog component. Minor addition to `src/pages/thread/inventory.vue`.
- **Permissions**: Reuses existing `thread.batch.receive` permission -- no new permissions needed.
