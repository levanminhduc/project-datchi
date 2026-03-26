import { supabase } from '@/lib/supabase'
import { fetchApi, fetchApiRaw, ApiError, clearAuthSessionLocal } from './api'
import type {
  LoginCredentials,
  LoginResponse,
  EmployeeAuth,
  ChangePasswordData,
} from '@/types/auth'

interface AuthDataResponse<T> {
  data: T | null
  error?: boolean | string | null
  message?: string
}

interface AuthActionResponse {
  error?: boolean | string | null
  message?: string
  success?: boolean
}

export type AuthErrorType = 'auth' | 'network' | null

export interface FetchResult<T> {
  data: T | null
  errorType: AuthErrorType
}

const HAS_SESSION_TIMEOUT_MS = 3000

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T | null> {
  const timeout = new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), timeoutMs)
  })
  return Promise.race([promise, timeout])
}

class AuthService {
  async signIn(
    credentials: LoginCredentials
  ): Promise<{ data: LoginResponse | null; error: string | null }> {
    try {
      const email = `${credentials.employeeId.toLowerCase()}@internal.datchi.local`

      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: credentials.password,
      })

      if (signInError) {
        console.error('[authService] Supabase signIn error:', signInError.message)

        if (signInError.message === 'Invalid login credentials') {
          const ensured = await this.ensureAuthUser(credentials)
          if (ensured) {
            const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
              email,
              password: credentials.password,
            })
            if (!retryError && retryData?.session?.access_token) {
              const { data: employee, errorType } = await this.fetchCurrentEmployee()
              if (!employee) {
                await clearAuthSessionLocal()
                const msg = errorType === 'network'
                  ? 'Không thể kết nối đến máy chủ'
                  : 'Không thể lấy thông tin nhân viên'
                return { data: null, error: msg }
              }
              return { data: { employee }, error: null }
            }
          }
          return { data: null, error: 'Mã nhân viên hoặc mật khẩu không đúng' }
        }

        if (signInError.status === 400) {
          return { data: null, error: 'Thông tin đăng nhập không hợp lệ' }
        }

        return { data: null, error: signInError.message || 'Đăng nhập thất bại' }
      }

      // Verify we got a valid session
      if (!authData?.session?.access_token) {
        console.error('[authService] No session after signIn')
        return { data: null, error: 'Không thể tạo phiên đăng nhập' }
      }

      const { data: employee, errorType } = await this.fetchCurrentEmployee()
      if (!employee) {
        // Sign out if we can't fetch employee data
        await clearAuthSessionLocal()
        const msg = errorType === 'network'
          ? 'Không thể kết nối đến máy chủ'
          : 'Không thể lấy thông tin nhân viên'
        return { data: null, error: msg }
      }

      return { data: { employee }, error: null }
    } catch (err) {
      console.error('[authService] Sign in error:', err)
      return { data: null, error: 'Không thể kết nối đến máy chủ' }
    }
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut()
  }

  async fetchCurrentEmployee(): Promise<FetchResult<EmployeeAuth>> {
    try {
      const response = await fetchApi<AuthDataResponse<EmployeeAuth>>('/api/auth/me')
      if (response.error === true || !response.data) {
        return { data: null, errorType: 'auth' }
      }
      return { data: response.data, errorType: null }
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403 || err.status === 404)) {
        return { data: null, errorType: 'auth' }
      }
      return { data: null, errorType: 'network' }
    }
  }

  async fetchPermissions(): Promise<FetchResult<string[]>> {
    try {
      const response = await fetchApi<AuthDataResponse<string[]>>('/api/auth/permissions')
      if (response.error === true || !response.data) {
        return { data: null, errorType: 'auth' }
      }
      return { data: response.data, errorType: null }
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        return { data: null, errorType: 'auth' }
      }
      return { data: null, errorType: 'network' }
    }
  }

  async changePassword(data: ChangePasswordData): Promise<{ error: string | null }> {
    try {
      if (!(await this.hasSession())) {
        return { error: 'Phiên đăng nhập đã hết hạn' }
      }

      const response = await fetchApi<AuthActionResponse>('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      })

      if (response.error === true || typeof response.error === 'string') {
        return {
          error:
            response.message ||
            (typeof response.error === 'string' ? response.error : 'Đổi mật khẩu thất bại'),
        }
      }

      return { error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể kết nối đến máy chủ'
      return { error: message }
    }
  }

  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    return fetchApiRaw(url, options, {
      includeJsonContentType: typeof options.body === 'string',
    })
  }

  async hasSession(): Promise<boolean> {
    try {
      const result = await withTimeout(
        supabase.auth.getSession(),
        HAS_SESSION_TIMEOUT_MS
      )

      if (!result) {
        return false
      }

      const {
        data: { session },
      } = result

      return !!session?.access_token
    } catch {
      return false
    }
  }

  private async ensureAuthUser(credentials: LoginCredentials): Promise<boolean> {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || ''
      const res = await fetch(`${apiUrl}/api/auth/ensure-auth-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: credentials.employeeId,
          password: credentials.password,
        }),
      })
      if (!res.ok) return false
      const data = await res.json()
      return data.created === true
    } catch {
      return false
    }
  }
}

export const authService = new AuthService()
