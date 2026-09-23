import { ref, computed, readonly } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/authService'
import {
  clearAuthSessionLocal,
  resetLogoutFlag,
  isLogoutInProgress,
  getRefreshedAccessToken,
} from '@/services/api'
import {
  hasTokens,
  getAccessToken,
  isTokenExpiringSoon,
  getTokenExpiry,
  ACCESS_TOKEN_KEY as ACCESS_TOKEN_STORAGE_KEY,
} from '@/lib/auth-token-store'
import { cancelRefresh, rescheduleFromCurrentToken } from '@/lib/auth-refresh-scheduler'
import { clearAllCache } from '@/lib/api-cache'
import { useSnackbar } from '@/composables/useSnackbar'
import type {
  AuthState,
  LoginCredentials,
  ChangePasswordData,
} from '@/types/auth'

const AUTH_CACHE_KEY = 'datchi-auth-cache'

interface AuthCache {
  employee: AuthState['employee']
  permissions: string[]
  isRoot: boolean
}

function saveAuthCache(s: AuthState): void {
  if (!s.isAuthenticated || !s.employee) return
  try {
    localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({
      employee: s.employee,
      permissions: s.permissions,
      isRoot: s.isRoot,
    } satisfies AuthCache))
  } catch { /* quota exceeded */ }
}

function loadAuthCache(): AuthCache | null {
  try {
    const raw = localStorage.getItem(AUTH_CACHE_KEY)
    if (!raw) return null
    const cache = JSON.parse(raw) as AuthCache
    if (!cache.employee) return null
    return cache
  } catch {
    return null
  }
}

function clearAuthCache(): void {
  localStorage.removeItem(AUTH_CACHE_KEY)
}

const cached = loadAuthCache()

const state = ref<AuthState>(cached ? {
  employee: cached.employee,
  permissions: cached.permissions,
  isAuthenticated: true,
  isRoot: cached.isRoot,
  isLoading: false,
  error: null,
} : {
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

let verifiedPermissionsSnapshot: string[] | null = cached?.permissions ?? null

const tempPassword = ref<string | null>(null)

const RETRY_DELAYS = [0, 500, 1000]
const RESUME_REINIT_DEBOUNCE_MS = 1500

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function retryGetUser(): Promise<{
  user: unknown | null
  errorType: 'auth' | 'network' | null
}> {
  if (!hasTokens()) {
    return { user: null, errorType: 'auth' }
  }

  for (let attempt = 0; attempt < RETRY_DELAYS.length; attempt++) {
    const delay = RETRY_DELAYS[attempt]
    if (attempt > 0 && delay) {
      await sleep(delay)
    }

    let token = getAccessToken()
    if (!token) {
      return { user: null, errorType: 'auth' }
    }

    if (isTokenExpiringSoon(token)) {
      try {
        token = await getRefreshedAccessToken()
      } catch {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          continue
        }
        return { user: null, errorType: 'auth' }
      }
    }

    if (token) {
      return { user: { token }, errorType: null }
    }
  }

  return { user: null, errorType: 'network' }
}

function hasValidSession(): boolean {
  return hasTokens() && !!getAccessToken()
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

    const hasCachedState = state.value.isAuthenticated && state.value.employee !== null
    if (!hasCachedState) {
      state.value.isLoading = true
    }

    try {
      const { user, errorType: getUserErrorType } = await retryGetUser()

      if (getUserErrorType === 'auth') {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          if (preserveExistingAuthStateOnNetworkError()) {
            return
          }
        }
        resetState()
        return
      }

      if (getUserErrorType === 'network') {
        if (hasValidSession()) {
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
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          if (preserveExistingAuthStateOnNetworkError()) {
            return
          }
        }
        resetState()
        return
      }

      if (empErrorType === 'network') {
        if (hasValidSession()) {
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
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          if (preserveExistingAuthStateOnNetworkError()) {
            return
          }
        }
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
      saveAuthCache(state.value)
      rescheduleFromCurrentToken()
    } catch {
      resetState()
      state.value.error = 'Không thể khởi tạo phiên đăng nhập'
      initialized = false
    }
  }

  function setupAuthListener() {
    if (authListenerUnsubscribe) return
    if (typeof window === 'undefined') return
    let handlingTokenRefresh = false
    let handlingSignedOut = false

    const handleSignedOutEvent = async () => {
      if (signingOut || isLogoutInProgress() || handlingSignedOut) return
      handlingSignedOut = true

      try {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          console.warn('[useAuth] SIGNED_OUT ignored — offline')
          return
        }

        if (hasValidSession()) {
          console.warn('[useAuth] SIGNED_OUT ignored — tokens preserved')
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

    const handleTokenRefreshedEvent = async () => {
      if (handlingTokenRefresh) return
      handlingTokenRefresh = true

      try {
        if (!hasValidSession()) {
          return
        }

        const { data: emp, errorType: empErrorType } = await authService.fetchCurrentEmployee()
        if (empErrorType === 'auth') {
          if (typeof navigator !== 'undefined' && !navigator.onLine) {
            console.warn('[useAuth] Token refreshed but offline — keeping session')
            return
          }
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
          if (typeof navigator !== 'undefined' && !navigator.onLine) {
            console.warn('[useAuth] Token refreshed but offline — keeping session')
            return
          }
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
        saveAuthCache(state.value)
      } finally {
        handlingTokenRefresh = false
      }
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key !== ACCESS_TOKEN_STORAGE_KEY) return

      if (event.newValue === null) {
        void handleSignedOutEvent()
        return
      }

      if (event.oldValue !== event.newValue) {
        void handleTokenRefreshedEvent()
      }
    }

    window.addEventListener('storage', onStorage)
    authListenerUnsubscribe = () => window.removeEventListener('storage', onStorage)
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

      lastResumeReinitAt = now

      const token = getAccessToken()
      if (!token) {
        return
      }

      const expiresAt = getTokenExpiry(token) ?? 0
      if (expiresAt <= now) {
        initialized = false
        void init()
        return
      }

      rescheduleFromCurrentToken()
    }

    document.addEventListener('visibilitychange', revalidateAuthOnResume)

    sessionResumeListenerCleanup = () => {
      document.removeEventListener('visibilitychange', revalidateAuthOnResume)
    }
  }

  function resetState() {
    clearAuthCache()
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
      saveAuthCache(state.value)

      snackbar.success('Đăng nhập thành công')

      if (data.employee.mustChangePassword) {
        tempPassword.value = credentials.password
      }

      resetLogoutFlag()
      setupAuthListener()
      setupSessionResumeListener()
      initialized = true
      rescheduleFromCurrentToken()

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
    cancelRefresh()
    verifiedPermissionsSnapshot = null
    try {
      try {
        await authService.signOut()
      } catch {
      }

      await clearAuthSessionLocal()
      clearAllCache()
      clearAuthCache()
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
