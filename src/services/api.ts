import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { isAuthError } from './auth-error-utils'

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

const CROSS_TAB_CHANNEL_NAME = 'datchi-auth-refresh'
const CROSS_TAB_WAIT_MS = 500

type RefreshMessage = { type: 'REFRESH_START' } | { type: 'REFRESH_DONE' }

let refreshChannel: BroadcastChannel | null = null
let otherTabRefreshing = false

function getRefreshChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null
  if (!refreshChannel) {
    refreshChannel = new BroadcastChannel(CROSS_TAB_CHANNEL_NAME)
    refreshChannel.onmessage = (event: MessageEvent<RefreshMessage>) => {
      if (event.data.type === 'REFRESH_START') {
        otherTabRefreshing = true
      }
      if (event.data.type === 'REFRESH_DONE') {
        otherTabRefreshing = false
      }
    }
  }
  return refreshChannel
}

async function waitForOtherTabRefresh(): Promise<Session | null> {
  await new Promise(r => setTimeout(r, CROSS_TAB_WAIT_MS))
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

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

export async function getRefreshedSession(): Promise<Session> {
  if (refreshPromise) {
    return refreshPromise
  }

  if (otherTabRefreshing) {
    const session = await waitForOtherTabRefresh()
    if (session) return session
  }

  const doRefresh = async (): Promise<Session> => {
    const channel = getRefreshChannel()
    try {
      channel?.postMessage({ type: 'REFRESH_START' } satisfies RefreshMessage)

      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        if (isAuthError(error)) {
          await clearAuthSessionLocal()
          throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại')
        }
        throw new Error('Lỗi kết nối, vui lòng thử lại')
      }

      if (!data.session) {
        await clearAuthSessionLocal()
        throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại')
      }

      return data.session
    } finally {
      channel?.postMessage({ type: 'REFRESH_DONE' } satisfies RefreshMessage)
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

const TOKEN_REFRESH_BUFFER_MS = 60_000

function isTokenExpiringSoon(token: string): boolean {
  try {
    const payloadB64 = token.split('.')[1]
    if (!payloadB64) return false
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')))
    if (typeof payload.exp !== 'number') return false
    return (payload.exp * 1000) - Date.now() < TOKEN_REFRESH_BUFFER_MS
  } catch {
    return false
  }
}

export async function fetchApiRaw(
  endpointOrUrl: string,
  options: RequestOptions = {},
  config: { includeJsonContentType?: boolean; timeout?: number } = {}
): Promise<Response> {
  const url = resolveRequestUrl(endpointOrUrl)
  const includeJsonContentType = config.includeJsonContentType ?? false
  const timeoutMs = config.timeout ?? REQUEST_TIMEOUT_MS

  const makeRequest = async (token?: string): Promise<Response> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

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
  let token = session?.access_token

  if (token && isTokenExpiringSoon(token)) {
    try {
      const refreshed = await getRefreshedSession()
      token = refreshed.access_token
    } catch {
    }
  }

  const response = await makeRequest(token)

  if (response.status === 503) {
    await new Promise(r => setTimeout(r, 1500))
    const retryResponse = await makeRequest(token)
    if (retryResponse.status === 503) {
      throw new ApiError(503, 'Hệ thống đang tải, vui lòng thử lại sau')
    }
    return retryResponse
  }

  if (response.status === 401) {
    if (!token) {
      await forceBackToLogin()
      throw new ApiError(401, 'Vui lòng đăng nhập')
    }
    const newSession = await getRefreshedSession()
    const retriedResponse = await makeRequest(newSession.access_token)

    if (retriedResponse.status === 401) {
      await new Promise(r => setTimeout(r, 2000))
      const finalResponse = await makeRequest(newSession.access_token)

      if (finalResponse.status === 401) {
        await clearAuthSessionLocal()
        await forceBackToLogin()
        throw new ApiError(401, 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại')
      }

      return finalResponse
    }

    return retriedResponse
  }

  return response
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestOptions = {},
  config?: { timeout?: number }
): Promise<T> {
  const response = await fetchApiRaw(endpoint, options, {
    includeJsonContentType: true,
    timeout: config?.timeout,
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
