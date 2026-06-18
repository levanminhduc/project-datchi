import assert from 'node:assert/strict'
import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { pool } from '../db/pool'
import type { AppEnv } from '../types/hono-env'
import authRoutes from './auth'

process.env.JWT_SIGNING_SECRET = process.env.JWT_SIGNING_SECRET || 'test-secret-min-32-characters-long-aaaaaa'

async function testRevokesRefreshTokensOnPasswordChange() {
  const original = pool.query
  const hash = await bcrypt.hash('OldPass123', 10)
  let revokeCalled = false
  let revokeEmployeeId: unknown = null

  pool.query = (async (text: string, params?: unknown[]) => {
    if (/SELECT password_hash, employee_id FROM employees/i.test(text)) {
      return { rows: [{ password_hash: hash, employee_id: 'NV017' }] }
    }
    if (/UPDATE employees SET password_hash/i.test(text)) {
      return { rows: [] }
    }
    if (/UPDATE auth_refresh_tokens SET revoked_at = now\(\)\s+WHERE employee_id/i.test(text)) {
      revokeCalled = true
      revokeEmployeeId = params?.[0]
      return { rows: [] }
    }
    return { rows: [] }
  }) as unknown as typeof pool.query

  try {
    const app = new Hono<AppEnv>()
    app.use('*', async (c, next) => {
      c.set('auth', {
        employeeId: 17,
        employeeCode: 'NV017',
        roles: [],
        isRoot: false,
        isAdmin: false,
        permissions: [],
      })
      await next()
    })
    app.route('/api/auth', authRoutes)

    const res = await app.request('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: 'OldPass123', newPassword: 'NewPass456' }),
    })

    assert.equal(res.status, 200)
    assert.ok(revokeCalled, 'phải revoke refresh token sau đổi mật khẩu')
    assert.equal(revokeEmployeeId, 17)
  } finally {
    pool.query = original
  }
}

await testRevokesRefreshTokensOnPasswordChange()
console.log('auth.change-password revoke test passed')
