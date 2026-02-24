## ADDED Requirements

### Requirement: Employee auth_user_id column
The system SHALL add an `auth_user_id` column (UUID, UNIQUE, NULLABLE) to the `employees` table that references `auth.users(id)` with ON DELETE SET NULL.

#### Scenario: Column exists after migration
- **WHEN** the migration runs
- **THEN** `employees` table has `auth_user_id UUID UNIQUE` column
- **AND** a unique index exists on `employees.auth_user_id`

#### Scenario: Active employee has auth_user_id populated
- **WHEN** the data migration script completes
- **THEN** every employee with `is_active = true` and `password_hash IS NOT NULL` SHALL have a non-null `auth_user_id`

### Requirement: Auth users created from employees
The system SHALL create `auth.users` entries for all active employees using `supabase.auth.admin.createUser()` with their existing bcrypt `password_hash`.

#### Scenario: Employee with bcrypt hash migrated
- **WHEN** the migration script processes employee "NV001" with `password_hash = '$2b$10$...'`
- **THEN** an `auth.users` entry is created with `email = 'nv001@internal.datchi.local'` and the same bcrypt hash
- **AND** `email_confirmed_at` is set (no email verification required)
- **AND** the returned UUID is stored in `employees.auth_user_id`

#### Scenario: Employee without password skipped
- **WHEN** an employee has `password_hash IS NULL` or `is_active = false`
- **THEN** no `auth.users` entry is created
- **AND** `auth_user_id` remains NULL

#### Scenario: Idempotent re-run
- **WHEN** the migration script is run again after a partial failure
- **THEN** employees that already have `auth_user_id` set SHALL be skipped
- **AND** only employees without `auth_user_id` SHALL be processed

### Requirement: Email mapping convention
The system SHALL use `{employee_id.toLowerCase()}@internal.datchi.local` as the email address for each employee in `auth.users`.

#### Scenario: Standard employee ID mapping
- **WHEN** employee has `employee_id = 'NV001'`
- **THEN** the `auth.users.email` is `'nv001@internal.datchi.local'`

#### Scenario: ROOT user mapping
- **WHEN** employee has `employee_id = 'ROOT'`
- **THEN** the `auth.users.email` is `'root@internal.datchi.local'`

### Requirement: Custom access token hook function
The system SHALL create a PostgreSQL function `custom_access_token_hook(event jsonb)` that injects custom claims into the Supabase JWT.

#### Scenario: Claims injected on login
- **WHEN** a user signs in with Supabase Auth
- **THEN** the JWT `access_token` SHALL contain these custom claims:
  - `employee_id` (integer): the `employees.id` value
  - `employee_code` (string): the `employees.employee_id` value (e.g., "NV001")
  - `roles` (string[]): array of role codes from `employee_roles` → `roles.code`
  - `is_root` (boolean): `true` if roles contain 'root', `false` otherwise

#### Scenario: Claims injected on token refresh
- **WHEN** the Supabase SDK refreshes the access token
- **THEN** the hook runs again and the new token contains fresh claims from the database

#### Scenario: Inactive employee blocked
- **WHEN** the hook runs for a user whose linked employee has `is_active = false`
- **THEN** the hook SHALL return an error response that prevents token issuance
- **AND** the user receives an authentication error

#### Scenario: Employee not found
- **WHEN** the hook runs for a user UUID that has no matching `employees.auth_user_id`
- **THEN** the hook SHALL return claims without custom fields (default Supabase JWT)
- **AND** backend middleware will reject the request due to missing `employee_id` claim

### Requirement: Hook permissions and grants
The system SHALL grant appropriate permissions to `supabase_auth_admin` role for the hook function and related tables.

#### Scenario: Grants applied
- **WHEN** the migration runs
- **THEN** `supabase_auth_admin` has EXECUTE on `custom_access_token_hook`
- **AND** `supabase_auth_admin` has SELECT on `employees`, `employee_roles`, `roles`
- **AND** `authenticated`, `anon`, `public` roles do NOT have EXECUTE on the hook function

### Requirement: Hook configuration
The system SHALL configure the custom access token hook in Supabase config.

#### Scenario: Local development config
- **WHEN** running Supabase locally via CLI
- **THEN** `supabase/config.toml` SHALL contain `[auth.hook.custom_access_token]` with `enabled = true` and `uri = "pg-functions://postgres/public/custom_access_token_hook"`

#### Scenario: Production Docker config
- **WHEN** deploying to production
- **THEN** GoTrue environment SHALL have `GOTRUE_HOOK_CUSTOM_ACCESS_TOKEN_ENABLED=true` and `GOTRUE_HOOK_CUSTOM_ACCESS_TOKEN_URI="pg-functions://postgres/public/custom_access_token_hook"`

### Requirement: Cleanup of old refresh token table
The system SHALL drop the `employee_refresh_tokens` table after migration is verified complete.

#### Scenario: Table dropped
- **WHEN** migration is verified and all employees are using Supabase Auth
- **THEN** `employee_refresh_tokens` table is dropped
- **AND** related columns `employees.refresh_token` and `employees.refresh_token_expires_at` are dropped
