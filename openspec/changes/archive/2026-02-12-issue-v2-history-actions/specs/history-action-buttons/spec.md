## ADDED Requirements

### Requirement: Actions column in history DataTable
The history DataTable SHALL include an Actions column as the last column with `name: 'actions'`, `label: 'Thao Tác'`, `field: 'actions'`, `align: 'center'`. The column SHALL NOT be sortable.

#### Scenario: Actions column is visible in history table
- **WHEN** the history tab is displayed
- **THEN** the DataTable shows an "Thao Tác" column as the last column

### Requirement: Confirm button for DRAFT issues
The Actions cell SHALL display a Confirm button (icon `check_circle`, color `positive`, size `sm`, flat round) for issues with status DRAFT. Clicking the button SHALL open a warning confirmation dialog before executing.

#### Scenario: User confirms a DRAFT issue from the list
- **WHEN** user clicks the Confirm button on a DRAFT issue row
- **THEN** a warning dialog appears with message indicating the issue will be confirmed and stock will be deducted
- **WHEN** user accepts the dialog
- **THEN** the system calls `issueV2Service.confirm(issueId)`, shows a success snackbar, and refreshes the issue list

#### Scenario: User cancels the confirm dialog
- **WHEN** user clicks the Confirm button then clicks Cancel in the dialog
- **THEN** no action is taken, the issue remains in DRAFT status

### Requirement: Delete button for DRAFT issues
The Actions cell SHALL display a Delete button (icon `delete`, color `negative`, size `sm`, flat round) for issues with status DRAFT. Clicking the button SHALL open a delete confirmation dialog before executing.

#### Scenario: User deletes a DRAFT issue from the list
- **WHEN** user clicks the Delete button on a DRAFT issue row
- **THEN** a delete confirmation dialog appears showing the issue code
- **WHEN** user accepts the dialog
- **THEN** the system calls `issueV2Service.deleteIssue(issueId)`, shows a success snackbar, and refreshes the issue list

#### Scenario: User cancels the delete dialog
- **WHEN** user clicks the Delete button then clicks Cancel in the dialog
- **THEN** no action is taken, the issue remains unchanged

### Requirement: Return button for CONFIRMED issues
The Actions cell SHALL display a Return button (icon `replay`, color `info`, size `sm`, flat round) for issues with status CONFIRMED. Clicking the button SHALL navigate to the return page.

#### Scenario: User clicks Return on a CONFIRMED issue
- **WHEN** user clicks the Return button on a CONFIRMED issue row
- **THEN** the router navigates to `/thread/issues/v2/return`

### Requirement: No action buttons for RETURNED issues
The Actions cell SHALL be empty for issues with status RETURNED.

#### Scenario: RETURNED issue shows no actions
- **WHEN** a row has status RETURNED
- **THEN** the Actions cell displays no buttons

### Requirement: Button click does not trigger row navigation
Clicking action buttons SHALL NOT trigger the existing row-click navigation to the detail page. Event propagation MUST be stopped on button clicks.

#### Scenario: Clicking a button stays on the list
- **WHEN** user clicks any action button in the Actions column
- **THEN** the row-click handler (`handleHistoryRowClick`) is NOT triggered
