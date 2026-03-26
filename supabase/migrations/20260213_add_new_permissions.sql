-- ============================================
-- ADD NEW PERMISSIONS & ROLE MAPPINGS
-- For: styles, weekly-order, issues, reconciliation,
--      calculation, mobile return/scan, settings,
--      admin permissions CRUD
-- ============================================

-- ============================================
-- NEW PERMISSIONS
-- ============================================

INSERT INTO permissions (code, name, description, module, resource, action, route_path, is_page_access, sort_order) VALUES
-- Styles Management
('thread.styles.view', 'Xem Mã Hàng', 'Quyền xem danh sách mã hàng', 'thread', 'styles', 'view', '/thread/styles', true, 120),
('thread.styles.create', 'Thêm Mã Hàng', 'Quyền thêm mã hàng mới', 'thread', 'styles', 'create', NULL, false, 121),
('thread.styles.edit', 'Sửa Mã Hàng', 'Quyền chỉnh sửa mã hàng', 'thread', 'styles', 'edit', NULL, false, 122),
('thread.styles.delete', 'Xóa Mã Hàng', 'Quyền xóa mã hàng', 'thread', 'styles', 'delete', NULL, false, 123),

-- Weekly Order
('thread.weekly-order.view', 'Xem Đặt Hàng Tuần', 'Quyền xem đặt hàng tuần', 'thread', 'weekly-order', 'view', '/thread/weekly-order', true, 130),
('thread.weekly-order.create', 'Tạo Đơn Đặt Hàng', 'Quyền tạo đơn đặt hàng tuần', 'thread', 'weekly-order', 'create', NULL, false, 131),
('thread.weekly-order.edit', 'Sửa Đơn Đặt Hàng', 'Quyền sửa đơn đặt hàng tuần', 'thread', 'weekly-order', 'edit', NULL, false, 132),

-- Issues (covers issues v1, v2, requests, returns)
('thread.issues.view', 'Xem Phiếu Xuất', 'Quyền xem phiếu xuất kho', 'thread', 'issues', 'view', '/thread/issues', true, 140),
('thread.issues.create', 'Tạo Phiếu Xuất', 'Quyền tạo phiếu xuất kho', 'thread', 'issues', 'create', NULL, false, 141),
('thread.issues.edit', 'Sửa/Duyệt Phiếu Xuất', 'Quyền sửa và duyệt phiếu xuất', 'thread', 'issues', 'edit', NULL, false, 142),
('thread.issues.delete', 'Hủy Phiếu Xuất', 'Quyền hủy phiếu xuất kho', 'thread', 'issues', 'delete', NULL, false, 143),
('thread.issues.return', 'Nhập Lại Chỉ', 'Quyền nhập lại chỉ đã xuất', 'thread', 'issues', 'manage', '/thread/issues/v2/return', true, 144),

-- Reconciliation
('thread.reconciliation.view', 'Đối Chiếu Tiêu Hao', 'Quyền xem đối chiếu tiêu hao', 'thread', 'reconciliation', 'view', '/thread/issues/reconciliation', true, 150),

-- Calculation
('thread.calculation.view', 'Tính Toán Định Mức', 'Quyền xem tính toán định mức', 'thread', 'calculation', 'view', '/thread/calculation', true, 160),

-- Additional Mobile Operations
('thread.mobile.return', 'Nhập Lại Mobile', 'Quyền nhập lại trên mobile', 'thread', 'mobile', 'manage', '/thread/mobile/return', true, 103),
('thread.mobile.issue-scan', 'Quét Xuất Kho Mobile', 'Quyền quét xuất kho trên mobile', 'thread', 'mobile', 'manage', '/thread/mobile/issue-scan', true, 104),

-- Settings
('settings.view', 'Xem Cài Đặt', 'Quyền xem trang cài đặt', 'settings', 'main', 'view', '/settings', true, 400),
('settings.edit', 'Sửa Cài Đặt', 'Quyền chỉnh sửa cài đặt', 'settings', 'main', 'edit', NULL, false, 401),

-- Admin Permission CRUD
('admin.permissions.create', 'Thêm Quyền', 'Quyền tạo quyền mới', 'admin', 'permissions', 'create', NULL, false, 921),
('admin.permissions.edit', 'Sửa Quyền', 'Quyền chỉnh sửa quyền', 'admin', 'permissions', 'edit', NULL, false, 922),
('admin.permissions.delete', 'Xóa Quyền', 'Quyền xóa quyền', 'admin', 'permissions', 'delete', NULL, false, 923)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- ROLE-PERMISSION MAPPINGS
-- ============================================

-- Admin: All new permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'admin'
  AND p.code IN (
    'thread.styles.view', 'thread.styles.create', 'thread.styles.edit', 'thread.styles.delete',
    'thread.weekly-order.view', 'thread.weekly-order.create', 'thread.weekly-order.edit',
    'thread.issues.view', 'thread.issues.create', 'thread.issues.edit', 'thread.issues.delete', 'thread.issues.return',
    'thread.reconciliation.view',
    'thread.calculation.view',
    'thread.mobile.return', 'thread.mobile.issue-scan',
    'settings.view', 'settings.edit',
    'admin.permissions.create', 'admin.permissions.edit', 'admin.permissions.delete'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Warehouse Manager: styles view, weekly-order.*, issues.*, reconciliation, calculation, mobile return/scan
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'warehouse_manager'
  AND p.code IN (
    'thread.styles.view',
    'thread.weekly-order.view', 'thread.weekly-order.create', 'thread.weekly-order.edit',
    'thread.issues.view', 'thread.issues.create', 'thread.issues.edit', 'thread.issues.delete', 'thread.issues.return',
    'thread.reconciliation.view',
    'thread.calculation.view',
    'thread.mobile.return', 'thread.mobile.issue-scan'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Planning: styles view, weekly-order view, issues view, reconciliation, calculation
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'planning'
  AND p.code IN (
    'thread.styles.view',
    'thread.weekly-order.view',
    'thread.issues.view',
    'thread.reconciliation.view',
    'thread.calculation.view'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Warehouse Staff: issues view, issues return, mobile return/scan
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'warehouse_staff'
  AND p.code IN (
    'thread.issues.view',
    'thread.issues.return',
    'thread.mobile.return',
    'thread.mobile.issue-scan'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Production: issues view only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'production'
  AND p.code IN (
    'thread.issues.view'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Viewer: reconciliation view
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'viewer'
  AND p.code IN (
    'thread.reconciliation.view'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;
