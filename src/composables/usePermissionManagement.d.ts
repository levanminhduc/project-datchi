import type { Role, Permission, CreateRoleData, UpdateRoleData, CreatePermissionData, UpdatePermissionData } from '@/types/auth';
export interface EmployeeSearchResult {
    id: number;
    employeeId: string;
    fullName: string;
    department: string;
    chucVu: string;
    isActive: boolean;
}
export interface EmployeeRolesPermissions {
    employee: {
        id: number;
        employeeId: string;
        fullName: string;
        department: string;
        chucVu: string;
    };
    roles: Role[];
    directPermissions: {
        permission: Permission;
        granted: boolean;
        expiresAt?: string;
    }[];
    effectivePermissions: string[];
    isRoot: boolean;
}
export declare function usePermissionManagement(): {
    roles: any;
    permissions: any;
    loading: any;
    error: any;
    permissionsByModule: any;
    moduleList: any;
    fetchRoles: () => Promise<Role[]>;
    createRole: (data: CreateRoleData) => Promise<Role>;
    updateRole: (id: number, data: UpdateRoleData) => Promise<Role>;
    deleteRole: (id: number) => Promise<void>;
    getRolePermissions: (roleId: number) => Promise<Permission[]>;
    fetchPermissions: () => Promise<Permission[]>;
    createPermission: (data: CreatePermissionData) => Promise<Permission>;
    updatePermission: (id: number, data: UpdatePermissionData) => Promise<Permission>;
    deletePermission: (id: number) => Promise<void>;
    searchEmployees: (query: string) => Promise<EmployeeSearchResult[]>;
    getEmployeeRolesPermissions: (employeeId: number) => Promise<EmployeeRolesPermissions | null>;
    updateEmployeeRoles: (employeeId: number, roleIds: number[]) => Promise<void>;
    updateEmployeePermissions: (employeeId: number, permissionUpdates: {
        permissionId: number;
        granted: boolean;
    }[]) => Promise<void>;
    initialize: () => Promise<void>;
};
