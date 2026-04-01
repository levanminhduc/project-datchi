const BACKUP_KEY = 'sb-session-backup'

let logoutAuthorized = false

export const protectedStorage = {
  getItem(key: string): string | null {
    return localStorage.getItem(key)
  },

  setItem(key: string, value: string): void {
    localStorage.setItem(key, value)
    if (key.includes('auth-token')) {
      localStorage.setItem(BACKUP_KEY, value)
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
}
