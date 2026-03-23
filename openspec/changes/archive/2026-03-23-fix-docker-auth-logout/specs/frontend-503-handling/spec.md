## ADDED Requirements

### Requirement: Do not destroy session on 503
The frontend `fetchApiRaw()` SHALL NOT clear the auth session or redirect to login when receiving HTTP 503 from the backend.

#### Scenario: 503 response preserves session
- **WHEN** an API request returns HTTP 503
- **THEN** the system SHALL NOT call `clearAuthSessionLocal()`
- **AND** SHALL NOT call `forceBackToLogin()`
- **AND** SHALL NOT trigger `getRefreshedSession()`

### Requirement: Retry once on 503
The frontend `fetchApiRaw()` SHALL retry the request once after a 1500ms delay when receiving HTTP 503.

#### Scenario: 503 retry succeeds
- **WHEN** an API request returns HTTP 503
- **AND** the retry request returns a non-503 status
- **THEN** the system SHALL return the retry response normally

#### Scenario: 503 retry also fails
- **WHEN** an API request returns HTTP 503
- **AND** the retry request also returns HTTP 503
- **THEN** the system SHALL throw an `ApiError` with status 503 and message "Hệ thống đang tải, vui lòng thử lại sau"

### Requirement: 401 handling unchanged
The existing 401 handling logic (token refresh, session clear, redirect to login) SHALL remain unchanged.

#### Scenario: 401 still triggers refresh flow
- **WHEN** an API request returns HTTP 401
- **THEN** the system SHALL attempt token refresh and retry (existing behavior preserved)
