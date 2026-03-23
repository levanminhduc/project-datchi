## Requirements

### Requirement: Route templates include auth middleware
All route templates SHALL rely on global authentication middleware (applied in `server/index.ts` via `except()`). Route templates SHALL NOT include per-route `authMiddleware` calls. Route templates SHALL include appropriate `requirePermission()` authorization middleware for each endpoint.

#### Scenario: CRUD route has permission protection
- **WHEN** a route template is generated for any CRUD endpoint
- **THEN** the route SHALL apply `requirePermission('<resource>.<action>')` middleware per handler, NOT `authMiddleware` (which is now global)

#### Scenario: Permission-protected route
- **WHEN** a route requires specific permissions
- **THEN** the route handler SHALL include `requirePermission('resource.action')` middleware

### Requirement: PUT endpoint validates body through Zod
The PUT (update) route template SHALL validate the request body through `UpdateSchema.safeParse(body)` before passing to `.update()`.

#### Scenario: Update with validated body
- **WHEN** a PUT request is received
- **THEN** the handler SHALL parse the body with Zod UpdateSchema and only pass `result.data` to `.update()`

#### Scenario: Update with invalid body
- **WHEN** a PUT request body fails Zod validation
- **THEN** the handler SHALL return 400 with validation error messages

### Requirement: RPC does not leak internal error details
RPC function templates SHALL NOT return `SQLERRM` to the client. They SHALL return a generic error message and log details server-side.

#### Scenario: RPC function encounters error
- **WHEN** a PL/pgSQL function catches an exception
- **THEN** the EXCEPTION block SHALL return `json_build_object('success', false, 'message', 'Loi xu ly yeu cau')` and NOT include `SQLERRM`

### Requirement: RPC SECURITY DEFINER includes search_path
RPC function templates with `SECURITY DEFINER` SHALL include `SET search_path = public` to prevent search_path hijacking.

#### Scenario: Function uses SECURITY DEFINER
- **WHEN** a function template uses `SECURITY DEFINER`
- **THEN** it SHALL also include `SET search_path = public` after the `LANGUAGE` clause

### Requirement: JSON body parsing has error handling
Route templates that parse JSON body SHALL handle parse errors gracefully with a 400 response.

#### Scenario: Invalid JSON body
- **WHEN** `c.req.json()` fails to parse the request body
- **THEN** the handler SHALL return 400 with error message `'Dữ liệu gửi lên không hợp lệ'` instead of falling through to 500

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
