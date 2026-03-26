# loan-return-history Specification

## Purpose
Return event log table, return logs API, expandable preview in loan tables, and LoanDetailDialog with full history. Synced from change: loan-return-tracking (2026-03-21).

## Requirements

### Requirement: Return event log table
The system SHALL maintain a `thread_loan_return_logs` table recording every return event.

#### Scenario: Log table schema
- **WHEN** table is created
- **THEN** it SHALL have columns: `id` (SERIAL PK), `loan_id` (FK → thread_order_loans.id), `cones_returned` (INTEGER NOT NULL), `return_type` (VARCHAR(10), values 'AUTO' or 'MANUAL'), `returned_by` (VARCHAR(100) NOT NULL), `notes` (TEXT NULL), `created_at` (TIMESTAMPTZ DEFAULT NOW())

#### Scenario: Auto-return creates log entries
- **WHEN** `fn_auto_return_loans()` returns cones to a loan
- **THEN** system SHALL INSERT a log entry with `return_type = 'AUTO'`, `returned_by = 'system'`, `cones_returned = <count returned to this loan>`

#### Scenario: Manual return creates log entries
- **WHEN** `fn_manual_return_loan()` completes successfully
- **THEN** system SHALL INSERT a log entry with `return_type = 'MANUAL'`, `returned_by = <user>`, `notes = <user input>`

### Requirement: Return logs API endpoint
The system SHALL expose `GET /api/weekly-orders/loans/:loanId/return-logs` to retrieve return history.

#### Scenario: Fetch logs for a loan
- **WHEN** GET request for loan #1
- **THEN** system SHALL return all `thread_loan_return_logs` WHERE `loan_id = 1` ordered by `created_at DESC`

#### Scenario: Empty logs
- **WHEN** loan has no return events
- **THEN** system SHALL return empty array `[]`

### Requirement: Return history expandable preview
The system SHALL show return history inline via expandable rows in loan tables (both `loans.vue` and `weekly-order/[id].vue`).

#### Scenario: Expandable row content
- **WHEN** user expands a loan row
- **THEN** system SHALL show up to 3 most recent return logs with: timestamp (DD/MM HH:mm), icon (robot for AUTO, wrench for MANUAL), cones count, actor name

#### Scenario: More than 3 logs
- **WHEN** loan has more than 3 return logs
- **THEN** expandable area SHALL show 3 most recent + "Xem đầy đủ (N)" link

#### Scenario: No logs
- **WHEN** loan has 0 return logs
- **THEN** expandable area SHALL show "Chưa có lần trả nào"

### Requirement: Loan detail dialog with full history
The system SHALL provide `LoanDetailDialog` showing complete loan info and full return history.

#### Scenario: Dialog content
- **WHEN** dialog opens for a loan
- **THEN** it SHALL show: loan header (from_week → to_week, thread type), quantities (borrowed, returned/total, remaining), status badge, full return log timeline (all entries, newest first), loan metadata (reason, created_by, created_at)

#### Scenario: Dialog action for ACTIVE loans
- **WHEN** dialog is open for an ACTIVE loan
- **THEN** dialog SHALL include "Trả thủ công" button that opens `ManualReturnDialog`

#### Scenario: Dialog for SETTLED loans
- **WHEN** dialog is open for a SETTLED loan
- **THEN** "Trả thủ công" button SHALL NOT be shown

#### Scenario: Loading state
- **WHEN** return logs are being fetched
- **THEN** dialog SHALL show loading spinner in the history section

#### Scenario: Error loading logs
- **WHEN** API returns error fetching logs
- **THEN** dialog SHALL show "Lỗi tải lịch sử" with retry option
