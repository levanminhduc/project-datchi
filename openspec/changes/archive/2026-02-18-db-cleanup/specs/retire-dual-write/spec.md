## ADDED Requirements

### Requirement: Drop lots.supplier VARCHAR column
The migration SHALL drop the `supplier` VARCHAR column from the `lots` table. Only `supplier_id` (FK to suppliers) SHALL remain.

#### Scenario: lots.supplier column removed
- **WHEN** the migration runs successfully
- **THEN** `SELECT column_name FROM information_schema.columns WHERE table_name = 'lots' AND column_name = 'supplier'` SHALL return 0 rows
- **THEN** `lots.supplier_id` FK column SHALL still exist

### Requirement: Drop redundant assigned_at from employee_roles
The migration SHALL drop the `assigned_at` column from `employee_roles` since `created_at` serves the same purpose.

#### Scenario: assigned_at removed from employee_roles
- **WHEN** the migration runs successfully
- **THEN** `employee_roles` SHALL NOT have an `assigned_at` column
- **THEN** `employee_roles.created_at` SHALL exist with `NOT NULL DEFAULT NOW()`

### Requirement: Drop redundant assigned_at from employee_permissions
The migration SHALL drop the `assigned_at` column from `employee_permissions` since `created_at` serves the same purpose.

#### Scenario: assigned_at removed from employee_permissions
- **WHEN** the migration runs successfully
- **THEN** `employee_permissions` SHALL NOT have an `assigned_at` column
- **THEN** `employee_permissions.created_at` SHALL exist with `NOT NULL DEFAULT NOW()`

### Requirement: Fix nullable timestamps on thread_order tables
The migration SHALL alter `thread_order_items.updated_at`, `thread_order_results.created_at`, and `thread_order_results.updated_at` to `NOT NULL DEFAULT NOW()`.

#### Scenario: Timestamps are NOT NULL after migration
- **WHEN** the migration runs successfully
- **THEN** `thread_order_items.updated_at` SHALL have `is_nullable = 'NO'`
- **THEN** `thread_order_results.created_at` SHALL have `is_nullable = 'NO'`
- **THEN** `thread_order_results.updated_at` SHALL have `is_nullable = 'NO'`

### Requirement: Rename v_issue_reconciliation_v2 view
The migration SHALL drop `v_issue_reconciliation_v2` and recreate it as `v_issue_reconciliation` with identical definition.

#### Scenario: View renamed without _v2 suffix
- **WHEN** the migration runs successfully
- **THEN** `v_issue_reconciliation` view SHALL exist
- **THEN** `v_issue_reconciliation_v2` SHALL NOT exist
- **THEN** the new view SHALL return the same columns and data as the old view
