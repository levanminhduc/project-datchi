## ADDED Requirements

### Requirement: Return Partial Cone

The system SHALL allow workers to return unused or partially used cones with percentage-based remaining estimation.

#### Scenario: Return with percentage selection
- **WHEN** worker returns cone and selects remaining percentage (10%, 20%, ..., 100%)
- **THEN** system calculates remaining_meters = original_meters × percentage / 100

#### Scenario: Return full cone (100%)
- **WHEN** worker returns cone with 100% remaining
- **THEN** cone status changes to AVAILABLE with original quantity_meters

#### Scenario: Return partial cone
- **WHEN** worker returns cone with percentage < 100%
- **THEN** cone status changes to AVAILABLE with is_partial = true and updated quantity_meters

### Requirement: Percentage Selection Interface

The system SHALL provide percentage selection in 10% increments from 10% to 100%.

#### Scenario: Display percentage options
- **WHEN** worker opens return form
- **THEN** system displays buttons: 10%, 20%, 30%, 40%, 50%, 60%, 70%, 80%, 90%, 100%

#### Scenario: Show calculated meters
- **WHEN** worker selects a percentage
- **THEN** system shows preview: "Còn lại khoảng X mét (Y%)"

#### Scenario: Require percentage selection
- **WHEN** worker submits return without selecting percentage
- **THEN** system rejects with error "Vui lòng chọn phần trăm còn lại"

### Requirement: Return Validation

The system SHALL validate that cone is eligible for return.

#### Scenario: Valid return - cone in production
- **WHEN** worker returns cone with status IN_PRODUCTION
- **THEN** system accepts the return

#### Scenario: Invalid return - cone not issued
- **WHEN** worker tries to return cone with status AVAILABLE
- **THEN** system rejects with error "Cuộn này chưa được xuất kho"

#### Scenario: Invalid return - already returned
- **WHEN** worker tries to return cone that already has return record
- **THEN** system rejects with error "Cuộn này đã được nhập lại"

### Requirement: Update Inventory on Return

The system SHALL update thread_inventory when cone is returned.

#### Scenario: Update quantity_meters
- **WHEN** cone is returned with X% remaining
- **THEN** thread_inventory.quantity_meters = original_meters × X / 100

#### Scenario: Mark as partial
- **WHEN** cone is returned with percentage < 100%
- **THEN** thread_inventory.is_partial = true

#### Scenario: Update status
- **WHEN** cone is returned
- **THEN** thread_inventory.status changes to AVAILABLE

#### Scenario: Record movement
- **WHEN** cone is returned
- **THEN** system creates thread_movements record with type RETURN

### Requirement: Return Notes

The system SHALL allow optional notes on returns for context.

#### Scenario: Return with notes
- **WHEN** worker adds notes to return
- **THEN** notes are stored with return record

#### Scenario: Return without notes
- **WHEN** worker submits return without notes
- **THEN** system accepts (notes are optional)

### Requirement: Return History

The system SHALL track return history for each issue item.

#### Scenario: View returns for issue request
- **WHEN** user views issue request detail
- **THEN** system shows all returns with cone_id, remaining_percentage, returned_by, returned_at

#### Scenario: Calculate consumed meters
- **WHEN** system calculates consumption
- **THEN** consumed_meters = issued_meters - SUM(returned remaining_meters)

### Requirement: Return by Barcode Scan

The system SHALL allow returning cones by scanning barcode on mobile.

#### Scenario: Scan cone for return
- **WHEN** worker scans cone barcode in return mode
- **THEN** system loads cone info and shows percentage selection

#### Scenario: Show cone context on scan
- **WHEN** cone is scanned
- **THEN** system shows: issue request info, PO, style, color, original meters
