import { Context, Next } from 'hono'
import { getConnInfo } from '@hono/node-server/conninfo'

interface RateLimitOptions {
  windowMs: number
  max: number
  message: string
}

interface Bucket {
  count: number
  resetAt: number
}

const MAX_TRACKED_IPS = 10_000

function getClientIp(c: Context): string {
  const forwarded = c.req.header('x-forwarded-for')
  if (forwarded) {
    const parts = forwarded.split(',')
    const last = parts[parts.length - 1]?.trim()
    if (last) return last
  }
  try {
    const address = getConnInfo(c).remote.address
    if (address) return address
  } catch {
    /* app.request() in tests has no socket */
  }
  return 'unknown'
}

export function rateLimit(options: RateLimitOptions) {
  const buckets = new Map<string, Bucket>()

  return async (c: Context, next: Next) => {
    const now = Date.now()

    if (buckets.size >= MAX_TRACKED_IPS) {
      for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(key)
      }
    }

    const ip = getClientIp(c)
    const bucket = buckets.get(ip)

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(ip, { count: 1, resetAt: now + options.windowMs })
      return next()
    }

    bucket.count++

    if (bucket.count > options.max) {
      c.header('Retry-After', String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))))
      return c.json({ error: true, message: options.message }, 429)
    }

    return next()
  }
}
