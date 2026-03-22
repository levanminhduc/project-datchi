## ADDED Requirements

### Requirement: Thread issues table exists
The system SHALL have a `thread_issues` table for issue request headers.

#### Scenario: Table structure
- **WHEN** the thread_issues table is created
- **THEN** it SHALL have columns: id (SERIAL), issue_code (VARCHAR UNIQUE), department (VARCHAR), status (ENUM: DRAFT, CONFIRMED, RETURNED), created_by (VARCHAR), notes (TEXT NULL), created_at, updated_at

### Requirement: Thread issue lines table exists
The system SHALL have a `thread_issue_lines` table for issue line items.

#### Scenario: Table structure
- **WHEN** the thread_issue_lines table is created
- **THEN** it SHALL have columns: id (SERIAL), issue_id (FK), po_id (FK NULL), style_id (FK NULL), color_id (FK NULL), thread_type_id (FK), quota_cones (DECIMAL), issued_full (INTEGER DEFAULT 0), issued_partial (INTEGER DEFAULT 0), returned_full (INTEGER DEFAULT 0), returned_partial (INTEGER DEFAULT 0), over_quota_notes (TEXT NULL), created_at

### Requirement: Auto-generate issue code
The system SHALL auto-generate unique issue codes.

#### Scenario: Code format
- **WHEN** creating a new issue
- **THEN** system SHALL generate code in format XK-YYYYMMDD-NNN (e.g., XK-20260211-001)

### Requirement: Create issue API
The system SHALL provide an API endpoint to create a new issue.

#### Scenario: Create issue with department
- **WHEN** client sends POST /api/issues/v2 with department, created_by
- **THEN** system SHALL create issue with status=DRAFT and return issue_id and issue_code

### Requirement: Add issue line API
The system SHALL provide an API endpoint to add lines to an issue.

#### Scenario: Add line with quota lookup
- **WHEN** client sends POST /api/issues/v2/:id/lines with po_id, style_id, color_id, thread_type_id
- **THEN** system SHALL look up quota_cones from thread_order_items and create line

#### Scenario: Add line with quantities
- **WHEN** client sends POST /api/issues/v2/:id/lines with thread_type_id, issued_full, issued_partial
- **THEN** system SHALL create line with those quantities

### Requirement: Load quota from Weekly Order
The system SHALL auto-load quota when adding issue line.

#### Scenario: Quota available
- **WHEN** adding line for po_id + style_id + color_id + thread_type_id combination
- **THEN** system SHALL find matching thread_order_item and use its quota_cones

#### Scenario: No quota found
- **WHEN** no matching weekly order item exists
- **THEN** system SHALL set quota_cones = NULL (allow issue without quota)

### Requirement: Quota check on confirm
The system SHALL check quota when confirming issue.

#### Scenario: Within quota
- **WHEN** confirming issue where issued_equivalent <= quota_cones for all lines
- **THEN** system SHALL allow confirmation

#### Scenario: Over quota without notes
- **WHEN** confirming issue where issued_equivalent > quota_cones AND over_quota_notes is empty
- **THEN** system SHALL reject with error "Vượt định mức, yêu cầu ghi chú lý do"

#### Scenario: Over quota with notes
- **WHEN** confirming issue where issued_equivalent > quota_cones AND over_quota_notes is provided
- **THEN** system SHALL allow confirmation

### Requirement: Calculate issued equivalent
The system SHALL calculate equivalent cones using partial ratio.

#### Scenario: Calculation formula
- **WHEN** calculating issued_equivalent
- **THEN** system SHALL use formula: issued_full + (issued_partial × partial_cone_ratio)

### Requirement: Confirm issue API
The system SHALL provide an API to confirm and deduct stock.

#### Scenario: Confirm success
- **WHEN** client sends POST /api/issues/v2/:id/confirm
- **THEN** system SHALL set status=CONFIRMED, deduct stock for each line, and return updated issue

#### Scenario: Confirm with insufficient stock
- **WHEN** confirming but stock is insufficient for any line
- **THEN** system SHALL reject with error listing which thread types are short

### Requirement: Get issue details API
The system SHALL provide an API to get issue with all lines.

#### Scenario: Get by ID
- **WHEN** client sends GET /api/issues/v2/:id
- **THEN** system SHALL return issue with all lines including quota and issued quantities

### Requirement: List issues API
The system SHALL provide an API to list issues with filters.

#### Scenario: Filter by date range
- **WHEN** client sends GET /api/issues/v2?from=2026-02-01&to=2026-02-28
- **THEN** system SHALL return issues created in that range

#### Scenario: Filter by department
- **WHEN** client sends GET /api/issues/v2?department=Chuyền 1
- **THEN** system SHALL return issues for that department

### Requirement: API returns computed fields
The backend API SHALL return all computed values so frontend only displays.

#### Scenario: Get lines with computed values
- **WHEN** client sends GET /api/issues/v2/:id
- **THEN** response SHALL include for each line: issued_equivalent (computed), is_over_quota (boolean), stock_available_full, stock_available_partial

#### Scenario: Validate line returns status
- **WHEN** client sends POST /api/issues/v2/:id/lines/validate with issued_full, issued_partial
- **THEN** backend SHALL compute issued_equivalent, check quota, check stock, and return validation result

### Requirement: Load issue form data API
The backend SHALL provide an API to load all data needed for issue form.

#### Scenario: Get thread types for product color
- **WHEN** client sends GET /api/issues/v2/form-data?po_id=X&style_id=Y&color_id=Z
- **THEN** backend SHALL return list of thread_types with quota_cones and stock_available for each

### Requirement: Issue UI page (display only)
The UI SHALL only display data and collect input, all logic is backend.

#### Scenario: Create new issue
- **WHEN** user clicks "Tạo phiếu xuất"
- **THEN** UI SHALL show form with department, created_by fields

#### Scenario: Add line to issue
- **WHEN** user selects PO → Style → Color
- **THEN** UI SHALL call API to load thread types and display returned data (quota, stock)

#### Scenario: Enter quantities
- **WHEN** user enters issued_full and issued_partial for a line
- **THEN** UI SHALL call validate API and display returned issued_equivalent and status

#### Scenario: Show stock availability
- **WHEN** displaying a thread type line
- **THEN** UI SHALL display stock_available_full and stock_available_partial from API response

#### Scenario: Over quota warning
- **WHEN** API returns is_over_quota = true for a line
- **THEN** UI SHALL highlight the line in warning color and show notes input

#### Scenario: Confirm issue
- **WHEN** user clicks "Xác nhận xuất"
- **THEN** UI SHALL call confirm API and display result (success or error message)
