## MODIFIED Requirements

### Requirement: Delivery receiving creates stock instead of cones
The delivery receiving process SHALL create thread_stock records instead of individual thread_inventory records.

#### Scenario: Receive delivery to stock
- **WHEN** user receives a delivery with quantity N
- **THEN** system SHALL create ONE thread_stock record with qty_full_cones = N
- **AND** SHALL NOT create N individual cone records

#### Scenario: Stock record details
- **WHEN** creating stock from delivery
- **THEN** record SHALL include: thread_type_id (from delivery), warehouse_id, lot_number (auto-generated), qty_full_cones, received_date

### Requirement: Lot number generation
The system SHALL auto-generate lot numbers when receiving.

#### Scenario: Lot format
- **WHEN** receiving delivery
- **THEN** system SHALL generate lot_number in format LOT-YYYYMMDD-HHmmss

### Requirement: Update delivery status
The receiving flow SHALL continue to update delivery receiving status.

#### Scenario: Status tracking
- **WHEN** receiving delivery
- **THEN** system SHALL update received_quantity and inventory_status on thread_order_deliveries as before

### Requirement: Receiving UI unchanged
The delivery receiving UI interaction SHALL remain the same.

#### Scenario: User experience
- **WHEN** user clicks "Nhập kho" on a delivery
- **THEN** UI flow SHALL be identical (enter quantity, select warehouse, confirm)
- **AND** only the backend storage model changes
