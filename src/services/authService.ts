import { fetchApi, fetchApiRaw, ApiError, clearAuthSessionLocal } from './api'
import { setTokens, hasTokens } from '@/lib/auth-token-store'
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

interface LoginTokenData {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export type AuthErrorType = 'auth' | 'network' | null

export interface FetchResult<T> {
  data: T | null
  errorType: AuthErrorType
}

class AuthService {
  async signIn(
    credentials: LoginCredentials
  ): Promise<{ data: LoginResponse | null; error: string | null }> {
    try {
      let loginResponse: AuthDataResponse<LoginTokenData>
      try {
        loginResponse = await fetchApi<AuthDataResponse<LoginTokenData>>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            employeeId: credentials.employeeId,
            password: credentials.password,
          }),
        })
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.status === 401 || err.status === 400) {
            return { data: null, error: err.message || 'Mã nhân viên hoặc mật khẩu không đúng' }
          }
          if (err.status === 423) {
            return { data: null, error: err.message || 'Tài khoản đã bị khóa tạm thời' }
          }
          return { data: null, error: err.message || 'Đăng nhập thất bại' }
        }
        return { data: null, error: 'Không thể kết nối đến máy chủ' }
      }

      const tokens = loginResponse.data
      if (!tokens?.accessToken || !tokens?.refreshToken) {
        return { data: null, error: 'Không thể tạo phiên đăng nhập' }
      }

      setTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken })

      const { data: employee, errorType } = await this.fetchCurrentEmployee()
      if (!employee) {
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
    await clearAuthSessionLocal()
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
    return hasTokens()
  }
}

export const authService = new AuthService()
