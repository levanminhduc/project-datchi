## ADDED Requirements

### Requirement: Thread stock table exists
The system SHALL have a `thread_stock` table for quantity-based inventory tracking, grouped by thread type, warehouse, and optional lot number.

#### Scenario: Table structure
- **WHEN** the thread_stock table is created
- **THEN** it SHALL have columns: id (SERIAL), thread_type_id (INTEGER FK), warehouse_id (INTEGER FK), lot_number (VARCHAR NULL), qty_full_cones (INTEGER DEFAULT 0), qty_partial_cones (INTEGER DEFAULT 0), received_date (DATE), expiry_date (DATE NULL), notes (TEXT NULL), created_at, updated_at

### Requirement: Stock summary view
The system SHALL provide a view that aggregates stock by thread type.

#### Scenario: View calculation
- **WHEN** querying v_stock_summary
- **THEN** system SHALL return total_full_cones, total_partial_cones, and total_equivalent (full + partial × ratio) per thread_type_id

### Requirement: Get stock API
The system SHALL provide an API endpoint to retrieve stock levels.

#### Scenario: Get stock by thread type
- **WHEN** client sends GET /api/stock?thread_type_id=5
- **THEN** system SHALL return all stock records for that thread type with totals

#### Scenario: Get stock summary
- **WHEN** client sends GET /api/stock/summary
- **THEN** system SHALL return aggregated stock per thread type

### Requirement: Add stock API (for receiving)
The system SHALL provide an API endpoint to add stock when receiving delivery.

#### Scenario: Add stock with lot number
- **WHEN** client sends POST /api/stock with thread_type_id, warehouse_id, qty_full_cones, lot_number
- **THEN** system SHALL create a new stock record

#### Scenario: Add stock without lot number
- **WHEN** client sends POST /api/stock with thread_type_id, warehouse_id, qty_full_cones (no lot_number)
- **THEN** system SHALL create a stock record with lot_number = NULL

### Requirement: Deduct stock API
The system SHALL provide an API endpoint to deduct stock when issuing.

#### Scenario: Deduct full cones
- **WHEN** client sends POST /api/stock/deduct with thread_type_id, warehouse_id, deduct_full=5
- **THEN** system SHALL reduce qty_full_cones from available stock (FEFO if multiple lots)

#### Scenario: Deduct partial cones
- **WHEN** client sends POST /api/stock/deduct with thread_type_id, warehouse_id, deduct_partial=3
- **THEN** system SHALL reduce qty_partial_cones from available stock

#### Scenario: Insufficient stock
- **WHEN** deduction exceeds available stock
- **THEN** system SHALL return error "Không đủ tồn kho"

### Requirement: Return stock API
The system SHALL provide an API endpoint to add stock back when returning.

#### Scenario: Return partial cones
- **WHEN** client sends POST /api/stock/return with thread_type_id, warehouse_id, return_partial=2
- **THEN** system SHALL increase qty_partial_cones in stock

### Requirement: FEFO ordering
The system SHALL prioritize older lots when deducting stock.

#### Scenario: Multiple lots available
- **WHEN** deducting from a thread type with multiple lots
- **THEN** system SHALL deduct from the lot with earliest received_date first

### Requirement: Migrate existing inventory
The system SHALL migrate existing thread_inventory records to thread_stock.

#### Scenario: Migration consolidation
- **WHEN** migration runs
- **THEN** system SHALL group thread_inventory by thread_type_id, warehouse_id, lot_number and sum quantities into thread_stock records
- **AND** partial cones (is_partial=true) SHALL be counted as qty_partial_cones
- **AND** full cones (is_partial=false) SHALL be counted as qty_full_cones
