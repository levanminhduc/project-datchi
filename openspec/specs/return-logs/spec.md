# return-logs Specification

## Purpose
TBD - created by archiving change return-history. Update Purpose after archive.
## Requirements
### Requirement: Return log storage
The system SHALL create a `thread_issue_return_logs` table that records each individual return transaction. Each log entry SHALL store the issue_id, line_id, returned_full count, returned_partial count, and created_at timestamp. The created_by field SHALL be nullable.

#### Scenario: Log created on successful return
- **WHEN** a user submits a return via `POST /api/issues/v2/:id/return` with valid quantities
- **THEN** the system SHALL INSERT one row into `thread_issue_return_logs` for each line in the return payload, with the quantities returned in that transaction and the current timestamp

#### Scenario: Log creation failure does not block return
- **WHEN** the INSERT into `thread_issue_return_logs` fails for any reason
- **THEN** the return operation SHALL still succeed (counters updated, stock restored) and the error SHALL be logged server-side

### Requirement: Return history API endpoint
The system SHALL provide a `GET /api/issues/v2/:id/return-logs` endpoint that returns all return log entries for a given issue, ordered by created_at descending. Each entry SHALL include the thread name, thread code, color name (if available), returned_full, returned_partial, and created_at.

#### Scenario: Fetch return logs for an issue with history
- **WHEN** client calls `GET /api/issues/v2/123/return-logs` and issue 123 has 3 return transactions
- **THEN** the system SHALL return `{ success: true, data: [...] }` with 3 log entries, each containing thread_name, thread_code, color_name, returned_full, returned_partial, created_at, ordered by created_at descending

#### Scenario: Fetch return logs for an issue with no history
- **WHEN** client calls `GET /api/issues/v2/123/return-logs` and issue 123 has no return logs
- **THEN** the system SHALL return `{ success: true, data: [] }`

#### Scenario: Fetch return logs for non-existent issue
- **WHEN** client calls `GET /api/issues/v2/999/return-logs` and issue 999 does not exist
- **THEN** the system SHALL return `{ success: false, error: "Không tìm thấy phiếu xuất" }` with HTTP 404

### Requirement: Return history display on return page
The system SHALL display a return history table on the `return.vue` page below the return input form when an issue is selected. The table SHALL show: sequence number (Lần), thread info (Loại chỉ), full cones returned (Nguyên), partial cones returned (Lẻ), and timestamp (Thời gian) formatted as HH:mm DD/MM/YYYY.

#### Scenario: History table displayed when issue is selected
- **WHEN** user selects a confirmed issue from the dropdown
- **THEN** the system SHALL load and display the return history table below the return form, showing all previous return transactions for that issue

#### Scenario: History table shows empty state
- **WHEN** user selects an issue that has no return history
- **THEN** the system SHALL display the message "Chưa có lịch sử trả kho"

#### Scenario: History table refreshes after new return
- **WHEN** user successfully submits a return for the selected issue
- **THEN** the return history table SHALL refresh to include the newly created return log entries

### Requirement: Return history data loading
The composable `useReturnV2` SHALL expose a `returnLogs` ref and a `loadReturnLogs(issueId)` method. Return logs SHALL be loaded automatically when an issue is selected and reloaded after a successful return submission.

#### Scenario: Logs loaded on issue selection
- **WHEN** user selects an issue in the return page
- **THEN** the composable SHALL call `GET /api/issues/v2/:id/return-logs` and populate the `returnLogs` ref

#### Scenario: Logs cleared when issue is deselected
- **WHEN** user clears the issue selection
- **THEN** the composable SHALL clear the `returnLogs` ref to an empty array

