import assert from 'node:assert/strict'
import { Hono } from 'hono'
import coreRoutes from './core'
import type { AppEnv } from '../../types/hono-env'
import { pool } from '../../db/pool'

interface StubOptions {
  isRoot: boolean
  hasActiveUnlock: boolean
}

function buildApp(isRoot: boolean) {
  const app = new Hono<AppEnv>()
  app.use('*', async (c, next) => {
    c.set('auth', {
      employeeId: 1,
      employeeCode: isRoot ? 'ROOT001' : 'NV001',
      roles: isRoot ? ['root'] : ['warehouse'],
      isRoot,
      isAdmin: isRoot,
      permissions: ['thread.allocations.manage'],
    })
    await next()
  })
  app.route('/', coreRoutes)
  return app
}

async function withStubbedPool(
  options: StubOptions,
  handler: (calls: Array<{ text: string; params: unknown[] }>) => Promise<void>,
) {
  const calls: Array<{ text: string; params: unknown[] }> = []
  const originalQuery = pool.query

  pool.query = (async (text: string, params?: unknown[]) => {
    calls.push({ text, params: params ?? [] })

    if (text.includes('FROM weekly_order_edit_unlocks')) {
      return {
        rows: options.hasActiveUnlock
          ? [
              {
                id: 9,
                week_id: 42,
                granted_by: 'ROOT001',
                granted_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 30 * 60_000).toISOString(),
                revoked_at: null,
                revoked_by: null,
                reason: 'Sửa sai nhu cầu chỉ',
              },
            ]
          : [],
      }
    }
    if (/SELECT id, status FROM thread_order_weeks/.test(text)) {
      return { rows: [{ id: 42, status: 'CONFIRMED' }] }
    }
    if (/FROM thread_order_weeks w WHERE w\.id/.test(text)) {
      return { rows: [{ week_name: 'Tuần 30', start_date: null, end_date: null, notes: null, items_count: 3 }] }
    }
    if (/UPDATE thread_order_weeks SET/.test(text)) {
      return {
        rows: [
          { id: 42, week_name: 'Tuần 30 - 2026', status: 'CONFIRMED', start_date: null, end_date: null, notes: null },
        ],
      }
    }
    if (/FROM employees WHERE id/.test(text)) {
      return { rows: [{ full_name: 'Nguyễn Văn Root' }] }
    }
    return { rows: [] }
  }) as unknown as typeof pool.query

  const originalConnect = pool.connect
  pool.connect = (async () => ({
    query: (text: string, params?: unknown[]) => pool.query(text, params),
    release: () => {},
  })) as unknown as typeof pool.connect

  try {
    await handler(calls)
  } finally {
    pool.query = originalQuery
    pool.connect = originalConnect
  }
}

async function updateWeek(isRoot: boolean, hasActiveUnlock: boolean) {
  let response!: Response
  let auditCalls = 0

  await withStubbedPool({ isRoot, hasActiveUnlock }, async (calls) => {
    response = await buildApp(isRoot).request('/42', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week_name: 'Tuần 30 - 2026' }),
    })
    auditCalls = calls.filter((call) => call.text.includes('INSERT INTO thread_audit_log')).length
  })

  return { response, auditCalls }
}

async function testConfirmedWeekStaysLockedWithoutUnlock() {
  const { response, auditCalls } = await updateWeek(true, false)
  assert.equal(response.status, 400)
  const body = await response.json() as { error: string }
  assert.match(body.error, /trạng thái nháp/)
  assert.equal(auditCalls, 0)
}

async function testNonRootStaysLockedEvenWhenUnlocked() {
  const { response } = await updateWeek(false, true)
  assert.equal(response.status, 400, 'người không phải root vẫn bị chặn dù tuần đang mở')
}

async function testRootPassesWhenUnlockedAndIsAudited() {
  const { response, auditCalls } = await updateWeek(true, true)
  assert.equal(response.status, 200)
  assert.equal(auditCalls, 1, 'thao tác trong lúc mở khóa phải ghi nhật ký')
}

await testConfirmedWeekStaysLockedWithoutUnlock()
await testNonRootStaysLockedEvenWhenUnlocked()
await testRootPassesWhenUnlockedAndIsAudited()
console.log('core unlock guard tests passed')
await pool.end()
