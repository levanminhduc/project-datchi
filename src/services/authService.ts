import { supabase } from '@/lib/supabase'
import { fetchApi, fetchApiRaw } from './api'
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

class AuthService {
  async signIn(
    credentials: LoginCredentials
  ): Promise<{ data: LoginResponse | null; error: string | null }> {
    try {
      const email = `${credentials.employeeId.toLowerCase()}@internal.datchi.local`

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: credentials.password,
      })

      if (signInError) {
        if (signInError.message === 'Invalid login credentials') {
          return { data: null, error: 'Mã nhân viên hoặc mật khẩu không đúng' }
        }
        return { data: null, error: signInError.message || 'Đăng nhập thất bại' }
      }

      const employee = await this.fetchCurrentEmployee()
      if (!employee) {
        return { data: null, error: 'Không thể lấy thông tin nhân viên' }
      }

      return { data: { employee }, error: null }
    } catch (err) {
      console.error('Sign in error:', err)
      return { data: null, error: 'Không thể kết nối đến máy chủ' }
    }
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut()
  }

  async fetchCurrentEmployee(): Promise<EmployeeAuth | null> {
    try {
      const response = await fetchApi<AuthDataResponse<EmployeeAuth>>('/api/auth/me')
      if (response.error === true || !response.data) return null
      return response.data
    } catch {
      return null
    }
  }

  async fetchPermissions(): Promise<string[] | null> {
    try {
      const response = await fetchApi<AuthDataResponse<string[]>>('/api/auth/permissions')
      if (response.error === true || !response.data) return null
      return response.data
    } catch {
      return null
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
    const { data: { session } } = await supabase.auth.getSession()
    return !!session?.access_token
  }
}

export const authService = new AuthService()
