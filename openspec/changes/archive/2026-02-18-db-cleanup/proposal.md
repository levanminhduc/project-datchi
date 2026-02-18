## Why

The database has accumulated naming inconsistencies, orphaned objects, and duplicate indexes across 4 migration waves (39 tables, 198 indexes). An audit of the live schema revealed:
- **2 orphaned functions** (`fn_calculate_quota`, `fn_check_quota`) that reference a dropped V1 table — calling them causes runtime errors
- **11 duplicate indexes** where a UNIQUE constraint already creates an implicit index, wasting storage that scales with data
- **2 enums with lowercase values** (`permission_action`) while all others use UPPERCASE — inconsistent convention
- **2 VARCHAR columns** that should be ENUMs (`purchase_orders.priority`, `notifications.type`)
- **Dual-write columns** not yet retired (`lots.supplier` VARCHAR alongside `lots.supplier_id` FK)
- **Inconsistent naming** across triggers, indexes, constraints, and columns

This cleanup ensures the schema is consistent, free of dead code, and optimized before production data grows. No business logic changes — purely structural.

**Exclusions:** The `employees` table and `positions` table are NOT in scope (used by external projects).

## What Changes

### Dead Code Removal
- **DROP** `fn_calculate_quota()` — references dropped V1 table `thread_issue_requests`
- **DROP** `fn_check_quota()` — references dropped V1 table `thread_issue_requests`
- **MERGE** `fn_update_system_settings_timestamp()` into generic `fn_update_updated_at_column()` (remove table-specific duplicate)

### Duplicate Index Cleanup
- **DROP 11 manual indexes** that duplicate UNIQUE constraint auto-indexes:
  - `idx_colors_name` (duplicate of `colors_name_key`)
  - `idx_employees_employee_id` (duplicate of `employees_employee_id_key`)
  - `idx_permissions_code` (duplicate of `permissions_code_key`)
  - `idx_suppliers_code` (duplicate of `suppliers_code_key`)
  - `idx_styles_style_code` (duplicate of `styles_style_code_key`)
  - `idx_purchase_orders_po_number` (duplicate of `purchase_orders_po_number_key`)
  - `idx_thread_types_code` (duplicate of `thread_types_code_key`)
  - `idx_warehouses_code` (duplicate of `warehouses_code_key`)
  - `idx_lots_lot_number` (duplicate of `lots_lot_number_key`)
  - `idx_thread_issues_issue_code` (duplicate of `thread_issues_issue_code_key`)
  - `idx_thread_inventory_cone_id` (duplicate of `thread_inventory_cone_id_key`)

### Enum Standardization
- **Convert** `permission_action` enum values to UPPERCASE: `view→VIEW`, `create→CREATE`, `edit→EDIT`, `delete→DELETE`, `manage→MANAGE`
- **Convert** `purchase_orders.priority` from VARCHAR to new `po_priority` enum with UPPERCASE values
- **Convert** `notifications.type` from VARCHAR+CHECK to new `notification_type` enum

### Dual-Write Column Retirement
- **DROP** `lots.supplier` VARCHAR column (keep only `lots.supplier_id` FK)

### Naming Standardization
- **Rename trigger** `update_warehouses_updated_at` → `trigger_warehouses_updated_at` (match convention)
- **Rename indexes** on `thread_issue_return_logs` to use full table name prefix:
  - `idx_return_logs_issue_id` → `idx_thread_issue_return_logs_issue_id`
  - `idx_return_logs_line_id` → `idx_thread_issue_return_logs_line_id`
- **Rename indexes** on `employee_refresh_tokens` to use full table name:
  - `idx_refresh_tokens_employee` → `idx_employee_refresh_tokens_employee_id`
  - `idx_refresh_tokens_expires` → `idx_employee_refresh_tokens_expires_at`
- **Rename** `idx_warehouses_active` → `idx_warehouses_is_active` (match column name)
- **Name unnamed UNIQUE constraints** on junction tables:
  - `color_supplier(color_id, supplier_id)` → `uq_color_supplier_color_supplier`
  - `thread_type_supplier(thread_type_id, supplier_id)` → `uq_thread_type_supplier_type_supplier`
  - `thread_type_supplier(supplier_id, supplier_item_code)` → `uq_thread_type_supplier_supplier_item`

### Timestamp Nullability Fix
- **ALTER** `thread_order_items.updated_at` to `NOT NULL DEFAULT NOW()`
- **ALTER** `thread_order_results.created_at` and `updated_at` to `NOT NULL DEFAULT NOW()`

### Redundant Column Cleanup
- **DROP** `employee_roles.assigned_at` (redundant with `created_at`)
- **DROP** `employee_permissions.assigned_at` (redundant with `created_at`)

### View Rename
- **Rename** `v_issue_reconciliation_v2` → `v_issue_reconciliation` (V1 already dropped, `_v2` suffix no longer needed)

## Capabilities

### New Capabilities
- `drop-orphaned-functions`: Drop fn_calculate_quota and fn_check_quota that reference dropped V1 tables
- `drop-duplicate-indexes`: Remove 11 manual indexes that duplicate UNIQUE constraint auto-indexes
- `enum-standardization`: Convert permission_action to UPPERCASE, convert priority/notification type VARCHAR to ENUM
- `naming-standardization`: Rename triggers, indexes, constraints to follow project conventions
- `retire-dual-write`: Drop lots.supplier VARCHAR, drop redundant assigned_at columns, fix nullable timestamps
- `backend-code-sync`: Update all backend code (routes, services, types, Zod schemas) to match renamed DB objects
- `frontend-code-sync`: Update frontend types, composables, and services to match enum/column changes

### Modified Capabilities
- `schema-cleanup-migration`: Additional cleanup items discovered by comprehensive audit
- `schema-cleanup-code-sync`: Additional code sync for enum and column changes

## Impact

- **Database**: 1 new migration file with all DDL changes (idempotent, wrapped in transaction)
- **Backend (server/)**: Update Zod schemas for enum value changes (UPPERCASE permission_action), update any references to `lots.supplier`, `assigned_at`, priority values
- **Frontend (src/)**: Update TypeScript types for enum changes, update any hardcoded lowercase permission values
- **Views**: `v_issue_reconciliation_v2` renamed — backend queries referencing old name must update
- **Risk**: LOW — no business logic changes, only naming/structural cleanup. All changes are additive renames or drops of unused objects. Migration is idempotent and transactional.
- **Rollback**: Each section of migration is independently reversible
