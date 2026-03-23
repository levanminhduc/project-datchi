"use strict";
// src/composables/usePermission.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePermission = usePermission;
var vue_1 = require("vue");
var useAuth_1 = require("./useAuth");
/**
 * Composable for permission checking in components
 * Provides reactive permission state and helpers
 *
 * ROOT role bypasses ALL permission checks automatically
 */
function usePermission() {
    var _a = (0, useAuth_1.useAuth)(), permissions = _a.permissions, hasPermission = _a.hasPermission, hasAnyPermission = _a.hasAnyPermission, hasAllPermissions = _a.hasAllPermissions, isAdmin = _a.isAdmin, checkIsRoot = _a.checkIsRoot;
    /**
     * Create a computed permission check
     * Usage: const canView = can('thread.inventory.view')
     * Note: ROOT always returns true
     */
    function can(permission) {
        return (0, vue_1.computed)(function () { return hasPermission(permission); });
    }
    /**
     * Create a computed check for any of the permissions
     * Usage: const canManage = canAny(['thread.inventory.edit', 'thread.inventory.delete'])
     * Note: ROOT always returns true
     */
    function canAny(permissionList) {
        return (0, vue_1.computed)(function () { return hasAnyPermission(permissionList); });
    }
    /**
     * Create a computed check for all permissions
     * Usage: const canFullManage = canAll(['thread.types.create', 'thread.types.edit'])
     * Note: ROOT always returns true
     */
    function canAll(permissionList) {
        return (0, vue_1.computed)(function () { return hasAllPermissions(permissionList); });
    }
    /**
     * Computed admin check (ROOT or admin role)
     */
    var isAdminUser = (0, vue_1.computed)(function () { return isAdmin(); });
    /**
     * Computed ROOT check
     */
    var isRootUser = (0, vue_1.computed)(function () { return checkIsRoot(); });
    return {
        permissions: permissions,
        can: can,
        canAny: canAny,
        canAll: canAll,
        isAdmin: isAdminUser,
        isRoot: isRootUser,
        hasPermission: hasPermission,
        hasAnyPermission: hasAnyPermission,
        hasAllPermissions: hasAllPermissions,
    };
}
