## ADDED Requirements

### Requirement: Issue creation is deferred until first line is added
The system SHALL NOT create a database record for an issue when the user only enters Department and Creator. The issue record SHALL only be created when the user adds their first thread line.

#### Scenario: User enters department and creator only
- **WHEN** user fills in Department and Creator and clicks the proceed button
- **THEN** no API call is made to create an issue; the UI advances to Step 2 (PO/Style/Color selection) using local state only

#### Scenario: User adds first thread line
- **WHEN** user has entered Department, Creator, selected PO/Style/Color, and clicks add on a thread type for the first time (no issue exists yet)
- **THEN** the system SHALL create the issue header AND the first line in a single API call (`POST /api/issues/v2/create-with-lines`)
- **AND** the created issue SHALL have status DRAFT with at least 1 line

#### Scenario: User adds subsequent thread lines
- **WHEN** an issue already exists (was created with the first line) and user adds another thread line
- **THEN** the system SHALL use the existing `POST /api/issues/v2/:id/lines` endpoint as before

### Requirement: Form-data loading works without issue_id
The system SHALL allow loading thread type form data (stock, quota) without requiring an existing issue_id.

#### Scenario: Load form data before issue creation
- **WHEN** user selects PO, Style, and Color but no issue has been created yet
- **THEN** the system SHALL load thread types with stock and quota data via `GET /api/issues/v2/form-data` using only po_id, style_id, and color_id parameters

### Requirement: Line validation works without issue_id
The system SHALL allow validating a thread line (stock check, quota check) without requiring an existing issue_id.

#### Scenario: Validate line before issue creation
- **WHEN** user enters quantities for a thread type but no issue has been created yet
- **THEN** the system SHALL validate via `POST /api/issues/v2/validate-line` without requiring an issue_id in the URL path

### Requirement: Combined create endpoint accepts issue header and first line
The backend SHALL provide an endpoint that atomically creates an issue header and its first line within a single database transaction.

#### Scenario: Successful create with first line
- **WHEN** a valid request is sent to `POST /api/issues/v2/create-with-lines` with department, created_by, and line data (po_id, style_id, color_id, thread_type_id, issued_full, issued_partial)
- **THEN** the system SHALL create a thread_issues record with status DRAFT
- **AND** create a thread_issue_lines record linked to the new issue
- **AND** return the full issue with lines and computed fields

#### Scenario: Validation failure on create
- **WHEN** the line data fails validation (insufficient stock, missing required fields)
- **THEN** no issue or line record SHALL be created
- **AND** the system SHALL return an appropriate error message

### Requirement: No empty issues appear in history
Every issue visible in the history list SHALL have at least one thread line.

#### Scenario: History list contains no empty issues
- **WHEN** user views the history tab
- **THEN** all displayed issues SHALL have `line_count >= 1`
