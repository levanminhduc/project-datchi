// src/services/authService.ts

import type {
  LoginCredentials,
  LoginResponse,
  RefreshTokenResponse,
  EmployeeAuth,
  ChangePasswordData,
} from '@/types/auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Token storage keys
const ACCESS_TOKEN_KEY = 'auth_access_token'
const REFRESH_TOKEN_KEY = 'auth_refresh_token'

class AuthService {
  private refreshPromise: Promise<string | null> | null = null

  /**
   * Sign in with employee_id and password
   */
  async signIn(
    credentials: LoginCredentials
  ): Promise<{ data: LoginResponse | null; error: string | null }> {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: credentials.employeeId,
          password: credentials.password,
        }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        return { data: null, error: result.message || 'Đăng nhập thất bại' }
      }

      // Store tokens
      this.setTokens(result.data.accessToken, result.data.refreshToken)

      return { data: result.data, error: null }
    } catch (err) {
      console.error('Sign in error:', err)
      return { data: null, error: 'Không thể kết nối đến máy chủ' }
    }
  }

  /**
   * Sign out - clear tokens and call backend to invalidate refresh token
   */
  async signOut(): Promise<void> {
    try {
      const token = this.getAccessToken()
      const refreshToken = this.getRefreshToken()

      if (token) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        })
      }
    } catch {
      // Ignore errors on logout
    } finally {
      this.clearTokens()
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<string | null> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = this._doRefresh()
    const result = await this.refreshPromise
    this.refreshPromise = null
    return result
  }

  private async _doRefresh(): Promise<string | null> {
    const refreshToken = this.getRefreshToken()

    if (!refreshToken) {
      return null
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) {
        this.clearTokens()
        return null
      }

      const result = await response.json()
      const data = result.data as RefreshTokenResponse

      localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken)
      return data.accessToken
    } catch {
      this.clearTokens()
      return null
    }
  }

  /**
   * Get current employee profile from token
   */
  async fetchCurrentEmployee(): Promise<EmployeeAuth | null> {
    try {
      const response = await this.authenticatedFetch(`${API_URL}/api/auth/me`)

      if (!response.ok) {
        return null
      }

      const { data } = await response.json()
      return data as EmployeeAuth
    } catch {
      return null
    }
  }

  /**
   * Fetch employee's permissions
   */
  async fetchPermissions(): Promise<string[]> {
    try {
      const response = await this.authenticatedFetch(`${API_URL}/api/auth/permissions`)

      if (!response.ok) return []

      const { data } = await response.json()
      return data as string[]
    } catch {
      return []
    }
  }

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordData): Promise<{ error: string | null }> {
    try {
      const response = await this.authenticatedFetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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

  /**
   * Authenticated fetch with automatic token refresh
   */
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    let token = this.getAccessToken()

    const makeRequest = (accessToken: string | null) => {
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      })
    }

    let response = await makeRequest(token)

    // If 401, try to refresh token and retry
    if (response.status === 401 && this.getRefreshToken()) {
      const newToken = await this.refreshAccessToken()
      if (newToken) {
        response = await makeRequest(newToken)
      }
    }

    return response
  }

  // Token management
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  }

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }

  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }

  hasTokens(): boolean {
    return !!this.getAccessToken()
  }
}

export const authService = new AuthService()
