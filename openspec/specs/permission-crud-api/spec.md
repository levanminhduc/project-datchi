## Requirements

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

### Requirement: Update permission endpoint
The system SHALL provide a `PUT /api/auth/permissions/:id` endpoint that updates an existing permission.

Updatable fields: `name`, `description`, `module`, `resource`, `action`, `routePath`, `isPageAccess`, `sortOrder`. The `code` field SHALL NOT be updatable after creation.

The endpoint SHALL require ROOT role authorization.

#### Scenario: Successfully update a permission
- **WHEN** a ROOT user sends PUT `/api/auth/permissions/42` with `{ name: "Tên Mới", description: "Mô tả mới" }`
- **THEN** the system SHALL update the permission and return `{ success: true, data: <updated permission> }`

#### Scenario: Reject update of non-existent permission
- **WHEN** a ROOT user sends PUT `/api/auth/permissions/9999`
- **THEN** the system SHALL return HTTP 404 with `{ success: false, error: "NOT_FOUND" }`

#### Scenario: Code field is not updatable
- **WHEN** a ROOT user sends PUT `/api/auth/permissions/42` with `{ code: "new.code" }`
- **THEN** the system SHALL ignore the `code` field and only update other provided fields

### Requirement: Delete permission endpoint
The system SHALL provide a `DELETE /api/auth/permissions/:id` endpoint that removes a permission.

The endpoint SHALL refuse to delete a permission that is currently assigned to any role (via `role_permissions`) or any employee (via `employee_permissions`).

The endpoint SHALL require ROOT role authorization.

#### Scenario: Successfully delete an unassigned permission
- **WHEN** a ROOT user sends DELETE `/api/auth/permissions/42` and the permission is not assigned to any role or employee
- **THEN** the system SHALL delete the permission and return `{ success: true, message: "Xóa quyền thành công" }`

#### Scenario: Reject delete of assigned permission
- **WHEN** a ROOT user sends DELETE `/api/auth/permissions/42` and the permission is assigned to 2 roles and 1 employee
- **THEN** the system SHALL return HTTP 409 with `{ success: false, error: "IN_USE", message: "Không thể xóa quyền đang được sử dụng bởi 2 vai trò và 1 nhân viên" }`

#### Scenario: Reject delete of non-existent permission
- **WHEN** a ROOT user sends DELETE `/api/auth/permissions/9999`
- **THEN** the system SHALL return HTTP 404

### Requirement: Zod validation schemas for permission endpoints
The system SHALL validate request bodies using Zod schemas defined in `server/validation/auth.ts`.

The create schema SHALL enforce:
- `code`: non-empty string, max 100 chars, matches pattern `^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*){1,3}$`
- `name`: non-empty string, max 255 chars
- `module`: non-empty string, max 50 chars
- `resource`: non-empty string, max 50 chars
- `action`: enum of `view | create | edit | delete | manage`

The update schema SHALL make all fields optional (partial of create, excluding `code`).

#### Scenario: Reject invalid permission code format
- **WHEN** a ROOT user sends POST `/api/auth/permissions` with `{ code: "INVALID CODE!" }`
- **THEN** the system SHALL return HTTP 400 with a validation error indicating invalid code format

### Requirement: TypeScript DTOs for permission data
The system SHALL export `CreatePermissionData` and `UpdatePermissionData` interfaces from `src/types/auth/index.ts`.

#### Scenario: Frontend can use typed permission data
- **WHEN** the frontend imports `CreatePermissionData` from `@/types/auth`
- **THEN** the type SHALL include fields: code, name, module, resource, action (required); description, routePath, isPageAccess, sortOrder (optional)

### Requirement: Password reset removes default password fallback
The `POST /api/auth/reset-password/:id` endpoint SHALL require `newPassword` as a mandatory field in the request body. The system SHALL NOT use any hardcoded default password when `newPassword` is omitted.

#### Scenario: Reset password with explicit new password
- **WHEN** an admin sends POST `/api/auth/reset-password/42` with `{ newPassword: "SecurePass123!" }`
- **THEN** the system SHALL hash and set the new password for the target employee

#### Scenario: Reset password without newPassword field
- **WHEN** an admin sends POST `/api/auth/reset-password/42` with `{}` (no newPassword)
- **THEN** the system SHALL return HTTP 400 with `{ error: true, message: "Mật khẩu mới là bắt buộc" }`
