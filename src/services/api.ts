import { supabase } from '@/lib/supabase'
import type { Session, AuthError } from '@supabase/supabase-js'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

let refreshPromise: Promise<Session> | null = null
let isLoggingOut = false

function clearSupabaseTokens() {
  if (typeof window === 'undefined') return

  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('sb-') && key.includes('auth-token')) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key))
}

async function forceBackToLogin() {
  if (typeof window === 'undefined') return
  if (window.location.pathname !== '/login') {
    window.location.replace('/login')
  }
}

function isAuthError(error: AuthError): boolean {
  if (error.message?.includes('Auth session missing')) return true
  if (error.name === 'AuthSessionMissingError') return true
  const authErrorCodes = ['invalid_grant', 'refresh_token_revoked', 'refresh_token_already_used', 'session_not_found', 'session_expired', 'refresh_token_not_found', 'bad_jwt']
  return authErrorCodes.some(code =>
    error.message?.includes(code) || error.code === code
  )
}

export async function getRefreshedSession(): Promise<Session> {
  if (refreshPromise) {
    return refreshPromise
  }

  const doRefresh = async (): Promise<Session> => {
    try {
      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        if (isAuthError(error)) {
          await clearAuthSessionLocal()
          await forceBackToLogin()
          throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại')
        }
        throw new Error('Lỗi kết nối, vui lòng thử lại')
      }

      if (!data.session) {
        await clearAuthSessionLocal()
        await forceBackToLogin()
        throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại')
      }

      return data.session
    } finally {
      refreshPromise = null
    }
  }

  refreshPromise = doRefresh()
  return refreshPromise
}

export function resetLogoutFlag() {
  isLoggingOut = false
}

export function isLogoutInProgress(): boolean {
  return isLoggingOut
}

export async function clearAuthSessionLocal(): Promise<void> {
  isLoggingOut = true
  try {
    await supabase.auth.signOut({ scope: 'local' })
  } catch {
  } finally {
    clearSupabaseTokens()
  }
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const makeRequest = async (token?: string): Promise<T> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const data = await response.json()

      if (!response.ok) {
        throw new ApiError(response.status, (typeof data.error === 'string' ? data.error : data.message) || 'Đã xảy ra lỗi')
      }

      return data
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(408, 'Yêu cầu quá thời gian. Vui lòng thử lại')
      }
      throw error
    }
  }

  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  try {
    return await makeRequest(token)
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      const newSession = await getRefreshedSession()
      return await makeRequest(newSession.access_token)
    }
    throw error
  }
}
