## ADDED Requirements

### Requirement: Route query watcher loads draft issue
The system SHALL watch `route.query.issue` for changes and load the corresponding draft issue into the create form when the param changes.

#### Scenario: User clicks DRAFT row in history table
- **WHEN** user clicks a row with status DRAFT in the history table
- **THEN** the URL updates to `?tab=create&issue={id}`, `fetchIssue` is called with the issue ID, `activeTab` switches to `create`, and the form populates with `department` and `createdBy` from the loaded issue

#### Scenario: User navigates directly via URL with issue param
- **WHEN** the page loads with `?issue={id}` in the URL and the issue has DRAFT status
- **THEN** the draft issue loads into the create form with department and createdBy populated

#### Scenario: Issue param is removed or cleared
- **WHEN** the `issue` query param is removed from the URL
- **THEN** no additional fetch is triggered and the current state remains unchanged

#### Scenario: Issue param references a non-DRAFT issue
- **WHEN** the `issue` query param references an issue with CONFIRMED status
- **THEN** the system SHALL redirect to the detail page `/thread/issues/v2/{id}`
