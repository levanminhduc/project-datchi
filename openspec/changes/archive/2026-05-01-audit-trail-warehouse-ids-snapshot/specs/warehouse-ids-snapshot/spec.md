## ADDED Requirements

### Requirement: Warehouse IDs snapshot column exists on thread_order_results
The database table `thread_order_results` SHALL have a column `warehouse_ids INTEGER[]` with `DEFAULT NULL`. The column SHALL have a SQL COMMENT documenting three semantic states: NULL (pre-migration, no snapshot), empty array (post-migration save with no warehouse selection), non-empty array (post-migration save with explicit warehouse IDs).

#### Scenario: Column exists after migration
- **WHEN** the migration is applied via `supabase migration up`
- **THEN** `\d thread_order_results` shows `warehouse_ids integer[]` column with nullable constraint

#### Scenario: Pre-migration rows remain NULL
- **WHEN** the migration is applied
- **THEN** all existing rows in `thread_order_results` have `warehouse_ids IS NULL`
- **THEN** no data loss or row modification occurs

### Requirement: Save results endpoint captures warehouse snapshot
When `POST /api/weekly-order/:id/results` is called, the system SHALL write the current junction warehouse IDs as a snapshot into `thread_order_results.warehouse_ids`.

#### Scenario: Save with specific warehouse selection
- **WHEN** the user has selected warehouse IDs 3 and 5 in `thread_order_week_warehouses` for week X
- **WHEN** `POST /api/weekly-order/X/results` is called
- **THEN** `SELECT warehouse_ids FROM thread_order_results WHERE week_id = X` returns `{3,5}`

#### Scenario: Save with no warehouse selection
- **WHEN** `thread_order_week_warehouses` has no rows for week X (junction empty)
- **WHEN** `POST /api/weekly-order/X/results` is called
- **THEN** `SELECT warehouse_ids FROM thread_order_results WHERE week_id = X` returns `{}` (empty array, NOT NULL)

#### Scenario: Re-save updates the snapshot
- **WHEN** a week already has a saved result with `warehouse_ids = {3,5}`
- **WHEN** the user changes warehouse selection to only warehouse 3 and re-saves
- **THEN** `SELECT warehouse_ids FROM thread_order_results WHERE week_id = X` returns `{3}`

### Requirement: Reserve flow is unaffected by snapshot column
The DB functions `fn_reserve_for_week`, `fn_confirm_week_with_reserve`, `fn_reserve_from_stock`, `fn_receive_delivery`, and `fn_re_reserve_after_remove_po` SHALL continue to read warehouse filtering exclusively from `thread_order_week_warehouses` junction table, not from `thread_order_results.warehouse_ids`.

#### Scenario: Confirm week reserves from junction, not snapshot
- **WHEN** a week has `warehouse_ids = {3}` in `thread_order_results` (snapshot)
- **WHEN** `thread_order_week_warehouses` has warehouse IDs `{3, 5}` for that week
- **WHEN** the Confirm action triggers `fn_confirm_week_with_reserve`
- **THEN** the reserve function considers both warehouses 3 and 5 (from junction)
- **THEN** the reserve function does NOT limit to warehouse 3 only (from snapshot)

### Requirement: Frontend type reflects warehouse_ids field
The `WeeklyOrderResults` TypeScript interface SHALL include an optional `warehouse_ids` field typed as `number[] | null`.

#### Scenario: Type-check passes with new field
- **WHEN** `npm run type-check` is executed after adding the field
- **THEN** no TypeScript errors related to `warehouse_ids` are reported

#### Scenario: Existing consumers unaffected
- **WHEN** existing code reads `WeeklyOrderResults` without accessing `warehouse_ids`
- **THEN** no TypeScript compilation errors occur (field is optional)

### Requirement: Warehouse filter UI label communicates confirmation impact
The warehouse selection control on the weekly-order page SHALL display a label that communicates that the selection applies at order confirmation time, not merely as a display filter.

#### Scenario: Label text is accurate
- **WHEN** the user views the weekly-order calculation page
- **THEN** the warehouse select control shows the label "Kho rút tồn (áp dụng khi xác nhận)"

#### Scenario: Hint text is accurate
- **WHEN** the user views the warehouse select hint
- **THEN** the hint reads "Trống = sẽ rút từ tất cả kho khi xác nhận đơn hàng"
