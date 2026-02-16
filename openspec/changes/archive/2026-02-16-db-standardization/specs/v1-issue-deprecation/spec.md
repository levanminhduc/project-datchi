## ADDED Requirements

### Requirement: Migrate v1 issue data to v2 format
The system SHALL migrate data from v1 tables (`thread_issue_requests`, `thread_issue_items`, `thread_issue_returns`) to v2 tables (`thread_issues`, `thread_issue_lines`, `thread_issue_return_logs`).

#### Scenario: thread_issue_requests migrated to thread_issues
- **WHEN** the migration runs
- **THEN** each `thread_issue_requests` row SHALL create a corresponding `thread_issues` row with: `issue_code` → `issue_code`, `department` → `department`, `requested_by` → `created_by`, `status` mapped to v2 enum (PENDING→DRAFT, COMPLETED→CONFIRMED)

#### Scenario: thread_issue_requests migrated to thread_issue_lines
- **WHEN** a `thread_issue_requests` row has `po_id`, `style_id`, `color_id`, `thread_type_id`
- **THEN** a `thread_issue_lines` row SHALL be created linking to the new `thread_issues` row

#### Scenario: Verification before drop
- **WHEN** migration completes
- **THEN** the migration SHALL output row counts: original v1 count vs new v2 count, and SHALL NOT proceed to drop if counts mismatch

### Requirement: Drop v1 tables
After successful migration and verification, the system SHALL drop v1 tables.

#### Scenario: Tables dropped
- **WHEN** verification passes
- **THEN** tables `thread_issue_requests`, `thread_issue_items`, `thread_issue_returns` SHALL be dropped

#### Scenario: v1 view dropped
- **WHEN** v1 tables are dropped
- **THEN** view `v_issue_reconciliation` SHALL also be dropped

### Requirement: Delete v1 backend routes
The v1 issue routes in `server/routes/issues.ts` SHALL be deleted entirely.

#### Scenario: Route file deleted
- **WHEN** v1 tables are dropped
- **THEN** `server/routes/issues.ts` SHALL be deleted and its registration removed from `server/index.ts`

#### Scenario: v1 validation deleted
- **WHEN** v1 routes are deleted
- **THEN** `server/validation/issues.ts` SHALL be deleted

#### Scenario: v1 types cleaned
- **WHEN** v1 code is removed
- **THEN** any v1-specific types in `server/types/` SHALL be removed

### Requirement: Remove v1 trigger functions
Trigger functions that only serve v1 tables SHALL be dropped.

#### Scenario: v1 triggers dropped
- **WHEN** v1 tables are dropped
- **THEN** `fn_update_issue_request_issued_meters` and `fn_update_issue_request_status` trigger functions SHALL be dropped (they only fire on v1 tables)
