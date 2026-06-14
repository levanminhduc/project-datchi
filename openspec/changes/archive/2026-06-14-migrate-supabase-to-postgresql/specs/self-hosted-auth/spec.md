## ADDED Requirements

### Requirement: Backend-owned password verification
The system SHALL verify login passwords in the Hono backend against the existing `employees.password_hash`, with no dependency on Supabase GoTrue.

#### Scenario: Successful login by employee id
- **WHEN** a user submits a valid employee id and correct password
- **THEN** the backend verifies the password against `employees.password_hash` and issues tokens

#### Scenario: Wrong password rejected
- **WHEN** a user submits an incorrect password
- **THEN** the backend returns a Vietnamese authentication error and issues no token

#### Scenario: Existing hashes are not re-hashed
- **WHEN** the migration completes
- **THEN** existing `employees.password_hash` values are used as-is by the matching verify library (bcrypt or argon2 per the stored prefix)

### Requirement: App-signed JWT access tokens with preserved claims
The system SHALL issue access tokens signed with the application's own key via `jose`, carrying the existing claim shape (`employee_id`, `employee_code`, `roles`, `is_root`) plus standard claims, replacing `custom_access_token_hook`.

#### Scenario: Claims match prior shape
- **WHEN** an access token is issued after login
- **THEN** it contains `employee_id`, `employee_code`, `roles`, `is_root`, `sub`, `iat`, and `exp` with the same meanings as before

#### Scenario: Token verified by app key
- **WHEN** a request presents an app-signed token
- **THEN** the auth middleware verifies it with the application's signing key and rejects tokens signed by any other issuer

### Requirement: Refresh-token storage and rotation
The system SHALL store refresh tokens in a dedicated table and rotate them on each refresh, revoking the prior token and detecting reuse, preserving current rotation behavior.

#### Scenario: Refresh rotates the token
- **WHEN** a client refreshes with a valid refresh token
- **THEN** a new access token and a new refresh token are issued and the old refresh token is revoked

#### Scenario: Reused (already-rotated) token rejected
- **WHEN** a client presents a refresh token that was already rotated
- **THEN** the backend rejects it and treats it as a reuse event

#### Scenario: Expired refresh token rejected
- **WHEN** a client presents an expired refresh token
- **THEN** the backend rejects it and the client is returned to login

### Requirement: Auth endpoints owned by the backend
The system SHALL expose login, logout, refresh, change-password, and reset-password endpoints on the Hono API, and SHALL create/update employees without GoTrue admin calls.

#### Scenario: Logout revokes refresh token
- **WHEN** a user logs out
- **THEN** the corresponding refresh token is revoked server-side

#### Scenario: Change password
- **WHEN** an authenticated user submits current and new passwords with the current password correct
- **THEN** the backend re-hashes and stores the new password and reports success in Vietnamese

#### Scenario: Reset password by authorized actor
- **WHEN** an authorized actor resets another employee's password
- **THEN** the backend stores the new hash directly on `employees` without calling GoTrue

#### Scenario: Create employee without GoTrue
- **WHEN** an employee is created
- **THEN** the row is written directly with an in-app password hash and no GoTrue user is created

#### Scenario: Lazy GoTrue-user provisioning endpoint removed
- **WHEN** the migration completes
- **THEN** the `POST /api/auth/ensure-auth-user` endpoint in `server/index.ts` no longer exists, because self-hosted auth treats the `employees` row itself as the identity and has no separate GoTrue user to provision

#### Scenario: Orphan auth_user_id column retained but unused
- **WHEN** any auth or employee flow runs after the migration
- **THEN** `employees.auth_user_id` is neither read nor written, and the column and its existing values are left intact (no data deletion) so a rollback can restore GoTrue wiring without a schema change

### Requirement: Frontend uses backend auth instead of supabase.auth
The frontend SHALL perform login, logout, session storage, refresh-on-401, and cross-tab sync against the Hono API, with all `supabase.auth.*` calls removed, preserving the existing employee-id login UX.

#### Scenario: Login UX preserved
- **WHEN** a user logs in via the existing login screen
- **THEN** the same employee-id + password flow succeeds against the backend endpoint

#### Scenario: Refresh on 401
- **WHEN** an API call returns 401 due to an expired access token
- **THEN** the frontend transparently refreshes via `POST /api/auth/refresh` and retries once

#### Scenario: Cross-tab refresh single-flight
- **WHEN** multiple tabs detect an expiring token simultaneously
- **THEN** only one refresh runs and the others reuse the result, matching current behavior

#### Scenario: Streaming import uses backend token store
- **WHEN** `src/services/importService.ts` issues its streaming-import `fetch` (`/api/import/supplier-colors/stream`)
- **THEN** it reads the access token from the shared token store used by `api.ts` instead of `supabase.auth.getSession()`, and the request still carries a valid bearer token
