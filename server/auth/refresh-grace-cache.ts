export const GRACE_WINDOW_MS = 30_000

interface GraceChild {
  token: string
  refreshToken: string
  expiresAt: number
}

interface GraceEntry extends GraceChild {
  recordedAt: number
}

const cache = new Map<string, GraceEntry>()

function purgeExpired(now: number): void {
  for (const [key, entry] of cache) {
    if (now - entry.recordedAt > GRACE_WINDOW_MS) {
      cache.delete(key)
    }
  }
}

export function recordRotation(oldTokenHash: string, child: GraceChild): void {
  const now = Date.now()
  purgeExpired(now)
  cache.set(oldTokenHash, { ...child, recordedAt: now })
}

export function getGraceChild(oldTokenHash: string): GraceChild | null {
  const now = Date.now()
  const entry = cache.get(oldTokenHash)
  if (!entry) return null
  if (now - entry.recordedAt > GRACE_WINDOW_MS) {
    cache.delete(oldTokenHash)
    return null
  }
  return { token: entry.token, refreshToken: entry.refreshToken, expiresAt: entry.expiresAt }
}
