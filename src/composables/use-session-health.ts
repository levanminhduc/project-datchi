import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { fetchApi, ApiError } from '@/services/api'
import { useSnackbar } from './useSnackbar'

const VALIDATION_COOLDOWN_MS = 30000
const SPINNER_DELAY_MS = 800

interface AuthHealthResponse {
  data: { employeeId: number; valid: boolean } | null
  error: boolean
}

export function useSessionHealth() {
  const router = useRouter()
  const snackbar = useSnackbar()

  const sessionReady = ref(false)
  const isValidating = ref(true)
  const showSpinner = ref(false)

  let lastValidationTime = 0
  let spinnerTimeout: ReturnType<typeof setTimeout> | null = null

  async function validateSession(): Promise<void> {
    const now = Date.now()

    if (now - lastValidationTime < VALIDATION_COOLDOWN_MS && sessionReady.value) {
      return
    }

    const currentPath = router.currentRoute.value.path
    if (currentPath === '/login') {
      sessionReady.value = true
      return
    }

    isValidating.value = true

    spinnerTimeout = setTimeout(() => {
      if (isValidating.value) {
        showSpinner.value = true
      }
    }, SPINNER_DELAY_MS)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        sessionReady.value = true
        return
      }

      const response = await fetchApi<AuthHealthResponse>('/api/auth/health')

      if (!response.data?.valid) {
        snackbar.error('Phiên đăng nhập đã hết hạn')
        await router.push('/login')
        sessionReady.value = true
        return
      }

      sessionReady.value = true
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        snackbar.error('Phiên đăng nhập đã hết hạn')
        await router.push('/login')
        sessionReady.value = true
        return
      }
      console.error('Session validation error:', err)
      snackbar.error('Lỗi kiểm tra phiên đăng nhập')
      sessionReady.value = true
    } finally {
      lastValidationTime = Date.now()
      isValidating.value = false
      showSpinner.value = false
      if (spinnerTimeout) {
        clearTimeout(spinnerTimeout)
        spinnerTimeout = null
      }
    }
  }

  async function handleVisibilityChange(): Promise<void> {
    if (document.visibilityState === 'visible') {
      await validateSession()
    }
  }

  onMounted(async () => {
    await validateSession()
    document.addEventListener('visibilitychange', handleVisibilityChange)
  })

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    if (spinnerTimeout) {
      clearTimeout(spinnerTimeout)
    }
  })

  return {
    sessionReady,
    showSpinner,
    validateSession,
  }
}
