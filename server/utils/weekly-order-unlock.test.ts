import assert from 'node:assert/strict'
import type { Context } from 'hono'
import { pool } from '../db/pool'
import {
  isUnlockActive,
  getActiveUnlock,
  isRootUnlocked,
  logWeekAudit,
  type WeeklyOrderEditUnlock,
} from './weekly-order-unlock'

const NOW = new Date('2026-07-30T10:00:00.000Z')

function makeUnlock(overrides: Partial<WeeklyOrderEditUnlock> = {}): WeeklyOrderEditUnlock {
  return {
    id: 1,
    week_id: 42,
    granted_by: 'ROOT001',
    granted_at: '2026-07-30T09:30:00.000Z',
    expires_at: '2026-07-30T10:30:00.000Z',
    revoked_at: null,
    revoked_by: null,
    reason: 'Sửa sai nhu cầu chỉ',
    ...overrides,
  }
}

function fakeContext(auth: unknown): Context {
  return { get: (key: string) => (key === 'auth' ? auth : undefined) } as unknown as Context
}

async function withStubbedPool(
  handler: (calls: Array<{ text: string; params: unknown[] }>) => Promise<void>,
  rowsFor: (text: string) => unknown[],
) {
  const calls: Array<{ text: string; params: unknown[] }> = []
  const originalQuery = pool.query
  pool.query = (async (text: string, params?: unknown[]) => {
    calls.push({ text, params: params ?? [] })
    return { rows: rowsFor(text) }
  }) as unknown as typeof pool.query
  try {
    await handler(calls)
  } finally {
    pool.query = originalQuery
  }
}

function testIsUnlockActive() {
  assert.equal(isUnlockActive(null, NOW), false)
  assert.equal(isUnlockActive(makeUnlock(), NOW), true)
  assert.equal(
    isUnlockActive(makeUnlock({ expires_at: '2026-07-30T09:59:59.000Z' }), NOW),
    false,
    'phiên đã hết hạn phải coi là đóng',
  )
  assert.equal(
    isUnlockActive(makeUnlock({ revoked_at: '2026-07-30T09:45:00.000Z' }), NOW),
    false,
    'phiên đã thu hồi phải coi là đóng',
  )
}

async function testGetActiveUnlockIgnoresRevoked() {
  await withStubbedPool(
    async (calls) => {
      const active = await getActiveUnlock(42)
      assert.equal(active, null)
      assert.match(calls[0].text, /weekly_order_edit_unlocks/)
      assert.match(calls[0].text, /revoked_at IS NULL/)
      assert.deepEqual(calls[0].params, [42])
    },
    () => [],
  )

  await withStubbedPool(
    async () => {
      const active = await getActiveUnlock(42)
      assert.equal(active?.id, 1)
    },
    () => [makeUnlock({ expires_at: new Date(Date.now() + 60_000).toISOString() })],
  )

  await withStubbedPool(
    async () => {
      const active = await getActiveUnlock(42)
      assert.equal(active, null, 'hàng đã hết hạn phải trả null')
    },
    () => [makeUnlock({ expires_at: new Date(Date.now() - 60_000).toISOString() })],
  )
}

async function testIsRootUnlocked() {
  const activeRow = makeUnlock({ expires_at: new Date(Date.now() + 60_000).toISOString() })

  await withStubbedPool(
    async (calls) => {
      const allowed = await isRootUnlocked(fakeContext({ isRoot: false, employeeCode: 'NV001' }), 42)
      assert.equal(allowed, false, 'người không phải root không được vượt chốt chặn')
      assert.equal(calls.length, 0, 'không phải root thì không cần truy vấn DB')
    },
    () => [activeRow],
  )

  await withStubbedPool(
    async () => {
      const allowed = await isRootUnlocked(fakeContext(undefined), 42)
      assert.equal(allowed, false, 'chưa xác thực thì không mở')
    },
    () => [activeRow],
  )

  await withStubbedPool(
    async () => {
      const allowed = await isRootUnlocked(fakeContext({ isRoot: true, employeeCode: 'ROOT001' }), 42)
      assert.equal(allowed, true)
    },
    () => [activeRow],
  )

  await withStubbedPool(
    async () => {
      const allowed = await isRootUnlocked(fakeContext({ isRoot: true, employeeCode: 'ROOT001' }), 42)
      assert.equal(allowed, false, 'root nhưng tuần chưa mở khóa thì vẫn bị chặn')
    },
    () => [],
  )
}

async function testLogWeekAudit() {
  await withStubbedPool(
    async (calls) => {
      await logWeekAudit({
        weekId: 42,
        tableName: 'thread_order_weeks',
        recordId: 42,
        action: 'UPDATE',
        oldValues: { week_name: 'Tuần 30', notes: 'cũ' },
        newValues: { week_name: 'Tuần 30 - 2026', notes: 'cũ' },
        performedBy: 'ROOT001',
      })

      assert.equal(calls.length, 1)
      assert.match(calls[0].text, /INSERT INTO thread_audit_log/)
      const [tableName, recordId, action, oldValues, newValues, changedFields, performedBy, weekId] =
        calls[0].params as [string, number, string, string, string, string[], string, number]
      assert.equal(tableName, 'thread_order_weeks')
      assert.equal(recordId, 42)
      assert.equal(action, 'UPDATE')
      assert.deepEqual(JSON.parse(oldValues), { week_name: 'Tuần 30', notes: 'cũ' })
      assert.deepEqual(JSON.parse(newValues), { week_name: 'Tuần 30 - 2026', notes: 'cũ' })
      assert.deepEqual(changedFields, ['week_name'], 'chỉ ghi nhận cột thật sự đổi')
      assert.equal(performedBy, 'ROOT001')
      assert.equal(weekId, 42)
    },
    () => [],
  )

  await withStubbedPool(
    async (calls) => {
      await logWeekAudit({
        weekId: 42,
        tableName: 'thread_order_items',
        recordId: 7,
        action: 'DELETE',
        oldValues: { id: 7, po_id: 3 },
        performedBy: 'ROOT001',
      })
      assert.equal(calls.length, 1)
      const params = calls[0].params as unknown[]
      assert.equal(params[4], null, 'DELETE không có new_values')
      assert.equal(params[5], null, 'DELETE không tính changed_fields')
    },
    () => [],
  )

  const originalQuery = pool.query
  const originalError = console.error
  pool.query = (async () => {
    throw new Error('db down')
  }) as unknown as typeof pool.query
  console.error = () => {}
  try {
    await logWeekAudit({
      weekId: 42,
      tableName: 'thread_order_weeks',
      recordId: 42,
      action: 'INSERT',
      newValues: { id: 42 },
      performedBy: 'ROOT001',
    })
  } finally {
    pool.query = originalQuery
    console.error = originalError
  }
}

testIsUnlockActive()
await testGetActiveUnlockIgnoresRevoked()
await testIsRootUnlocked()
await testLogWeekAudit()
console.log('weekly-order-unlock tests passed')
await pool.end()
