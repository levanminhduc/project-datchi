-- Thêm quyền Phân Bổ Sản Phẩm (dept product allocation)
-- Fix bug: backend route deptAllocations.ts dùng 'thread.issues.manage' nhưng permission này không tồn tại

INSERT INTO permissions (code, name, description, module, resource, action, route_path, is_page_access, sort_order)
VALUES (
  'thread.dept-allocation.manage',
  'Phân Bổ Sản Phẩm',
  'Quyền phân bổ sản phẩm theo bộ phận (dept product allocation)',
  'thread',
  'dept-allocation',
  'MANAGE',
  NULL,
  false,
  145
)
ON CONFLICT (code) DO NOTHING;

-- Gán cho Quản lý Kho
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'warehouse_manager'
  AND p.code = 'thread.dept-allocation.manage'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Gán cho Nhân viên Kho
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'warehouse_staff'
  AND p.code = 'thread.dept-allocation.manage'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Gán cho Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'admin'
  AND p.code = 'thread.dept-allocation.manage'
ON CONFLICT (role_id, permission_id) DO NOTHING;
