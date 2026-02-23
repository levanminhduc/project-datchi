## Why

Weekly orders (`thread_order_weeks`) have a `created_by` column that is never populated. There is no `updated_by` column. This means there is no audit trail of who created or last modified a weekly order. Business needs to know which employee created each weekly order for accountability and traceability.

## What Changes

- Populate `created_by` with the employee's `full_name` when creating a weekly order (POST)
- Add `updated_by VARCHAR(50)` column to `thread_order_weeks` table
- Populate `updated_by` with the employee's `full_name` when updating a weekly order (PUT)
- Update backend and frontend types to include `updated_by`
- Display "Người tạo" (created_by) column in `WeekHistoryDialog`

## Capabilities

### New Capabilities
- `weekly-order-user-tracking`: Track which employee created and last updated each weekly order, storing `full_name` in `created_by`/`updated_by` columns

### Modified Capabilities

## Impact

- **Database**: New migration adding `updated_by` column to `thread_order_weeks`
- **Backend**: `server/routes/weeklyOrder.ts` — POST and PUT handlers query `employees.full_name` from auth context
- **Backend Types**: `server/types/weeklyOrder.ts` — add `updated_by` field
- **Frontend Types**: `src/types/thread/weeklyOrder.ts` — add `updated_by` field
- **Frontend UI**: `src/components/thread/weekly-order/WeekHistoryDialog.vue` — add "Người tạo" column
