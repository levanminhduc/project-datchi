## ADDED Requirements

### Requirement: Stocktake Page Access
The system SHALL provide a dedicated stocktake page for inventory verification.

#### Scenario: Navigate to stocktake page
- **WHEN** user clicks "Kiểm kê" menu item or navigates to /thread/stocktake
- **THEN** system displays the stocktake page
- **AND** page shows warehouse selection dropdown

#### Scenario: Select warehouse before scanning
- **WHEN** user has not selected a warehouse
- **THEN** scanner is disabled
- **AND** message prompts user to select warehouse first

### Requirement: Continuous Scanning for Stocktake
The system SHALL support continuous QR scanning during stocktake without interruption.

#### Scenario: Start stocktake scanning session
- **WHEN** user selects warehouse and clicks "Bắt đầu quét"
- **THEN** camera stream activates
- **AND** scanned items are added to a buffer list in real-time

#### Scenario: Scan valid cone in warehouse
- **WHEN** user scans a cone_id that exists in the selected warehouse
- **THEN** cone is added to scannedList with status "found"
- **AND** list updates immediately showing cone details
- **AND** haptic feedback confirms scan

#### Scenario: Scan cone from different warehouse
- **WHEN** user scans a cone_id that exists but in a different warehouse
- **THEN** cone is added to scannedList with status "wrong_warehouse"
- **AND** displays warning indicator on the item

#### Scenario: Scan unknown cone
- **WHEN** user scans a cone_id that does not exist in database
- **THEN** cone is added to scannedList with status "not_found"
- **AND** displays error indicator on the item

#### Scenario: Scan duplicate in session
- **WHEN** user scans a cone_id already in current scannedList
- **THEN** system shows brief warning "Đã quét rồi"
- **AND** does not add duplicate to list
- **AND** highlights the existing item

### Requirement: Scanned Items Management
The system SHALL allow users to manage the list of scanned items before finalizing.

#### Scenario: View scanned items list
- **WHEN** user has scanned items
- **THEN** list displays all scanned items with status icons
- **AND** shows count of found/not_found/wrong_warehouse

#### Scenario: Remove item from scanned list
- **WHEN** user clicks remove button on a scanned item
- **THEN** item is removed from scannedList
- **AND** item can be scanned again

#### Scenario: Clear all scanned items
- **WHEN** user clicks "Xóa tất cả"
- **THEN** system asks for confirmation
- **AND** clears scannedList if confirmed

### Requirement: Database Comparison
The system SHALL compare scanned items with database records to identify discrepancies.

#### Scenario: Generate comparison report
- **WHEN** user clicks "So sánh với kho"
- **THEN** system fetches all cones in selected warehouse from database
- **AND** compares with scannedList
- **AND** displays comparison results

#### Scenario: Show matched items
- **WHEN** comparison is complete
- **THEN** system shows count and list of items that exist in both scan and database

#### Scenario: Show missing items (in DB but not scanned)
- **WHEN** comparison is complete
- **THEN** system shows count and list of items in database but not scanned
- **AND** these are potential missing inventory

#### Scenario: Show extra items (scanned but not in DB)
- **WHEN** comparison is complete
- **THEN** system shows count and list of items scanned but not in database
- **AND** these are potential unrecorded inventory or errors

### Requirement: Stocktake Summary Report
The system SHALL provide a summary of the stocktake results.

#### Scenario: Display summary statistics
- **WHEN** comparison is complete
- **THEN** system displays:
  - Total cones in database for warehouse
  - Total cones scanned
  - Match count and percentage
  - Missing count
  - Extra count

#### Scenario: Export discrepancy list
- **WHEN** user clicks "Xuất báo cáo"
- **THEN** system downloads CSV file with discrepancy details
- **AND** file includes cone_id, status, lot_number, thread_type

### Requirement: Stocktake Session Persistence
The system SHALL allow users to pause and resume stocktake sessions.

#### Scenario: Pause scanning session
- **WHEN** user clicks "Tạm dừng" or navigates away
- **THEN** scannedList is preserved in local storage
- **AND** user can continue later

#### Scenario: Resume previous session
- **WHEN** user returns to stocktake page with existing session
- **THEN** system prompts to continue or start new
- **AND** selecting continue restores scannedList

#### Scenario: Complete and clear session
- **WHEN** user clicks "Hoàn tất kiểm kê"
- **THEN** system clears session from local storage
- **AND** optionally saves record to database (if configured)

### Requirement: API for Cone Lookup
The system SHALL provide an API endpoint to lookup cone details by cone_id.

#### Scenario: Lookup existing cone
- **WHEN** client sends GET /api/thread/cone/:coneId
- **AND** cone exists
- **THEN** API returns cone details with 200 status
- **AND** response includes id, cone_id, warehouse, thread_type, lot_number, weight, status

#### Scenario: Lookup non-existent cone
- **WHEN** client sends GET /api/thread/cone/:coneId
- **AND** cone does not exist
- **THEN** API returns 404 with message "Không tìm thấy cuộn chỉ"
