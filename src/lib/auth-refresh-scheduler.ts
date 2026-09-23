import { getAccessToken, getTokenExpiry } from './auth-token-store'
import { getRefreshedAccessToken } from '@/services/api'

const REFRESH_BUFFER_MS = 60_000

let refreshTimer: ReturnType<typeof setTimeout> | null = null

export function scheduleRefresh(expiresAtSeconds: number): void {
  cancelRefresh()
  const delay = expiresAtSeconds * 1000 - Date.now() - REFRESH_BUFFER_MS
  if (delay <= 0) {
    void doRefresh()
    return
  }
  refreshTimer = setTimeout(() => void doRefresh(), delay)
}

export function cancelRefresh(): void {
  if (refreshTimer !== null) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }
}

export function rescheduleFromCurrentToken(): void {
  const token = getAccessToken()
  if (!token) {
    cancelRefresh()
    return
  }
  const expiresAtMs = getTokenExpiry(token)
  if (!expiresAtMs) {
    cancelRefresh()
    return
  }
  scheduleRefresh(Math.floor(expiresAtMs / 1000))
}

async function doRefresh(): Promise<void> {
  try {
    await getRefreshedAccessToken()
    rescheduleFromCurrentToken()
  } catch {
    // Refresh failed — don't reschedule.
    // Visibility handler or next fetchApi call will handle it.
  }
}
