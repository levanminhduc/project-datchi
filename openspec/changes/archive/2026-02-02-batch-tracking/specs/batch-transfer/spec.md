## ADDED Requirements

### Requirement: Batch Transfer API
The system SHALL support transferring multiple cones between warehouses in a single operation.

#### Scenario: Transfer specific cones
- **WHEN** user submits POST /api/batch/transfer with cone_ids, from_warehouse_id, to_warehouse_id
- **THEN** system updates warehouse_id for all specified cones
- **AND** logs batch_transaction with operation_type 'TRANSFER'
- **AND** returns count of transferred cones

#### Scenario: Transfer entire lot
- **WHEN** user submits POST /api/batch/transfer with lot_id instead of cone_ids
- **THEN** system transfers all available cones in lot
- **AND** updates lot.warehouse_id to destination
- **AND** logs batch_transaction

#### Scenario: Transfer cone not in source warehouse
- **WHEN** batch transfer includes cone_id not in from_warehouse_id
- **THEN** system rejects entire batch with 400 error
- **AND** message identifies mismatched cone_ids

#### Scenario: Transfer to same warehouse
- **WHEN** from_warehouse_id equals to_warehouse_id
- **THEN** system returns 400 error "Kho nguồn và kho đích không được trùng nhau"

#### Scenario: Transfer unavailable cones
- **WHEN** batch transfer includes cones with status not in (AVAILABLE, RECEIVED, INSPECTED)
- **THEN** system rejects with error listing unavailable cone_ids

### Requirement: Batch Transfer Page
The system SHALL provide a dedicated page for batch transfer operations.

#### Scenario: Access batch transfer page
- **WHEN** user navigates to /thread/batch/transfer
- **THEN** system displays batch transfer form
- **AND** source warehouse selector is displayed

#### Scenario: Select source warehouse
- **WHEN** user selects source warehouse
- **THEN** system shows available lots in that warehouse
- **AND** enables cone scanning/selection

#### Scenario: Select by lot
- **WHEN** user selects a lot from source warehouse
- **THEN** system loads all available cones from that lot into buffer
- **AND** displays cone count and list

#### Scenario: Select by scanning
- **WHEN** user scans individual cones
- **THEN** system validates cone exists in source warehouse
- **AND** adds valid cones to transfer buffer
- **AND** shows error for cones not in source warehouse

#### Scenario: Select destination warehouse
- **WHEN** user has cones in buffer
- **THEN** user selects destination warehouse from available STORAGE warehouses
- **AND** destination options exclude source warehouse

#### Scenario: Confirm batch transfer
- **WHEN** user clicks "Xác nhận chuyển kho" with valid data
- **THEN** system submits batch transfer request
- **AND** shows success message with cone count transferred
- **AND** clears buffer

### Requirement: Transfer Validation
The system SHALL validate transfer operations before execution.

#### Scenario: Validate cone availability
- **WHEN** preparing batch transfer
- **THEN** system checks all cones have transferable status
- **AND** warns about any cones that cannot be transferred

#### Scenario: Partial transfer option
- **WHEN** some cones in batch are not transferable
- **THEN** user can choose to proceed with valid cones only
- **OR** cancel entire operation
