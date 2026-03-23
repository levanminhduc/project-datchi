## ADDED Requirements

### Requirement: Route templates include auth middleware
All route templates SHALL include `authMiddleware` and appropriate permission middleware from `server/middleware/auth`.

#### Scenario: CRUD route has auth protection
- **WHEN** a route template is generated for any CRUD endpoint
- **THEN** the route SHALL apply `authMiddleware` via `.use('*', authMiddleware)` or per-route middleware

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
