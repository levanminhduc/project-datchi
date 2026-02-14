## ADDED Requirements

### Requirement: Add permission button in Tab 2
The permissions list tab SHALL display a "Thêm quyền" button in the header section next to the search input.

The button SHALL only be visible to ROOT users (using `v-permission` directive or ROOT check).

#### Scenario: ROOT user sees add button
- **WHEN** a ROOT user views Tab 2 "Danh sách quyền"
- **THEN** a "Thêm quyền" button with icon `add` SHALL be visible in the header area

#### Scenario: Non-ROOT user does not see add button
- **WHEN** a non-ROOT user views Tab 2
- **THEN** the "Thêm quyền" button SHALL NOT be visible

### Requirement: Create/Edit permission dialog
The system SHALL provide a dialog for creating and editing permissions, matching the pattern of the existing role dialog in Tab 1.

Dialog fields:
- Mã quyền (code) — text input, required, readonly in edit mode
- Tên quyền (name) — text input, required
- Mô tả (description) — text input, optional
- Module — text input with autocomplete from existing modules, required
- Resource — text input, required
- Hành động (action) — select dropdown with options: view, create, edit, delete, manage, required
- Route path — text input, optional
- Truy cập trang (isPageAccess) — toggle/checkbox, default false
- Thứ tự (sortOrder) — number input, default 0

#### Scenario: Open create dialog
- **WHEN** the ROOT user clicks "Thêm quyền"
- **THEN** a dialog SHALL open with all fields empty, title "Tạo quyền mới", and the code field editable

#### Scenario: Open edit dialog
- **WHEN** the ROOT user clicks the edit button on a permission row
- **THEN** a dialog SHALL open pre-filled with the permission's current values, title "Sửa quyền", and the code field readonly

#### Scenario: Save new permission
- **WHEN** the user fills in required fields and clicks "Tạo"
- **THEN** the system SHALL call `POST /api/auth/permissions`, show a success snackbar "Tạo quyền thành công", close the dialog, and refresh the permissions list

#### Scenario: Save edited permission
- **WHEN** the user modifies fields and clicks "Lưu"
- **THEN** the system SHALL call `PUT /api/auth/permissions/:id`, show a success snackbar "Cập nhật quyền thành công", close the dialog, and refresh the permissions list

#### Scenario: Module autocomplete
- **WHEN** the user types in the Module field
- **THEN** the input SHALL suggest existing module names from the current permissions list (e.g., 'thread', 'admin', 'settings', 'dashboard', 'reports', 'employees')

### Requirement: Edit and delete buttons on permission rows
Each permission row in Tab 2's table SHALL display edit and delete action buttons, visible only to ROOT users.

#### Scenario: ROOT user sees action buttons
- **WHEN** a ROOT user views the permission table
- **THEN** each row SHALL have edit (pencil icon) and delete (trash icon) buttons

#### Scenario: Click edit button
- **WHEN** the ROOT user clicks the edit button on a permission row
- **THEN** the edit dialog SHALL open pre-filled with that permission's data

### Requirement: Delete permission with confirmation
The system SHALL show a confirmation dialog before deleting a permission. If the permission is in use (assigned to roles or employees), the system SHALL show a warning with the usage count and prevent deletion.

#### Scenario: Delete unassigned permission
- **WHEN** the ROOT user clicks delete on an unassigned permission and confirms
- **THEN** the system SHALL call `DELETE /api/auth/permissions/:id`, show "Xóa quyền thành công", and refresh the list

#### Scenario: Attempt to delete assigned permission
- **WHEN** the ROOT user clicks delete on a permission assigned to 2 roles
- **THEN** the system SHALL call the DELETE endpoint, receive a 409 error, and show an error snackbar with the message from the API (e.g., "Không thể xóa quyền đang được sử dụng bởi 2 vai trò và 0 nhân viên")

### Requirement: Composable methods for permission CRUD
The `usePermissionManagement` composable SHALL expose three new methods:

- `createPermission(data: CreatePermissionData): Promise<Permission>` — calls POST endpoint, refreshes permissions list on success
- `updatePermission(id: number, data: UpdatePermissionData): Promise<Permission>` — calls PUT endpoint, refreshes permissions list on success
- `deletePermission(id: number): Promise<void>` — calls DELETE endpoint, refreshes permissions list on success

All methods SHALL set `loading` state and handle errors consistently with existing methods.

#### Scenario: Create permission via composable
- **WHEN** `createPermission({ code: 'test.view', name: 'Test', module: 'test', resource: 'main', action: 'view' })` is called
- **THEN** the method SHALL POST to `/api/auth/permissions`, refresh the permissions list, and return the created permission

#### Scenario: Error handling in composable
- **WHEN** any CRUD method encounters an API error
- **THEN** the method SHALL set `error.value` with the error message and throw the error for the caller to handle

### Requirement: Permission table adds actions column
The permission table in Tab 2 SHALL include an "Thao tác" (Actions) column at the end, consistent with the roles table in Tab 1.

#### Scenario: Table structure with actions
- **WHEN** Tab 2 is rendered
- **THEN** the permission table within each module expansion panel SHALL have columns: Mã quyền, Tên quyền, Hành động, Mô tả, Route, Thao tác
