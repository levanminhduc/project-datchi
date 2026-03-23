## ADDED Requirements

### Requirement: Add missing created_at columns
The system SHALL add `created_at TIMESTAMPTZ DEFAULT now()` to tables that lack it:
- batch_transactions
- employee_permissions
- employee_roles
- system_settings
- thread_issue_items (will be dropped — skip)
- thread_issue_returns (will be dropped — skip)
- thread_order_results

#### Scenario: Column added with default
- **WHEN** the migration runs
- **THEN** `created_at` SHALL be added with `DEFAULT now()` and existing rows SHALL get the current timestamp

### Requirement: Add missing updated_at columns
The system SHALL add `updated_at TIMESTAMPTZ DEFAULT now()` to tables that lack it:
- batch_transactions
- employee_permissions
- employee_refresh_tokens
- employee_roles
- notifications
- thread_allocation_cones
- thread_conflict_allocations
- thread_issue_lines
- thread_issue_return_logs
- thread_movements
- thread_order_items
- thread_order_results
- role_permissions

#### Scenario: Column added with trigger
- **WHEN** `updated_at` is added to a table
- **THEN** a `trigger_<table>_updated_at` trigger SHALL be created using the `fn_update_updated_at_column()` function

### Requirement: Add deleted_at soft delete to master data tables
The system SHALL add `deleted_at TIMESTAMPTZ DEFAULT NULL` to:
- colors
- suppliers
- styles
- warehouses
- thread_types
- purchase_orders
- employees

#### Scenario: Soft delete column added
- **WHEN** the migration runs
- **THEN** `deleted_at` SHALL be added as nullable with no default (NULL = not deleted)

#### Scenario: Backend queries filter deleted rows
- **WHEN** `deleted_at` is added
- **THEN** all SELECT queries on these tables SHALL add `.is('deleted_at', null)` filter by default
