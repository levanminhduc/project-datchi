## MODIFIED Requirements

### Requirement: Route templates include auth middleware
All route templates SHALL rely on global authentication middleware (applied in `server/index.ts` via `except()`). Route templates SHALL NOT include per-route `authMiddleware` calls. Route templates SHALL include appropriate `requirePermission()` authorization middleware for each endpoint.

#### Scenario: CRUD route has permission protection
- **WHEN** a route template is generated for any CRUD endpoint
- **THEN** the route SHALL apply `requirePermission('<resource>.<action>')` middleware per handler, NOT `authMiddleware` (which is now global)

#### Scenario: Permission-protected route
- **WHEN** a route requires specific permissions
- **THEN** the route handler SHALL include `requirePermission('resource.action')` middleware

## ADDED Requirements

### Requirement: PostgREST filter input sanitization
The system SHALL provide a shared `sanitizeFilterValue(input: string): string` helper in `server/utils/sanitize.ts` that removes characters not matching the allowlist `[a-zA-Z0-9À-ỹ\s._%-]` from user input before interpolation into PostgREST `.or()` filter strings.

All `.or()` calls that include user-provided values SHALL use `sanitizeFilterValue()` before interpolation. The affected locations are:
- `batch.ts` — warehouse ID filter (1 location)
- `employees.ts` — search filter (2 locations)
- `auth.ts` — employee search filter (1 location)
- `lots.ts` — lot ID/number filter (1 location)
- `inventory.ts` — cone/lot search filter (2 locations)
- `suppliers.ts` — name/code search filter (1 location)
- `threads.ts` — code/name search filter (1 location)

#### Scenario: Normal search text passes through
- **WHEN** `sanitizeFilterValue("Chỉ đỏ ABC-123")` is called
- **THEN** the function SHALL return `"Chỉ đỏ ABC-123"` (Vietnamese characters, alphanumerics, hyphens preserved)

#### Scenario: Filter injection attempt is neutralized
- **WHEN** `sanitizeFilterValue("test,status.eq.deleted")` is called
- **THEN** the function SHALL return `"teststatus.eq.deleted"` (comma removed, breaking the injection)

#### Scenario: Parentheses injection stripped
- **WHEN** `sanitizeFilterValue("test),is_active.eq.false,(name.eq.x")` is called
- **THEN** the function SHALL return `"testis_active.eq.falsename.eq.x"` (parentheses and commas removed)

### Requirement: JWT algorithm pinning in verification
The `jwt.verify()` call in `authMiddleware` SHALL include `{ algorithms: ['HS256'] }` as the third argument to prevent algorithm confusion attacks.

#### Scenario: HS256 token accepted
- **WHEN** a JWT signed with HS256 and the correct secret is presented
- **THEN** verification SHALL succeed

#### Scenario: Algorithm none rejected
- **WHEN** a JWT with `alg: none` is presented
- **THEN** verification SHALL fail with `JsonWebTokenError`
