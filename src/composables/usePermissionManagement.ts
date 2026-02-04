// src/composables/usePermissionManagement.ts

import { ref, computed } from 'vue'
import { authService } from '@/services/authService'
import type {
  Role,
  Permission,
  CreateRoleData,
  UpdateRoleData,
  EmployeeAuth,
} from '@/types/auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// ============================================
// Types
// ============================================

export interface EmployeeSearchResult {
  id: number
  employeeId: string
  fullName: string
  department: string
  chucVu: string
  isActive: boolean
}

export interface EmployeeRolesPermissions {
  employee: {
    id: number
    employeeId: string
    fullName: string
    department: string
    chucVu: string
  }
  roles: Role[]
  directPermissions: {
    permission: Permission
    granted: boolean
    expiresAt?: string
  }[]
  effectivePermissions: string[]
  isRoot: boolean
}

interface PermissionsByModule {
  [module: string]: Permission[]
}

// ============================================
// Composable
// ============================================

export function usePermissionManagement() {
  // State
  const roles = ref<Role[]>([])
  const permissions = ref<Permission[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const permissionsByModule = computed<PermissionsByModule>(() => {
    const grouped: PermissionsByModule = {}
    for (const perm of permissions.value) {
      if (!grouped[perm.module]) {
        grouped[perm.module] = []
      }
      grouped[perm.module]!.push(perm)
    }
    // Sort permissions within each module by sortOrder
    for (const module in grouped) {
      grouped[module]!.sort((a, b) => a.sortOrder - b.sortOrder)
    }
    return grouped
  })

  const moduleList = computed(() => Object.keys(permissionsByModule.value).sort())

  // ============================================
  // Roles API
  // ============================================

  async function fetchRoles(): Promise<Role[]> {
    loading.value = true
    error.value = null
    try {
      const response = await authService.authenticatedFetch(`${API_URL}/api/auth/roles`)
      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.message || 'Không thể tải danh sách vai trò')
      }

      roles.value = result.data
      return result.data
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải vai trò'
      error.value = msg
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createRole(data: CreateRoleData): Promise<Role> {
    loading.value = true
    error.value = null
    try {
      const response = await authService.authenticatedFetch(`${API_URL}/api/auth/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.message || 'Không thể tạo vai trò')
      }

      // Refresh roles list
      await fetchRoles()
      return result.data
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tạo vai trò'
      error.value = msg
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateRole(id: number, data: UpdateRoleData): Promise<Role> {
    loading.value = true
    error.value = null
    try {
      const response = await authService.authenticatedFetch(`${API_URL}/api/auth/roles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.message || 'Không thể cập nhật vai trò')
      }

      // Refresh roles list
      await fetchRoles()
      return result.data
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi cập nhật vai trò'
      error.value = msg
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteRole(id: number): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const response = await authService.authenticatedFetch(`${API_URL}/api/auth/roles/${id}`, {
        method: 'DELETE',
      })
      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.message || 'Không thể xóa vai trò')
      }

      // Refresh roles list
      await fetchRoles()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi xóa vai trò'
      error.value = msg
      throw err
    } finally {
      loading.value = false
    }
  }

  async function getRolePermissions(roleId: number): Promise<Permission[]> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_URL}/api/auth/roles/${roleId}/permissions`
      )
      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.message || 'Không thể tải quyền của vai trò')
      }

      return result.data
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải quyền'
      error.value = msg
      throw err
    }
  }

  // ============================================
  // Permissions API
  // ============================================

  async function fetchPermissions(): Promise<Permission[]> {
    loading.value = true
    error.value = null
    try {
      const response = await authService.authenticatedFetch(
        `${API_URL}/api/auth/permissions/all`
      )
      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.message || 'Không thể tải danh sách quyền')
      }

      permissions.value = result.data
      return result.data
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải quyền'
      error.value = msg
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // Employee Permissions API
  // ============================================

  async function searchEmployees(query: string): Promise<EmployeeSearchResult[]> {
    if (!query || query.length < 2) return []

    try {
      const response = await authService.authenticatedFetch(
        `${API_URL}/api/auth/employees/search?q=${encodeURIComponent(query)}`
      )
      const result = await response.json()

      if (!response.ok || result.error) {
        return []
      }

      return result.data
    } catch {
      return []
    }
  }

  async function getEmployeeRolesPermissions(
    employeeId: number
  ): Promise<EmployeeRolesPermissions | null> {
    loading.value = true
    error.value = null
    try {
      const response = await authService.authenticatedFetch(
        `${API_URL}/api/auth/employees/${employeeId}/roles-permissions`
      )
      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.message || 'Không thể tải thông tin phân quyền')
      }

      return result.data
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải thông tin'
      error.value = msg
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateEmployeeRoles(employeeId: number, roleIds: number[]): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const response = await authService.authenticatedFetch(
        `${API_URL}/api/auth/employees/${employeeId}/roles`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roleIds }),
        }
      )
      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.message || 'Không thể cập nhật vai trò')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi cập nhật vai trò'
      error.value = msg
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateEmployeePermissions(
    employeeId: number,
    permissionUpdates: { permissionId: number; granted: boolean }[]
  ): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const response = await authService.authenticatedFetch(
        `${API_URL}/api/auth/employees/${employeeId}/permissions`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permissions: permissionUpdates }),
        }
      )
      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.message || 'Không thể cập nhật quyền')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi cập nhật quyền'
      error.value = msg
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // Initialize
  // ============================================

  async function initialize(): Promise<void> {
    await Promise.all([fetchRoles(), fetchPermissions()])
  }

  return {
    // State
    roles,
    permissions,
    loading,
    error,

    // Computed
    permissionsByModule,
    moduleList,

    // Roles methods
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
    getRolePermissions,

    // Permissions methods
    fetchPermissions,

    // Employee methods
    searchEmployees,
    getEmployeeRolesPermissions,
    updateEmployeeRoles,
    updateEmployeePermissions,

    // Initialize
    initialize,
  }
}
