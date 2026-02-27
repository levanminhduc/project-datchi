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
          if (!isLoggingOut) {
            isLoggingOut = true
            supabase.auth.signOut({ scope: 'local' })
          }
          throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại')
        }
        throw new Error('Lỗi kết nối, vui lòng thử lại')
      }

      if (!data.session) {
        if (!isLoggingOut) {
          isLoggingOut = true
          supabase.auth.signOut({ scope: 'local' })
        }
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
