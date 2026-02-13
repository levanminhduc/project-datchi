## ADDED Requirements

### Requirement: DRAFT row click navigates to create tab
Clicking a DRAFT issue row in the history DataTable SHALL navigate to the create tab with the issue ID as a query parameter (`?tab=create&issue=<id>`) instead of navigating to the detail page. Non-DRAFT issues (CONFIRMED, RETURNED) SHALL continue navigating to the detail page `[id].vue`.

#### Scenario: User clicks a DRAFT issue row
- **WHEN** user clicks a row with status DRAFT in the history DataTable
- **THEN** the router navigates to `/thread/issues/v2?tab=create&issue=<id>` where `<id>` is the issue ID

#### Scenario: User clicks a CONFIRMED issue row
- **WHEN** user clicks a row with status CONFIRMED in the history DataTable
- **THEN** the router navigates to `/thread/issues/v2/<id>` (detail page, unchanged behavior)

#### Scenario: User clicks a RETURNED issue row
- **WHEN** user clicks a row with status RETURNED in the history DataTable
- **THEN** the router navigates to `/thread/issues/v2/<id>` (detail page, unchanged behavior)

### Requirement: Load draft issue from query parameter
When the page loads or the `issue` query parameter changes, the system SHALL detect the `issue` query parameter, fetch the issue by ID, verify it is in DRAFT status, and populate the form state. If the issue is not DRAFT, the system SHALL redirect to the detail page.

#### Scenario: Page loads with issue query parameter for a DRAFT issue
- **WHEN** `index.vue` mounts with query parameters `tab=create&issue=<id>` and the issue has status DRAFT
- **THEN** the system calls `fetchIssue(id)`, switches to the create tab, and populates `department` and `createdBy` from the fetched issue data

#### Scenario: Page loads with issue query parameter for a non-DRAFT issue
- **WHEN** `index.vue` mounts with query parameter `issue=<id>` and the issue has status CONFIRMED or RETURNED
- **THEN** the system redirects to `/thread/issues/v2/<id>` (detail page)

#### Scenario: Page loads without issue query parameter
- **WHEN** `index.vue` mounts without an `issue` query parameter
- **THEN** the system behaves as before (no draft loading, normal create/history flow)

### Requirement: Form displays loaded draft in editing mode
When a DRAFT issue is loaded via query parameter, the create tab SHALL display the issue header information (issue code, department, created by) as read-only, show existing lines in the detail table, and allow the user to select PO/Style/Color to add new lines.

#### Scenario: Draft issue loaded shows header and existing lines
- **WHEN** a DRAFT issue is loaded into the create tab
- **THEN** the `hasIssue` computed is true, the create form is hidden, the issue header displays the issue code, department, and created_by, and the existing lines are shown in the detail table

#### Scenario: User can add new lines to loaded draft
- **WHEN** a DRAFT issue is loaded and the user selects PO, Style, Color
- **THEN** the thread types load and the user can enter quantities and add lines as normal
