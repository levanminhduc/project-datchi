## Requirements

### Requirement: Global authentication middleware on all API routes
The system SHALL apply `authMiddleware` globally to all `/api/*` routes using `except()` from `hono/combine`, requiring a valid JWT Bearer token for every request unless the route is explicitly whitelisted.

#### Scenario: Authenticated request to protected route
- **WHEN** a request with a valid JWT Bearer token is sent to any `/api/*` endpoint
- **THEN** the system SHALL verify the token, attach auth context to the request, and allow the request to proceed

#### Scenario: Unauthenticated request to protected route
- **WHEN** a request without an Authorization header is sent to any `/api/*` endpoint (e.g., `GET /api/employees`)
- **THEN** the system SHALL return HTTP 401 with `{ error: true, message: "Token không hợp lệ" }`

#### Scenario: Expired token
- **WHEN** a request with an expired JWT is sent to any `/api/*` endpoint
- **THEN** the system SHALL return HTTP 401 with `{ error: true, message: "Token đã hết hạn" }`

### Requirement: Public route whitelist
The system SHALL exempt the following routes from authentication via `except()`:
- `POST /api/auth/login`
- `POST /api/auth/refresh`

All other `/api/*` routes SHALL require authentication by default.

#### Scenario: Login without token
- **WHEN** a `POST` request is sent to `/api/auth/login` without an Authorization header
- **THEN** the system SHALL process the login request normally (no 401)

#### Scenario: Refresh token without auth
- **WHEN** a `POST` request is sent to `/api/auth/refresh` without an Authorization header
- **THEN** the system SHALL process the refresh request normally (no 401)

#### Scenario: Non-whitelisted auth route requires token
- **WHEN** a `GET` request is sent to `/api/auth/me` without an Authorization header
- **THEN** the system SHALL return HTTP 401

### Requirement: Health check endpoint outside API scope
The `GET /health` endpoint SHALL remain outside the `/api/*` path and SHALL NOT require authentication.

#### Scenario: Health check without token
- **WHEN** a `GET` request is sent to `/health` without any Authorization header
- **THEN** the system SHALL return HTTP 200 with `{ status: "ok" }`

### Requirement: Secure HTTP headers
The system SHALL apply `secureHeaders()` from `hono/secure-headers` as the first middleware, before CORS and auth middleware.

#### Scenario: Response includes security headers
- **WHEN** any response is returned from the server
- **THEN** the response SHALL include headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection: 0`, and `Strict-Transport-Security` (if configured)

### Requirement: JWT algorithm pinning
The `authMiddleware` SHALL verify JWT tokens with explicit algorithm restriction `{ algorithms: ['HS256'] }` passed to `jwt.verify()`.

#### Scenario: Token with HS256 algorithm
- **WHEN** a request contains a JWT signed with HS256 and the correct secret
- **THEN** the system SHALL accept the token and proceed

#### Scenario: Token with 'none' algorithm
- **WHEN** a request contains a JWT with `alg: 'none'`
- **THEN** the system SHALL reject the token with HTTP 401

### Requirement: Middleware registration order
The global auth middleware SHALL be registered AFTER `secureHeaders()` and `cors()`, but BEFORE all `app.route()` calls.

#### Scenario: Middleware execution order
- **WHEN** a request arrives at any `/api/*` endpoint
- **THEN** the middleware SHALL execute in order: secureHeaders → cors → authMiddleware (via except) → route handler

### Requirement: Remove redundant per-route authMiddleware
After global auth is applied, `authMiddleware` SHALL be removed from individual route files that previously applied it: `auth.ts` (per-endpoint), `settings.ts` (per-endpoint), and `notifications.ts` (`use('*', authMiddleware)`). Authorization middleware (`requireAdmin`, `requireRoot`) SHALL remain.

#### Scenario: Auth route keeps requireAdmin but drops authMiddleware
- **WHEN** a `POST` request with valid JWT but non-admin role is sent to `/api/auth/reset-password/1`
- **THEN** the system SHALL return HTTP 403 (from `requireAdmin`), not 401 (auth already handled globally)

#### Scenario: Notifications route no longer double-verifies
- **WHEN** a request with valid JWT is sent to `/api/notifications`
- **THEN** the JWT SHALL be verified exactly once (by global middleware), not twice
