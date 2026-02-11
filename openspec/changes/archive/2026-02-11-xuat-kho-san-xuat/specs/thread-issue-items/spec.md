## ADDED Requirements

### Requirement: Add Cones to Issue Request

The system SHALL allow users to add individual cones to an issue request by scanning barcode or selecting from inventory.

#### Scenario: Add cone by barcode scan
- **WHEN** user scans cone barcode for PENDING/PARTIAL issue request
- **THEN** system adds cone to issue request and updates issued_meters

#### Scenario: Add cone from inventory list
- **WHEN** user selects cone from available inventory for the thread_type_id
- **THEN** system adds cone to issue request

#### Scenario: Reject unavailable cone
- **WHEN** user tries to add cone with status other than AVAILABLE
- **THEN** system rejects with error "Cuộn này không khả dụng"

#### Scenario: Reject wrong thread type
- **WHEN** user tries to add cone with thread_type_id different from issue request
- **THEN** system rejects with error "Loại chỉ không khớp với yêu cầu"

### Requirement: Over-Limit Notes

The system SHALL require over_limit_notes when adding cones that cause total issued meters to exceed quota.

#### Scenario: Within quota - no notes required
- **WHEN** adding cone keeps total issued_meters ≤ quota_meters
- **THEN** system allows without requiring over_limit_notes

#### Scenario: Exceeds quota - notes required
- **WHEN** adding cone causes total issued_meters > quota_meters
- **THEN** system requires over_limit_notes before proceeding

#### Scenario: Reject empty notes when over quota
- **WHEN** user submits over-quota addition with empty over_limit_notes
- **THEN** system rejects with error "Vui lòng ghi chú lý do xuất vượt định mức"

### Requirement: Cone Status Update

The system SHALL update cone status to IN_PRODUCTION when added to issue request.

#### Scenario: Update cone status on issue
- **WHEN** cone is added to issue request
- **THEN** cone status changes from AVAILABLE to IN_PRODUCTION

#### Scenario: Record movement
- **WHEN** cone is issued
- **THEN** system creates thread_movements record with type ISSUE

### Requirement: Remove Cone from Issue Request

The system SHALL allow removing cones from issue request before completion.

#### Scenario: Remove cone from pending request
- **WHEN** user removes cone from PENDING/PARTIAL request
- **THEN** cone status returns to AVAILABLE and issued_meters is updated

#### Scenario: Reject removal from completed request
- **WHEN** user tries to remove cone from COMPLETED request
- **THEN** system rejects with error "Không thể sửa yêu cầu đã hoàn thành"

### Requirement: Batch Number Tracking

The system SHALL assign batch_number to each cone addition to track issuance waves.

#### Scenario: First batch
- **WHEN** first cones are added to issue request
- **THEN** batch_number is 1

#### Scenario: Subsequent batch
- **WHEN** cones are added after some time gap (new session)
- **THEN** batch_number increments

### Requirement: Link to Allocation

The system SHALL optionally link issue items to existing allocation for traceability.

#### Scenario: Issue with allocation
- **WHEN** issue item references an allocation_id
- **THEN** system links item to allocation and updates allocation.issued_meters

#### Scenario: Direct issue without allocation
- **WHEN** issue item has no allocation_id
- **THEN** system processes normally without allocation link

### Requirement: Issue Item Listing

The system SHALL provide listing of all cones in an issue request with quantities and batch info.

#### Scenario: List issue items
- **WHEN** user views issue request detail
- **THEN** system shows all cones with cone_id, thread_type, quantity_meters, batch_number, issued_by, issued_at

#### Scenario: Group by batch
- **WHEN** user views with batch grouping
- **THEN** system groups items by batch_number with subtotals
