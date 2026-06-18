import assert from 'node:assert/strict'
import { Hono } from 'hono'
import { pool } from '../db/pool'
import authRoutes from './auth'

process.env.JWT_SIGNING_SECRET = process.env.JWT_SIGNING_SECRET || 'test-secret-min-32-characters-long-aaaaaa'

interface FakeRow { [k: string]: unknown }

function makeApp() {
  const app = new Hono()
  app.route('/api/auth', authRoutes)
  return app
}

function callRefresh(app: Hono, refreshToken: string) {
  return app.request('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
}

async function testConcurrentRefreshDoesNotKillSession() {
  const original = pool.query
  const originalConnect = pool.connect

  const raw = 'concurrent-raw-token'
  let claimed = false

  const fakeClient = {
    query: (async (text: string, params?: unknown[]) => {
      if (text.includes('BEGIN') || text.includes('COMMIT') || text.includes('ROLLBACK')) {
        return { rows: [] }
      }
      if (/UPDATE auth_refresh_tokens[\s\S]*revoked_at = now\(\)[\s\S]*token_hash = \$1[\s\S]*RETURNING/i.test(text)) {
        if (claimed) return { rows: [] as FakeRow[] }
        claimed = true
        return { rows: [{ id: 'tok-1', employee_id: 17 }] }
      }
      if (text.includes('INSERT INTO auth_refresh_tokens')) {
        return { rows: [] }
      }
      if (/FROM employees WHERE id/i.test(text)) {
        return { rows: [{ id: 17, employee_id: 'NV017', is_active: true, deleted_at: null }] }
      }
      if (/FROM employee_roles/i.test(text)) {
        return { rows: [{ code: 'admin' }] }
      }
      return { rows: [] }
    }),
    release: () => {},
  }

  pool.connect = (async () => fakeClient) as unknown as typeof pool.connect
  pool.query = (async (text: string, params?: unknown[]) => {
    if (/SELECT[\s\S]*FROM employees WHERE id/i.test(text)) {
      return { rows: [{ id: 17, employee_id: 'NV017', is_active: true, deleted_at: null }] }
    }
    if (/FROM employee_roles/i.test(text)) {
      return { rows: [{ code: 'admin' }] }
    }
    if (/rotated_from/i.test(text)) {
      return { rows: [{ id: 'child-1' }] }
    }
    if (/SELECT[\s\S]*expires_at[\s\S]*revoked_at[\s\S]*FROM auth_refresh_tokens[\s\S]*WHERE token_hash/i.test(text)) {
      return { rows: [{ id: 'tok-1', employee_id: 17, expires_at: '2099-01-01T00:00:00Z', revoked_at: '2026-06-18T00:00:00Z' }] }
    }
    return { rows: [] }
  }) as unknown as typeof pool.query

  try {
    const app = makeApp()
    const [r1, r2] = await Promise.all([callRefresh(app, raw), callRefresh(app, raw)])
    const statuses = [r1.status, r2.status].sort()
    assert.ok(statuses.includes(200), 'ít nhất 1 request phải 200')
    assert.ok(!statuses.includes(500), 'không request nào được 500')
    for (const s of statuses) {
      assert.ok(s === 200 || s === 409, `status hợp lệ phải là 200/409, nhận ${s}`)
    }
  } finally {
    pool.query = original
    pool.connect = originalConnect
  }
}

await testConcurrentRefreshDoesNotKillSession()
console.log('auth.refresh concurrent test passed')
