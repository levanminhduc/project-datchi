import assert from 'node:assert/strict'
import { Hono } from 'hono'
import stockAdjustRoutes from './stock-adjust'
import type { AppEnv } from '../../types/hono-env'
import { pool } from '../../db/pool'

interface StubOptions {
  isRoot: boolean
  hasActiveUnlock: boolean
  eligibleCones?: number
  lockedCones?: number
  logRevertedAt?: string | null
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
  app.route('/', stockAdjustRoutes)
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
                reason: 'Kiểm kê lại tồn kho',
              },
            ]
          : [],
      }
    }
    if (text.includes('FROM delivery_receive_logs')) {
      return {
        rows: [
          {
            id: 7,
            delivery_id: 55,
            week_id: 42,
            quantity: 10,
            reverted_at: options.logRevertedAt ?? null,
          },
        ],
      }
    }
    if (text.includes('FROM thread_inventory')) {
      return {
        rows: [
          {
            eligible_cones: options.eligibleCones ?? 10,
            locked_cones: options.lockedCones ?? 0,
          },
        ],
      }
    }
    if (text.includes('fn_write_off_week_cones')) {
      return { rows: [{ result: { success: true, written_off: 2, cone_ids: [101, 102] } }] }
    }
    if (text.includes('fn_revert_delivery_receive')) {
      return {
        rows: [{ result: { success: true, week_id: 42, delivery_id: 55, reverted_quantity: 10, written_off: 10 } }],
      }
    }
    return { rows: [] }
  }) as unknown as typeof pool.query

  try {
    await handler(calls)
  } finally {
    pool.query = originalQuery
  }
}

async function adjustStock(options: StubOptions, actualCones: number) {
  let response!: Response
  let rpcCalls = 0
  let auditCalls = 0
  let rpcParams: unknown[] = []

  await withStubbedPool(options, async (calls) => {
    response = await buildApp(options.isRoot).request('/42/stock-adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        thread_type_id: 5,
        thread_color_id: 3,
        actual_cones: actualCones,
        reason: 'Kiểm kê thực tế',
      }),
    })
    const rpc = calls.filter((call) => call.text.includes('fn_write_off_week_cones'))
    rpcCalls = rpc.length
    rpcParams = rpc[0]?.params ?? []
    auditCalls = calls.filter((call) => call.text.includes('INSERT INTO thread_audit_log')).length
  })

  return { response, rpcCalls, auditCalls, rpcParams }
}

async function revertReceive(options: StubOptions) {
  let response!: Response
  let rpcCalls = 0
  let auditCalls = 0

  await withStubbedPool(options, async (calls) => {
    response = await buildApp(options.isRoot).request('/deliveries/receive-logs/7/revert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Nhập nhầm quá số lượng' }),
    })
    rpcCalls = calls.filter((call) => call.text.includes('fn_revert_delivery_receive')).length
    auditCalls = calls.filter((call) => call.text.includes('INSERT INTO thread_audit_log')).length
  })

  return { response, rpcCalls, auditCalls }
}

async function testNonRootCannotAdjust() {
  const { response, rpcCalls } = await adjustStock(
    { isRoot: false, hasActiveUnlock: true },
    8,
  )
  assert.equal(response.status, 403)
  assert.equal(rpcCalls, 0, 'người không phải root không được chạm vào tồn kho')
}

async function testRootWithoutUnlockCannotAdjust() {
  const { response, rpcCalls } = await adjustStock(
    { isRoot: true, hasActiveUnlock: false },
    8,
  )
  assert.equal(response.status, 403)
  assert.equal(rpcCalls, 0, 'tuần chưa mở khóa thì không được điều chỉnh')
}

async function testRootWithUnlockAdjustsAndIsAudited() {
  const { response, rpcCalls, auditCalls, rpcParams } = await adjustStock(
    { isRoot: true, hasActiveUnlock: true, eligibleCones: 10 },
    8,
  )
  assert.equal(response.status, 200)
  assert.equal(rpcCalls, 1)
  assert.deepEqual(
    rpcParams.slice(0, 5),
    [42, 5, 3, 2, null],
    'phải loại bỏ đúng phần chênh lệch, receive_log_id để trống',
  )
  assert.equal(auditCalls, 1, 'điều chỉnh tồn kho phải ghi nhật ký')
}

async function testActualMoreThanCurrentIsRejected() {
  const { response, rpcCalls } = await adjustStock(
    { isRoot: true, hasActiveUnlock: true, eligibleCones: 10 },
    12,
  )
  assert.equal(response.status, 400)
  assert.equal(rpcCalls, 0, 'không tạo cuộn từ hư không')
}

async function testSameQuantityIsRejected() {
  const { response, rpcCalls } = await adjustStock(
    { isRoot: true, hasActiveUnlock: true, eligibleCones: 10 },
    10,
  )
  assert.equal(response.status, 400)
  assert.equal(rpcCalls, 0)
}

async function testRevertRequiresUnlock() {
  const { response, rpcCalls } = await revertReceive({ isRoot: true, hasActiveUnlock: false })
  assert.equal(response.status, 403)
  assert.equal(rpcCalls, 0)
}

async function testRevertAlreadyRevertedIsRejected() {
  const { response, rpcCalls } = await revertReceive({
    isRoot: true,
    hasActiveUnlock: true,
    logRevertedAt: new Date().toISOString(),
  })
  assert.equal(response.status, 400)
  assert.equal(rpcCalls, 0, 'không hoàn tác hai lần')
}

async function testRevertSucceedsAndIsAudited() {
  const { response, rpcCalls, auditCalls } = await revertReceive({
    isRoot: true,
    hasActiveUnlock: true,
  })
  assert.equal(response.status, 200)
  assert.equal(rpcCalls, 1)
  assert.equal(auditCalls, 1, 'hoàn tác lần nhập phải ghi nhật ký')
}

await testNonRootCannotAdjust()
await testRootWithoutUnlockCannotAdjust()
await testRootWithUnlockAdjustsAndIsAudited()
await testActualMoreThanCurrentIsRejected()
await testSameQuantityIsRejected()
await testRevertRequiresUnlock()
await testRevertAlreadyRevertedIsRejected()
await testRevertSucceedsAndIsAudited()
console.log('stock-adjust tests passed')
await pool.end()
