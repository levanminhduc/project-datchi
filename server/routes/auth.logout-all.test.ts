import assert from 'node:assert/strict'
import { Hono } from 'hono'
import { pool } from '../db/pool'
import type { AppEnv } from '../types/hono-env'
import authRoutes from './auth'

process.env.JWT_SIGNING_SECRET = process.env.JWT_SIGNING_SECRET || 'test-secret-min-32-characters-long-aaaaaa'

async function testRevokesAllForCallingEmployee() {
  const original = pool.query
  let revokedEmployeeId: unknown = null

  pool.query = (async (text: string, params?: unknown[]) => {
    if (/UPDATE auth_refresh_tokens SET revoked_at = now\(\)\s+WHERE employee_id/i.test(text)) {
      revokedEmployeeId = params?.[0]
      return { rows: [] }
    }
    return { rows: [] }
  }) as unknown as typeof pool.query

  try {
    const app = new Hono<AppEnv>()
    app.use('*', async (c, next) => {
      c.set('auth', {
        employeeId: 42,
        employeeCode: 'NV042',
        roles: [],
        isRoot: false,
        isAdmin: false,
        permissions: [],
      })
      await next()
    })
    app.route('/api/auth', authRoutes)

    const res = await app.request('/api/auth/logout-all-devices', { method: 'POST' })
    assert.equal(res.status, 200)
    assert.equal(revokedEmployeeId, 42)
  } finally {
    pool.query = original
  }
}

await testRevokesAllForCallingEmployee()
console.log('auth.logout-all test passed')
