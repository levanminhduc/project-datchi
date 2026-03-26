## ADDED Requirements

### Requirement: Config button visibility
The system SHALL display a "Cấu hình" button on the employees page, positioned immediately after the "Thêm Nhân Viên" button. This button SHALL only be visible to users with the root role.

#### Scenario: Root user sees config button
- **WHEN** a user with root role visits the employees page
- **THEN** the "Cấu hình" button with a settings/gear icon is visible next to "Thêm Nhân Viên"

#### Scenario: Non-root user does not see config button
- **WHEN** a user without root role visits the employees page
- **THEN** the "Cấu hình" button is not rendered

### Requirement: Config dialog field listing
The system SHALL display a configuration dialog when the root user clicks the "Cấu hình" button. The dialog SHALL list all configurable employee detail fields with a checkbox toggle and drag handle for each.

#### Scenario: Open config dialog
- **WHEN** root user clicks "Cấu hình" button
- **THEN** a dialog opens showing all 12 employee fields with their Vietnamese labels, each with a checkbox and drag handle

#### Scenario: Required fields are locked
- **WHEN** the config dialog is open
- **THEN** `employee_id` (Mã nhân viên) and `full_name` (Họ tên) checkboxes are checked and disabled (cannot be toggled off)
- **AND** they display a lock indicator

### Requirement: Field visibility toggle
The system SHALL allow root users to toggle visibility of non-required fields using checkboxes in the config dialog.

#### Scenario: Toggle field off
- **WHEN** root user unchecks a non-required field (e.g., "Ngày tạo")
- **THEN** the checkbox becomes unchecked
- **AND** the change is reflected when saving

#### Scenario: Toggle field on
- **WHEN** root user checks a previously unchecked field (e.g., "Lần đăng nhập cuối")
- **THEN** the checkbox becomes checked
- **AND** the change is reflected when saving

### Requirement: Drag-and-drop field reordering
The system SHALL allow root users to reorder fields in the config dialog using drag-and-drop. The order determines display order in the employee detail dialog.

#### Scenario: Reorder fields
- **WHEN** root user drags a field (e.g., "Chức vụ") to a new position above "Phòng ban"
- **THEN** the field list updates to reflect the new order
- **AND** the new order is reflected when saving

### Requirement: Save configuration
The system SHALL save the field configuration to `system_settings` table with key `employee_detail_fields` when the root user clicks "Lưu".

#### Scenario: Successful save
- **WHEN** root user modifies field visibility/order and clicks "Lưu"
- **THEN** the configuration is saved via PUT /api/settings/employee_detail_fields
- **AND** a success toast message is shown
- **AND** the dialog closes

#### Scenario: Save failure
- **WHEN** the save request fails (network error, server error)
- **THEN** an error toast message is shown
- **AND** the dialog remains open with the unsaved changes

### Requirement: Restore default configuration
The system SHALL provide a "Khôi phục mặc định" button that resets the field configuration to the default state.

#### Scenario: Restore defaults
- **WHEN** root user clicks "Khôi phục mặc định"
- **THEN** all fields revert to the default visibility and order (employee_id, full_name, department, chuc_vu, is_active visible; created_at, updated_at visible; auth fields hidden)
- **AND** the dialog shows the restored defaults (not yet saved)

### Requirement: Dynamic employee detail dialog
The system SHALL render the employee detail dialog dynamically based on the stored field configuration. Only fields with `visible: true` are shown, in the configured `order`.

#### Scenario: Detail dialog respects config
- **WHEN** any user opens the employee detail dialog
- **THEN** only fields marked as visible in the configuration are displayed
- **AND** fields are ordered according to the configured order

#### Scenario: Default rendering when no config exists
- **WHEN** the `employee_detail_fields` setting does not exist in the database
- **THEN** the detail dialog renders with the default field set (employee_id, full_name, department, chuc_vu, is_active, created_at, updated_at)

#### Scenario: Field type rendering
- **WHEN** the detail dialog renders a datetime field (created_at, updated_at, last_login_at, password_changed_at, locked_until)
- **THEN** the value is formatted using the existing `formatDateTime()` utility
- **WHEN** the detail dialog renders a boolean field (is_active, must_change_password)
- **THEN** the value is displayed as a colored badge (positive for true, negative for false)
- **WHEN** the detail dialog renders a number field (failed_login_attempts)
- **THEN** the value is displayed as a plain number

### Requirement: Employee detail API returns configurable fields
The backend GET /api/employees/:id endpoint SHALL return the additional fields needed for dynamic rendering: last_login_at, must_change_password, password_changed_at, failed_login_attempts, locked_until. Sensitive fields (password_hash, refresh_token, refresh_token_expires_at) SHALL NOT be returned.

#### Scenario: Detail endpoint returns extended fields
- **WHEN** a GET request is made to /api/employees/:id
- **THEN** the response includes: id, employee_id, full_name, department, chuc_vu, is_active, created_at, updated_at, last_login_at, must_change_password, password_changed_at, failed_login_attempts, locked_until
- **AND** the response does NOT include: password_hash, refresh_token, refresh_token_expires_at

### Requirement: Seed default configuration
A database migration SHALL insert the default field configuration into `system_settings` with key `employee_detail_fields`.

#### Scenario: Migration creates default config
- **WHEN** the migration runs
- **THEN** a row is inserted into `system_settings` with key `employee_detail_fields`
- **AND** the value contains all 12 fields with default visibility and order
- **AND** the first 7 fields (employee_id, full_name, department, chuc_vu, is_active, created_at, updated_at) are visible by default
- **AND** the remaining 5 auth-related fields are hidden by default
