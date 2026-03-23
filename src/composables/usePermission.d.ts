/**
 * Composable for permission checking in components
 * Provides reactive permission state and helpers
 *
 * ROOT role bypasses ALL permission checks automatically
 */
export declare function usePermission(): {
    permissions: any;
    can: (permission: string) => any;
    canAny: (permissionList: string[]) => any;
    canAll: (permissionList: string[]) => any;
    isAdmin: any;
    isRoot: any;
    hasPermission: (permission: string) => boolean;
    hasAnyPermission: (perms: string[]) => boolean;
    hasAllPermissions: (perms: string[]) => boolean;
};
