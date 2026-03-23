export type PermissionAction = 'VIEW' | 'CREATE' | 'EDIT' | 'DELETE' | 'MANAGE';
export interface Permission {
    id: number;
    code: string;
    name: string;
    description?: string;
    module: string;
    resource: string;
    action: PermissionAction;
    routePath?: string;
    isPageAccess: boolean;
    sortOrder: number;
}
export interface Role {
    id: number;
    code: string;
    name: string;
    description?: string;
    level: number;
    isSystem: boolean;
    isActive: boolean;
    permissions?: Permission[];
}
export interface EmployeeAuth {
    id: number;
    employeeId: string;
    fullName: string;
    department: string;
    chucVu: string;
    isActive: boolean;
    mustChangePassword: boolean;
    lastLoginAt?: string;
    roles: Role[];
    permissions: string[];
    isRoot: boolean;
}
export interface EmployeeRole {
    id: number;
    employeeId: number;
    roleId: number;
    assignedBy?: number;
}
export interface EmployeePermission {
    id: number;
    employeeId: number;
    permissionId: number;
    granted: boolean;
    assignedBy?: number;
    expiresAt?: string;
}
export interface AuthState {
    employee: EmployeeAuth | null;
    permissions: string[];
    isAuthenticated: boolean;
    isRoot: boolean;
    isLoading: boolean;
    error: string | null;
}
export interface LoginCredentials {
    employeeId: string;
    password: string;
}
export interface LoginResponse {
    employee: EmployeeAuth;
}
export interface ChangePasswordData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}
export interface AssignRoleData {
    employeeId: number;
    roleId: number;
}
export interface AssignPermissionData {
    employeeId: number;
    permissionId: number;
    granted?: boolean;
    expiresAt?: string;
}
export interface CreateRoleData {
    code: string;
    name: string;
    description?: string;
    level: number;
    permissionIds: number[];
}
export interface UpdateRoleData {
    name?: string;
    description?: string;
    level?: number;
    isActive?: boolean;
    permissionIds?: number[];
}
export interface CreatePermissionData {
    code: string;
    name: string;
    description?: string;
    module: string;
    resource: string;
    action: PermissionAction;
    routePath?: string;
    isPageAccess?: boolean;
    sortOrder?: number;
}
export interface UpdatePermissionData {
    name?: string;
    description?: string;
    module?: string;
    resource?: string;
    action?: PermissionAction;
    routePath?: string;
    isPageAccess?: boolean;
    sortOrder?: number;
}
export interface AuthResponse {
    data: LoginResponse | null;
    error: boolean;
    message?: string;
}
export interface PermissionCheckResponse {
    hasPermission: boolean;
    permissions: string[];
}
export interface RouteMeta {
    /**
     * Mark route as public - no authentication required.
     * ALL routes require auth BY DEFAULT unless `public: true` is set.
     */
    public?: boolean;
    /**
     * @deprecated Use `public: true` instead. Kept for backward compatibility.
     */
    requiresAuth?: boolean;
    permissions?: string[];
    allPermissions?: string[];
    requiresRoot?: boolean;
    requiresAdmin?: boolean;
    redirectTo?: string;
    title?: string;
}
export interface JwtPayload {
    sub: string;
    employee_id: number;
    employee_code: string;
    roles: string[];
    is_root: boolean;
    iat: number;
    exp: number;
}
