export const ACCESS_TOKEN_KEY = 'datchi-access-token'
export const REFRESH_TOKEN_KEY = 'datchi-refresh-token'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  } catch {
    return null
  }
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setTokens(tokens: AuthTokens): void {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
  } catch {
    /* quota exceeded */
  }
}

export function clearTokens(): void {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

export function hasTokens(): boolean {
  return !!getAccessToken() && !!getRefreshToken()
}

const TOKEN_REFRESH_BUFFER_MS = 60_000

export function isTokenExpiringSoon(token: string): boolean {
  try {
    const payloadB64 = token.split('.')[1]
    if (!payloadB64) return false
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')))
    if (typeof payload.exp !== 'number') return false
    return payload.exp * 1000 - Date.now() < TOKEN_REFRESH_BUFFER_MS
  } catch {
    return false
  }
}

export function getTokenExpiry(token: string): number | null {
  try {
    const payloadB64 = token.split('.')[1]
    if (!payloadB64) return null
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')))
    if (typeof payload.exp !== 'number') return null
    return payload.exp * 1000
  } catch {
    return null
  }
}
