// src/composables/useAuth.ts

import { ref, computed, readonly } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/authService'
import { useSnackbar } from '@/composables/useSnackbar'
import type {
  EmployeeAuth,
  AuthState,
  LoginCredentials,
  ChangePasswordData,
} from '@/types/auth'

// Module-level state (shared across components)
const state = ref<AuthState>({
  employee: null,
  accessToken: null,
  refreshToken: null,
  permissions: [],
  isAuthenticated: false,
  isRoot: false,
  isLoading: true,
  error: null,
})

// Initialized flag to prevent multiple initializations
let initialized = false

const tempPassword = ref<string | null>(null)

export function useAuth() {
  const router = useRouter()
  const snackbar = useSnackbar()

  // Computed
  const employee = computed(() => state.value.employee)
  const isAuthenticated = computed(() => state.value.isAuthenticated)
  const isLoading = computed(() => state.value.isLoading)
  const permissions = computed(() => state.value.permissions)
  const error = computed(() => state.value.error)
  const isRoot = computed(() => state.value.isRoot)

  /**
   * Initialize auth state from stored tokens
   */
  async function init() {
    if (initialized) {
      return
    }
    initialized = true

    state.value.isLoading = true

    try {
      const hasTokens = authService.hasTokens()

      if (hasTokens) {
        const emp = await authService.fetchCurrentEmployee()
        const perms = await authService.fetchPermissions()

        if (emp) {
          state.value = {
            employee: emp,
            accessToken: authService.getAccessToken(),
            refreshToken: authService.getRefreshToken(),
            permissions: perms,
            isAuthenticated: true,
            isRoot: emp.isRoot || perms.includes('*'),
            isLoading: false,
            error: null,
          }

        } else {
          // Token invalid, clear state
          authService.clearTokens()
          resetState()
        }
      } else {
        resetState()
      }
    } catch {
      resetState()
      state.value.error = 'Không thể khởi tạo phiên đăng nhập'
    }
  }

  function resetState() {
    state.value = {
      employee: null,
      accessToken: null,
      refreshToken: null,
      permissions: [],
      isAuthenticated: false,
      isRoot: false,
      isLoading: false,
      error: null,
    }
  }

  /**
   * Sign in with employee_id and password
   */
  async function signIn(credentials: LoginCredentials): Promise<boolean> {
    state.value.isLoading = true
    state.value.error = null

    try {
      const { data, error: signInError } = await authService.signIn(credentials)

      if (signInError || !data) {
        state.value.error = signInError || 'Đăng nhập thất bại'
        snackbar.error(state.value.error)
        return false
      }

      // Fetch full permissions
      const perms = await authService.fetchPermissions()

      state.value = {
        employee: data.employee,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        permissions: perms,
        isAuthenticated: true,
        isRoot: data.employee.isRoot || perms.includes('*'),
        isLoading: false,
        error: null,
      }

      snackbar.success('Đăng nhập thành công')

      if (data.employee.mustChangePassword) {
        tempPassword.value = credentials.password
      }

      return true
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Đăng nhập thất bại'
      state.value.error = message
      snackbar.error(state.value.error)
      return false
    } finally {
      state.value.isLoading = false
    }
  }

  /**
   * Sign out current employee
   */
  async function signOut() {
    try {
      await authService.signOut()
      snackbar.success('Đã đăng xuất')
    } catch {
      // Still clear local state even if server call fails
    } finally {
      resetState()
      initialized = false // Allow re-init on next login
      router.push('/login')
    }
  }

  /**
   * Change password
   */
  async function changePassword(data: ChangePasswordData): Promise<boolean> {
    const { error: changeError } = await authService.changePassword(data)

    if (changeError) {
      snackbar.error(changeError)
      return false
    }

    // Update state to reflect password changed
    if (state.value.employee) {
      state.value.employee.mustChangePassword = false
    }
    tempPassword.value = null

    snackbar.success('Đổi mật khẩu thành công')
    return true
  }

  /**
   * Check if current employee has ROOT role
   * ROOT bypasses ALL permission checks
   */
  function checkIsRoot(): boolean {
    return state.value.isRoot
  }

  /**
   * Check if current employee has a specific permission
   * ROOT always returns true
   */
  function hasPermission(permission: string): boolean {
    if (state.value.isRoot) return true
    return state.value.permissions.includes(permission)
  }

  /**
   * Check if current employee has any of the given permissions
   * ROOT always returns true
   */
  function hasAnyPermission(perms: string[]): boolean {
    if (state.value.isRoot) return true
    return perms.some((p) => state.value.permissions.includes(p))
  }

  /**
   * Check if current employee has all of the given permissions
   * ROOT always returns true
   */
  function hasAllPermissions(perms: string[]): boolean {
    if (state.value.isRoot) return true
    return perms.every((p) => state.value.permissions.includes(p))
  }

  /**
   * Check if employee has a specific role
   */
  function hasRole(roleCode: string): boolean {
    return state.value.employee?.roles?.some((r) => r.code === roleCode) ?? false
  }

  /**
   * Check if employee is admin (ROOT or admin role)
   */
  function isAdmin(): boolean {
    return state.value.isRoot || hasRole('admin')
  }

  /**
   * Refresh employee permissions (after role/permission change)
   */
  async function refreshPermissions() {
    if (!state.value.isAuthenticated) return

    const perms = await authService.fetchPermissions()
    state.value.permissions = perms
    state.value.isRoot = perms.includes('*') || hasRole('root')
  }

  return {
    // State
    employee: readonly(employee),
    isAuthenticated: readonly(isAuthenticated),
    isLoading: readonly(isLoading),
    permissions: readonly(permissions),
    error: readonly(error),
    isRoot: readonly(isRoot),
    tempPassword: readonly(tempPassword),

    // Actions
    init,
    signIn,
    signOut,
    changePassword,
    refreshPermissions,

    // Permission helpers
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isAdmin,
    checkIsRoot,
  }
}
