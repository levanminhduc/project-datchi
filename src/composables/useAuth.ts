import { ref, computed, readonly } from 'vue'
import { useRouter } from 'vue-router'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { authService } from '@/services/authService'
import {
  clearAuthSessionLocal,
  resetLogoutFlag,
  isLogoutInProgress,
} from '@/services/api'
import { isAuthError } from '@/services/auth-error-utils'
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
let initPromise: Promise<void> | null = null
let signingOut = false
let loggedOut = false
let authListenerUnsubscribe: (() => void) | null = null
let sessionResumeListenerCleanup: (() => void) | null = null
let lastResumeReinitAt = 0

let verifiedPermissionsSnapshot: string[] | null = null

const tempPassword = ref<string | null>(null)

const RETRY_DELAYS = [0, 500, 1000]
const GET_USER_TIMEOUT = 8000
const GET_SESSION_TIMEOUT = 8000
const RESUME_REINIT_DEBOUNCE_MS = 1500
const SESSION_NEAR_EXPIRY_MS = 15 * 60 * 1000

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))
  return Promise.race([promise, timeout])
}

async function retryGetUser(): Promise<{
  user: unknown | null
  errorType: 'auth' | 'network' | null
}> {
  for (let attempt = 0; attempt < RETRY_DELAYS.length; attempt++) {
    const delay = RETRY_DELAYS[attempt]
    if (attempt > 0 && delay) {
      await sleep(delay)
    }

    const result = await withTimeout(supabase.auth.getUser(), GET_USER_TIMEOUT)

    // Timeout - treat as network error
    if (result === null) {
      continue
    }

    const { data, error } = result

    // No session = auth error (user needs to login)
    if (!data.user && !error) {
      return { user: null, errorType: 'auth' }
    }

    if (!error && data.user) {
      return { user: data.user, errorType: null }
    }

    if (error) {
      if (isAuthError(error)) {
        return { user: null, errorType: 'auth' }
      }
    }
  }

  return { user: null, errorType: 'network' }
}

async function getSessionSafe(timeoutMs = GET_SESSION_TIMEOUT): Promise<Session | null> {
  try {
    const result = await withTimeout(
      supabase.auth.getSession(),
      timeoutMs
    )

    if (!result) {
      return null
    }

    return result.data.session ?? null
  } catch {
    return null
  }
}

function applyPermissionsSnapshot() {
  if (verifiedPermissionsSnapshot) {
    state.value.permissions = verifiedPermissionsSnapshot
    state.value.isRoot = verifiedPermissionsSnapshot.includes('*')
  }
}

function preserveExistingAuthStateOnNetworkError(): boolean {
  if (!state.value.isAuthenticated || !state.value.employee) {
    return false
  }

  state.value.isLoading = false
  state.value.error = 'network'
  applyPermissionsSnapshot()
  initialized = false
  return true
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
    // If already initializing, wait for that promise
    if (initPromise) {
      await initPromise
      return
    }

    if (initialized || signingOut) {
      return
    }

    if (loggedOut) {
      resetState()
      return
    }

    // Create promise for this init
    initPromise = doInit()
    try {
      await initPromise
    } finally {
      initPromise = null
    }
  }

  async function doInit() {
    initialized = true
    setupAuthListener()
    setupSessionResumeListener()

    state.value.isLoading = true

    try {
      const { user, errorType: getUserErrorType } = await retryGetUser()

      if (getUserErrorType === 'auth') {
        // Don't call clearAuthSessionLocal() here - it triggers SIGNED_OUT event
        // which causes router navigation → deadlock with initPromise
        // Guard will redirect to /login since isAuthenticated=false
        resetState()
        return
      }

      if (getUserErrorType === 'network') {
        const session = await getSessionSafe()

        if (session) {
          state.value.isAuthenticated = true
          state.value.error = 'network'
          state.value.isLoading = false
          applyPermissionsSnapshot()
          initialized = false
          snackbar.error('Lỗi kết nối mạng. Đang thử khôi phục phiên...')
          return
        }

        if (preserveExistingAuthStateOnNetworkError()) {
          snackbar.error('Kết nối bị gián đoạn khi khôi phục phiên. Đang thử lại...')
          return
        }

        resetState()
        initialized = false
        return
      }

      if (!user) {
        resetState()
        return
      }

      const { data: emp, errorType: empErrorType } =
        await authService.fetchCurrentEmployee()

      if (empErrorType === 'auth') {
        resetState()
        return
      }

      if (empErrorType === 'network') {
        const session = await getSessionSafe()

        if (session) {
          state.value.isAuthenticated = true
          state.value.error = 'network'
          state.value.isLoading = false
          applyPermissionsSnapshot()
          initialized = false
          snackbar.error('Lỗi kết nối mạng. Đang thử khôi phục phiên...')
          return
        }

        if (preserveExistingAuthStateOnNetworkError()) {
          snackbar.error('Kết nối bị gián đoạn khi khôi phục phiên. Đang thử lại...')
          return
        }

        resetState()
        initialized = false
        return
      }

      if (!emp) {
        await clearAuthSessionLocal()
        resetState()
        return
      }

      if (emp.mustChangePassword) {
        await clearAuthSessionLocal()
        resetState()
        initialized = false
        router.push('/login')
        return
      }

      const { data: perms, errorType: permsErrorType } =
        await authService.fetchPermissions()

      if (permsErrorType === 'auth') {
        await clearAuthSessionLocal()
        resetState()
        initialized = false
        return
      }

      const finalPerms =
        permsErrorType === 'network' && verifiedPermissionsSnapshot
          ? verifiedPermissionsSnapshot
          : perms ?? []

      if (perms) {
        verifiedPermissionsSnapshot = perms
      }

      state.value = {
        employee: emp,
        permissions: finalPerms,
        isAuthenticated: true,
        isRoot: emp.isRoot || finalPerms.includes('*'),
        isLoading: false,
        error: permsErrorType === 'network' ? 'network' : null,
      }
    } catch {
      resetState()
      state.value.error = 'Không thể khởi tạo phiên đăng nhập'
      initialized = false
    }
  }

  function setupAuthListener() {
    if (authListenerUnsubscribe) return
    let handlingTokenRefresh = false

    let handlingSignedOut = false

    const handleSignedOutEvent = async () => {
      if (signingOut || isLogoutInProgress() || handlingSignedOut) return
      handlingSignedOut = true

      try {
        await new Promise(r => setTimeout(r, 150))

        if (signingOut || isLogoutInProgress()) return

        const session = await getSessionSafe(3000)
        if (session) {
          return
        }

        await clearAuthSessionLocal()
        resetState()
        initialized = false
        const isOnLoginPage = router.currentRoute.value.path === '/login'

        if (!isOnLoginPage) {
          snackbar.error('Phiên đăng nhập đã hết hạn')
          await router.replace('/login').catch(() => {
            window.location.replace('/login')
          })
        }
      } finally {
        handlingSignedOut = false
      }
    }

    const handleTokenRefreshedEvent = async (session: Session | null) => {
      if (handlingTokenRefresh) return
      handlingTokenRefresh = true

      try {
        if (!session?.access_token) {
          return
        }

        const { data: emp, errorType: empErrorType } = await authService.fetchCurrentEmployee()
        if (empErrorType === 'auth') {
          await clearAuthSessionLocal()
          resetState()
          initialized = false
          if (router.currentRoute.value.path !== '/login') {
            await router.replace('/login').catch(() => {
              window.location.replace('/login')
            })
          }
          return
        }
        if (empErrorType === 'network') {
          console.warn('[useAuth] Token refreshed but backend unreachable — keeping current session')
          return
        }

        const { data: perms, errorType: permsErrorType } = await authService.fetchPermissions()
        if (permsErrorType === 'auth') {
          await clearAuthSessionLocal()
          resetState()
          initialized = false
          if (router.currentRoute.value.path !== '/login') {
            await router.replace('/login').catch(() => {
              window.location.replace('/login')
            })
          }
          return
        }
        if (permsErrorType === 'network') {
          console.warn('[useAuth] Token refreshed but backend unreachable — keeping current session')
          return
        }

        if (emp) {
          state.value.employee = emp
        }
        if (perms !== null) {
          state.value.permissions = perms
          verifiedPermissionsSnapshot = perms
          state.value.isRoot = (emp?.isRoot ?? state.value.employee?.isRoot ?? false) || perms.includes('*')
        }
        if (state.value.error === 'network') {
          state.value.error = null
        }
      } finally {
        handlingTokenRefresh = false
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        void handleSignedOutEvent()
      }

      if (event === 'TOKEN_REFRESHED') {
        // Keep callback synchronous to avoid Supabase auth lock deadlocks.
        void handleTokenRefreshedEvent(session)
      }
    })

    authListenerUnsubscribe = () => subscription.unsubscribe()
  }

  function setupSessionResumeListener() {
    if (typeof window === 'undefined' || sessionResumeListenerCleanup) return

    const revalidateAuthOnResume = async () => {
      if (document.visibilityState === 'hidden') return
      if (signingOut || loggedOut || !state.value.isAuthenticated) return

      const now = Date.now()
      if (now - lastResumeReinitAt < RESUME_REINIT_DEBOUNCE_MS) {
        return
      }

      const session = await getSessionSafe(3000)
      if (!session) {
        lastResumeReinitAt = now
        initialized = false
        void init()
        return
      }

      const expiresAt = session.expires_at ? session.expires_at * 1000 : 0
      if (expiresAt - now > SESSION_NEAR_EXPIRY_MS) {
        return
      }

      lastResumeReinitAt = now
      initialized = false
      void init()
    }

    window.addEventListener('focus', revalidateAuthOnResume)
    document.addEventListener('visibilitychange', revalidateAuthOnResume)

    sessionResumeListenerCleanup = () => {
      window.removeEventListener('focus', revalidateAuthOnResume)
      document.removeEventListener('visibilitychange', revalidateAuthOnResume)
    }
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

      const { data: perms } = await authService.fetchPermissions()

      if (perms) {
        verifiedPermissionsSnapshot = perms
      }

      state.value = {
        employee: data.employee,
        permissions: perms ?? [],
        isAuthenticated: true,
        isRoot: data.employee.isRoot || (perms ?? []).includes('*'),
        isLoading: false,
        error: null,
      }

      snackbar.success('Đăng nhập thành công')

      if (data.employee.mustChangePassword) {
        tempPassword.value = credentials.password
      }

      resetLogoutFlag()
      setupAuthListener()
      setupSessionResumeListener()
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
    verifiedPermissionsSnapshot = null
    try {
      try {
        await authService.signOut()
      } catch {
      }

      await clearAuthSessionLocal()
      snackbar.success('Đã đăng xuất')
      resetState()
      initialized = false

      await router.push('/login').catch(() => {
        window.location.replace('/login')
      })
    } finally {
      signingOut = false
    }
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

    const { data: perms } = await authService.fetchPermissions()
    if (perms !== null) {
      state.value.permissions = perms
      verifiedPermissionsSnapshot = perms
      state.value.isRoot = perms.includes('*') || hasRole('root')
    }
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
