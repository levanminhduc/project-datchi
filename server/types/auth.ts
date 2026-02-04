// server/types/auth.ts

// ============================================
// JWT PAYLOAD
// ============================================

export interface JwtPayload {
  sub: number          // employee.id
  employeeId: string   // employee.employee_id (username)
  roles: string[]      // role codes
  isRoot: boolean      // quick ROOT check
  iat?: number
  exp?: number
}

// ============================================
// AUTH CONTEXT (attached to request)
// ============================================

export interface AuthContext {
  employeeId: number         // employee.id (primary key)
  employeeCode: string       // employee.employee_id (username)
  roles: string[]            // role codes
  isRoot: boolean            // ROOT role check
  isAdmin: boolean           // admin or root
}

// ============================================
// DATABASE ROW TYPES
// ============================================

export interface EmployeeAuthRow {
  id: number
  employee_id: string
  full_name: string
  department: string
  chuc_vu: string
  is_active: boolean
  password_hash: string | null
  must_change_password: boolean
  password_changed_at: string | null
  failed_login_attempts: number
  locked_until: string | null
  last_login_at: string | null
  refresh_token: string | null
  refresh_token_expires_at: string | null
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
  action: 'view' | 'create' | 'edit' | 'delete' | 'manage'
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
  assigned_at: string
}

export interface EmployeePermissionRow {
  id: number
  employee_id: number
  permission_id: number
  granted: boolean
  assigned_by: number | null
  assigned_at: string
  expires_at: string | null
}

// ============================================
// REQUEST DTOs
// ============================================

export interface LoginRequest {
  employeeId: string
  password: string
}

export interface RefreshTokenRequest {
  refreshToken: string
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

// ============================================
// RESPONSE DTOs
// ============================================

export interface LoginResponseData {
  employee: {
    id: number
    employeeId: string
    fullName: string
    department: string
    chucVu: string
    isActive: boolean
    mustChangePassword: boolean
    lastLoginAt: string | null
    roles: Array<{
      id: number
      code: string
      name: string
      level: number
    }>
    permissions: string[]
    isRoot: boolean
  }
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface RefreshTokenResponseData {
  accessToken: string
  expiresIn: number
}

// ============================================
// AUTH CONFIGURATION
// ============================================

export interface AuthConfig {
  jwtSecret: string
  jwtExpiresIn: string | number  // e.g., '15m' or 900
  refreshTokenExpiresIn: string  // e.g., '7d'
  maxFailedAttempts: number
  lockoutDuration: number        // minutes
  passwordMinLength: number
}

export const DEFAULT_AUTH_CONFIG: AuthConfig = {
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  maxFailedAttempts: 5,
  lockoutDuration: 30,           // 30 minutes
  passwordMinLength: 8
}
