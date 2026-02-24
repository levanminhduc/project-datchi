import { ref, computed, readonly } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { authService } from '@/services/authService'
import { useSnackbar } from '@/composables/useSnackbar'
import type {
  AuthState,
  LoginCredentials,
  ChangePasswordData,
} from '@/types/auth'

const state = ref<AuthState>({
  employee: null,
  permissions: [],
  isAuthenticated: false,
  isRoot: false,
  isLoading: true,
  error: null,
})

let initialized = false
let signingOut = false
let loggedOut = false
let authListenerUnsubscribe: (() => void) | null = null

const tempPassword = ref<string | null>(null)

function clearSupabaseTokens() {
  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('sb-') && key.includes('auth-token')) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key))
}

export function useAuth() {
  const router = useRouter()
  const snackbar = useSnackbar()

  const employee = computed(() => state.value.employee)
  const isAuthenticated = computed(() => state.value.isAuthenticated)
  const isLoading = computed(() => state.value.isLoading)
  const permissions = computed(() => state.value.permissions)
  const error = computed(() => state.value.error)
  const isRoot = computed(() => state.value.isRoot)

  async function init() {
    if (initialized || signingOut) {
      return
    }

    if (loggedOut) {
      resetState()
      return
    }

    initialized = true

    state.value.isLoading = true

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        const emp = await authService.fetchCurrentEmployee()
        const perms = await authService.fetchPermissions()

        if (emp) {
          if (emp.mustChangePassword) {
            await supabase.auth.signOut()
            resetState()
            initialized = false
            router.push('/login')
            return
          }

          state.value = {
            employee: emp,
            permissions: perms,
            isAuthenticated: true,
            isRoot: emp.isRoot || perms.includes('*'),
            isLoading: false,
            error: null,
          }
        } else {
          await supabase.auth.signOut()
          resetState()
        }
      } else {
        resetState()
      }
    } catch {
      resetState()
      state.value.error = 'Không thể khởi tạo phiên đăng nhập'
    }

    setupAuthListener()
  }

  function setupAuthListener() {
    if (authListenerUnsubscribe) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_OUT') {
          if (signingOut) return
          resetState()
          initialized = false
          snackbar.error('Phiên đăng nhập đã hết hạn')
          router.push('/login')
        }

        if (event === 'TOKEN_REFRESHED') {
          const emp = await authService.fetchCurrentEmployee()
          if (emp) {
            state.value.employee = emp
          }
        }
      }
    )

    authListenerUnsubscribe = () => subscription.unsubscribe()
  }

  function resetState() {
    state.value = {
      employee: null,
      permissions: [],
      isAuthenticated: false,
      isRoot: false,
      isLoading: false,
      error: null,
    }
  }

  async function signIn(credentials: LoginCredentials): Promise<boolean> {
    loggedOut = false
    state.value.isLoading = true
    state.value.error = null

    try {
      const { data, error: signInError } = await authService.signIn(credentials)

      if (signInError || !data) {
        state.value.error = signInError || 'Đăng nhập thất bại'
        snackbar.error(state.value.error)
        return false
      }

      const perms = await authService.fetchPermissions()

      state.value = {
        employee: data.employee,
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

      setupAuthListener()
      initialized = true

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

  async function signOut() {
    signingOut = true
    loggedOut = true
    try {
      await authService.signOut()
    } catch {
    }
    clearSupabaseTokens()
    snackbar.success('Đã đăng xuất')
    resetState()
    initialized = false
    await router.push('/login')
    signingOut = false
  }

  async function changePassword(data: ChangePasswordData): Promise<boolean> {
    const { error: changeError } = await authService.changePassword(data)

    if (changeError) {
      snackbar.error(changeError)
      return false
    }

    if (state.value.employee) {
      state.value.employee.mustChangePassword = false
    }
    tempPassword.value = null

    snackbar.success('Đổi mật khẩu thành công')
    return true
  }

  function checkIsRoot(): boolean {
    return state.value.isRoot
  }

  function hasPermission(permission: string): boolean {
    if (state.value.isRoot) return true
    return state.value.permissions.includes(permission)
  }

  function hasAnyPermission(perms: string[]): boolean {
    if (state.value.isRoot) return true
    return perms.some((p) => state.value.permissions.includes(p))
  }

  function hasAllPermissions(perms: string[]): boolean {
    if (state.value.isRoot) return true
    return perms.every((p) => state.value.permissions.includes(p))
  }

  function hasRole(roleCode: string): boolean {
    return state.value.employee?.roles?.some((r) => r.code === roleCode) ?? false
  }

  function isAdmin(): boolean {
    return state.value.isRoot || hasRole('admin')
  }

  async function refreshPermissions() {
    if (!state.value.isAuthenticated) return

    const perms = await authService.fetchPermissions()
    state.value.permissions = perms
    state.value.isRoot = perms.includes('*') || hasRole('root')
  }

  return {
    employee: readonly(employee),
    isAuthenticated: readonly(isAuthenticated),
    isLoading: readonly(isLoading),
    permissions: readonly(permissions),
    error: readonly(error),
    isRoot: readonly(isRoot),
    tempPassword: readonly(tempPassword),

    init,
    signIn,
    signOut,
    changePassword,
    refreshPermissions,

    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isAdmin,
    checkIsRoot,
  }
}
