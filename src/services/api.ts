import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  isTokenExpiringSoon,
} from '@/lib/auth-token-store'
import { scheduleRefresh } from '@/lib/auth-refresh-scheduler'

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

export class SessionExpiredError extends Error {
  constructor() {
    super('Phiên đăng nhập đã hết hạn')
    this.name = 'SessionExpiredError'
  }
}

export class NetworkError extends Error {
  constructor() {
    super('Network unavailable')
    this.name = 'NetworkError'
  }
}

const WAIT_FOR_NETWORK_TIMEOUT_MS = 300_000

function waitForNetwork(timeoutMs = WAIT_FOR_NETWORK_TIMEOUT_MS): Promise<void> {
  if (navigator.onLine) return Promise.resolve()

  return new Promise<void>((resolve, reject) => {
    const onOnline = () => {
      clearTimeout(timer)
      window.removeEventListener('online', onOnline)
      resolve()
    }

    const timer = setTimeout(() => {
      window.removeEventListener('online', onOnline)
      reject(new ApiError(503, 'Mất kết nối quá lâu, vui lòng kiểm tra mạng'))
    }, timeoutMs)

    window.addEventListener('online', onOnline)
  })
}

let refreshPromise: Promise<string> | null = null
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

async function waitForOtherTabRefresh(): Promise<string | null> {
  await new Promise(r => setTimeout(r, CROSS_TAB_WAIT_MS))
  const token = getAccessToken()
  if (token && !isTokenExpiringSoon(token)) return token
  return null
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

interface RefreshResponseData {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

async function requestTokenRefresh(refreshToken: string): Promise<RefreshResponseData> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new NetworkError()
    }
    if (error instanceof TypeError) {
      throw new NetworkError()
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new SessionExpiredError()
    }
    throw new Error(getErrorMessageFromPayload(payload) || 'Lỗi khi làm mới phiên')
  }

  const data = (payload as { data?: RefreshResponseData } | null)?.data
  if (!data?.accessToken || !data?.refreshToken) {
    throw new SessionExpiredError()
  }
  return data
}

export async function getRefreshedAccessToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise
  }

  if (otherTabRefreshing) {
    const token = await waitForOtherTabRefresh()
    if (token) return token
  }

  const doRefresh = async (): Promise<string> => {
    const channel = getRefreshChannel()
    try {
      channel?.postMessage({ type: 'REFRESH_START' } satisfies RefreshMessage)

      const currentToken = getAccessToken()
      if (currentToken && !isTokenExpiringSoon(currentToken)) {
        return currentToken
      }

      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        throw new SessionExpiredError()
      }

      try {
        const data = await requestTokenRefresh(refreshToken)
        setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken })
        scheduleRefresh(data.expiresAt)
        return data.accessToken
      } catch (error) {
        if (error instanceof SessionExpiredError) {
          if (!navigator.onLine) {
            throw new NetworkError()
          }
          throw error
        }
        if (error instanceof NetworkError) {
          throw error
        }
        if (!navigator.onLine) {
          throw new NetworkError()
        }
        throw error
      }
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
  const refreshToken = getRefreshToken()
  try {
    if (refreshToken) {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {})
    }
  } finally {
    clearTokens()
  }
}

async function forceBackToLogin() {
  if (typeof window === 'undefined') return
  if (window.location.pathname !== '/login') {
    window.location.replace('/login')
  }
}


export async function fetchApiRaw(
  endpointOrUrl: string,
  options: RequestOptions = {},
  config: { includeJsonContentType?: boolean; timeout?: number; retryOnNetworkError?: boolean } = {}
): Promise<Response> {
  const url = resolveRequestUrl(endpointOrUrl)
  const includeJsonContentType = config.includeJsonContentType ?? false
  const timeoutMs = config.timeout ?? REQUEST_TIMEOUT_MS
  const method = (options.method || 'GET').toUpperCase()
  const IDEMPOTENT_METHODS = ['GET', 'PUT', 'DELETE']
  const shouldRetryNetwork = config.retryOnNetworkError || IDEMPOTENT_METHODS.includes(method)
  const NETWORK_RETRY_DELAYS = [1000, 3000]

  const makeRequest = async (token?: string): Promise<Response> => {
    const doFetch = async (): Promise<Response> => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

      const externalSignal = options.signal
      if (externalSignal) {
        if (externalSignal.aborted) {
          controller.abort()
        } else {
          externalSignal.addEventListener('abort', () => controller.abort(), { once: true })
        }
      }

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

    try {
      return await doFetch()
    } catch (error) {
      if (error instanceof ApiError) throw error

      if (error instanceof TypeError && shouldRetryNetwork) {
        if (!navigator.onLine) {
          await waitForNetwork()
          try {
            return await doFetch()
          } catch (retryError) {
            if (retryError instanceof ApiError) throw retryError
            if (!(retryError instanceof TypeError)) throw retryError
          }
        }

        for (const delay of NETWORK_RETRY_DELAYS) {
          await new Promise(r => setTimeout(r, delay))
          if (!navigator.onLine) {
            await waitForNetwork()
          }
          try {
            return await doFetch()
          } catch (retryError) {
            if (retryError instanceof ApiError) throw retryError
            if (!(retryError instanceof TypeError)) throw retryError
          }
        }
      }

      if (error instanceof TypeError) {
        throw new ApiError(
          503,
          navigator.onLine
            ? 'Lỗi kết nối, vui lòng thử lại'
            : 'Mất kết nối mạng, vui lòng thử lại khi có mạng'
        )
      }

      throw error
    }
  }

  let token = getAccessToken() ?? undefined

  if (token && isTokenExpiringSoon(token) && !isLoggingOut) {
    try {
      token = await getRefreshedAccessToken()
    } catch {
    }
  }

  const response = await makeRequest(token)

  if (response.status === 502 || response.status === 503) {
    await new Promise(r => setTimeout(r, 1500))
    const retryResponse = await makeRequest(token)
    if (retryResponse.status === 502 || retryResponse.status === 503) {
      throw new ApiError(response.status, 'Hệ thống đang tải, vui lòng thử lại sau')
    }
    return retryResponse
  }

  if (response.status === 401) {
    if (!token) {
      await forceBackToLogin()
      throw new ApiError(401, 'Vui lòng đăng nhập')
    }

    try {
      const newToken = await getRefreshedAccessToken()
      const retriedResponse = await makeRequest(newToken)

      if (retriedResponse.status === 401) {
        throw new ApiError(
          401,
          getErrorMessageFromPayload(await retriedResponse.json().catch(() => null)) || 'Không có quyền truy cập'
        )
      }

      return retriedResponse
    } catch (refreshError) {
      if (refreshError instanceof ApiError) {
        throw refreshError
      }
      if (refreshError instanceof SessionExpiredError) {
        if (!navigator.onLine) {
          throw new ApiError(503, 'Mất kết nối mạng, vui lòng thử lại khi có mạng')
        }
        await clearAuthSessionLocal()
        await forceBackToLogin()
        throw new ApiError(401, 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại')
      }
      if (refreshError instanceof NetworkError) {
        throw new ApiError(503, 'Mất kết nối mạng, vui lòng thử lại khi có mạng')
      }
      throw new ApiError(503, 'Lỗi kết nối, vui lòng thử lại')
    }
  }

  return response
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestOptions = {},
  config?: { timeout?: number; retryOnNetworkError?: boolean }
): Promise<T> {
  const response = await fetchApiRaw(endpoint, options, {
    includeJsonContentType: true,
    timeout: config?.timeout,
    retryOnNetworkError: config?.retryOnNetworkError,
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
