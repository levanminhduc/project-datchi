export interface JwtPayload {
  sub: string
  employee_id: number
  employee_code: string
  roles: string[]
  is_root: boolean
  iss?: string
  aud?: string
  iat?: number
  exp?: number
}

export interface AuthContext {
  employeeId: number
  employeeCode: string
  roles: string[]
  isRoot: boolean
  isAdmin: boolean
}

export interface EmployeeAuthRow {
  id: number
  employee_id: string
  full_name: string
  department: string
  chuc_vu: string
  is_active: boolean
  must_change_password: boolean
  password_changed_at: string | null
  failed_login_attempts: number
  locked_until: string | null
  last_login_at: string | null
  auth_user_id: string | null
}

export interface RoleRow {
  id: number
  code: string
  name: string
  description: string | null
  level: number
  is_system: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PermissionRow {
  id: number
  code: string
  name: string
  description: string | null
  module: string
  resource: string
  action: 'VIEW' | 'CREATE' | 'EDIT' | 'DELETE' | 'MANAGE'
  route_path: string | null
  is_page_access: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface EmployeeRoleRow {
  id: number
  employee_id: number
  role_id: number
  assigned_by: number | null
}

export interface EmployeePermissionRow {
  id: number
  employee_id: number
  permission_id: number
  granted: boolean
  assigned_by: number | null
  expires_at: string | null
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface ResetPasswordRequest {
  employeeId: number
  newPassword: string
  mustChangePassword?: boolean
}

export interface AssignRoleRequest {
  employeeId: number
  roleId: number
}

export interface AssignPermissionRequest {
  employeeId: number
  permissionId: number
  granted?: boolean
  expiresAt?: string
}
