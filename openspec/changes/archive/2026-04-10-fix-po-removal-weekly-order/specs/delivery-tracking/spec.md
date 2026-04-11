## MODIFIED Requirements

### Requirement: Auto-create delivery records on save
When weekly order results are saved via `POST /api/weekly-orders/:id/results`, the backend SHALL automatically create or update delivery records in `thread_order_deliveries` for each aggregated row that has a valid `supplier_id` and `delivery_date`. The system SHALL use UPSERT on `(week_id, thread_type_id)` to avoid duplicates. Additionally, the system SHALL identify orphan deliveries -- records that exist in the database for the given `week_id` but whose composite key (`thread_type_id` + `thread_color`) does NOT appear in the current desired delivery set. Orphan deliveries with `status = 'PENDING'` AND (`received_quantity IS NULL` OR `received_quantity = 0`) SHALL be deleted. Orphan deliveries with any other status or with `received_quantity > 0` SHALL be preserved.

#### Scenario: First save creates delivery records
- **WHEN** results are saved for week_id=1 with 3 aggregated rows each having valid supplier_id
- **THEN** 3 records SHALL be created in `thread_order_deliveries` with status='PENDING'
- **AND** delivery_date SHALL match the computed dates from the aggregated data

#### Scenario: Re-save updates existing delivery records
- **WHEN** results are re-saved for week_id=1 (recalculated with different quantities)
- **THEN** existing delivery records SHALL be updated (upsert on week_id + thread_type_id)
- **AND** manually edited delivery_date values SHALL be preserved (not overwritten)

#### Scenario: Aggregated row without supplier
- **WHEN** an aggregated row has `supplier_id: null`
- **THEN** no delivery record SHALL be created for that row

#### Scenario: Orphan PENDING delivery with no received quantity is deleted
- **WHEN** results are saved for week_id=1
- **AND** the database has a delivery for thread_type_id=42 with status='PENDING' and received_quantity=NULL
- **AND** thread_type_id=42 does NOT appear in the current summary rows
- **THEN** that delivery record SHALL be deleted
- **AND** the deletion SHALL be logged with thread_type_id and week_id

#### Scenario: Orphan PENDING delivery with received_quantity=0 is deleted
- **WHEN** results are saved for week_id=1
- **AND** the database has a delivery for thread_type_id=42 with status='PENDING' and received_quantity=0
- **AND** thread_type_id=42 does NOT appear in the current summary rows
- **THEN** that delivery record SHALL be deleted

#### Scenario: Orphan DELIVERED delivery is preserved
- **WHEN** results are saved for week_id=1
- **AND** the database has a delivery for thread_type_id=42 with status='DELIVERED'
- **AND** thread_type_id=42 does NOT appear in the current summary rows
- **THEN** that delivery record SHALL NOT be deleted

#### Scenario: Orphan PENDING delivery with received inventory is preserved
- **WHEN** results are saved for week_id=1
- **AND** the database has a delivery for thread_type_id=42 with status='PENDING' and received_quantity=5
- **AND** thread_type_id=42 does NOT appear in the current summary rows
- **THEN** that delivery record SHALL NOT be deleted (it has received inventory)

#### Scenario: No orphans exist
- **WHEN** results are saved for week_id=1
- **AND** all existing deliveries match entries in the desired delivery set
- **THEN** no deliveries SHALL be deleted
