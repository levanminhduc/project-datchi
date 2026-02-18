## ADDED Requirements

### Requirement: Drop fn_calculate_quota function
The migration SHALL drop the function `fn_calculate_quota()` which references the dropped V1 table `thread_issue_requests`.

#### Scenario: Function does not exist after migration
- **WHEN** the migration runs successfully
- **THEN** `SELECT proname FROM pg_proc WHERE proname = 'fn_calculate_quota'` SHALL return 0 rows

### Requirement: Drop fn_check_quota function
The migration SHALL drop the function `fn_check_quota()` which references the dropped V1 table `thread_issue_requests`.

#### Scenario: Function does not exist after migration
- **WHEN** the migration runs successfully
- **THEN** `SELECT proname FROM pg_proc WHERE proname = 'fn_check_quota'` SHALL return 0 rows

### Requirement: Merge system_settings timestamp function
The migration SHALL drop `fn_update_system_settings_timestamp()` and update the `system_settings` trigger to use the generic `fn_update_updated_at_column()` instead.

#### Scenario: system_settings trigger uses generic function
- **WHEN** the migration runs successfully
- **THEN** the trigger `trigger_system_settings_updated_at` SHALL reference `fn_update_updated_at_column()`
- **THEN** `fn_update_system_settings_timestamp` SHALL NOT exist in `pg_proc`

#### Scenario: system_settings updated_at still works
- **WHEN** a row in `system_settings` is updated
- **THEN** the `updated_at` column SHALL be automatically set to `NOW()`
