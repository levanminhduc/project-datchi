## ADDED Requirements

### Requirement: Seed permissions for styles management
The system SHALL have permission entries for the styles management feature.

Permissions to add:
- `thread.styles.view` — Xem Mã Hàng — route `/thread/styles`, is_page_access=true, sort_order=120
- `thread.styles.create` — Thêm Mã Hàng — no route, is_page_access=false, sort_order=121
- `thread.styles.edit` — Sửa Mã Hàng — no route, is_page_access=false, sort_order=122
- `thread.styles.delete` — Xóa Mã Hàng — no route, is_page_access=false, sort_order=123

#### Scenario: Styles permissions exist after migration
- **WHEN** the migration runs
- **THEN** the `permissions` table SHALL contain 4 entries with codes `thread.styles.view`, `thread.styles.create`, `thread.styles.edit`, `thread.styles.delete` under module `thread`, resource `styles`

### Requirement: Seed permissions for weekly order management
The system SHALL have permission entries for the weekly order feature.

Permissions to add:
- `thread.weekly-order.view` — Xem Đặt Hàng Tuần — route `/thread/weekly-order`, is_page_access=true, sort_order=130
- `thread.weekly-order.create` — Tạo Đơn Đặt Hàng — no route, is_page_access=false, sort_order=131
- `thread.weekly-order.edit` — Sửa Đơn Đặt Hàng — no route, is_page_access=false, sort_order=132

#### Scenario: Weekly order permissions exist after migration
- **WHEN** the migration runs
- **THEN** the `permissions` table SHALL contain 3 entries with codes starting with `thread.weekly-order.` under module `thread`, resource `weekly-order`

### Requirement: Seed permissions for issues management
The system SHALL have permission entries covering issues v1, issues v2, requests, and returns.

Permissions to add:
- `thread.issues.view` — Xem Phiếu Xuất — route `/thread/issues`, is_page_access=true, sort_order=140
- `thread.issues.create` — Tạo Phiếu Xuất — no route, is_page_access=false, sort_order=141
- `thread.issues.edit` — Sửa/Duyệt Phiếu Xuất — no route, is_page_access=false, sort_order=142
- `thread.issues.delete` — Hủy Phiếu Xuất — no route, is_page_access=false, sort_order=143
- `thread.issues.return` — Nhập Lại Chỉ — route `/thread/issues/v2/return`, is_page_access=true, sort_order=144

#### Scenario: Issues permissions exist after migration
- **WHEN** the migration runs
- **THEN** the `permissions` table SHALL contain 5 entries with codes starting with `thread.issues.` under module `thread`, resource `issues`

### Requirement: Seed permissions for reconciliation
The system SHALL have a permission entry for the reconciliation report page.

- `thread.reconciliation.view` — Đối Chiếu Tiêu Hao — route `/thread/issues/reconciliation`, is_page_access=true, sort_order=150

#### Scenario: Reconciliation permission exists after migration
- **WHEN** the migration runs
- **THEN** the `permissions` table SHALL contain entry with code `thread.reconciliation.view`

### Requirement: Seed permissions for thread calculation
The system SHALL have a permission entry for the thread calculation page.

- `thread.calculation.view` — Tính Toán Định Mức — route `/thread/calculation`, is_page_access=true, sort_order=160

#### Scenario: Calculation permission exists after migration
- **WHEN** the migration runs
- **THEN** the `permissions` table SHALL contain entry with code `thread.calculation.view`

### Requirement: Seed permissions for additional mobile operations
The system SHALL have permission entries for mobile return and issue-scan features.

- `thread.mobile.return` — Nhập Lại Mobile — route `/thread/mobile/return`, is_page_access=true, sort_order=103
- `thread.mobile.issue-scan` — Quét Xuất Kho Mobile — route `/thread/mobile/issue-scan`, is_page_access=true, sort_order=104

#### Scenario: Additional mobile permissions exist after migration
- **WHEN** the migration runs
- **THEN** the `permissions` table SHALL contain entries with codes `thread.mobile.return` and `thread.mobile.issue-scan`

### Requirement: Seed permissions for system settings
The system SHALL have permission entries for the settings page.

- `settings.view` — Xem Cài Đặt — route `/settings`, is_page_access=true, sort_order=400
- `settings.edit` — Sửa Cài Đặt — no route, is_page_access=false, sort_order=401

#### Scenario: Settings permissions exist after migration
- **WHEN** the migration runs
- **THEN** the `permissions` table SHALL contain entries with codes `settings.view` and `settings.edit` under module `settings`, resource `main`

### Requirement: Seed permissions for admin permission management
The system SHALL have permission entries for permission CRUD operations.

- `admin.permissions.create` — Thêm Quyền — no route, is_page_access=false, sort_order=921
- `admin.permissions.edit` — Sửa Quyền — no route, is_page_access=false, sort_order=922
- `admin.permissions.delete` — Xóa Quyền — no route, is_page_access=false, sort_order=923

#### Scenario: Admin permission CRUD permissions exist after migration
- **WHEN** the migration runs
- **THEN** the `permissions` table SHALL contain entries with codes `admin.permissions.create`, `admin.permissions.edit`, `admin.permissions.delete`

### Requirement: Migration is idempotent
All INSERT statements in the migration SHALL use `ON CONFLICT (code) DO NOTHING` to prevent errors on re-run.

#### Scenario: Migration runs twice without error
- **WHEN** the migration is applied to a database that already has these permissions
- **THEN** no error occurs and no duplicate rows are created

### Requirement: Update role-permission assignments for existing roles
The migration SHALL update `role_permissions` to assign new permissions to existing roles according to this mapping:

| Role | New Permissions |
|------|----------------|
| admin | All new permissions |
| warehouse_manager | thread.styles.view, thread.weekly-order.*, thread.issues.*, thread.reconciliation.view, thread.calculation.view, thread.mobile.return, thread.mobile.issue-scan |
| planning | thread.styles.view, thread.weekly-order.view, thread.issues.view, thread.reconciliation.view, thread.calculation.view |
| warehouse_staff | thread.issues.view, thread.issues.return, thread.mobile.return, thread.mobile.issue-scan |
| production | thread.issues.view |
| viewer | thread.reconciliation.view |

#### Scenario: Admin role has all new permissions
- **WHEN** the migration runs
- **THEN** the `admin` role SHALL have all newly seeded permissions assigned via `role_permissions`

#### Scenario: Warehouse staff role has limited new permissions
- **WHEN** the migration runs
- **THEN** the `warehouse_staff` role SHALL have only `thread.issues.view`, `thread.issues.return`, `thread.mobile.return`, and `thread.mobile.issue-scan` from the new permissions
