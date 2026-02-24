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
    checkIsRoot,
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
