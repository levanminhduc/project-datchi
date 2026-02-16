## ADDED Requirements

### Requirement: Delivery receiving writes to bins instead of thread_stock
When receiving a delivery (POST /deliveries/:deliveryId/receive), the system SHALL require `bin_id` (existing bin) or bin creation parameters. Stock SHALL be written to `bin_items` instead of `thread_stock`. Multiple bins per delivery receive are allowed (split receiving).

#### Scenario: Receive delivery into existing bin
- **WHEN** user receives 50 cones from delivery #45 into bin BIN-00042
- **THEN** system increments bin_items for the thread_type in BIN-00042, creates bin_transaction {operation=IN, source_type=NEW, reference_type=DELIVERY, reference_id=45}, and updates delivery received_quantity

#### Scenario: Receive delivery split across multiple bins
- **WHEN** user receives 50 cones from delivery #45, putting 20 into BIN-00042 and 30 into BIN-00043
- **THEN** system creates/updates bin_items in both bins, creates 2 bin_transactions, and updates delivery received_quantity to total (50)

#### Scenario: Receive delivery with new bin creation
- **WHEN** user receives 50 cones from delivery #45 and creates a new bin (color=Red, location="C-1-1")
- **THEN** system creates new bin, then adds 50 cones to it, creates bin_transaction, and updates delivery

#### Scenario: Reject delivery receive into wrong-color bin
- **WHEN** user tries to receive Red thread into a Blue bin
- **THEN** system rejects with error "Màu chỉ không khớp với thùng"

### Requirement: Issue V2 deducts from bin_items instead of thread_inventory
When confirming an issue (POST /issues/v2/:id/confirm), the system SHALL deduct stock from `bin_items` instead of changing `thread_inventory` cone status. The deduction SHALL follow FEFO order (earliest received bin_items first, based on bin_transactions IN dates).

#### Scenario: Deduct full cones on issue confirm
- **WHEN** issue is confirmed with 10 full cones of thread_type_id=5, and bins have BIN-001 (15 cones, received 2026-01-01) and BIN-002 (20 cones, received 2026-02-01)
- **THEN** system deducts 10 from BIN-001 (FEFO: earlier received first), BIN-001 now has 5 cones, creates bin_transaction {operation=OUT, reference_type=ISSUE}

#### Scenario: Deduct spanning multiple bins
- **WHEN** issue needs 20 full cones, BIN-001 has 8 and BIN-002 has 15
- **THEN** system deducts 8 from BIN-001 (emptied) and 12 from BIN-002, creates 2 bin_transactions

#### Scenario: Insufficient stock rejects confirm
- **WHEN** issue needs 50 full cones but total across all bins is 30
- **THEN** system rejects with error showing shortage amount

### Requirement: Issue V2 stock availability queries bin_items
The `getStockAvailability()` function SHALL query `bin_items` (summing qty_cones grouped by is_partial) instead of counting `thread_inventory` rows. This affects all endpoints that check stock: form-data, validate-line, add-line, confirm.

#### Scenario: Stock availability reflects bin contents
- **WHEN** bins contain total 25 full cones and 8 partial cones of thread_type_id=5
- **THEN** getStockAvailability(5) returns {full_cones: 25, partial_cones: 8}

#### Scenario: Stock availability with no bins
- **WHEN** no bin_items exist for thread_type_id=99
- **THEN** getStockAvailability(99) returns {full_cones: 0, partial_cones: 0}

### Requirement: Issue V2 returns add stock back to bins
When returning items (POST /issues/v2/:id/return), the system SHALL add stock back to `bin_items`. The user SHALL select which bin to return cones to (scan QR or select from list).

#### Scenario: Return full cones to existing bin
- **WHEN** user returns 3 full cones of thread_type_id=5 to bin BIN-00042
- **THEN** system increments bin_items qty_cones for the matching row, creates bin_transaction {operation=IN, source_type=RETURN, reference_type=ISSUE}

#### Scenario: Return partial cones to bin
- **WHEN** user returns 2 partial cones of thread_type_id=5 to bin BIN-00042
- **THEN** system increments bin_items for is_partial=true row (or creates if not exists), creates bin_transaction

### Requirement: v_stock_summary view uses bin_items
The `v_stock_summary` view SHALL be replaced to query `bin_items` instead of `thread_stock`. Output columns SHALL remain the same for backward compatibility: thread_type_id, thread_code, thread_name, warehouse_id, warehouse_name, total_full_cones, total_partial_cones, total_equivalent_cones.

#### Scenario: Dashboard shows correct totals from bins
- **WHEN** dashboard queries v_stock_summary
- **THEN** results reflect the sum of all bin_items across all active bins, grouped by thread_type

### Requirement: Migrate existing thread_stock data to bins
The system SHALL provide a migration that creates one "UNASSIGNED" bin per warehouse for each existing `thread_stock` record's color, and moves the quantities into `bin_items`.

#### Scenario: Migrate thread_stock records
- **WHEN** migration runs and thread_stock has 3 records for warehouse 1 (different thread types)
- **THEN** system creates UNASSIGNED bins (one per unique color), creates corresponding bin_items, and logs bin_transactions with source_type=NEW and reference_type=MIGRATION
