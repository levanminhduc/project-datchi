## ADDED Requirements

### Requirement: Drop deprecated employee token columns
The system SHALL drop `employees.refresh_token` and `employees.refresh_token_expires_at` columns as they are replaced by the `employee_refresh_tokens` table.

#### Scenario: Columns dropped
- **WHEN** the migration runs
- **THEN** columns `refresh_token` and `refresh_token_expires_at` SHALL be dropped from `employees` table

#### Scenario: Backend references removed
- **WHEN** columns are dropped
- **THEN** any backend code referencing these columns SHALL be removed or updated

### Requirement: Document cone_id naming convention
The system SHALL add SQL comments to tables where `cone_id` (integer) references `thread_inventory.id` (PK), clarifying it is NOT a reference to `thread_inventory.cone_id` (varchar barcode).

#### Scenario: Comments added
- **WHEN** the migration runs
- **THEN** `COMMENT ON COLUMN` SHALL be added to `thread_movements.cone_id`, `thread_recovery.cone_id`, `thread_allocation_cones.cone_id`, `thread_issue_items.cone_id` explaining: "FK to thread_inventory.id (PK), not to thread_inventory.cone_id (varchar barcode)"

### Requirement: Standardize junction table naming
Junction tables SHALL follow consistent naming. The `color_supplier` table SHALL be verified for naming consistency with other junction tables.

#### Scenario: Junction table name evaluated
- **WHEN** reviewing junction table names
- **THEN** `color_supplier` naming SHALL be documented as acceptable (follows `<entity1>_<entity2>` pattern matching `thread_type_supplier`, `role_permissions`)

### Requirement: PostgREST schema reload
After each migration that renames or creates objects, the system SHALL notify PostgREST to reload its schema cache.

#### Scenario: Schema reload after migration
- **WHEN** any migration renames functions, tables, or creates new FK relationships
- **THEN** the migration SHALL include `NOTIFY pgrst, 'reload schema'` at the end
