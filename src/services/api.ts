import { supabase } from '@/lib/supabase'
import type { Session, AuthError } from '@supabase/supabase-js'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''
const REQUEST_TIMEOUT_MS = 10000

type RequestOptions = RequestInit & {
  headers?: HeadersInit
}

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

function resolveRequestUrl(endpointOrUrl: string): string {
  if (endpointOrUrl.startsWith('http://') || endpointOrUrl.startsWith('https://')) {
    return endpointOrUrl
  }
  return `${API_BASE_URL}${endpointOrUrl}`
}

function buildRequestHeaders(
  headers: HeadersInit | undefined,
  token: string | undefined,
  includeJsonContentType: boolean
): Headers {
  const mergedHeaders = new Headers(headers)

  if (includeJsonContentType && !mergedHeaders.has('Content-Type')) {
    mergedHeaders.set('Content-Type', 'application/json')
  }

  if (token && !mergedHeaders.has('Authorization')) {
    mergedHeaders.set('Authorization', `Bearer ${token}`)
  }

  return mergedHeaders
}

function getErrorMessageFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const record = payload as Record<string, unknown>

  if (typeof record.error === 'string' && record.error.trim()) {
    return record.error
  }
  if (typeof record.message === 'string' && record.message.trim()) {
    return record.message
  }
  return null
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

export async function fetchApiRaw(
  endpointOrUrl: string,
  options: RequestOptions = {},
  config: { includeJsonContentType?: boolean } = {}
): Promise<Response> {
  const url = resolveRequestUrl(endpointOrUrl)
  const includeJsonContentType = config.includeJsonContentType ?? false

  const makeRequest = async (token?: string): Promise<Response> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const headers = buildRequestHeaders(
        options.headers,
        token,
        includeJsonContentType
      )

      return await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      })
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(408, 'Yêu cầu quá thời gian. Vui lòng thử lại')
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token

  const response = await makeRequest(token)
  if (response.status === 401) {
    const newSession = await getRefreshedSession()
    return makeRequest(newSession.access_token)
  }

  return response
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const response = await fetchApiRaw(endpoint, options, {
    includeJsonContentType: true,
  })

  let payload: unknown = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      getErrorMessageFromPayload(payload) || 'Đã xảy ra lỗi'
    )
  }

  return payload as T
}
