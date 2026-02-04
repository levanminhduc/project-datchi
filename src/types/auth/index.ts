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
  /**
   * Mark route as public - no authentication required.
   * ALL routes require auth BY DEFAULT unless `public: true` is set.
   */
  public?: boolean
  /**
   * @deprecated Use `public: true` instead. Kept for backward compatibility.
   */
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
