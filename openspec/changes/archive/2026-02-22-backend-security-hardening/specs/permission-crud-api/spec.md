## MODIFIED Requirements

### Requirement: Create permission endpoint
The system SHALL provide a `POST /api/auth/permissions` endpoint that creates a new permission record.

Request body fields:
- `code` (string, required) — unique permission code in format `module.resource.action`
- `name` (string, required) — Vietnamese display name
- `description` (string, optional)
- `module` (string, required) — e.g., 'thread', 'admin', 'settings'
- `resource` (string, required) — e.g., 'styles', 'issues'
- `action` (enum, required) — one of: 'view', 'create', 'edit', 'delete', 'manage'
- `routePath` (string, optional) — associated route path
- `isPageAccess` (boolean, optional, default false)
- `sortOrder` (number, optional, default 0)

The endpoint SHALL require ROOT role authorization via `requireRoot` (authentication handled by global middleware).

#### Scenario: Successfully create a permission
- **WHEN** a ROOT user sends POST `/api/auth/permissions` with valid body `{ code: "thread.new-feature.view", name: "Xem Feature Mới", module: "thread", resource: "new-feature", action: "view" }`
- **THEN** the system SHALL create the permission record and return `{ success: true, data: <permission object> }` with HTTP 201

#### Scenario: Reject duplicate permission code
- **WHEN** a ROOT user sends POST `/api/auth/permissions` with a code that already exists
- **THEN** the system SHALL return HTTP 409 with `{ success: false, error: "DUPLICATE_CODE", message: "Mã quyền đã tồn tại" }`

#### Scenario: Reject missing required fields
- **WHEN** a ROOT user sends POST `/api/auth/permissions` without `code` or `name` or `module` or `resource` or `action`
- **THEN** the system SHALL return HTTP 400 with validation error details

#### Scenario: Reject non-ROOT user
- **WHEN** a non-ROOT authenticated user sends POST `/api/auth/permissions`
- **THEN** the system SHALL return HTTP 403

### Requirement: Password reset removes default password fallback
The `POST /api/auth/reset-password/:id` endpoint SHALL require `newPassword` as a mandatory field in the request body. The system SHALL NOT use any hardcoded default password when `newPassword` is omitted.

#### Scenario: Reset password with explicit new password
- **WHEN** an admin sends POST `/api/auth/reset-password/42` with `{ newPassword: "SecurePass123!" }`
- **THEN** the system SHALL hash and set the new password for the target employee

#### Scenario: Reset password without newPassword field
- **WHEN** an admin sends POST `/api/auth/reset-password/42` with `{}` (no newPassword)
- **THEN** the system SHALL return HTTP 400 with `{ error: true, message: "Mật khẩu mới là bắt buộc" }`
