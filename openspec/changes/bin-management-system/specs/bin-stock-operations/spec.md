## ADDED Requirements

### Requirement: Add stock to bin (IN operation)
The system SHALL allow adding cones to a bin by specifying thread_type_id, qty_cones, and is_partial. If a bin_items row already exists for the same thread_type_id + is_partial combination, the system SHALL increment qty_cones (aggregate). Otherwise, it SHALL create a new bin_items row. The system SHALL validate that the thread type's color matches the bin's color. A bin_transaction with operation=IN SHALL be created.

#### Scenario: Add full cones to empty bin
- **WHEN** user adds 20 full cones of thread_type_id=5 (Red Tex40) to bin BIN-00042 (color=Red)
- **THEN** system creates bin_items row {bin_id, thread_type_id=5, qty_cones=20, is_partial=false} and a bin_transaction {operation=IN, qty_cones=20, is_partial=false}

#### Scenario: Add cones to bin with existing same type
- **WHEN** bin BIN-00042 already has 20 full cones of thread_type_id=5, and user adds 10 more full cones of same type
- **THEN** system updates existing bin_items row to qty_cones=30 and creates a bin_transaction {operation=IN, qty_cones=10}

#### Scenario: Add partial cones alongside full cones of same type
- **WHEN** bin BIN-00042 has 20 full cones of thread_type_id=5, and user adds 3 partial cones of same type
- **THEN** system creates a new bin_items row {thread_type_id=5, qty_cones=3, is_partial=true} (separate row for partial)

#### Scenario: Reject adding wrong color to bin
- **WHEN** user tries to add thread_type_id=10 (Blue Tex40) to bin BIN-00042 (color=Red)
- **THEN** system rejects with error "Màu chỉ không khớp với thùng"

### Requirement: Remove stock from bin (OUT operation)
The system SHALL allow removing cones from a bin by specifying thread_type_id, qty_cones, and is_partial. The system SHALL decrement the corresponding bin_items row. If qty_cones reaches 0, the row SHALL be deleted. A bin_transaction with operation=OUT SHALL be created.

#### Scenario: Remove partial quantity from bin
- **WHEN** bin BIN-00042 has 20 full cones of type 5, and user removes 8
- **THEN** system decrements bin_items to qty_cones=12 and creates bin_transaction {operation=OUT, qty_cones=8}

#### Scenario: Remove all remaining cones
- **WHEN** bin BIN-00042 has 5 full cones of type 5, and user removes 5
- **THEN** system deletes the bin_items row and creates bin_transaction {operation=OUT, qty_cones=5}

#### Scenario: Reject removing more than available
- **WHEN** bin BIN-00042 has 5 cones of type 5, and user tries to remove 8
- **THEN** system rejects with error "Không đủ số cuộn trong thùng"

### Requirement: Move bin to new location (MOVE operation)
The system SHALL record bin relocations as bin_transactions with operation=MOVE, capturing location_from and location_to.

#### Scenario: Move bin to new location
- **WHEN** user moves bin BIN-00042 from location "A-2-3" to "B-1-4"
- **THEN** system updates bin.location and creates bin_transaction {operation=MOVE, location_from="A-2-3", location_to="B-1-4"}

### Requirement: Query stock availability from bins
The system SHALL provide a function to query total available stock for a given thread_type_id by summing qty_cones across all bin_items in active bins. The result SHALL separate full cones and partial cones.

#### Scenario: Check stock for thread type across all bins
- **WHEN** system queries availability for thread_type_id=5
- **THEN** system returns {full_cones: sum of qty_cones where is_partial=false, partial_cones: sum of qty_cones where is_partial=true} across all active bins

#### Scenario: Check stock when no bins contain the thread type
- **WHEN** system queries availability for thread_type_id=99 which exists in no bins
- **THEN** system returns {full_cones: 0, partial_cones: 0}

### Requirement: Estimate equivalent full cones
The system SHALL calculate estimated equivalent full cones for a bin using the formula: `equivalent = qty_full + (qty_partial × partial_cone_ratio)`. The `partial_cone_ratio` SHALL be read from `system_settings` (key: `partial_cone_ratio`, default: 0.3).

#### Scenario: Calculate equivalent for mixed bin
- **WHEN** bin has 10 full cones and 6 partial cones, and partial_cone_ratio=0.3
- **THEN** estimated equivalent = 10 + (6 × 0.3) = 11.8 full cones

### Requirement: Transaction audit log
Every stock operation (IN, OUT, MOVE) SHALL create a `bin_transactions` record with: bin_id, operation, thread_type_id (for IN/OUT), qty_cones (for IN/OUT), is_partial, source_type (NEW/RETURN for IN), reference_type, reference_id, performed_by, and timestamp.

#### Scenario: IN transaction from delivery
- **WHEN** 20 cones are added to bin from delivery #45
- **THEN** bin_transaction is created with {operation=IN, source_type=NEW, reference_type=DELIVERY, reference_id=45, qty_cones=20}

#### Scenario: OUT transaction from issue
- **WHEN** 5 cones are removed from bin for issue #12
- **THEN** bin_transaction is created with {operation=OUT, reference_type=ISSUE, reference_id=12, qty_cones=5}

#### Scenario: IN transaction from return
- **WHEN** 3 partial cones are returned to bin from issue #12
- **THEN** bin_transaction is created with {operation=IN, source_type=RETURN, reference_type=ISSUE, reference_id=12, qty_cones=3, is_partial=true}
