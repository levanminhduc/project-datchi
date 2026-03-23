## ADDED Requirements

### Requirement: Data migration function converts thread_stock to thread_inventory
The system SHALL provide a SQL function `fn_stock_to_inventory()` that converts all `thread_stock` aggregate records into individual `thread_inventory` cone records with proper `lots` linking.

#### Scenario: Full cones migrated correctly
- **WHEN** `thread_stock` has a record with `thread_type_id=10, warehouse_id=1, lot_number='LOT-20260210-143045', qty_full_cones=5, qty_partial_cones=0`
- **THEN** the migration SHALL create:
  - 1 `lots` record with `lot_number='LOT-20260210-143045', thread_type_id=10, warehouse_id=1, total_cones=5, available_cones=5, status='ACTIVE'`
  - 5 `thread_inventory` records each with `cone_id='MIG-{stock_id}-{seq}', thread_type_id=10, warehouse_id=1, is_partial=false, status='AVAILABLE', quantity_meters=thread_types.meters_per_cone, lot_id=lots.id, lot_number='LOT-20260210-143045'`

#### Scenario: Partial cones migrated correctly
- **WHEN** `thread_stock` has a record with `qty_full_cones=3, qty_partial_cones=2`
- **THEN** the migration SHALL create:
  - 1 `lots` record with `total_cones=5, available_cones=5`
  - 3 `thread_inventory` records with `is_partial=false, quantity_meters=meters_per_cone`
  - 2 `thread_inventory` records with `is_partial=true, quantity_meters=meters_per_cone * partial_cone_ratio`

#### Scenario: Lot number handling for null lot_number
- **WHEN** `thread_stock` has a record with `lot_number IS NULL`
- **THEN** the migration SHALL generate lot_number as `MIG-LOT-{stock_id}` for the lots record

#### Scenario: Migration is idempotent
- **WHEN** `fn_stock_to_inventory()` is called a second time
- **THEN** the function SHALL skip records where `cone_id` with prefix `MIG-{stock_id}-` already exists in `thread_inventory`
- **AND** return the count of newly created cones

#### Scenario: Migration preserves received_date and expiry_date
- **WHEN** `thread_stock` has `received_date='2026-02-10'` and `expiry_date='2027-02-10'`
- **THEN** all created `thread_inventory` records SHALL have `received_date='2026-02-10'` and `expiry_date='2027-02-10'`
- **AND** the `lots` record SHALL have `expiry_date='2027-02-10'`

---

### Requirement: thread_stock table and related objects are removed after migration
The system SHALL remove the `thread_stock` table and all dependent database objects after data migration is complete.

#### Scenario: Table and dependencies dropped
- **WHEN** migration has been verified
- **THEN** the system SHALL drop:
  - TABLE `thread_stock` (CASCADE)
  - FUNCTION `fn_migrate_inventory_to_stock()` (the reverse migration function)
  - All indexes on `thread_stock` (dropped automatically via CASCADE)
  - Trigger `trigger_thread_stock_updated_at` (dropped automatically via CASCADE)

#### Scenario: Migration add_notes cleanup
- **WHEN** `thread_stock` is dropped
- **THEN** the migration `20260226000008_add_notes_to_thread_stock.sql` side-effects SHALL be inert (no action needed — table no longer exists)
