## ADDED Requirements

### Requirement: Delete DRAFT issue via API
The system SHALL provide a DELETE endpoint at `/api/issues/v2/:id` that removes a DRAFT issue and all its associated lines from the database. The endpoint MUST reject requests for issues that are not in DRAFT status.

#### Scenario: Successfully delete a DRAFT issue
- **WHEN** a DELETE request is sent to `/api/issues/v2/:id` where the issue has status DRAFT
- **THEN** the system deletes all `thread_issue_lines` with `issue_id = :id` and then deletes the `thread_issues` record, returning `{ success: true, data: { id, issue_code } }`

#### Scenario: Attempt to delete a CONFIRMED issue
- **WHEN** a DELETE request is sent to `/api/issues/v2/:id` where the issue has status CONFIRMED
- **THEN** the system returns HTTP 400 with error message indicating only DRAFT issues can be deleted

#### Scenario: Attempt to delete a RETURNED issue
- **WHEN** a DELETE request is sent to `/api/issues/v2/:id` where the issue has status RETURNED
- **THEN** the system returns HTTP 400 with error message indicating only DRAFT issues can be deleted

#### Scenario: Attempt to delete a non-existent issue
- **WHEN** a DELETE request is sent to `/api/issues/v2/:id` where no issue exists with that ID
- **THEN** the system returns HTTP 404 with error message indicating the issue was not found

### Requirement: Service method for deleting issues
The `issueV2Service` SHALL expose a `deleteIssue(id: number)` method that calls `DELETE /api/issues/v2/:id` using `fetchApi` and throws on error.

#### Scenario: Service calls delete endpoint
- **WHEN** `issueV2Service.deleteIssue(123)` is called
- **THEN** it sends a DELETE request to `/api/issues/v2/123` via `fetchApi` and returns on success or throws an Error on failure
