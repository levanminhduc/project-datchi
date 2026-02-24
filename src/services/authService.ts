import { supabase } from '@/lib/supabase'
import type {
  LoginCredentials,
  LoginResponse,
  EmployeeAuth,
  ChangePasswordData,
} from '@/types/auth'

const API_URL = import.meta.env.VITE_API_URL || ''

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
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return null

      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) return null

      const { data } = await response.json()
      return data as EmployeeAuth
    } catch {
      return null
    }
  }

  async fetchPermissions(): Promise<string[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return []

      const response = await fetch(`${API_URL}/api/auth/permissions`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) return []

      const { data } = await response.json()
      return data as string[]
    } catch {
      return []
    }
  }

  async changePassword(data: ChangePasswordData): Promise<{ error: string | null }> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        return { error: 'Phiên đăng nhập đã hết hạn' }
      }

      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        return { error: result.message || 'Đổi mật khẩu thất bại' }
      }

      return { error: null }
    } catch {
      return { error: 'Không thể kết nối đến máy chủ' }
    }
  }

  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })
  }

  async hasSession(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession()
    return !!session?.access_token
  }
}

export const authService = new AuthService()
