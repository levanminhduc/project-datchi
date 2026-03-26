## ADDED Requirements

### Requirement: Create Issue Request

The system SHALL allow users to create an issue request linked to a PO, Style, Color, and Thread Type. The issue request SHALL auto-generate a unique issue code in format `XK-YYYYMMDD-NNN`.

#### Scenario: Create issue request with valid data
- **WHEN** user submits issue request with po_id, style_id, color_id, thread_type_id, department, and requested_meters
- **THEN** system creates issue request with status PENDING and auto-generated issue_code

#### Scenario: Calculate quota on creation
- **WHEN** issue request is created
- **THEN** system calculates quota_meters from style_thread_specs (meters_per_unit × order_quantity) and stores it on the request

#### Scenario: Reject without required fields
- **WHEN** user submits issue request missing po_id, style_id, color_id, or thread_type_id
- **THEN** system rejects with validation error

### Requirement: Department Selection

The system SHALL provide a dropdown of departments populated from DISTINCT values in employees.department column.

#### Scenario: Load department options
- **WHEN** user opens issue request form
- **THEN** system loads department options from employees.department DISTINCT values

#### Scenario: Department is required
- **WHEN** user submits issue request without department
- **THEN** system rejects with validation error "Vui lòng chọn bộ phận nhận"

### Requirement: Multiple Issue Batches

The system SHALL allow multiple issue requests for the same PO/Style/Color/ThreadType combination to support multi-batch issuance.

#### Scenario: Create second batch
- **WHEN** user creates issue request for PO/Style/Color/ThreadType that already has existing requests
- **THEN** system creates new request with incremented batch tracking

#### Scenario: View batch history
- **WHEN** user views issue requests for a PO
- **THEN** system shows all batches with running totals

### Requirement: Quota Warning

The system SHALL calculate remaining quota and warn when requested meters exceed available quota.

#### Scenario: Request within quota
- **WHEN** user requests meters ≤ remaining quota
- **THEN** system proceeds normally without warning

#### Scenario: Request exceeds quota
- **WHEN** user requests meters > remaining quota
- **THEN** system shows warning with over-limit amount and quota details

#### Scenario: Quota calculation
- **WHEN** system calculates remaining quota
- **THEN** remaining_quota = quota_meters - SUM(issued_meters from all requests for same PO/Style/Color/ThreadType)

### Requirement: Issue Request Status

The system SHALL track issue request status as PENDING, PARTIAL, COMPLETED, or CANCELLED.

#### Scenario: Initial status
- **WHEN** issue request is created
- **THEN** status is PENDING

#### Scenario: Partial issuance
- **WHEN** issued_meters < requested_meters and issued_meters > 0
- **THEN** status is PARTIAL

#### Scenario: Complete issuance
- **WHEN** issued_meters >= requested_meters
- **THEN** status is COMPLETED

#### Scenario: Cancel request
- **WHEN** user cancels request with status PENDING
- **THEN** status changes to CANCELLED

### Requirement: List and Filter Issue Requests

The system SHALL provide listing of issue requests with filtering by PO, status, department, and date range.

#### Scenario: Filter by PO
- **WHEN** user filters by po_number
- **THEN** system returns only requests for that PO

#### Scenario: Filter by status
- **WHEN** user filters by status (e.g., PENDING)
- **THEN** system returns only requests with that status

#### Scenario: Filter by date range
- **WHEN** user filters by date range
- **THEN** system returns requests created within that range
