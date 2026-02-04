# Auth & Page-Level Permissions System

## Overview

**Goal**: Implement a complete authentication and granular page-level permissions system for the Thread Inventory Management System.

**Key Features**:
1. **Employee-based Authentication** - Use existing `employees` table with `employee_id` (username) + `password_hash`
2. JWT session management with auto-refresh (NO Supabase Auth - custom JWT)
3. **ROOT role** - Highest privilege, bypasses ALL permission checks
4. Page-level permission granularity (assign specific pages to users)
5. Role hierarchy: ROOT > admin > other roles
6. Router guards with auth + permission checking
7. Admin UI for user/role/permission management

---

## Role Hierarchy

| Role | Level | Description |
|------|-------|-------------|
| **ROOT** | 0 (highest) | Bypass ALL checks. Can manage admins. Cannot be deleted/modified. |
| **admin** | 1 | Full system access. Cannot manage ROOT users. |
| **warehouse_manager** | 2 | Manage warehouse operations |
| **planning** | 2 | Manage allocations |
| **warehouse_staff** | 3 | Basic warehouse operations |
| **production** | 3 | View inventory, receive allocations |
| **viewer** | 4 | Read-only access |

---

## 1. Database Schema

### 1.1 Update Employees Table (Add Auth Fields)

```sql
-- ============================================
-- EXTEND EMPLOYEES TABLE FOR AUTHENTICATION
-- (These columns may already exist - check first)
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
```

### 1.2 Helper Functions

> **Note**: Since we're NOT using Supabase Auth, these SQL functions are for reference/backend use only.
> Permission checking is done in the Hono backend middleware, not via RLS.

```sql
-- ============================================
-- AUTHORIZATION HELPER FUNCTIONS
-- Used by backend, NOT for RLS (we're using custom JWT, not Supabase Auth)
-- ============================================

-- Check if employee has ROOT role (bypasses ALL permission checks)
-- This is called from backend middleware, passing employee_id
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
-- Cannot manage someone with same or lower level (except ROOT can manage all)
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
```

### 1.3 Row-Level Security Note

> **IMPORTANT**: Since we're using custom JWT authentication (NOT Supabase Auth), 
> RLS policies that rely on `auth.uid()` will NOT work. 
> 
> **Our approach**: All authorization is handled in the **Hono backend middleware**.
> The backend uses `supabaseAdmin` (service role) which bypasses RLS.
> Permission checks happen in middleware BEFORE database operations.

```sql
-- ============================================
-- RLS DISABLED FOR AUTH TABLES
-- Authorization is handled in Hono middleware instead
-- ============================================

-- We keep RLS disabled on auth-related tables since backend handles authorization
-- If you want defense-in-depth, you can enable RLS with service_role bypass:

-- Example: Protect employee_roles table (optional, middleware already handles this)
-- ALTER TABLE employee_roles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Service role bypass" ON employee_roles FOR ALL USING (true) TO service_role;
-- CREATE POLICY "No direct access" ON employee_roles FOR ALL USING (false) TO anon, authenticated;

-- For data tables (thread_inventory, etc.), you have two options:
-- 1. Keep RLS disabled and rely on backend middleware (simpler, current approach)
-- 2. Enable RLS and create policies that check employee via custom claims (complex)

-- We recommend Option 1: Backend middleware handles all authorization.
-- This is cleaner when not using Supabase Auth.
```

### 1.4 Seed Data

```sql
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
('admin.permissions.view', 'Xem Quyền', 'Quyền xem danh sách quyền', 'admin', 'permissions', 'view', '/admin/permissions', true, 920);

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
('viewer', 'Xem báo cáo', 'Chỉ xem báo cáo và dashboard', 4, false);

-- ============================================
-- SEED DATA: ROLE_PERMISSIONS
-- ============================================

-- Admin: All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.code = 'admin';

-- Warehouse Manager: Thread management + batch operations
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.code = 'warehouse_manager' 
  AND p.module IN ('thread', 'dashboard')
  AND p.code NOT LIKE 'thread.allocations.manage';

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
  );

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
  );

-- Production: View only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.code = 'production' 
  AND p.code IN (
    'dashboard.view',
    'thread.inventory.view',
    'thread.allocations.view'
  );

-- Viewer: Dashboard + Reports
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.code = 'viewer' 
  AND p.code IN ('dashboard.view', 'thread.dashboard.view', 'reports.view');

-- NOTE: ROOT role does NOT need permission entries!
-- ROOT bypasses all permission checks in the backend middleware.
-- The is_root() function returns true, and hasPermission() returns true immediately.

-- ============================================
-- SEED DATA: DEFAULT ROOT USER
-- Create a default ROOT user for initial system setup
-- Password should be changed immediately after first login
-- ============================================

-- First, ensure there's an employee for ROOT (or use existing)
-- This assumes employee_id = 'ROOT' exists or will be created
INSERT INTO employees (employee_id, full_name, department, chuc_vu, is_active, password_hash, must_change_password)
VALUES ('ROOT', 'System Administrator', 'IT', 'Root', true, 
        -- bcrypt hash of 'ChangeMe123!' - MUST be changed on first login
        '$2b$10$K8YZ5U5Z5U5Z5U5Z5U5Z5O5Z5U5Z5U5Z5U5Z5U5Z5U5Z5U5Z5U5Z5U', 
        true)
ON CONFLICT (employee_id) DO NOTHING;

-- Assign ROOT role to the ROOT employee
INSERT INTO employee_roles (employee_id, role_id)
SELECT e.id, r.id 
FROM employees e, roles r 
WHERE e.employee_id = 'ROOT' AND r.code = 'root'
ON CONFLICT (employee_id, role_id) DO NOTHING;
```

---

## 2. TypeScript Types

### 2.1 Auth Types (`src/types/auth/index.ts`)

```typescript
// src/types/auth/index.ts

// ============================================
// ENUMS
// ============================================

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'manage'

// ============================================
// CORE TYPES
// ============================================

export interface Permission {
  id: number
  code: string
  name: string
  description?: string
  module: string
  resource: string
  action: PermissionAction
  routePath?: string
  isPageAccess: boolean
  sortOrder: number
}

export interface Role {
  id: number
  code: string
  name: string
  description?: string
  level: number          // 0 = ROOT (highest), higher = lower privilege
  isSystem: boolean
  isActive: boolean
  permissions?: Permission[]
}

export interface EmployeeAuth {
  id: number
  employeeId: string     // Mã nhân viên (login username)
  fullName: string
  department: string
  chucVu: string
  isActive: boolean
  mustChangePassword: boolean
  lastLoginAt?: string
  roles: Role[]
  permissions: string[]  // Flattened permission codes
  isRoot: boolean        // Quick check for ROOT role
}

export interface EmployeeRole {
  id: number
  employeeId: number
  roleId: number
  assignedBy?: number
  assignedAt: string
}

export interface EmployeePermission {
  id: number
  employeeId: number
  permissionId: number
  granted: boolean
  assignedBy?: number
  assignedAt: string
  expiresAt?: string
}

// ============================================
// AUTH STATE (Frontend)
// ============================================

export interface AuthState {
  employee: EmployeeAuth | null
  accessToken: string | null
  refreshToken: string | null
  permissions: string[]  // List of permission codes (or ['*'] for ROOT)
  isAuthenticated: boolean
  isRoot: boolean        // Fast ROOT check
  isLoading: boolean
  error: string | null
}

// ============================================
// DTOs
// ============================================

export interface LoginCredentials {
  employeeId: string     // Mã Nhân Viên (NOT email)
  password: string
}

export interface LoginResponse {
  employee: EmployeeAuth
  accessToken: string
  refreshToken: string
  expiresIn: number      // seconds
}

export interface RefreshTokenResponse {
  accessToken: string
  expiresIn: number
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface AssignRoleData {
  employeeId: number
  roleId: number
}

export interface AssignPermissionData {
  employeeId: number
  permissionId: number
  granted?: boolean
  expiresAt?: string
}

export interface CreateRoleData {
  code: string
  name: string
  description?: string
  level: number
  permissionIds: number[]
}

export interface UpdateRoleData {
  name?: string
  description?: string
  level?: number
  isActive?: boolean
  permissionIds?: number[]
}

// ============================================
// API RESPONSES
// ============================================

export interface AuthResponse {
  data: LoginResponse | null
  error: boolean
  message?: string
}

export interface PermissionCheckResponse {
  hasPermission: boolean
  permissions: string[]
}

// ============================================
// ROUTE META
// ============================================

export interface RouteMeta {
  requiresAuth?: boolean
  permissions?: string[]      // Required permissions (OR logic)
  allPermissions?: string[]   // Required permissions (AND logic)
  requiresRoot?: boolean      // Only ROOT can access
  requiresAdmin?: boolean     // ROOT or admin can access
  redirectTo?: string
  title?: string
}

// ============================================
// JWT PAYLOAD (Backend)
// ============================================

export interface JwtPayload {
  sub: number          // employee.id
  employeeId: string   // employee.employee_id (username)
  roles: string[]      // role codes
  isRoot: boolean      // quick ROOT check
  iat: number
  exp: number
}
```

---

## 3. Frontend Implementation

### 3.1 Auth Service (`src/services/authService.ts`)

```typescript
// src/services/authService.ts

import type { 
  LoginCredentials, 
  LoginResponse,
  RefreshTokenResponse,
  EmployeeAuth,
  ChangePasswordData
} from '@/types/auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Token storage keys
const ACCESS_TOKEN_KEY = 'auth_access_token'
const REFRESH_TOKEN_KEY = 'auth_refresh_token'

class AuthService {
  private refreshPromise: Promise<string | null> | null = null

  /**
   * Sign in with employee_id and password
   */
  async signIn(credentials: LoginCredentials): Promise<{ data: LoginResponse | null; error: string | null }> {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: credentials.employeeId,
          password: credentials.password,
        }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        return { data: null, error: result.message || 'Đăng nhập thất bại' }
      }

      // Store tokens
      this.setTokens(result.data.accessToken, result.data.refreshToken)

      return { data: result.data, error: null }
    } catch (err) {
      console.error('Sign in error:', err)
      return { data: null, error: 'Không thể kết nối đến máy chủ' }
    }
  }

  /**
   * Sign out - clear tokens and call backend to invalidate refresh token
   */
  async signOut(): Promise<void> {
    try {
      const token = this.getAccessToken()
      if (token) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
          },
        })
      }
    } catch {
      // Ignore errors on logout
    } finally {
      this.clearTokens()
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<string | null> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = this._doRefresh()
    const result = await this.refreshPromise
    this.refreshPromise = null
    return result
  }

  private async _doRefresh(): Promise<string | null> {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      return null
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })

      if (!response.ok) {
        this.clearTokens()
        return null
      }

      const result = await response.json()
      const data = result.data as RefreshTokenResponse
      
      localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken)
      return data.accessToken
    } catch {
      this.clearTokens()
      return null
    }
  }

  /**
   * Get current employee profile from token
   */
  async fetchCurrentEmployee(): Promise<EmployeeAuth | null> {
    try {
      const response = await this.authenticatedFetch(`${API_URL}/api/auth/me`)

      if (!response.ok) return null

      const { data } = await response.json()
      return data as EmployeeAuth
    } catch {
      return null
    }
  }

  /**
   * Fetch employee's permissions
   */
  async fetchPermissions(): Promise<string[]> {
    try {
      const response = await this.authenticatedFetch(`${API_URL}/api/auth/permissions`)

      if (!response.ok) return []

      const { data } = await response.json()
      return data as string[]
    } catch {
      return []
    }
  }

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordData): Promise<{ error: string | null }> {
    try {
      const response = await this.authenticatedFetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        return { error: result.message || 'Đổi mật khẩu thất bại' }
      }

      return { error: null }
    } catch {
      return { error: 'Không thể kết nối đến máy chủ' }
    }
  }

  /**
   * Authenticated fetch with automatic token refresh
   */
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    let token = this.getAccessToken()

    const makeRequest = (accessToken: string | null) => {
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
      })
    }

    let response = await makeRequest(token)

    // If 401, try to refresh token and retry
    if (response.status === 401 && this.getRefreshToken()) {
      const newToken = await this.refreshAccessToken()
      if (newToken) {
        response = await makeRequest(newToken)
      }
    }

    return response
  }

  // Token management
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  }

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }

  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }

  hasTokens(): boolean {
    return !!this.getAccessToken()
  }
}

export const authService = new AuthService()
```

### 3.2 Auth Composable (`src/composables/useAuth.ts`)

```typescript
// src/composables/useAuth.ts

import { ref, computed, readonly } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/authService'
import { useSnackbar } from '@/composables/useSnackbar'
import type { 
  EmployeeAuth, 
  AuthState, 
  LoginCredentials,
  ChangePasswordData
} from '@/types/auth'

// Module-level state (shared across components)
const state = ref<AuthState>({
  employee: null,
  accessToken: null,
  refreshToken: null,
  permissions: [],
  isAuthenticated: false,
  isRoot: false,
  isLoading: true,
  error: null,
})

// Initialized flag to prevent multiple initializations
let initialized = false

export function useAuth() {
  const router = useRouter()
  const snackbar = useSnackbar()

  // Computed
  const employee = computed(() => state.value.employee)
  const isAuthenticated = computed(() => state.value.isAuthenticated)
  const isLoading = computed(() => state.value.isLoading)
  const permissions = computed(() => state.value.permissions)
  const error = computed(() => state.value.error)
  const isRoot = computed(() => state.value.isRoot)

  /**
   * Initialize auth state from stored tokens
   */
  async function init() {
    if (initialized) return
    initialized = true

    state.value.isLoading = true

    try {
      if (authService.hasTokens()) {
        const emp = await authService.fetchCurrentEmployee()
        const perms = await authService.fetchPermissions()

        if (emp) {
          state.value = {
            employee: emp,
            accessToken: authService.getAccessToken(),
            refreshToken: authService.getRefreshToken(),
            permissions: perms,
            isAuthenticated: true,
            isRoot: emp.isRoot || perms.includes('*'),
            isLoading: false,
            error: null,
          }

          // Force password change if required
          if (emp.mustChangePassword) {
            router.push('/change-password')
          }
        } else {
          // Token invalid, clear state
          authService.clearTokens()
          resetState()
        }
      } else {
        resetState()
      }
    } catch (err) {
      console.error('Auth init error:', err)
      resetState()
      state.value.error = 'Không thể khởi tạo phiên đăng nhập'
    }
  }

  function resetState() {
    state.value = {
      employee: null,
      accessToken: null,
      refreshToken: null,
      permissions: [],
      isAuthenticated: false,
      isRoot: false,
      isLoading: false,
      error: null,
    }
  }

  /**
   * Sign in with employee_id and password
   */
  async function signIn(credentials: LoginCredentials): Promise<boolean> {
    state.value.isLoading = true
    state.value.error = null

    try {
      const { data, error: signInError } = await authService.signIn(credentials)

      if (signInError || !data) {
        state.value.error = signInError || 'Đăng nhập thất bại'
        snackbar.error(state.value.error)
        return false
      }

      // Fetch full permissions
      const perms = await authService.fetchPermissions()

      state.value = {
        employee: data.employee,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        permissions: perms,
        isAuthenticated: true,
        isRoot: data.employee.isRoot || perms.includes('*'),
        isLoading: false,
        error: null,
      }

      snackbar.success('Đăng nhập thành công')

      // Force password change if required
      if (data.employee.mustChangePassword) {
        router.push('/change-password')
        return true
      }

      return true
    } catch (err: any) {
      state.value.error = err.message || 'Đăng nhập thất bại'
      snackbar.error(state.value.error!)
      return false
    } finally {
      state.value.isLoading = false
    }
  }

  /**
   * Sign out current employee
   */
  async function signOut() {
    try {
      await authService.signOut()
      snackbar.success('Đã đăng xuất')
    } catch {
      // Still clear local state even if server call fails
    } finally {
      resetState()
      initialized = false  // Allow re-init on next login
      router.push('/login')
    }
  }

  /**
   * Change password
   */
  async function changePassword(data: ChangePasswordData): Promise<boolean> {
    const { error: changeError } = await authService.changePassword(data)
    
    if (changeError) {
      snackbar.error(changeError)
      return false
    }

    // Update state to reflect password changed
    if (state.value.employee) {
      state.value.employee.mustChangePassword = false
    }

    snackbar.success('Đổi mật khẩu thành công')
    return true
  }

  /**
   * Check if current employee has ROOT role
   * ROOT bypasses ALL permission checks
   */
  function checkIsRoot(): boolean {
    return state.value.isRoot
  }

  /**
   * Check if current employee has a specific permission
   * ROOT always returns true
   */
  function hasPermission(permission: string): boolean {
    if (state.value.isRoot) return true
    return state.value.permissions.includes(permission)
  }

  /**
   * Check if current employee has any of the given permissions
   * ROOT always returns true
   */
  function hasAnyPermission(perms: string[]): boolean {
    if (state.value.isRoot) return true
    return perms.some(p => state.value.permissions.includes(p))
  }

  /**
   * Check if current employee has all of the given permissions
   * ROOT always returns true
   */
  function hasAllPermissions(perms: string[]): boolean {
    if (state.value.isRoot) return true
    return perms.every(p => state.value.permissions.includes(p))
  }

  /**
   * Check if employee has a specific role
   */
  function hasRole(roleCode: string): boolean {
    return state.value.employee?.roles?.some(r => r.code === roleCode) ?? false
  }

  /**
   * Check if employee is admin (ROOT or admin role)
   */
  function isAdmin(): boolean {
    return state.value.isRoot || hasRole('admin')
  }

  /**
   * Refresh employee permissions (after role/permission change)
   */
  async function refreshPermissions() {
    if (!state.value.isAuthenticated) return

    const perms = await authService.fetchPermissions()
    state.value.permissions = perms
    state.value.isRoot = perms.includes('*') || hasRole('root')
  }

  return {
    // State
    employee: readonly(employee),
    isAuthenticated: readonly(isAuthenticated),
    isLoading: readonly(isLoading),
    permissions: readonly(permissions),
    error: readonly(error),
    isRoot: readonly(isRoot),

    // Actions
    init,
    signIn,
    signOut,
    changePassword,
    refreshPermissions,

    // Permission helpers
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isAdmin,
    checkIsRoot,
  }
}
```

### 3.3 Permission Composable (`src/composables/usePermission.ts`)

```typescript
// src/composables/usePermission.ts

import { computed } from 'vue'
import { useAuth } from './useAuth'

/**
 * Composable for permission checking in components
 * Provides reactive permission state and helpers
 * 
 * ROOT role bypasses ALL permission checks automatically
 */
export function usePermission() {
  const { 
    permissions, 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions, 
    isAdmin,
    isRoot,
    checkIsRoot
  } = useAuth()

  /**
   * Create a computed permission check
   * Usage: const canView = can('thread.inventory.view')
   * Note: ROOT always returns true
   */
  function can(permission: string) {
    return computed(() => hasPermission(permission))
  }

  /**
   * Create a computed check for any of the permissions
   * Usage: const canManage = canAny(['thread.inventory.edit', 'thread.inventory.delete'])
   * Note: ROOT always returns true
   */
  function canAny(permissionList: string[]) {
    return computed(() => hasAnyPermission(permissionList))
  }

  /**
   * Create a computed check for all permissions
   * Usage: const canFullManage = canAll(['thread.types.create', 'thread.types.edit'])
   * Note: ROOT always returns true
   */
  function canAll(permissionList: string[]) {
    return computed(() => hasAllPermissions(permissionList))
  }

  /**
   * Computed admin check (ROOT or admin role)
   */
  const isAdminUser = computed(() => isAdmin())

  /**
   * Computed ROOT check
   */
  const isRootUser = computed(() => checkIsRoot())

  return {
    permissions,
    can,
    canAny,
    canAll,
    isAdmin: isAdminUser,
    isRoot: isRootUser,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  }
}
```

### 3.4 Router Guards (`src/router/guards.ts`)

```typescript
// src/router/guards.ts

import type { Router, RouteLocationNormalized } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import type { RouteMeta } from '@/types/auth'

/**
 * Setup router navigation guards for authentication and authorization
 * 
 * Permission check order:
 * 1. Public routes (no auth) - allow
 * 2. ROOT check - if user is ROOT, bypass all permission checks
 * 3. Admin check - if route requires admin
 * 4. Permission checks - OR logic or AND logic
 */
export function setupRouterGuards(router: Router) {
  router.beforeEach(async (to, from, next) => {
    const auth = useAuth()
    const meta = to.meta as RouteMeta

    // Initialize auth state if not done
    await auth.init()

    // Public routes (no auth required)
    if (!meta.requiresAuth) {
      // Redirect to home if already authenticated and trying to access login
      if (to.path === '/login' && auth.isAuthenticated.value) {
        return next('/')
      }
      return next()
    }

    // Auth required but not authenticated
    if (!auth.isAuthenticated.value) {
      return next({
        path: '/login',
        query: { redirect: to.fullPath },
      })
    }

    // ROOT bypasses ALL permission checks
    if (auth.checkIsRoot()) {
      return next()
    }

    // Check if route requires ROOT only
    if (meta.requiresRoot) {
      return next('/forbidden')  // Not ROOT, deny access
    }

    // Check if route requires admin (ROOT or admin role)
    if (meta.requiresAdmin) {
      if (!auth.isAdmin()) {
        return next('/forbidden')
      }
      // Admin check passed, continue
    }

    // Check permissions (OR logic)
    if (meta.permissions && meta.permissions.length > 0) {
      const hasAccess = auth.hasAnyPermission(meta.permissions)
      
      if (!hasAccess) {
        return next(meta.redirectTo || '/forbidden')
      }
    }

    // Check all permissions (AND logic)
    if (meta.allPermissions && meta.allPermissions.length > 0) {
      const hasAllAccess = auth.hasAllPermissions(meta.allPermissions)
      
      if (!hasAllAccess) {
        return next(meta.redirectTo || '/forbidden')
      }
    }

    // All checks passed
    next()
  })

  // Update page title from route meta
  router.afterEach((to) => {
    const meta = to.meta as RouteMeta
    if (meta.title) {
      document.title = `${meta.title} | Quản lý Kho Chỉ`
    }
  })
}
```

### 3.5 Updated Router (`src/router/index.ts`)

```typescript
// src/router/index.ts

import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import { setupRouterGuards } from './guards'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    return { top: 0, left: 0, behavior: 'smooth' }
  },
})

// Setup authentication guards
setupRouterGuards(router)

// Workaround for dynamic import errors
router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (localStorage.getItem('quasar:dynamic-reload')) {
      console.error('Dynamic import error, reloading page did not fix it', err)
    } else {
      console.log('Reloading page to fix dynamic import error')
      localStorage.setItem('quasar:dynamic-reload', 'true')
      location.assign(to.fullPath)
    }
  } else {
    console.error(err)
  }
})

router.isReady().then(() => {
  localStorage.removeItem('quasar:dynamic-reload')
})

export default router
```

### 3.6 Login Page (`src/pages/login.vue`)

```vue
<template>
  <q-page class="flex flex-center bg-grey-2">
    <q-card
      class="login-card q-pa-lg"
      style="width: 400px; max-width: 90vw"
    >
      <!-- Logo & Title -->
      <div class="text-center q-mb-lg">
        <q-icon
          name="inventory_2"
          size="64px"
          color="primary"
        />
        <h1 class="text-h5 q-mt-md q-mb-none">
          Quản lý Kho Chỉ
        </h1>
        <p class="text-grey-7">
          Đăng nhập để tiếp tục
        </p>
      </div>

      <!-- Login Form -->
      <q-form
        @submit="handleLogin"
        class="q-gutter-md"
      >
        <AppInput
          v-model="form.employeeId"
          label="Mã Nhân Viên"
          prepend-icon="badge"
          :rules="[required]"
          autocomplete="username"
          hint="Ví dụ: NV001"
        />

        <AppInput
          v-model="form.password"
          label="Mật khẩu"
          :type="showPassword ? 'text' : 'password'"
          prepend-icon="lock"
          :append-icon="showPassword ? 'visibility_off' : 'visibility'"
          @click:append="showPassword = !showPassword"
          :rules="[required]"
          autocomplete="current-password"
        />

        <div class="row items-center justify-between">
          <q-checkbox
            v-model="rememberMe"
            label="Ghi nhớ đăng nhập"
            dense
          />
          <!-- Note: Forgot password requires admin reset for employee-based auth -->
        </div>

        <AppButton
          type="submit"
          label="Đăng nhập"
          color="primary"
          :loading="isLoading"
          class="full-width"
          size="lg"
        />
      </q-form>

      <!-- Error Display -->
      <q-banner
        v-if="error"
        class="q-mt-md bg-negative text-white"
        rounded
      >
        <template #avatar>
          <q-icon name="error" />
        </template>
        {{ error }}
      </q-banner>

      <!-- Help Text -->
      <div class="text-center q-mt-md text-grey-6 text-caption">
        Quên mật khẩu? Liên hệ quản trị viên để đặt lại.
      </div>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

definePage({
  meta: {
    requiresAuth: false,
    title: 'Đăng nhập',
  },
})

const router = useRouter()
const route = useRoute()
const { signIn, isLoading, error } = useAuth()

const form = reactive({
  employeeId: '',
  password: '',
})

const showPassword = ref(false)
const rememberMe = ref(true)

// Validation rules
const required = (val: string) => !!val || 'Trường này là bắt buộc'

async function handleLogin() {
  const success = await signIn({
    employeeId: form.employeeId,
    password: form.password,
  })

  if (success) {
    // Redirect to intended page or home
    const redirect = route.query.redirect as string
    router.push(redirect || '/')
  }
}
</script>

<style scoped lang="scss">
.login-card {
  border-radius: 12px;
}
</style>
```

### 3.7 Permission Directive (`src/directives/permission.ts`)

```typescript
// src/directives/permission.ts

import type { Directive, DirectiveBinding } from 'vue'
import { useAuth } from '@/composables/useAuth'

type PermissionValue = string | string[]

interface PermissionDirectiveOptions {
  mode?: 'any' | 'all'  // Default: 'any'
  hide?: boolean        // true = remove from DOM, false = display:none
}

/**
 * v-permission directive for conditional rendering based on permissions
 * 
 * ROOT users bypass all permission checks - elements are always visible.
 * 
 * Usage:
 * v-permission="'thread.inventory.view'"
 * v-permission="['thread.inventory.view', 'thread.inventory.edit']"
 * v-permission:all="['admin.users.view', 'admin.users.manage']"
 * v-permission.hide="'admin.roles.view'"
 */
export const vPermission: Directive<HTMLElement, PermissionValue> = {
  mounted(el, binding) {
    checkPermission(el, binding)
  },
  updated(el, binding) {
    checkPermission(el, binding)
  },
}

function checkPermission(el: HTMLElement, binding: DirectiveBinding<PermissionValue>) {
  const { value, arg, modifiers } = binding
  const auth = useAuth()

  if (!value) return

  // ROOT bypasses all permission checks
  if (auth.checkIsRoot()) {
    el.style.display = ''
    return
  }

  const permissions = Array.isArray(value) ? value : [value]
  const mode = arg === 'all' ? 'all' : 'any'
  const shouldHide = modifiers.hide

  let hasAccess: boolean

  if (mode === 'all') {
    hasAccess = auth.hasAllPermissions(permissions)
  } else {
    hasAccess = auth.hasAnyPermission(permissions)
  }

  if (!hasAccess) {
    if (shouldHide) {
      el.parentNode?.removeChild(el)
    } else {
      el.style.display = 'none'
    }
  } else {
    el.style.display = ''
  }
}

// Register globally in main.ts
// app.directive('permission', vPermission)
```

### 3.8 App Initialization (`src/App.vue` update)

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useDarkMode } from '@/composables/useDarkMode'

const { init: initAuth } = useAuth()
const { init: initDarkMode } = useDarkMode()

onMounted(async () => {
  // Initialize dark mode preference
  initDarkMode()
  
  // Initialize auth state
  await initAuth()
})
</script>

<template>
  <router-view />
</template>
```

---

## 4. Backend Implementation

> **Note**: This implementation uses **custom JWT authentication** with `jsonwebtoken` and `bcrypt`.
> We do NOT use Supabase Auth because employees authenticate by "Mã NV" (employee_id), not email.
> RLS is NOT used - authorization is handled in middleware.

### 4.0 Dependencies

Add to `server/package.json`:

```json
{
  "dependencies": {
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1"
  },
  "devDependencies": {
    "@types/jsonwebtoken": "^9.0.5",
    "@types/bcrypt": "^5.0.2"
  }
}
```

Environment variables (`.env`):

```bash
JWT_SECRET=your-secure-random-secret-min-32-chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

### 4.1 Auth Middleware (`server/middleware/auth.ts`)

```typescript
// server/middleware/auth.ts

import { Context, Next } from 'hono'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '../db/supabase'

const JWT_SECRET = process.env.JWT_SECRET!

/**
 * JWT Payload structure
 */
export interface JwtPayload {
  sub: number          // employee.id
  employeeId: string   // employee.employee_id (Mã NV)
  roles: string[]      // Role codes: ['admin', 'warehouse_manager']
  isRoot: boolean      // Fast ROOT check
  iat: number
  exp: number
}

/**
 * Auth context attached to each request
 */
export interface AuthContext {
  employeeId: number   // employee.id (primary key)
  employeeCode: string // employee.employee_id (Mã NV)
  roles: string[]      // Role codes
  isRoot: boolean      // ROOT bypasses all permission checks
  permissions: string[] // Permission codes (or ['*'] for ROOT)
}

/**
 * Middleware to verify JWT and attach auth context
 * 
 * Flow:
 * 1. Extract Bearer token from Authorization header
 * 2. Verify JWT signature and expiration
 * 3. Check if isRoot for fast bypass
 * 4. Fetch permissions (cached in JWT for ROOT)
 * 5. Attach AuthContext to request
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: true, message: 'Token không hợp lệ' }, 401)
  }

  const token = authHeader.slice(7)

  try {
    // Verify JWT
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload

    // ROOT users get wildcard permission
    let permissions: string[]
    if (payload.isRoot) {
      permissions = ['*']
    } else {
      // Fetch actual permissions from database
      permissions = await getEmployeePermissions(payload.sub)
    }

    // Attach auth context
    c.set('auth', {
      employeeId: payload.sub,
      employeeCode: payload.employeeId,
      roles: payload.roles,
      isRoot: payload.isRoot,
      permissions,
    } as AuthContext)

    await next()
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return c.json({ error: true, message: 'Token đã hết hạn' }, 401)
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return c.json({ error: true, message: 'Token không hợp lệ' }, 401)
    }
    console.error('Auth middleware error:', err)
    return c.json({ error: true, message: 'Xác thực thất bại' }, 401)
  }
}

/**
 * Middleware to check specific permission(s)
 * ROOT bypasses all checks
 * 
 * Usage:
 * app.get('/api/items', authMiddleware, requirePermission('items.view'), handler)
 * app.delete('/api/items/:id', authMiddleware, requirePermission('items.delete', 'admin.full'), handler)
 */
export function requirePermission(...requiredPermissions: string[]) {
  return async (c: Context, next: Next) => {
    const auth = c.get('auth') as AuthContext | undefined

    if (!auth) {
      return c.json({ error: true, message: 'Chưa xác thực' }, 401)
    }

    // ROOT bypasses all permission checks
    if (auth.isRoot) {
      return next()
    }

    // Check if user has ANY of the required permissions (OR logic)
    const hasPermission = requiredPermissions.some(p => auth.permissions.includes(p))

    if (!hasPermission) {
      return c.json({ 
        error: true, 
        message: 'Bạn không có quyền thực hiện thao tác này' 
      }, 403)
    }

    await next()
  }
}

/**
 * Middleware to require all permissions (AND logic)
 */
export function requireAllPermissions(...requiredPermissions: string[]) {
  return async (c: Context, next: Next) => {
    const auth = c.get('auth') as AuthContext | undefined

    if (!auth) {
      return c.json({ error: true, message: 'Chưa xác thực' }, 401)
    }

    // ROOT bypasses all permission checks
    if (auth.isRoot) {
      return next()
    }

    // Check if user has ALL of the required permissions
    const hasAllPermissions = requiredPermissions.every(p => auth.permissions.includes(p))

    if (!hasAllPermissions) {
      return c.json({ 
        error: true, 
        message: 'Bạn không có đủ quyền thực hiện thao tác này' 
      }, 403)
    }

    await next()
  }
}

/**
 * Middleware to require admin role (ROOT or admin)
 */
export async function requireAdmin(c: Context, next: Next) {
  const auth = c.get('auth') as AuthContext | undefined

  if (!auth) {
    return c.json({ error: true, message: 'Chưa xác thực' }, 401)
  }

  // ROOT is always admin
  if (auth.isRoot) {
    return next()
  }

  // Check for admin role
  if (!auth.roles.includes('admin')) {
    return c.json({ 
      error: true, 
      message: 'Chỉ quản trị viên mới có quyền thực hiện thao tác này' 
    }, 403)
  }

  await next()
}

/**
 * Middleware to require ROOT role only
 * Even admin cannot access
 */
export async function requireRoot(c: Context, next: Next) {
  const auth = c.get('auth') as AuthContext | undefined

  if (!auth) {
    return c.json({ error: true, message: 'Chưa xác thực' }, 401)
  }

  if (!auth.isRoot) {
    return c.json({ 
      error: true, 
      message: 'Chỉ ROOT mới có quyền thực hiện thao tác này' 
    }, 403)
  }

  await next()
}

/**
 * Get all permissions for an employee (from roles + direct assignments)
 * 
 * Permission sources:
 * 1. Role-based: employee_roles → roles → role_permissions → permissions
 * 2. Direct: employee_permissions (can grant or revoke)
 */
async function getEmployeePermissions(employeeId: number): Promise<string[]> {
  // Get role-based permissions
  const { data: rolePerms } = await supabaseAdmin
    .from('employee_roles')
    .select(`
      roles!inner(
        role_permissions(
          permissions(code)
        )
      )
    `)
    .eq('employee_id', employeeId)

  const permissionSet = new Set<string>()
  
  rolePerms?.forEach((er: any) => {
    er.roles?.role_permissions?.forEach((rp: any) => {
      if (rp.permissions?.code) {
        permissionSet.add(rp.permissions.code)
      }
    })
  })

  // Get direct permissions (grants and revocations)
  const { data: directPerms } = await supabaseAdmin
    .from('employee_permissions')
    .select('permissions(code), granted, expires_at')
    .eq('employee_id', employeeId)

  const now = new Date().toISOString()
  
  directPerms?.forEach((ep: any) => {
    const isExpired = ep.expires_at && ep.expires_at < now
    if (!isExpired && ep.permissions?.code) {
      if (ep.granted) {
        permissionSet.add(ep.permissions.code)
      } else {
        // Revocation takes precedence
        permissionSet.delete(ep.permissions.code)
      }
    }
  })

  return Array.from(permissionSet)
}

/**
 * Helper to check if requesting user can manage target employee
 * - ROOT can manage anyone
 * - Admin can manage non-ROOT employees
 * - Cannot manage employees with higher or equal role level
 */
export async function canManageEmployee(
  requesterAuth: AuthContext, 
  targetEmployeeId: number
): Promise<boolean> {
  // ROOT can manage anyone
  if (requesterAuth.isRoot) {
    return true
  }

  // Get target's roles and check for ROOT
  const { data: targetRoles } = await supabaseAdmin
    .from('employee_roles')
    .select('roles(code, level)')
    .eq('employee_id', targetEmployeeId)

  // Check if target is ROOT
  const isTargetRoot = targetRoles?.some((er: any) => er.roles?.code === 'root')
  if (isTargetRoot) {
    return false // Only ROOT can manage ROOT
  }

  // Get requester's minimum level (lower = higher privilege)
  const { data: requesterRoles } = await supabaseAdmin
    .from('employee_roles')
    .select('roles(level)')
    .eq('employee_id', requesterAuth.employeeId)

  const requesterMinLevel = Math.min(
    ...(requesterRoles?.map((r: any) => r.roles?.level ?? 999) ?? [999])
  )

  // Get target's minimum level
  const targetMinLevel = Math.min(
    ...(targetRoles?.map((r: any) => r.roles?.level ?? 999) ?? [999])
  )

  // Can only manage employees with higher level number (lower privilege)
  return requesterMinLevel < targetMinLevel
}
```

### 4.2 Auth Routes (`server/routes/auth.ts`)

```typescript
// server/routes/auth.ts

import { Hono } from 'hono'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { supabaseAdmin } from '../db/supabase'
import { 
  authMiddleware, 
  requireAdmin, 
  requireRoot,
  canManageEmployee,
  type AuthContext,
  type JwtPayload 
} from '../middleware/auth'

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'

const auth = new Hono()

// ============================================================
// PUBLIC ROUTES (no auth required)
// ============================================================

/**
 * POST /api/auth/login - Authenticate employee
 * 
 * Request: { employeeId: "NV001", password: "..." }
 * Response: { accessToken, refreshToken, employee }
 */
auth.post('/login', async (c) => {
  const { employeeId, password } = await c.req.json()

  if (!employeeId || !password) {
    return c.json({ 
      error: true, 
      message: 'Vui lòng nhập mã nhân viên và mật khẩu' 
    }, 400)
  }

  try {
    // Find employee by employee_id (Mã NV)
    const { data: employee, error } = await supabaseAdmin
      .from('employees')
      .select(`
        id,
        employee_id,
        full_name,
        email,
        phone,
        department,
        position,
        status,
        password_hash,
        failed_login_attempts,
        locked_until,
        must_change_password,
        last_login
      `)
      .eq('employee_id', employeeId)
      .single()

    if (error || !employee) {
      return c.json({ 
        error: true, 
        message: 'Mã nhân viên hoặc mật khẩu không đúng' 
      }, 401)
    }

    // Check if account is locked
    if (employee.locked_until) {
      const lockExpiry = new Date(employee.locked_until)
      if (lockExpiry > new Date()) {
        const minutesLeft = Math.ceil((lockExpiry.getTime() - Date.now()) / 60000)
        return c.json({ 
          error: true, 
          message: `Tài khoản bị khóa. Vui lòng thử lại sau ${minutesLeft} phút.` 
        }, 423)
      }
    }

    // Check if account is active
    if (employee.status !== 'active') {
      return c.json({ 
        error: true, 
        message: 'Tài khoản đã bị vô hiệu hóa. Liên hệ quản trị viên.' 
      }, 403)
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, employee.password_hash)

    if (!isValidPassword) {
      // Increment failed attempts
      const newAttempts = (employee.failed_login_attempts || 0) + 1
      const updates: any = { failed_login_attempts: newAttempts }

      // Lock account after 5 failed attempts (30 minutes)
      if (newAttempts >= 5) {
        updates.locked_until = new Date(Date.now() + 30 * 60 * 1000).toISOString()
      }

      await supabaseAdmin
        .from('employees')
        .update(updates)
        .eq('id', employee.id)

      return c.json({ 
        error: true, 
        message: 'Mã nhân viên hoặc mật khẩu không đúng' 
      }, 401)
    }

    // Successful login - reset failed attempts and update last_login
    await supabaseAdmin
      .from('employees')
      .update({ 
        failed_login_attempts: 0, 
        locked_until: null,
        last_login: new Date().toISOString()
      })
      .eq('id', employee.id)

    // Get employee roles
    const { data: employeeRoles } = await supabaseAdmin
      .from('employee_roles')
      .select('roles(id, code, name, level)')
      .eq('employee_id', employee.id)

    const roles = employeeRoles?.map((er: any) => er.roles) ?? []
    const roleCodes = roles.map((r: any) => r.code)
    const isRoot = roleCodes.includes('root')

    // Generate tokens
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: employee.id,
      employeeId: employee.employee_id,
      roles: roleCodes,
      isRoot,
    }

    const accessToken = jwt.sign(payload, JWT_SECRET, { 
      expiresIn: JWT_EXPIRES_IN 
    })

    const refreshToken = jwt.sign(
      { sub: employee.id, type: 'refresh' }, 
      JWT_SECRET, 
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    )

    // Store refresh token hash in database (for revocation)
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10)
    await supabaseAdmin
      .from('employee_refresh_tokens')
      .insert({
        employee_id: employee.id,
        token_hash: refreshTokenHash,
        expires_at: new Date(Date.now() + parseDuration(REFRESH_TOKEN_EXPIRES_IN)).toISOString(),
      })

    // Clean up old refresh tokens for this employee (keep last 5)
    const { data: oldTokens } = await supabaseAdmin
      .from('employee_refresh_tokens')
      .select('id')
      .eq('employee_id', employee.id)
      .order('created_at', { ascending: false })
      .range(5, 1000)

    if (oldTokens?.length) {
      await supabaseAdmin
        .from('employee_refresh_tokens')
        .delete()
        .in('id', oldTokens.map(t => t.id))
    }

    // Return response (exclude sensitive fields)
    const { password_hash, failed_login_attempts, locked_until, ...safeEmployee } = employee

    return c.json({
      data: {
        accessToken,
        refreshToken,
        employee: {
          ...safeEmployee,
          roles,
          isRoot,
        },
      },
      error: false,
    })
  } catch (err) {
    console.error('Login error:', err)
    return c.json({ error: true, message: 'Lỗi hệ thống' }, 500)
  }
})

/**
 * POST /api/auth/refresh - Refresh access token
 * 
 * Request: { refresh_token: "..." }
 * Response: { accessToken }
 */
auth.post('/refresh', async (c) => {
  const { refresh_token } = await c.req.json()

  if (!refresh_token) {
    return c.json({ error: true, message: 'Refresh token là bắt buộc' }, 400)
  }

  try {
    // Verify refresh token
    const payload = jwt.verify(refresh_token, JWT_SECRET) as { sub: number; type: string }

    if (payload.type !== 'refresh') {
      return c.json({ error: true, message: 'Token không hợp lệ' }, 401)
    }

    // Check if refresh token exists in database (not revoked)
    const { data: storedTokens } = await supabaseAdmin
      .from('employee_refresh_tokens')
      .select('id, token_hash, expires_at')
      .eq('employee_id', payload.sub)
      .gte('expires_at', new Date().toISOString())

    // Find matching token
    let validToken = null
    for (const stored of storedTokens ?? []) {
      const isMatch = await bcrypt.compare(refresh_token, stored.token_hash)
      if (isMatch) {
        validToken = stored
        break
      }
    }

    if (!validToken) {
      return c.json({ error: true, message: 'Refresh token đã hết hạn hoặc bị thu hồi' }, 401)
    }

    // Get fresh employee data
    const { data: employee } = await supabaseAdmin
      .from('employees')
      .select('id, employee_id, status')
      .eq('id', payload.sub)
      .single()

    if (!employee || employee.status !== 'active') {
      // Revoke all tokens if account is inactive
      await supabaseAdmin
        .from('employee_refresh_tokens')
        .delete()
        .eq('employee_id', payload.sub)

      return c.json({ error: true, message: 'Tài khoản không còn hoạt động' }, 401)
    }

    // Get current roles
    const { data: employeeRoles } = await supabaseAdmin
      .from('employee_roles')
      .select('roles(code)')
      .eq('employee_id', employee.id)

    const roleCodes = employeeRoles?.map((er: any) => er.roles?.code).filter(Boolean) ?? []
    const isRoot = roleCodes.includes('root')

    // Generate new access token
    const newPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: employee.id,
      employeeId: employee.employee_id,
      roles: roleCodes,
      isRoot,
    }

    const accessToken = jwt.sign(newPayload, JWT_SECRET, { 
      expiresIn: JWT_EXPIRES_IN 
    })

    return c.json({
      data: { accessToken },
      error: false,
    })
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return c.json({ error: true, message: 'Refresh token đã hết hạn' }, 401)
    }
    console.error('Refresh error:', err)
    return c.json({ error: true, message: 'Token không hợp lệ' }, 401)
  }
})

// ============================================================
// PROTECTED ROUTES (auth required)
// ============================================================

/**
 * POST /api/auth/logout - Revoke refresh token
 */
auth.post('/logout', authMiddleware, async (c) => {
  const auth = c.get('auth') as AuthContext
  const { refresh_token } = await c.req.json()

  try {
    if (refresh_token) {
      // Revoke specific token
      const { data: storedTokens } = await supabaseAdmin
        .from('employee_refresh_tokens')
        .select('id, token_hash')
        .eq('employee_id', auth.employeeId)

      for (const stored of storedTokens ?? []) {
        const isMatch = await bcrypt.compare(refresh_token, stored.token_hash)
        if (isMatch) {
          await supabaseAdmin
            .from('employee_refresh_tokens')
            .delete()
            .eq('id', stored.id)
          break
        }
      }
    } else {
      // Revoke all tokens for this employee
      await supabaseAdmin
        .from('employee_refresh_tokens')
        .delete()
        .eq('employee_id', auth.employeeId)
    }

    return c.json({ 
      message: 'Đăng xuất thành công',
      error: false 
    })
  } catch (err) {
    console.error('Logout error:', err)
    return c.json({ error: true, message: 'Lỗi hệ thống' }, 500)
  }
})

/**
 * GET /api/auth/me - Get current employee profile
 */
auth.get('/me', authMiddleware, async (c) => {
  const { employeeId } = c.get('auth') as AuthContext

  try {
    const { data: employee, error } = await supabaseAdmin
      .from('employees')
      .select(`
        id,
        employee_id,
        full_name,
        email,
        phone,
        department,
        position,
        avatar_url,
        status,
        must_change_password,
        last_login,
        created_at
      `)
      .eq('id', employeeId)
      .single()

    if (error || !employee) {
      return c.json({ error: true, message: 'Nhân viên không tồn tại' }, 404)
    }

    // Get roles
    const { data: employeeRoles } = await supabaseAdmin
      .from('employee_roles')
      .select('roles(id, code, name, description, level)')
      .eq('employee_id', employeeId)

    const roles = employeeRoles?.map((er: any) => er.roles) ?? []
    const isRoot = roles.some((r: any) => r.code === 'root')

    return c.json({
      data: {
        ...employee,
        roles,
        isRoot,
      },
      error: false,
    })
  } catch (err) {
    console.error('Get me error:', err)
    return c.json({ error: true, message: 'Lỗi hệ thống' }, 500)
  }
})

/**
 * GET /api/auth/permissions - Get current employee's permissions
 */
auth.get('/permissions', authMiddleware, async (c) => {
  const { permissions, isRoot } = c.get('auth') as AuthContext

  // ROOT gets wildcard permission
  if (isRoot) {
    return c.json({
      data: ['*'],
      error: false,
    })
  }

  return c.json({
    data: permissions,
    error: false,
  })
})

/**
 * POST /api/auth/change-password - Change own password
 */
auth.post('/change-password', authMiddleware, async (c) => {
  const { employeeId } = c.get('auth') as AuthContext
  const { currentPassword, newPassword } = await c.req.json()

  if (!currentPassword || !newPassword) {
    return c.json({ 
      error: true, 
      message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới' 
    }, 400)
  }

  if (newPassword.length < 8) {
    return c.json({ 
      error: true, 
      message: 'Mật khẩu mới phải có ít nhất 8 ký tự' 
    }, 400)
  }

  try {
    // Get current password hash
    const { data: employee } = await supabaseAdmin
      .from('employees')
      .select('password_hash')
      .eq('id', employeeId)
      .single()

    if (!employee) {
      return c.json({ error: true, message: 'Nhân viên không tồn tại' }, 404)
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, employee.password_hash)
    if (!isValid) {
      return c.json({ error: true, message: 'Mật khẩu hiện tại không đúng' }, 401)
    }

    // Hash new password
    const newHash = await bcrypt.hash(newPassword, 12)

    // Update password
    await supabaseAdmin
      .from('employees')
      .update({ 
        password_hash: newHash,
        must_change_password: false,
        password_changed_at: new Date().toISOString(),
      })
      .eq('id', employeeId)

    // Revoke all refresh tokens (force re-login on other devices)
    await supabaseAdmin
      .from('employee_refresh_tokens')
      .delete()
      .eq('employee_id', employeeId)

    return c.json({
      message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.',
      error: false,
    })
  } catch (err) {
    console.error('Change password error:', err)
    return c.json({ error: true, message: 'Lỗi hệ thống' }, 500)
  }
})

// ============================================================
// ADMIN ROUTES
// ============================================================

/**
 * POST /api/auth/reset-password/:id - Admin: Reset employee password
 */
auth.post('/reset-password/:id', authMiddleware, requireAdmin, async (c) => {
  const auth = c.get('auth') as AuthContext
  const targetId = parseInt(c.req.param('id'))
  const { newPassword } = await c.req.json()

  // Check if can manage this employee
  if (!(await canManageEmployee(auth, targetId))) {
    return c.json({ 
      error: true, 
      message: 'Bạn không có quyền đặt lại mật khẩu cho nhân viên này' 
    }, 403)
  }

  try {
    const passwordHash = await bcrypt.hash(newPassword || 'Password123!', 12)

    await supabaseAdmin
      .from('employees')
      .update({
        password_hash: passwordHash,
        must_change_password: true,  // Force change on next login
        failed_login_attempts: 0,
        locked_until: null,
      })
      .eq('id', targetId)

    // Revoke all refresh tokens
    await supabaseAdmin
      .from('employee_refresh_tokens')
      .delete()
      .eq('employee_id', targetId)

    return c.json({
      message: 'Đặt lại mật khẩu thành công',
      error: false,
    })
  } catch (err) {
    console.error('Reset password error:', err)
    return c.json({ error: true, message: 'Lỗi hệ thống' }, 500)
  }
})

/**
 * PUT /api/auth/employees/:id/roles - Admin: Update employee roles
 */
auth.put('/employees/:id/roles', authMiddleware, requireAdmin, async (c) => {
  const authContext = c.get('auth') as AuthContext
  const targetId = parseInt(c.req.param('id'))
  const { roleIds } = await c.req.json()

  // Check if can manage this employee
  if (!(await canManageEmployee(authContext, targetId))) {
    return c.json({ 
      error: true, 
      message: 'Bạn không có quyền quản lý nhân viên này' 
    }, 403)
  }

  // Check if trying to assign ROOT role (only ROOT can do this)
  if (!authContext.isRoot) {
    const { data: rootRole } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('code', 'root')
      .single()

    if (rootRole && roleIds?.includes(rootRole.id)) {
      return c.json({ 
        error: true, 
        message: 'Chỉ ROOT mới có thể gán vai trò ROOT' 
      }, 403)
    }
  }

  try {
    // Delete existing roles
    await supabaseAdmin
      .from('employee_roles')
      .delete()
      .eq('employee_id', targetId)

    // Insert new roles
    if (roleIds?.length > 0) {
      const employeeRoles = roleIds.map((roleId: number) => ({
        employee_id: targetId,
        role_id: roleId,
        assigned_by: authContext.employeeId,
      }))

      await supabaseAdmin.from('employee_roles').insert(employeeRoles)
    }

    return c.json({
      message: 'Cập nhật vai trò thành công',
      error: false,
    })
  } catch (err) {
    console.error('Update employee roles error:', err)
    return c.json({ error: true, message: 'Lỗi hệ thống' }, 500)
  }
})

/**
 * PUT /api/auth/employees/:id/permissions - Admin: Update direct permissions
 */
auth.put('/employees/:id/permissions', authMiddleware, requireAdmin, async (c) => {
  const authContext = c.get('auth') as AuthContext
  const targetId = parseInt(c.req.param('id'))
  const { permissions } = await c.req.json() // [{ permissionId, granted, expiresAt }]

  // Check if can manage this employee
  if (!(await canManageEmployee(authContext, targetId))) {
    return c.json({ 
      error: true, 
      message: 'Bạn không có quyền quản lý nhân viên này' 
    }, 403)
  }

  try {
    // Delete existing direct permissions
    await supabaseAdmin
      .from('employee_permissions')
      .delete()
      .eq('employee_id', targetId)

    // Insert new permissions
    if (permissions?.length > 0) {
      const employeePerms = permissions.map((p: any) => ({
        employee_id: targetId,
        permission_id: p.permissionId,
        granted: p.granted ?? true,
        expires_at: p.expiresAt || null,
        assigned_by: authContext.employeeId,
      }))

      await supabaseAdmin.from('employee_permissions').insert(employeePerms)
    }

    return c.json({
      message: 'Cập nhật quyền thành công',
      error: false,
    })
  } catch (err) {
    console.error('Update employee permissions error:', err)
    return c.json({ error: true, message: 'Lỗi hệ thống' }, 500)
  }
})

/**
 * POST /api/auth/employees/:id/unlock - Admin: Unlock locked account
 */
auth.post('/employees/:id/unlock', authMiddleware, requireAdmin, async (c) => {
  const authContext = c.get('auth') as AuthContext
  const targetId = parseInt(c.req.param('id'))

  // Check if can manage this employee
  if (!(await canManageEmployee(authContext, targetId))) {
    return c.json({ 
      error: true, 
      message: 'Bạn không có quyền mở khóa tài khoản này' 
    }, 403)
  }

  try {
    await supabaseAdmin
      .from('employees')
      .update({
        failed_login_attempts: 0,
        locked_until: null,
      })
      .eq('id', targetId)

    return c.json({
      message: 'Đã mở khóa tài khoản',
      error: false,
    })
  } catch (err) {
    console.error('Unlock account error:', err)
    return c.json({ error: true, message: 'Lỗi hệ thống' }, 500)
  }
})

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Parse duration string to milliseconds
 * Supports: 15m, 1h, 7d, 30d
 */
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([mhd])$/)
  if (!match) return 15 * 60 * 1000 // Default 15 minutes

  const value = parseInt(match[1])
  const unit = match[2]

  switch (unit) {
    case 'm': return value * 60 * 1000
    case 'h': return value * 60 * 60 * 1000
    case 'd': return value * 24 * 60 * 60 * 1000
    default: return 15 * 60 * 1000
  }
}

export default auth
```

### 4.3 Register Auth Routes (`server/index.ts`)

```typescript
// server/index.ts

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import dotenv from 'dotenv'

// Load environment variables BEFORE any other imports that use them
dotenv.config()

import auth from './routes/auth'
// ... other route imports

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))

// Routes
app.route('/api/auth', auth)
// ... other routes

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok' }))

export default app
```

### 4.4 Refresh Token Table Migration

Add this table for refresh token management:

```sql
-- Table: employee_refresh_tokens
-- Stores hashed refresh tokens for revocation support
CREATE TABLE employee_refresh_tokens (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,  -- bcrypt hash of refresh token
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Index for lookup by employee
  CONSTRAINT fk_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE INDEX idx_refresh_tokens_employee ON employee_refresh_tokens(employee_id);
CREATE INDEX idx_refresh_tokens_expires ON employee_refresh_tokens(expires_at);

-- Cleanup expired tokens (run via cron or scheduled function)
CREATE OR REPLACE FUNCTION cleanup_expired_refresh_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM employee_refresh_tokens WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;
```

### 4.5 Password Column for Employees

Ensure the `employees` table has auth-related columns:

```sql
-- Add auth columns to employees table if not exist
ALTER TABLE employees ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT true;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Index for login lookup
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
```

---

## 5. Page-Level Permission Configuration

### 5.1 Using definePage() for Route Meta

Each protected page should use `definePage()` to declare its permission requirements:

```vue
<!-- src/pages/thread/recovery.vue -->
<script setup lang="ts">
definePage({
  meta: {
    requiresAuth: true,
    permissions: ['thread.recovery.view'],
    title: 'Hoàn Trả Chỉ Dư',
  },
})

// Component code...
</script>
```

### 5.2 Permission Matrix by Page

| Page | Route | Required Permission |
|------|-------|---------------------|
| Dashboard | `/` | `dashboard.view` |
| Thread Types | `/thread` | `thread.types.view` |
| Thread Colors | `/thread/colors` | `thread.colors.view` |
| Thread Suppliers | `/thread/suppliers` | `thread.suppliers.view` |
| Inventory | `/thread/inventory` | `thread.inventory.view` |
| Lots | `/thread/lots` | `thread.lots.view` |
| Allocations | `/thread/allocations` | `thread.allocations.view` |
| Recovery | `/thread/recovery` | `thread.recovery.view` |
| Thread Dashboard | `/thread/dashboard` | `thread.dashboard.view` |
| Batch Receive | `/thread/batch/receive` | `thread.batch.receive` |
| Batch Issue | `/thread/batch/issue` | `thread.batch.issue` |
| Batch Transfer | `/thread/batch/transfer` | `thread.batch.transfer` |
| Mobile Receive | `/thread/mobile/receive` | `thread.mobile.receive` |
| Mobile Issue | `/thread/mobile/issue` | `thread.mobile.issue` |
| Mobile Recovery | `/thread/mobile/recovery` | `thread.mobile.recovery` |
| Stocktake | `/thread/stocktake` | `thread.stocktake.view` |
| Reports | `/reports` | `reports.view` |
| Employees | `/employees` | `employees.view` |
| Admin Users | `/admin/users` | `admin.users.view` |
| Admin Roles | `/admin/roles` | `admin.roles.view` |
| Login | `/login` | (public) |
| Forbidden | `/forbidden` | (public) |

---

## 6. Admin UI

### 6.1 User Management Page (`src/pages/admin/users.vue`)

Key features:
- List all users with search/filter
- Create new user with role assignment
- Edit user: update profile, assign/remove roles
- Granular permission assignment (page-level)
- User status management (active/inactive/suspended)

### 6.2 Role Management Page (`src/pages/admin/roles.vue`)

Key features:
- List all roles
- Create role with permission selection
- Edit role permissions
- View users with each role
- System roles cannot be deleted

### 6.3 Permission Assignment UI Pattern

```vue
<!-- Permission tree component -->
<template>
  <div class="permission-tree">
    <div
      v-for="module in groupedPermissions"
      :key="module.name"
      class="module-group"
    >
      <q-checkbox
        v-model="moduleSelected[module.name]"
        :label="module.label"
        :indeterminate-value="null"
        @update:model-value="toggleModule(module.name)"
      />
      
      <div class="permission-list q-pl-lg">
        <q-checkbox
          v-for="perm in module.permissions"
          :key="perm.code"
          v-model="selectedPermissions"
          :val="perm.id"
          :label="perm.name"
        />
      </div>
    </div>
  </div>
</template>
```

---

## 7. Implementation Checklist

### Phase 1: Database & Backend (Priority: High)
- [ ] Create migration file with employee auth tables
  - [ ] `roles` table with `level` column
  - [ ] `permissions` table
  - [ ] `role_permissions` junction table
  - [ ] `employee_roles` junction table
  - [ ] `employee_permissions` junction table
  - [ ] `employee_refresh_tokens` table
- [ ] Add auth columns to `employees` table (password_hash, failed_login_attempts, etc.)
- [ ] Create helper SQL functions (is_root, has_permission, can_manage_employee)
- [ ] Seed ROOT role (level 0) and permissions
- [ ] Create default ROOT user with initial password
- [ ] Install backend dependencies: `jsonwebtoken`, `bcrypt`
- [ ] Implement auth middleware with custom JWT verification
- [ ] Implement auth routes (login, refresh, logout, change-password)
- [ ] Test with Postman/curl

### Phase 2: Frontend Auth (Priority: High)
- [ ] Create auth types (LoginCredentials, JwtPayload, AuthState, EmployeeAuth)
- [ ] Implement authService with localStorage token management
- [ ] Implement useAuth composable with isRoot support
- [ ] Create login page with employeeId field (not email)
- [ ] Setup router guards with ROOT bypass
- [ ] Create change-password page
- [ ] Test login/logout flow

### Phase 3: Permission System (Priority: High)
- [ ] Implement usePermission composable with ROOT bypass
- [ ] Create v-permission directive with ROOT bypass
- [ ] Add definePage() to all protected pages
- [ ] Create forbidden page (/forbidden)
- [ ] Test permission blocking

### Phase 4: Admin UI (Priority: Medium)
- [ ] Employee management page (with role assignment)
- [ ] Role management page
- [ ] Permission assignment UI
- [ ] Reset password functionality
- [ ] Unlock account functionality
- [ ] Test admin workflows

### Phase 5: Integration (Priority: Medium)
- [ ] Update existing API routes with authMiddleware + requirePermission
- [ ] Hide/show UI elements based on permissions
- [ ] Test ROOT user has access to everything
- [ ] Test end-to-end permission flow

---

## 8. Security Considerations

### Token Security

1. **Token Storage**: JWTs stored in localStorage. For higher security, consider:
   - httpOnly cookies (requires CORS changes)
   - Secure flag for HTTPS only
   - SameSite=Strict for CSRF protection

2. **Token Expiration**:
   - Access token: Short-lived (15 minutes recommended)
   - Refresh token: Longer-lived (7 days), stored hashed in database
   - Automatic refresh before expiration in authService

3. **Token Revocation**:
   - Refresh tokens can be revoked (stored in `employee_refresh_tokens`)
   - Logout revokes all tokens for the employee
   - Password change revokes all tokens (force re-login)

### Password Security

1. **Hashing**: bcrypt with cost factor 12 (configurable)
2. **Minimum Length**: 8 characters (enforced in change-password)
3. **Complexity**: Consider adding uppercase, number, special char requirements
4. **First Login**: `must_change_password` flag forces password change

### Account Protection

1. **Brute Force Prevention**:
   - Lock account after 5 failed attempts
   - 30-minute lockout period
   - Admin can unlock accounts

2. **Rate Limiting**: Implement rate limiting on login endpoint:
   ```typescript
   import { rateLimiter } from 'hono-rate-limiter'
   
   auth.post('/login', rateLimiter({ 
     windowMs: 15 * 60 * 1000, // 15 minutes
     limit: 5  // 5 attempts per window
   }), loginHandler)
   ```

### Authorization Security

1. **RLS Not Used**: Since we use custom JWT (not Supabase Auth), RLS policies won't work.
   - All authorization is handled in middleware
   - Always use `supabaseAdmin` in backend (bypasses RLS)
   - Never expose service_role key to frontend

2. **ROOT Protection**:
   - ROOT role cannot be deleted
   - ROOT users cannot be managed by non-ROOT admins
   - Only ROOT can assign ROOT role to others
   - `canManageEmployee()` helper enforces hierarchy

3. **Permission Caching**: 
   - Permissions cached in JWT payload (fast check)
   - Full permissions fetched fresh on each request in middleware
   - Call `refreshPermissions()` after role/permission changes

### Audit Trail (Future Enhancement)

Consider logging:
- Login attempts (success/failure)
- Permission changes (who granted what to whom)
- Role assignments
- Password resets

---

## 9. Testing Strategy

### Unit Tests
- `useAuth` composable: init, signIn, signOut, permission checks
- `authMiddleware`: token validation, permission extraction
- Router guards: redirect logic

### Integration Tests
- Full login flow with redirect
- Permission-based route blocking
- Admin user/role CRUD operations

### E2E Tests (Playwright)
- Login with valid/invalid credentials
- Navigate to protected routes
- Permission-denied scenario
- Admin creates user and assigns permissions
