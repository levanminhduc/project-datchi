// src/types/auth/index.ts

// ============================================
// ENUMS
// ============================================

export type PermissionAction = 'VIEW' | 'CREATE' | 'EDIT' | 'DELETE' | 'MANAGE'

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
}

export interface EmployeePermission {
  id: number
  employeeId: number
  permissionId: number
  granted: boolean
  assignedBy?: number
  expiresAt?: string
}

// ============================================
// AUTH STATE (Frontend)
// ============================================

export interface AuthState {
  employee: EmployeeAuth | null
  permissions: string[]
  isAuthenticated: boolean
  isRoot: boolean
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

export interface CreatePermissionData {
  code: string
  name: string
  description?: string
  module: string
  resource: string
  action: PermissionAction
  routePath?: string
  isPageAccess?: boolean
  sortOrder?: number
}

export interface UpdatePermissionData {
  name?: string
  description?: string
  module?: string
  resource?: string
  action?: PermissionAction
  routePath?: string
  isPageAccess?: boolean
  sortOrder?: number
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
  sub: string
  employee_id: number
  employee_code: string
  roles: string[]
  is_root: boolean
  iat: number
  exp: number
}
