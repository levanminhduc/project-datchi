## Context

The `thread_order_weeks` table already has a `created_by VARCHAR(50)` column (added in migration `20260208_create_weekly_thread_orders.sql`) but it is never populated — the POST handler in `server/routes/weeklyOrder.ts` omits it during insert. There is no `updated_by` column.

The auth middleware attaches `AuthContext` with `employeeId` (numeric PK) and `employeeCode` (string username) but not `full_name`. The established pattern in the codebase (e.g., `auth.ts` GET `/me`) is to query the `employees` table inline to retrieve `full_name`.

## Goals / Non-Goals

**Goals:**
- Populate `created_by` with employee `full_name` on weekly order creation
- Add and populate `updated_by` with employee `full_name` on weekly order update
- Display creator name in `WeekHistoryDialog`

**Non-Goals:**
- Changing JWT payload or `AuthContext` to include `full_name` (avoid breaking changes)
- Adding FK constraint from `created_by`/`updated_by` to `employees` (storing name string for audit trail — if employee renames, historical records keep original name)
- Tracking user for other operations (confirm, cancel, delete) — can be added later

## Decisions

**D1: Store `full_name` string, not employee ID**
- Rationale: `created_by` column is already `VARCHAR(50)`. Storing the display name directly avoids JOIN on every read. Consistent with existing column definition.
- Alternative: Store `employee_id` (FK) and JOIN on read — rejected because column already exists as VARCHAR and changing type requires data migration.

**D2: Query `employees` table inline in route handler**
- Rationale: Consistent with existing codebase pattern (e.g., `auth.ts:372-388`). One extra query per create/update is negligible overhead.
- Alternative: Add `full_name` to JWT/AuthContext — rejected to avoid breaking changes across all auth flows.

**D3: Single migration for `updated_by` column**
- Rationale: `created_by` already exists. Only need to add `updated_by`.

## Risks / Trade-offs

- [Employee name change] → Historical records keep the old name. Acceptable for audit trail purposes.
- [Extra DB query per create/update] → Negligible performance impact. One simple `SELECT full_name` by PK.
