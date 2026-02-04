-- ============================================
-- AUTH & PERMISSIONS SYSTEM MIGRATION
-- ============================================

-- ============================================
-- EXTEND EMPLOYEES TABLE FOR AUTHENTICATION
-- ============================================

-- Add authentication columns if not exist
ALTER TABLE employees ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS refresh_token TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS refresh_token_expires_at TIMESTAMPTZ;

-- Index for login lookup
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_refresh_token ON employees(refresh_token);

-- ============================================
-- ENUM TYPES
-- ============================================

-- Permission actions
DO $$ BEGIN
  CREATE TYPE permission_action AS ENUM ('view', 'create', 'edit', 'delete', 'manage');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- PERMISSIONS TABLE
-- Defines all available permissions in the system
-- Each permission maps to a page/feature + action
-- ============================================
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,  -- e.g., 'thread.recovery.view'
  name VARCHAR(255) NOT NULL,          -- Vietnamese display name
  description TEXT,
  module VARCHAR(50) NOT NULL,         -- e.g., 'thread', 'employee', 'admin'
  resource VARCHAR(50) NOT NULL,       -- e.g., 'recovery', 'inventory', 'users'
  action permission_action NOT NULL,
  route_path VARCHAR(255),             -- Associated route path, e.g., '/thread/recovery'
  is_page_access BOOLEAN DEFAULT false,-- True if this grants access to a page
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code);
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);
CREATE INDEX IF NOT EXISTS idx_permissions_route ON permissions(route_path);

-- ============================================
-- ROLES TABLE
-- Groups of permissions for convenience
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,   -- e.g., 'root', 'admin', 'warehouse_manager'
  name VARCHAR(100) NOT NULL,          -- Vietnamese display name
  description TEXT,
  level INTEGER DEFAULT 99,            -- Hierarchy level (0 = highest, ROOT)
  is_system BOOLEAN DEFAULT false,     -- System roles cannot be deleted
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROLE_PERMISSIONS TABLE
-- Many-to-many: roles <-> permissions
-- Note: ROOT role doesn't need entries - it bypasses checks
-- ============================================
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);

-- ============================================
-- EMPLOYEE_ROLES TABLE
-- Many-to-many: employees <-> roles
-- Uses employees table instead of separate users table
-- ============================================
CREATE TABLE IF NOT EXISTS employee_roles (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by INTEGER REFERENCES employees(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_employee_roles_employee ON employee_roles(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_roles_role ON employee_roles(role_id);

-- ============================================
-- EMPLOYEE_PERMISSIONS TABLE
-- Direct employee-permission assignment (overrides/additions to role)
-- Enables granular page-level access per employee
-- ============================================
CREATE TABLE IF NOT EXISTS employee_permissions (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT true,  -- false = explicitly deny (override role)
  assigned_by INTEGER REFERENCES employees(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,        -- Optional expiration
  UNIQUE(employee_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_employee_permissions_employee ON employee_permissions(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_permissions_permission ON employee_permissions(permission_id);

-- ============================================
-- AUTHORIZATION HELPER FUNCTIONS
-- Used by backend, NOT for RLS (we're using custom JWT, not Supabase Auth)
-- ============================================

-- Check if employee has ROOT role (bypasses ALL permission checks)
CREATE OR REPLACE FUNCTION public.is_root(p_employee_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM employee_roles er
    JOIN roles r ON er.role_id = r.id
    WHERE er.employee_id = p_employee_id
      AND r.code = 'root'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if employee is admin
CREATE OR REPLACE FUNCTION public.is_admin(p_employee_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM employee_roles er
    JOIN roles r ON er.role_id = r.id
    WHERE er.employee_id = p_employee_id
      AND r.code IN ('root', 'admin')  -- ROOT is also considered admin
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if employee has a specific permission
-- Returns TRUE immediately if employee has ROOT role (bypasses check)
CREATE OR REPLACE FUNCTION public.has_permission(p_employee_id INTEGER, requested_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  has_perm BOOLEAN := false;
BEGIN
  -- ROOT bypasses ALL permission checks
  IF public.is_root(p_employee_id) THEN
    RETURN true;
  END IF;
  
  -- Check direct employee permission (explicit grant/deny)
  SELECT granted INTO has_perm
  FROM employee_permissions ep
  JOIN permissions p ON ep.permission_id = p.id
  WHERE ep.employee_id = p_employee_id 
    AND p.code = requested_permission
    AND (ep.expires_at IS NULL OR ep.expires_at > NOW());
  
  IF has_perm IS NOT NULL THEN
    RETURN has_perm;  -- Return explicit grant/deny
  END IF;
  
  -- Check role-based permission
  SELECT EXISTS (
    SELECT 1 
    FROM employee_roles er
    JOIN role_permissions rp ON er.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE er.employee_id = p_employee_id 
      AND p.code = requested_permission
  ) INTO has_perm;
  
  RETURN COALESCE(has_perm, false);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if employee has any of the given permissions
CREATE OR REPLACE FUNCTION public.has_any_permission(p_employee_id INTEGER, requested_permissions TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  -- ROOT bypasses ALL permission checks
  IF public.is_root(p_employee_id) THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM unnest(requested_permissions) AS perm
    WHERE public.has_permission(p_employee_id, perm)
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Get all permissions for an employee
-- If ROOT, returns special '*' indicator
CREATE OR REPLACE FUNCTION public.get_employee_permissions(p_employee_id INTEGER)
RETURNS TABLE(permission_code TEXT, granted BOOLEAN) AS $$
BEGIN
  -- ROOT has ALL permissions (return special indicator)
  IF public.is_root(p_employee_id) THEN
    RETURN QUERY SELECT '*'::TEXT, true;
    RETURN;
  END IF;
  
  -- Combine role permissions + direct permissions
  RETURN QUERY
  WITH role_perms AS (
    SELECT DISTINCT p.code, true as granted
    FROM employee_roles er
    JOIN role_permissions rp ON er.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE er.employee_id = p_employee_id
  ),
  direct_perms AS (
    SELECT p.code, ep.granted
    FROM employee_permissions ep
    JOIN permissions p ON ep.permission_id = p.id
    WHERE ep.employee_id = p_employee_id
      AND (ep.expires_at IS NULL OR ep.expires_at > NOW())
  )
  SELECT COALESCE(dp.code, rp.code), COALESCE(dp.granted, rp.granted)
  FROM role_perms rp
  FULL OUTER JOIN direct_perms dp ON rp.code = dp.code
  WHERE COALESCE(dp.granted, rp.granted) = true;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Get all roles for an employee
CREATE OR REPLACE FUNCTION public.get_employee_roles(p_employee_id INTEGER)
RETURNS TABLE(role_code TEXT, role_name TEXT, role_level INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT r.code, r.name, r.level
  FROM employee_roles er
  JOIN roles r ON er.role_id = r.id
  WHERE er.employee_id = p_employee_id
    AND r.is_active = true
  ORDER BY r.level;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if actor can manage target (based on role hierarchy)
-- Lower level = higher privilege. ROOT (level 0) can manage everyone.
CREATE OR REPLACE FUNCTION public.can_manage_employee(actor_id INTEGER, target_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  actor_min_level INTEGER;
  target_min_level INTEGER;
BEGIN
  -- Cannot manage yourself
  IF actor_id = target_id THEN
    RETURN false;
  END IF;
  
  -- Get actor's minimum (highest privilege) level
  SELECT MIN(r.level) INTO actor_min_level
  FROM employee_roles er
  JOIN roles r ON er.role_id = r.id
  WHERE er.employee_id = actor_id;
  
  -- Get target's minimum level
  SELECT MIN(r.level) INTO target_min_level
  FROM employee_roles er
  JOIN roles r ON er.role_id = r.id
  WHERE er.employee_id = target_id;
  
  -- No roles = level 99 (lowest privilege)
  actor_min_level := COALESCE(actor_min_level, 99);
  target_min_level := COALESCE(target_min_level, 99);
  
  -- Can manage if actor's level is strictly lower (higher privilege)
  -- Exception: ROOT (level 0) can manage anyone including other ROOTs
  IF actor_min_level = 0 THEN
    RETURN true;
  END IF;
  
  RETURN actor_min_level < target_min_level;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================
-- SEED DATA: PERMISSIONS
-- ============================================

INSERT INTO permissions (code, name, description, module, resource, action, route_path, is_page_access, sort_order) VALUES
-- Dashboard
('dashboard.view', 'Xem Dashboard', 'Quyền xem trang tổng quan', 'dashboard', 'main', 'view', '/', true, 1),

-- Thread Management
('thread.types.view', 'Xem Loại Chỉ', 'Quyền xem danh sách loại chỉ', 'thread', 'types', 'view', '/thread', true, 10),
('thread.types.create', 'Thêm Loại Chỉ', 'Quyền thêm loại chỉ mới', 'thread', 'types', 'create', NULL, false, 11),
('thread.types.edit', 'Sửa Loại Chỉ', 'Quyền chỉnh sửa loại chỉ', 'thread', 'types', 'edit', NULL, false, 12),
('thread.types.delete', 'Xóa Loại Chỉ', 'Quyền xóa loại chỉ', 'thread', 'types', 'delete', NULL, false, 13),

('thread.colors.view', 'Xem Màu Chỉ', 'Quyền xem danh sách màu chỉ', 'thread', 'colors', 'view', '/thread/colors', true, 20),
('thread.colors.manage', 'Quản lý Màu Chỉ', 'Quyền thêm/sửa/xóa màu chỉ', 'thread', 'colors', 'manage', NULL, false, 21),

('thread.suppliers.view', 'Xem Nhà Cung Cấp', 'Quyền xem danh sách NCC', 'thread', 'suppliers', 'view', '/thread/suppliers', true, 30),
('thread.suppliers.manage', 'Quản lý NCC', 'Quyền thêm/sửa/xóa NCC', 'thread', 'suppliers', 'manage', NULL, false, 31),

('thread.inventory.view', 'Xem Tồn Kho', 'Quyền xem tồn kho chỉ', 'thread', 'inventory', 'view', '/thread/inventory', true, 40),
('thread.inventory.edit', 'Chỉnh sửa Tồn Kho', 'Quyền chỉnh sửa tồn kho', 'thread', 'inventory', 'edit', NULL, false, 41),

('thread.lots.view', 'Xem Lô Hàng', 'Quyền xem danh sách lô', 'thread', 'lots', 'view', '/thread/lots', true, 50),
('thread.lots.manage', 'Quản lý Lô Hàng', 'Quyền thêm/sửa lô hàng', 'thread', 'lots', 'manage', NULL, false, 51),

('thread.allocations.view', 'Xem Phân Bổ', 'Quyền xem phân bổ chỉ', 'thread', 'allocations', 'view', '/thread/allocations', true, 60),
('thread.allocations.manage', 'Quản lý Phân Bổ', 'Quyền tạo/duyệt phân bổ', 'thread', 'allocations', 'manage', NULL, false, 61),

('thread.recovery.view', 'Xem Hoàn Trả', 'Quyền xem hoàn trả chỉ', 'thread', 'recovery', 'view', '/thread/recovery', true, 70),
('thread.recovery.manage', 'Quản lý Hoàn Trả', 'Quyền xử lý hoàn trả', 'thread', 'recovery', 'manage', NULL, false, 71),

('thread.dashboard.view', 'Xem Thread Dashboard', 'Quyền xem dashboard chỉ', 'thread', 'dashboard', 'view', '/thread/dashboard', true, 80),

-- Batch Operations
('thread.batch.receive', 'Nhập Kho', 'Quyền nhập kho chỉ', 'thread', 'batch', 'create', '/thread/batch/receive', true, 90),
('thread.batch.issue', 'Xuất Kho', 'Quyền xuất kho chỉ', 'thread', 'batch', 'create', '/thread/batch/issue', true, 91),
('thread.batch.transfer', 'Chuyển Kho', 'Quyền chuyển kho nội bộ', 'thread', 'batch', 'create', '/thread/batch/transfer', true, 92),

-- Mobile Operations
('thread.mobile.receive', 'Nhập Kho Mobile', 'Quyền nhập kho trên mobile', 'thread', 'mobile', 'create', '/thread/mobile/receive', true, 100),
('thread.mobile.issue', 'Xuất Kho Mobile', 'Quyền xuất kho trên mobile', 'thread', 'mobile', 'create', '/thread/mobile/issue', true, 101),
('thread.mobile.recovery', 'Hoàn Trả Mobile', 'Quyền hoàn trả trên mobile', 'thread', 'mobile', 'create', '/thread/mobile/recovery', true, 102),

-- Stocktake
('thread.stocktake.view', 'Kiểm Kê', 'Quyền thực hiện kiểm kê', 'thread', 'stocktake', 'view', '/thread/stocktake', true, 110),

-- Reports
('reports.view', 'Xem Báo Cáo', 'Quyền xem các báo cáo', 'reports', 'main', 'view', '/reports', true, 200),

-- Employee Management
('employees.view', 'Xem Nhân Viên', 'Quyền xem danh sách nhân viên', 'employees', 'main', 'view', '/employees', true, 300),
('employees.create', 'Thêm Nhân Viên', 'Quyền thêm nhân viên', 'employees', 'main', 'create', NULL, false, 301),
('employees.edit', 'Sửa Nhân Viên', 'Quyền chỉnh sửa nhân viên', 'employees', 'main', 'edit', NULL, false, 302),
('employees.delete', 'Xóa Nhân Viên', 'Quyền xóa nhân viên', 'employees', 'main', 'delete', NULL, false, 303),

-- Admin
('admin.users.view', 'Xem Người Dùng', 'Quyền xem danh sách người dùng', 'admin', 'users', 'view', '/admin/users', true, 900),
('admin.users.manage', 'Quản lý Người Dùng', 'Quyền thêm/sửa/xóa người dùng', 'admin', 'users', 'manage', NULL, false, 901),
('admin.roles.view', 'Xem Vai Trò', 'Quyền xem danh sách vai trò', 'admin', 'roles', 'view', '/admin/roles', true, 910),
('admin.roles.manage', 'Quản lý Vai Trò', 'Quyền thêm/sửa/xóa vai trò', 'admin', 'roles', 'manage', NULL, false, 911),
('admin.permissions.view', 'Xem Quyền', 'Quyền xem danh sách quyền', 'admin', 'permissions', 'view', '/admin/permissions', true, 920)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- SEED DATA: ROLES (with hierarchy levels)
-- ============================================

INSERT INTO roles (code, name, description, level, is_system) VALUES
('root', 'ROOT', 'Quyền cao nhất - bypass mọi kiểm tra. Không thể xóa.', 0, true),
('admin', 'Quản trị viên', 'Toàn quyền truy cập hệ thống (trừ quản lý ROOT)', 1, true),
('warehouse_manager', 'Quản lý Kho', 'Quản lý tồn kho, nhập/xuất/chuyển kho', 2, false),
('planning', 'Kế hoạch', 'Phân bổ chỉ cho sản xuất', 2, false),
('warehouse_staff', 'Nhân viên Kho', 'Thao tác nhập/xuất kho cơ bản', 3, false),
('production', 'Sản xuất', 'Xem tồn kho và nhận chỉ', 3, false),
('viewer', 'Xem báo cáo', 'Chỉ xem báo cáo và dashboard', 4, false)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- SEED DATA: ROLE_PERMISSIONS
-- ============================================

-- Admin: All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.code = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Warehouse Manager: Thread management + batch operations
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.code = 'warehouse_manager' 
  AND p.module IN ('thread', 'dashboard')
  AND p.code NOT LIKE 'thread.allocations.manage'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Warehouse Staff: Basic operations
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.code = 'warehouse_staff' 
  AND p.code IN (
    'dashboard.view',
    'thread.inventory.view',
    'thread.batch.receive',
    'thread.batch.issue',
    'thread.mobile.receive',
    'thread.mobile.issue',
    'thread.recovery.view',
    'thread.mobile.recovery'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Planning: Allocations + view
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.code = 'planning' 
  AND p.code IN (
    'dashboard.view',
    'thread.inventory.view',
    'thread.allocations.view',
    'thread.allocations.manage',
    'thread.dashboard.view',
    'reports.view'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Production: View only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.code = 'production' 
  AND p.code IN (
    'dashboard.view',
    'thread.inventory.view',
    'thread.allocations.view'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Viewer: Dashboard + Reports
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.code = 'viewer' 
  AND p.code IN ('dashboard.view', 'thread.dashboard.view', 'reports.view')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================
-- SEED DATA: DEFAULT ROOT USER
-- ============================================

-- First, ensure there's an employee for ROOT (or use existing)
-- bcrypt hash of 'ChangeMe123!' - MUST be changed on first login
INSERT INTO employees (employee_id, full_name, department, chuc_vu, is_active, password_hash, must_change_password)
VALUES ('ROOT', 'System Administrator', 'IT', 'Root', true, 
        '$2b$10$rQdR3YmH8V5RzKVX.J0.QeQ8HnVGVnELRVN4WvM0HVr5vX5xJQz7S', 
        true)
ON CONFLICT (employee_id) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  must_change_password = EXCLUDED.must_change_password;

-- Assign ROOT role to the ROOT employee
INSERT INTO employee_roles (employee_id, role_id)
SELECT e.id, r.id 
FROM employees e, roles r 
WHERE e.employee_id = 'ROOT' AND r.code = 'root'
ON CONFLICT (employee_id, role_id) DO NOTHING;

-- ============================================
-- EMPLOYEE REFRESH TOKENS TABLE
-- Stores hashed refresh tokens for token revocation
-- ============================================
CREATE TABLE IF NOT EXISTS employee_refresh_tokens (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_employee ON employee_refresh_tokens(employee_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON employee_refresh_tokens(expires_at);

-- Cleanup expired tokens periodically (can be called by cron job or app)
CREATE OR REPLACE FUNCTION public.cleanup_expired_refresh_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM employee_refresh_tokens WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
