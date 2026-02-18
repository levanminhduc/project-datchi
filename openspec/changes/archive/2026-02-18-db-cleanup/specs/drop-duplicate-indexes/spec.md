## ADDED Requirements

### Requirement: Drop duplicate indexes on UNIQUE columns
The migration SHALL drop 11 manually-created indexes that duplicate indexes automatically created by UNIQUE constraints.

#### Scenario: Duplicate indexes removed
- **WHEN** the migration runs successfully
- **THEN** the following indexes SHALL NOT exist:
  - `idx_colors_name`
  - `idx_employees_employee_id`
  - `idx_permissions_code`
  - `idx_suppliers_code`
  - `idx_styles_style_code`
  - `idx_purchase_orders_po_number`
  - `idx_thread_types_code`
  - `idx_warehouses_code`
  - `idx_lots_lot_number`
  - `idx_thread_issues_issue_code`
  - `idx_thread_inventory_cone_id`

#### Scenario: UNIQUE constraint indexes still exist
- **WHEN** the duplicate indexes are dropped
- **THEN** the UNIQUE constraint auto-indexes SHALL still exist:
  - `colors_name_key`
  - `employees_employee_id_key`
  - `permissions_code_key`
  - `suppliers_code_key`
  - `styles_style_code_key`
  - `purchase_orders_po_number_key`
  - `thread_types_code_key`
  - `warehouses_code_key`
  - `lots_lot_number_key`
  - `thread_issues_issue_code_key`
  - `thread_inventory_cone_id_key`

#### Scenario: Query performance unchanged
- **WHEN** queries filter by the UNIQUE columns (e.g., `WHERE code = 'X'`)
- **THEN** PostgreSQL SHALL use the UNIQUE constraint index (verified via EXPLAIN)
