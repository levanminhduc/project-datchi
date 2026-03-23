## Why

The database has accumulated significant technical debt across 42 tables: FK migration columns never populated (color_id, supplier_id = 100% NULL), dual v1/v2 issue systems running in parallel, inconsistent naming conventions (functions, triggers, status casing), and missing standard columns (updated_at, deleted_at). Live data analysis confirmed these issues exist in production data, not just schema definitions. This standardization is needed now to prevent confusion as the system grows and to unblock future features that depend on normalized FK relationships.

## What Changes

- **BREAKING**: Backfill and enforce FK columns (color_id, supplier_id) on thread_types, then drop legacy text columns (color, supplier, color_code)
- **BREAKING**: Rename 12 SQL functions to add `fn_` prefix (e.g., `allocate_thread` → `fn_allocate_thread`) and update all backend RPC calls
- **BREAKING**: Rename 3 trigger functions to add `fn_` prefix
- **BREAKING**: Standardize status values to UPPERCASE enums across purchase_orders, thread_order_weeks, thread_order_deliveries
- **BREAKING**: Migrate v1 issue data (thread_issue_requests/items/returns) to v2 tables, then drop v1 tables, v1 view, and v1 backend routes (~1000 LOC)
- Rename 8 triggers from `update_*` pattern to `trigger_*` pattern for consistency
- Add missing `created_at`/`updated_at` columns and triggers to 15 tables
- Add `deleted_at` soft delete column to master data tables
- Drop deprecated `employees.refresh_token` and `employees.refresh_token_expires_at` columns
- Document cone_id naming convention (FK to thread_inventory.id, not to cone_id varchar)
- Standardize junction table naming consistency

## Capabilities

### New Capabilities
- `fk-normalization`: Backfill FK data, enforce constraints, remove legacy text columns from thread_types
- `function-naming`: Rename all SQL functions/trigger-functions to use consistent `fn_` prefix
- `trigger-naming`: Rename triggers to consistent `trigger_*` pattern
- `status-standardization`: Migrate varchar status values to UPPERCASE PostgreSQL enums
- `v1-issue-deprecation`: Migrate v1 issue data to v2 format, then drop v1 tables/view/routes
- `timestamp-compliance`: Add missing created_at/updated_at/deleted_at columns and triggers
- `schema-cleanup`: Drop deprecated columns, document naming conventions, fix junction table names

### Modified Capabilities
- `thread-issue-reconciliation`: Reconciliation route switches from v1 view to v2 view exclusively

## Impact

- **SQL**: 10+ migration files affecting 42 tables, 25 functions, 41 triggers
- **Backend**: server/routes/threads.ts (remove dual-write), server/routes/issues.ts (delete entirely), server/routes/reconciliation.ts (switch to v2), all .rpc() calls for renamed functions, Zod validation schemas, TypeScript types
- **Frontend**: src/types/thread/thread-type.ts (remove legacy fields), src/components/thread/ThreadTypeFormDialog.vue (FK only), status display updates for order tables, remove any remaining v1 issue references
- **Risk**: Function rename + backend update must deploy together. V1 data migration requires verification before drop.
