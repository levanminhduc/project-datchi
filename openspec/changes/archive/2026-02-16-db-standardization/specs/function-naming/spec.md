## ADDED Requirements

### Requirement: Rename regular functions to fn_ prefix
The system SHALL rename 12 PostgreSQL functions to use the `fn_` prefix:

| Current Name | New Name |
|---|---|
| allocate_thread | fn_allocate_thread |
| can_manage_employee | fn_can_manage_employee |
| cleanup_expired_refresh_tokens | fn_cleanup_expired_refresh_tokens |
| get_employee_permissions | fn_get_employee_permissions |
| get_employee_roles | fn_get_employee_roles |
| has_any_permission | fn_has_any_permission |
| has_permission | fn_has_permission |
| is_admin | fn_is_admin |
| is_root | fn_is_root |
| issue_cone | fn_issue_cone |
| recover_cone | fn_recover_cone |
| split_allocation | fn_split_allocation |

#### Scenario: Function renamed in database
- **WHEN** the migration runs
- **THEN** each function SHALL be renamed using `ALTER FUNCTION ... RENAME TO ...` and the old name SHALL no longer exist

#### Scenario: Backend RPC calls updated
- **WHEN** functions are renamed
- **THEN** all `.rpc()` calls in the backend SHALL reference the new `fn_` prefixed names

#### Scenario: Functions called by other functions
- **WHEN** a renamed function is called by another SQL function (e.g., `is_admin` called inside `can_manage_employee`)
- **THEN** the calling function body SHALL be updated to use the new name via `CREATE OR REPLACE FUNCTION`

### Requirement: Rename trigger functions to fn_ prefix
The system SHALL rename 3 trigger functions:

| Current Name | New Name |
|---|---|
| thread_audit_trigger_func | fn_thread_audit_trigger |
| update_lots_updated_at | fn_update_lots_updated_at |
| update_updated_at_column | fn_update_updated_at_column |

#### Scenario: Trigger function renamed
- **WHEN** the migration runs
- **THEN** each trigger function SHALL be renamed and all triggers referencing it SHALL be updated to call the new function name
