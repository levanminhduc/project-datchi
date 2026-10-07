import assert from 'node:assert/strict'
import { Hono } from 'hono'
import coreRoutes from './core'
import { signWeeklyOrder } from '../../utils/weekly-order-approval-service'
import type { AppEnv } from '../../types/hono-env'
import { pool } from '../../db/pool'

interface StubOptions {
  leaderSignedBy: number | null
  failDeliveryInsert?: boolean
}

const SUMMARY_ROWS = [
  { thread_type_id: 7, supplier_id: 3, total_final: 12, thread_color: 'Đỏ', thread_color_code: '#f00' },
]

function buildApp() {
  const app = new Hono<AppEnv>()
  app.use('*', async (c, next) => {
    c.set('auth', {
      employeeId: 1,
      employeeCode: 'NV001',
      roles: ['warehouse'],
      isRoot: true,
      isAdmin: true,
      permissions: ['thread.allocations.manage'],
    })
    await next()
  })
  app.route('/', coreRoutes)
  return app
}

async function withStubbedPool(
  options: StubOptions,
  handler: (calls: string[]) => Promise<void>,
) {
  const calls: string[] = []
  const originalQuery = pool.query
  const originalConnect = pool.connect

  const respond = async (text: string) => {
    calls.push(text.trim())

    if (/FROM employee_roles/.test(text)) {
      return { rows: [{ role_code: 'root', perm_code: null }] }
    }
    if (/SELECT id, status, leader_signed_by FROM thread_order_weeks/.test(text)) {
      return { rows: [{ id: 42, status: 'CONFIRMED', leader_signed_by: options.leaderSignedBy }] }
    }
    if (/SELECT id, status FROM thread_order_weeks/.test(text)) {
      return { rows: [{ id: 42, status: 'CONFIRMED' }] }
    }
    if (/UPDATE thread_order_weeks/.test(text)) {
      return {
        rows: [
          {
            id: 42,
            week_name: 'Tuần 30',
            status: 'CONFIRMED',
            created_by: null,
            leader_signed_by: 1,
            leader_signed_at: new Date().toISOString(),
          },
        ],
      }
    }
    if (/SELECT summary_data FROM thread_order_results/.test(text)) {
      return { rows: [{ summary_data: SUMMARY_ROWS }] }
    }
    if (/INSERT INTO thread_order_deliveries/.test(text) && options.failDeliveryInsert) {
      throw new Error('insert deliveries failed')
    }
    return { rows: [] }
  }

  pool.query = (async (text: string) => respond(text)) as unknown as typeof pool.query
  pool.connect = (async () => ({
    query: (text: string) => respond(text),
    release: () => {},
  })) as unknown as typeof pool.connect

  try {
    await handler(calls)
  } finally {
    pool.query = originalQuery
    pool.connect = originalConnect
  }
}

const countOf = (calls: string[], pattern: RegExp) => calls.filter((text) => pattern.test(text)).length

async function testSignCreatesDeliveriesInsideTransaction() {
  await withStubbedPool({ leaderSignedBy: null }, async (calls) => {
    const result = await signWeeklyOrder({ weekId: 42, employeeId: 1 })

    assert.equal(result.week.id, 42)
    assert.equal(countOf(calls, /INSERT INTO thread_order_deliveries/), 1)

    const begin = calls.indexOf('BEGIN')
    const insert = calls.findIndex((text) => /INSERT INTO thread_order_deliveries/.test(text))
    const commit = calls.indexOf('COMMIT')
    assert.ok(begin >= 0 && begin < insert && insert < commit, 'tạo giao hàng phải nằm trong cùng transaction với bước ký')
  })
}

async function testSignRollsBackWhenSyncFails() {
  await withStubbedPool({ leaderSignedBy: null, failDeliveryInsert: true }, async (calls) => {
    await assert.rejects(() => signWeeklyOrder({ weekId: 42, employeeId: 1 }), /insert deliveries failed/)

    assert.equal(countOf(calls, /^ROLLBACK$/), 1)
    assert.equal(countOf(calls, /^COMMIT$/), 0)
  })
}

async function testSyncDeliveriesUnsignedCreatesNothing() {
  await withStubbedPool({ leaderSignedBy: null }, async (calls) => {
    const response = await buildApp().request('/42/sync-deliveries', { method: 'POST' })

    assert.equal(response.status, 200)
    const body = await response.json() as { data: { synced: boolean; awaiting_leader_sign?: boolean }; error: string | null }
    assert.deepEqual(body.data, { synced: false, awaiting_leader_sign: true })
    assert.equal(body.error, null)
    assert.equal(countOf(calls, /thread_order_deliveries/), 0)
  })
}

async function testSyncDeliveriesSignedCreatesDeliveries() {
  await withStubbedPool({ leaderSignedBy: 5 }, async (calls) => {
    const response = await buildApp().request('/42/sync-deliveries', { method: 'POST' })

    assert.equal(response.status, 200)
    const body = await response.json() as { data: { synced: boolean } }
    assert.deepEqual(body.data, { synced: true })
    assert.equal(countOf(calls, /INSERT INTO thread_order_deliveries/), 1)
  })
}

await testSignCreatesDeliveriesInsideTransaction()
await testSignRollsBackWhenSyncFails()
await testSyncDeliveriesUnsignedCreatesNothing()
await testSyncDeliveriesSignedCreatesDeliveries()
console.log('sync deliveries sign gate tests passed')
await pool.end()
