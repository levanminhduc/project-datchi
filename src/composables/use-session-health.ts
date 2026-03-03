import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { fetchApi, ApiError } from '@/services/api'
import { useSnackbar } from './useSnackbar'

const VALIDATION_COOLDOWN_MS = 30000
const SPINNER_DELAY_MS = 800
const VALIDATION_TIMEOUT_MS = 10000

interface AuthHealthResponse {
  data: { employeeId: number; valid: boolean } | null
  error: boolean
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage))
    }, timeoutMs)

    promise.then(
      (result) => {
        clearTimeout(timeoutId)
        resolve(result)
      },
      (error) => {
        clearTimeout(timeoutId)
        reject(error)
      }
    )
  })
}

export function useSessionHealth() {
  const router = useRouter()
  const snackbar = useSnackbar()

  const sessionReady = ref(false)
  const isValidating = ref(true)
  const showSpinner = ref(false)

  let lastValidationTime = 0
  let spinnerTimeout: ReturnType<typeof setTimeout> | null = null
  let validationPromise: Promise<void> | null = null

  function startValidation() {
    isValidating.value = true
    showSpinner.value = false

    if (spinnerTimeout) {
      clearTimeout(spinnerTimeout)
    }

    spinnerTimeout = setTimeout(() => {
      if (isValidating.value) {
        showSpinner.value = true
      }
    }, SPINNER_DELAY_MS)
  }

  function finishValidation() {
    isValidating.value = false
    showSpinner.value = false
    if (spinnerTimeout) {
      clearTimeout(spinnerTimeout)
      spinnerTimeout = null
    }
  }

  async function validateSession(): Promise<void> {
    if (validationPromise) {
      return validationPromise
    }

    const now = Date.now()

    if (now - lastValidationTime < VALIDATION_COOLDOWN_MS && sessionReady.value) {
      finishValidation()
      return
    }

    const currentPath = router.currentRoute.value.path
    if (currentPath === '/login') {
      sessionReady.value = true
      finishValidation()
      return
    }

    validationPromise = (async () => {
      startValidation()

      try {
        const {
          data: { session },
        } = await withTimeout(
          supabase.auth.getSession(),
          VALIDATION_TIMEOUT_MS,
          'SESSION_TIMEOUT'
        )

        if (!session) {
          sessionReady.value = true
          return
        }

        const response = await withTimeout(
          fetchApi<AuthHealthResponse>('/api/auth/health'),
          VALIDATION_TIMEOUT_MS,
          'HEALTH_TIMEOUT'
        )

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
        if (err instanceof Error && err.message.endsWith('TIMEOUT')) {
          console.error('Session validation timeout:', err.message)
          snackbar.error('Không thể kiểm tra phiên đăng nhập. Vui lòng thử lại.')
          sessionReady.value = true
          return
        }
        console.error('Session validation error:', err)
        snackbar.error('Lỗi kiểm tra phiên đăng nhập')
        sessionReady.value = true
      } finally {
        lastValidationTime = Date.now()
        finishValidation()
      }
    })()

    try {
      await validationPromise
    } finally {
      validationPromise = null
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
    finishValidation()
  })

  return {
    sessionReady,
    showSpinner,
    validateSession,
  }
}
