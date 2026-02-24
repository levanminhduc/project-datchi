## ADDED Requirements

### Requirement: Logout prevents re-authentication via stale session
After explicit logout, the system SHALL NOT re-authenticate the user from cached or stale Supabase session tokens during SPA navigation. The `init()` function MUST detect that the user has explicitly logged out and skip session restoration.

#### Scenario: User logs out and navigates to protected route via URL
- **WHEN** user clicks logout and is redirected to login page
- **AND** user types a protected route URL (e.g., `/`) in the browser address bar
- **THEN** the router guard SHALL redirect user to `/login`
- **AND** `isAuthenticated` SHALL remain `false`

#### Scenario: User logs out and uses browser back button
- **WHEN** user clicks logout and is redirected to login page
- **AND** user presses the browser back button
- **THEN** the router guard SHALL redirect user to `/login`

#### Scenario: User logs out then logs in successfully
- **WHEN** user logs out
- **AND** user enters valid credentials on the login page
- **THEN** the system SHALL authenticate the user normally
- **AND** the `loggedOut` flag SHALL be cleared

### Requirement: Logout clears localStorage tokens regardless of signOut result
The `signOut()` function SHALL remove Supabase auth tokens from localStorage even if `supabase.auth.signOut()` throws an error. This ensures `getSession()` returns null on any subsequent call.

#### Scenario: supabase.auth.signOut() succeeds
- **WHEN** `supabase.auth.signOut()` completes successfully
- **THEN** localStorage keys matching `sb-*-auth-token` SHALL be removed
- **AND** `supabase.auth.getSession()` SHALL return `{ session: null }`

#### Scenario: supabase.auth.signOut() fails with network error
- **WHEN** `supabase.auth.signOut()` throws an error
- **THEN** localStorage keys matching `sb-*-auth-token` SHALL still be removed
- **AND** user SHALL still be redirected to `/login`
- **AND** success message "Đã đăng xuất" SHALL still be shown

### Requirement: Page reload after logout requires fresh login
On full page reload (F5 / browser refresh), the module-level `loggedOut` flag resets. The system SHALL rely on localStorage being cleared to prevent re-authentication. Since tokens were removed during logout, `getSession()` returns null and user is redirected to login.

#### Scenario: User logs out and refreshes the login page
- **WHEN** user is on `/login` after logout
- **AND** user presses F5 to refresh
- **THEN** user SHALL remain on `/login`
- **AND** `getSession()` SHALL return null (tokens were cleared from localStorage)
