## ADDED Requirements

### Requirement: Batch Receive API
The system SHALL support receiving multiple cones into inventory in a single operation.

#### Scenario: Receive cones into new lot
- **WHEN** user submits POST /api/batch/receive with cone_ids, thread_type_id, warehouse_id, and lot metadata
- **THEN** system creates new lot record
- **AND** creates cone records for each cone_id with lot_id reference
- **AND** updates lot.total_cones and lot.available_cones
- **AND** logs batch_transaction with operation_type 'RECEIVE'

#### Scenario: Receive cones into existing lot
- **WHEN** user submits POST /api/batch/receive with cone_ids and existing lot_id
- **THEN** system creates cone records linked to specified lot
- **AND** updates lot counts
- **AND** logs batch_transaction

#### Scenario: Receive with duplicate cone_id
- **WHEN** user submits batch receive containing cone_id that already exists
- **THEN** system rejects entire batch with 400 error
- **AND** message identifies which cone_ids are duplicates

#### Scenario: Receive exceeds batch limit
- **WHEN** user submits batch receive with more than 500 cone_ids
- **THEN** system returns 400 error "Vượt quá giới hạn 500 cuộn mỗi lần nhập"

### Requirement: Batch Receive Page
The system SHALL provide a dedicated page for batch receiving operations.

#### Scenario: Access batch receive page
- **WHEN** user navigates to /thread/batch/receive
- **THEN** system displays batch receive form
- **AND** warehouse selector is required before proceeding

#### Scenario: Select or create lot for receiving
- **WHEN** user has selected warehouse
- **THEN** user can choose existing lot from dropdown
- **OR** user can create new lot by entering lot_number and metadata

#### Scenario: Scan cones for receiving
- **WHEN** user activates scanner in batch receive mode
- **THEN** scanned cone_ids are added to buffer list
- **AND** duplicate scans show warning and are not added
- **AND** list displays count of scanned items

#### Scenario: Manual entry of cone IDs
- **WHEN** user enters cone_ids manually (comma or newline separated)
- **THEN** system parses and adds valid cone_ids to buffer
- **AND** highlights any invalid or duplicate entries

#### Scenario: Review before confirm
- **WHEN** user has scanned/entered cone_ids
- **THEN** system displays summary: lot info, warehouse, cone count, list preview
- **AND** user can remove individual items from list

#### Scenario: Confirm batch receive
- **WHEN** user clicks "Xác nhận nhập kho" with valid data
- **THEN** system submits batch receive request
- **AND** shows success message with transaction ID
- **AND** clears buffer for next batch

#### Scenario: Cancel batch receive
- **WHEN** user clicks "Hủy" or navigates away
- **THEN** system prompts for confirmation if buffer is not empty
- **AND** clears buffer on confirm

### Requirement: Cone ID Generation
The system SHALL support auto-generating cone IDs during batch receive.

#### Scenario: Auto-generate cone IDs
- **WHEN** user specifies quantity instead of scanning individual cones
- **THEN** system generates sequential cone_ids with pattern: {lot_number}-{sequence}
- **AND** ensures uniqueness across system

#### Scenario: Mixed auto and manual entry
- **WHEN** user has both scanned cones and requests auto-generation
- **THEN** system adds auto-generated IDs to existing scanned list
- **AND** checks for conflicts with existing cone_ids
