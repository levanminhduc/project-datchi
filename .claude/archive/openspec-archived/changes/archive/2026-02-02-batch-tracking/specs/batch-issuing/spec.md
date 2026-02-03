## ADDED Requirements

### Requirement: Batch Issue API
The system SHALL support issuing multiple cones from inventory in a single operation.

#### Scenario: Issue specific cones
- **WHEN** user submits POST /api/batch/issue with cone_ids, warehouse_id, recipient
- **THEN** system updates status to 'HARD_ALLOCATED' or 'IN_PRODUCTION' for all cones
- **AND** logs batch_transaction with operation_type 'ISSUE'
- **AND** returns count of issued cones

#### Scenario: Issue entire lot
- **WHEN** user submits POST /api/batch/issue with lot_id instead of cone_ids
- **THEN** system issues all available cones in lot
- **AND** updates lot.available_cones to 0
- **AND** sets lot.status to 'DEPLETED' if no cones remain

#### Scenario: Issue with reference number
- **WHEN** batch issue includes reference_number (phiếu xuất, PO, etc.)
- **THEN** system stores reference_number in batch_transaction
- **AND** reference is searchable in transaction history

#### Scenario: Issue unavailable cones
- **WHEN** batch issue includes cones not in AVAILABLE status
- **THEN** system rejects with error listing unavailable cone_ids

#### Scenario: Issue from wrong warehouse
- **WHEN** batch issue includes cones not in specified warehouse_id
- **THEN** system rejects entire batch with 400 error

### Requirement: Batch Issue Page
The system SHALL provide a dedicated page for batch issuing operations.

#### Scenario: Access batch issue page
- **WHEN** user navigates to /thread/batch/issue
- **THEN** system displays batch issue form
- **AND** warehouse selector is displayed

#### Scenario: Select issue warehouse
- **WHEN** user selects warehouse
- **THEN** system shows available lots in that warehouse
- **AND** enables cone scanning/selection

#### Scenario: Select by lot for issue
- **WHEN** user selects a lot
- **THEN** system loads all available cones into issue buffer
- **AND** displays total meters/weight being issued

#### Scenario: Select by scanning for issue
- **WHEN** user scans individual cones
- **THEN** system validates cone is available in selected warehouse
- **AND** adds to issue buffer

#### Scenario: Enter recipient information
- **WHEN** user has cones in buffer
- **THEN** user enters recipient name (required)
- **AND** optionally enters reference_number and notes

#### Scenario: Review issue summary
- **WHEN** user is ready to confirm
- **THEN** system displays: recipient, reference, cone count, total meters, total weight
- **AND** list of cone_ids being issued

#### Scenario: Confirm batch issue
- **WHEN** user clicks "Xác nhận xuất kho" with valid data
- **THEN** system submits batch issue request
- **AND** shows success with transaction ID
- **AND** offers option to print issue slip

### Requirement: Issue Documentation
The system SHALL support generating documentation for issued batches.

#### Scenario: Generate issue slip
- **WHEN** user requests print after successful batch issue
- **THEN** system generates printable issue slip with:
  - Transaction ID and date/time
  - Recipient name
  - Reference number
  - List of cone_ids with thread type and meters
  - Total cone count, meters, weight
  - Signature lines

#### Scenario: Export issue history
- **WHEN** user requests export of batch issue transactions
- **THEN** system generates CSV with transaction details
- **AND** includes cone_ids, recipient, reference, timestamp

### Requirement: Batch Return (Reverse Issue)
The system SHALL support returning issued cones back to inventory.

#### Scenario: Return issued cones
- **WHEN** user submits POST /api/batch/return with cone_ids, warehouse_id
- **THEN** system updates cone status back to 'AVAILABLE'
- **AND** updates lot.available_cones
- **AND** logs batch_transaction with operation_type 'RETURN'

#### Scenario: Return to different warehouse
- **WHEN** return specifies different warehouse than original issue
- **THEN** system updates cone.warehouse_id to new warehouse
- **AND** logs transfer in transaction
