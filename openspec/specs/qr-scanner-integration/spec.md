## ADDED Requirements

### Requirement: QR Scanner Dialog Integration
The system SHALL provide a reusable QR scanner dialog that can be integrated into any form or page requiring cone identification.

#### Scenario: Open scanner from Issue Dialog
- **WHEN** user clicks the QR scanner button in IssueDialog
- **THEN** system opens QrScannerDialog with camera stream active

#### Scenario: Successful scan adds cone to selection
- **WHEN** user scans a valid cone_id QR code that exists in the allocation
- **THEN** system adds the cone to selectedCones list
- **AND** displays success snackbar with cone_id

#### Scenario: Scan duplicate cone shows warning
- **WHEN** user scans a cone_id that is already in the selection list
- **THEN** system displays warning snackbar "Cone đã có trong danh sách"
- **AND** does not add duplicate to the list

#### Scenario: Scan invalid cone shows error
- **WHEN** user scans a cone_id that does not belong to the current allocation
- **THEN** system displays error snackbar "Cone không thuộc phiếu phân bổ này"
- **AND** does not add the cone to the list

### Requirement: Continuous Scanning Mode
The system SHALL support continuous scanning mode where multiple codes can be scanned without closing the dialog.

#### Scenario: Multiple scans in sequence
- **WHEN** user scans one cone and dialog remains open
- **AND** user scans another cone
- **THEN** both cones are added to the selection list
- **AND** each scan triggers haptic feedback (vibration)

#### Scenario: Close scanner manually
- **WHEN** user clicks "Đóng" button or clicks outside dialog
- **THEN** scanner dialog closes
- **AND** camera stream is stopped

### Requirement: Barcode Format Support
The system SHALL support multiple barcode formats commonly used in warehouse operations.

#### Scenario: Scan QR code format
- **WHEN** user scans a QR code containing cone_id
- **THEN** system correctly reads and processes the code

#### Scenario: Scan Code128 barcode
- **WHEN** user scans a Code128 barcode containing cone_id
- **THEN** system correctly reads and processes the code

#### Scenario: Scan EAN-13 barcode
- **WHEN** user scans an EAN-13 barcode containing cone_id
- **THEN** system correctly reads and processes the code

### Requirement: Camera Error Handling
The system SHALL gracefully handle camera access errors with user-friendly Vietnamese messages.

#### Scenario: Camera permission denied
- **WHEN** user denies camera permission
- **THEN** system displays error "Không có quyền truy cập camera. Vui lòng cấp quyền trong cài đặt trình duyệt."
- **AND** provides manual input fallback

#### Scenario: No camera available
- **WHEN** device has no camera or camera is in use
- **THEN** system displays error "Không tìm thấy camera trên thiết bị"
- **AND** provides manual input fallback

#### Scenario: Camera stream fails
- **WHEN** camera stream fails unexpectedly
- **THEN** system displays error message
- **AND** allows user to retry or use manual input

### Requirement: Quick Lookup from Inventory Page
The system SHALL allow users to scan a QR code from the inventory page to quickly view cone details.

#### Scenario: Scan to lookup cone
- **WHEN** user clicks "Quét tra cứu" button on inventory page
- **AND** scans a valid cone_id
- **THEN** system highlights the cone row in the table
- **AND** scrolls to the cone if not visible

#### Scenario: Lookup cone not in current view
- **WHEN** user scans a cone_id that exists but is filtered out
- **THEN** system clears filters
- **AND** navigates to show the cone
