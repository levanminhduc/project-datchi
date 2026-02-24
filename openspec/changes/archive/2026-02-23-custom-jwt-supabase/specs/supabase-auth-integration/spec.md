## ADDED Requirements

### Requirement: Frontend login via Supabase Auth
The system SHALL authenticate users via `supabase.auth.signInWithPassword()` instead of custom `POST /api/auth/login`.

#### Scenario: Successful login
- **WHEN** user enters employee_id "NV001" and password "correct_password"
- **THEN** frontend converts to email `'nv001@internal.datchi.local'`
- **AND** calls `supabase.auth.signInWithPassword({ email, password })`
- **AND** receives a session with `access_token` containing custom claims
- **AND** `useAuth` state is updated with employee info from JWT claims
- **AND** user is redirected to the dashboard

#### Scenario: Invalid credentials
- **WHEN** user enters wrong employee_id or password
- **THEN** `supabase.auth.signInWithPassword()` returns an error
- **AND** user sees "Mã nhân viên hoặc mật khẩu không đúng"

#### Scenario: Inactive employee login
- **WHEN** an inactive employee attempts to sign in
- **THEN** the `custom_access_token_hook` blocks token issuance
- **AND** user sees "Tài khoản đã bị vô hiệu hóa"

### Requirement: Frontend logout via Supabase Auth
The system SHALL sign out via `supabase.auth.signOut()` instead of custom `POST /api/auth/logout`.

#### Scenario: Successful logout
- **WHEN** user clicks logout
- **THEN** `supabase.auth.signOut()` is called
- **AND** all local auth state is cleared
- **AND** user is redirected to the login page

### Requirement: Automatic token refresh
The system SHALL rely on Supabase SDK's automatic token refresh instead of custom refresh logic.

#### Scenario: Token near expiry
- **WHEN** the access token is about to expire
- **THEN** Supabase SDK automatically refreshes the token using the refresh token
- **AND** the new access token contains fresh custom claims from the hook
- **AND** no user interaction is required

#### Scenario: Refresh token expired
- **WHEN** the refresh token has expired (user inactive for extended period)
- **THEN** `onAuthStateChange` fires with `SIGNED_OUT` event
- **AND** user is redirected to login page with message "Phiên đăng nhập đã hết hạn"

### Requirement: Auth state synchronization
The system SHALL synchronize auth state with `supabase.auth.onAuthStateChange()`.

#### Scenario: Page load with existing session
- **WHEN** user refreshes the page and a valid Supabase session exists in storage
- **THEN** `onAuthStateChange` fires with `INITIAL_SESSION` event
- **AND** `useAuth` state is populated from the session's JWT claims
- **AND** user stays authenticated without re-login

#### Scenario: Session expired on page load
- **WHEN** user refreshes the page and the session is expired/invalid
- **THEN** `onAuthStateChange` fires with `SIGNED_OUT` event
- **AND** user is redirected to login page

#### Scenario: Token refreshed event
- **WHEN** the SDK refreshes the access token
- **THEN** `onAuthStateChange` fires with `TOKEN_REFRESHED` event
- **AND** `useAuth` state is updated with new claims

### Requirement: fetchApi uses Supabase session token
The `fetchApi` function SHALL read the access token from the Supabase session instead of `localStorage` directly.

#### Scenario: Authenticated API call
- **WHEN** `fetchApi('/api/employees')` is called
- **THEN** it reads the token from `supabase.auth.getSession()`
- **AND** sends it as `Authorization: Bearer <token>` header

#### Scenario: No active session
- **WHEN** `fetchApi` is called without an active Supabase session
- **THEN** the request is sent without an Authorization header
- **AND** the backend returns 401

### Requirement: Backend login endpoint simplified
The backend `POST /api/auth/login` endpoint SHALL be removed. Authentication is handled entirely by Supabase Auth.

#### Scenario: Direct API login attempt
- **WHEN** a client calls `POST /api/auth/login`
- **THEN** the endpoint does not exist (404)
- **AND** clients must use Supabase Auth SDK instead

### Requirement: Backend refresh endpoint removed
The backend `POST /api/auth/refresh` endpoint SHALL be removed. Token refresh is handled by Supabase Auth.

#### Scenario: Direct refresh attempt
- **WHEN** a client calls `POST /api/auth/refresh`
- **THEN** the endpoint does not exist (404)

### Requirement: Backend logout endpoint simplified
The backend `POST /api/auth/logout` endpoint SHALL be removed or simplified.

#### Scenario: Logout via Supabase
- **WHEN** a user logs out
- **THEN** frontend calls `supabase.auth.signOut()` directly
- **AND** Supabase invalidates the session server-side

### Requirement: Password change via Supabase Auth
The system SHALL change passwords using `supabase.auth.updateUser({ password })` instead of custom endpoint.

#### Scenario: Employee changes own password
- **WHEN** an authenticated employee changes their password
- **THEN** frontend calls `supabase.auth.updateUser({ password: newPassword })`
- **AND** the password is updated in `auth.users`
- **AND** `employees.must_change_password` is set to `false` via backend API call

#### Scenario: Admin resets employee password
- **WHEN** an admin resets another employee's password
- **THEN** backend calls `supabase.auth.admin.updateUserById(authUserId, { password: newPassword })`
- **AND** `employees.must_change_password` is set to `true`

### Requirement: Must-change-password flow preserved
The system SHALL preserve the `must_change_password` flow after migration.

#### Scenario: First login after password reset
- **WHEN** an employee logs in and `employees.must_change_password = true`
- **THEN** the frontend detects this from a post-login API check
- **AND** shows the password change modal
- **AND** after successful password change, `must_change_password` is set to `false`
