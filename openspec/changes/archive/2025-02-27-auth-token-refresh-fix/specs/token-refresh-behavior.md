# Spec: Token Refresh Behavior

## Capability
The system SHALL automatically refresh expired access tokens and retry failed requests.

## Requirements

### REQ-1: Auto-refresh on init
- **GIVEN** user opens the app after token has expired
- **WHEN** `useAuth.init()` is called
- **THEN** the system SHALL call `supabase.auth.getUser()` to validate and refresh the token
- **AND** if refresh succeeds, proceed with fetching employee data
- **AND** if refresh fails, reset auth state and allow user to login again

### REQ-2: 401 retry in fetchApi
- **GIVEN** an API request returns 401 status
- **WHEN** the error indicates token expired
- **THEN** the system SHALL call `supabase.auth.refreshSession()`
- **AND** retry the original request with the new token
- **AND** if retry succeeds, return the response normally
- **AND** if retry fails, throw an error for redirect to login

### REQ-3: Single retry only
- **GIVEN** an API request has already been retried once
- **WHEN** the retry also returns 401
- **THEN** the system SHALL NOT retry again
- **AND** SHALL throw an error immediately

### REQ-4: Permissions refresh on token refresh
- **GIVEN** the SDK fires a TOKEN_REFRESHED event
- **WHEN** the event handler executes
- **THEN** the system SHALL refresh both employee data AND permissions
- **AND** update the auth state with new permissions

### REQ-5: Auth listener timing
- **GIVEN** `useAuth.init()` is called
- **WHEN** the function starts execution
- **THEN** `setupAuthListener()` SHALL be called BEFORE any token validation
- **AND** SHALL remain active throughout the session

## Acceptance Criteria

1. User can return to the app after 2+ hours and continue working without re-login
2. No "Không tìm thấy nhân viên" error after login
3. Token refresh is transparent to the user (no visible interruption)
4. If session cannot be recovered, user is cleanly redirected to login
