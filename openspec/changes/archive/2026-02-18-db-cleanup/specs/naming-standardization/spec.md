## ADDED Requirements

### Requirement: Standardize trigger naming for warehouses
The migration SHALL rename the trigger `update_warehouses_updated_at` to `trigger_warehouses_updated_at` on the `warehouses` table.

#### Scenario: Trigger uses standard name
- **WHEN** the migration runs successfully
- **THEN** `trigger_warehouses_updated_at` SHALL exist on `warehouses`
- **THEN** `update_warehouses_updated_at` SHALL NOT exist

### Requirement: Standardize index names on thread_issue_return_logs
The migration SHALL rename indexes to use full table name prefix:
- `idx_return_logs_issue_id` → `idx_thread_issue_return_logs_issue_id`
- `idx_return_logs_line_id` → `idx_thread_issue_return_logs_line_id`

#### Scenario: Indexes use full table name prefix
- **WHEN** the migration runs successfully
- **THEN** `idx_thread_issue_return_logs_issue_id` and `idx_thread_issue_return_logs_line_id` SHALL exist
- **THEN** `idx_return_logs_issue_id` and `idx_return_logs_line_id` SHALL NOT exist

### Requirement: Standardize index names on employee_refresh_tokens
The migration SHALL rename indexes to use full table name prefix:
- `idx_refresh_tokens_employee` → `idx_employee_refresh_tokens_employee_id`
- `idx_refresh_tokens_expires` → `idx_employee_refresh_tokens_expires_at`

#### Scenario: Indexes use full table name prefix
- **WHEN** the migration runs successfully
- **THEN** `idx_employee_refresh_tokens_employee_id` and `idx_employee_refresh_tokens_expires_at` SHALL exist
- **THEN** `idx_refresh_tokens_employee` and `idx_refresh_tokens_expires` SHALL NOT exist

### Requirement: Standardize warehouses is_active index name
The migration SHALL rename `idx_warehouses_active` to `idx_warehouses_is_active` to match the column name.

#### Scenario: Index name matches column name
- **WHEN** the migration runs successfully
- **THEN** `idx_warehouses_is_active` SHALL exist
- **THEN** `idx_warehouses_active` SHALL NOT exist

### Requirement: Name unnamed UNIQUE constraints on junction tables
The migration SHALL add explicit names to unnamed UNIQUE constraints:
- `color_supplier(color_id, supplier_id)` → constraint named `uq_color_supplier_color_supplier`
- `thread_type_supplier(thread_type_id, supplier_id)` → constraint named `uq_thread_type_supplier_type_supplier`
- `thread_type_supplier(supplier_id, supplier_item_code)` → constraint named `uq_thread_type_supplier_supplier_item`

#### Scenario: Constraints have explicit names
- **WHEN** the migration runs successfully
- **THEN** `SELECT conname FROM pg_constraint WHERE conname LIKE 'uq_%'` SHALL include the three new constraint names
- **THEN** the old auto-generated constraint names SHALL NOT exist
