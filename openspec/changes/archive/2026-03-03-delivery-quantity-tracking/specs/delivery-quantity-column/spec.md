## ADDED Requirements

### Requirement: Delivery record has quantity_cones column
The `thread_order_deliveries` table SHALL have a `quantity_cones` column (INTEGER NOT NULL DEFAULT 0) that tracks the expected number of cones to be delivered from the supplier.

#### Scenario: Column exists with default value
- **WHEN** the migration is applied
- **THEN** the `thread_order_deliveries` table SHALL have a `quantity_cones` column with NOT NULL constraint and DEFAULT 0

#### Scenario: Existing records get default value
- **WHEN** the migration is applied to a table with existing delivery records
- **THEN** all existing records SHALL have `quantity_cones = 0`

---

### Requirement: quantity_cones populated from shortage on save
When weekly order results are saved via `POST /api/weekly-orders/:id/results`, the backend SHALL update each delivery record's `quantity_cones` to match `total_final` from the corresponding summary_data row (matched by thread_type_id).

#### Scenario: First save populates quantity_cones
- **WHEN** results are saved for week_id=1 with summary_data containing thread_type_id=42 and total_final=50
- **AND** a delivery record exists for week_id=1 and thread_type_id=42
- **THEN** the delivery record SHALL have `quantity_cones = 50`

#### Scenario: Re-save updates quantity_cones
- **WHEN** results are re-saved for week_id=1 with thread_type_id=42 and total_final changed from 50 to 30
- **THEN** the delivery record SHALL have `quantity_cones = 30`

#### Scenario: Delivery without matching summary row
- **WHEN** a delivery record exists for thread_type_id=99 but no summary_data row has that thread_type_id
- **THEN** the delivery's `quantity_cones` SHALL remain unchanged

---

### Requirement: Loan adjusts both weeks' delivery quantity_cones
When `fn_borrow_thread` moves cones from source week to target week, it SHALL update delivery records for both weeks to reflect the changed expected delivery quantity.

#### Scenario: Source week quantity increases
- **WHEN** fn_borrow_thread moves 20 cones from week_id=2 to week_id=1 for thread_type_id=42
- **AND** week_id=2 has delivery with quantity_cones=40
- **THEN** week_id=2 delivery SHALL have `quantity_cones = 60` (40 + 20)

#### Scenario: Target week quantity decreases
- **WHEN** fn_borrow_thread moves 20 cones from week_id=2 to week_id=1 for thread_type_id=42
- **AND** week_id=1 has delivery with quantity_cones=50
- **THEN** week_id=1 delivery SHALL have `quantity_cones = 30` (50 - 20)

#### Scenario: Target week quantity cannot go negative
- **WHEN** fn_borrow_thread moves 30 cones from week_id=2 to week_id=1 for thread_type_id=42
- **AND** week_id=1 has delivery with quantity_cones=20
- **THEN** week_id=1 delivery SHALL have `quantity_cones = 0` (not -10)

#### Scenario: Delivery record created if not exists
- **WHEN** fn_borrow_thread is called for thread_type_id=42
- **AND** no delivery record exists for that week and thread_type
- **THEN** the function SHALL create a delivery record with the adjusted quantity_cones

---

### Requirement: Pending delivery quantity calculation
The pending delivery quantity SHALL be calculated as `quantity_cones - received_quantity` for any delivery record.

#### Scenario: Pending quantity with no receipts
- **WHEN** a delivery has quantity_cones=50 and received_quantity=0
- **THEN** pending SHALL be 50

#### Scenario: Pending quantity with partial receipt
- **WHEN** a delivery has quantity_cones=50 and received_quantity=30
- **THEN** pending SHALL be 20

#### Scenario: Pending quantity fully received
- **WHEN** a delivery has quantity_cones=50 and received_quantity=50
- **THEN** pending SHALL be 0

#### Scenario: Over-received
- **WHEN** a delivery has quantity_cones=50 and received_quantity=60
- **THEN** pending SHALL be -10 (indicates over-receipt)
