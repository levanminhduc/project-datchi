const BACKUP_KEY = 'sb-session-backup'
const BACKUP_TS_KEY = 'sb-session-backup-ts'
const BACKUP_MAX_AGE_MS = 604800 * 1000

let logoutAuthorized = false

export const protectedStorage = {
  getItem(key: string): string | null {
    return localStorage.getItem(key)
  },

  setItem(key: string, value: string): void {
    localStorage.setItem(key, value)
    if (key.includes('auth-token')) {
      localStorage.setItem(BACKUP_KEY, value)
      localStorage.setItem(BACKUP_TS_KEY, Date.now().toString())
    }
  },

  removeItem(key: string): void {
    if (!logoutAuthorized) {
      console.warn('[protectedStorage] removeItem blocked — logout not authorized')
      return
    }
    localStorage.removeItem(key)
  },
}

export function authorizeLogout(): void {
  logoutAuthorized = true
}

export function revokeLogout(): void {
  logoutAuthorized = false
}

export function getBackup(): { access_token: string; refresh_token: string } | null {
  const raw = localStorage.getItem(BACKUP_KEY)
  if (!raw) return null

  const tsRaw = localStorage.getItem(BACKUP_TS_KEY)
  if (tsRaw) {
    const age = Date.now() - Number(tsRaw)
    if (age > BACKUP_MAX_AGE_MS) {
      return null
    }
  }

  try {
    const parsed = JSON.parse(raw)
    const access_token = parsed?.access_token ?? parsed?.session?.access_token
    const refresh_token = parsed?.refresh_token ?? parsed?.session?.refresh_token
    if (!access_token || !refresh_token) return null
    return { access_token, refresh_token }
  } catch {
    return null
  }
}

export function clearAll(): void {
  const keysToRemove = Object.keys(localStorage).filter((k) => k.startsWith('sb-'))
  keysToRemove.forEach((k) => localStorage.removeItem(k))
  localStorage.removeItem(BACKUP_KEY)
  localStorage.removeItem(BACKUP_TS_KEY)
}
