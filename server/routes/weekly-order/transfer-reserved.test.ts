import assert from 'node:assert/strict'
import { Hono } from 'hono'
import transferReservedRoutes from './transfer-reserved'
import type { AppEnv } from '../../types/hono-env'
import { pool } from '../../db/pool'

async function testStoresPerformerFullName() {
  const rpcCalls: Array<{ text: string; params: unknown[] }> = []
  const originalQuery = pool.query

  pool.query = (async (text: string, params?: unknown[]) => {
    if (/FROM employees WHERE id/i.test(text) || text.includes('full_name')) {
      return { rows: [{ full_name: 'Nguyễn Văn A' }] }
    }
    if (text.includes('fn_transfer_reserved_cones')) {
      rpcCalls.push({ text, params: params ?? [] })
      return { rows: [{ result: { transaction_id: 1, total_cones: 1, per_item: [] } }] }
    }
    return { rows: [] }
  }) as unknown as typeof pool.query

  try {
    const app = new Hono<AppEnv>()
    app.use('*', async (c, next) => {
      c.set('auth', {
        employeeId: 7,
        employeeCode: 'NV007',
        roles: [],
        isRoot: true,
        isAdmin: true,
        permissions: ['*'],
      })
      await next()
    })
    app.route('/', transferReservedRoutes)

    const response = await app.request('/17/transfer-reserved-cones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from_warehouse_id: 1,
        to_warehouse_id: 2,
        items: [
          {
            thread_type_id: 10,
            color_id: 20,
            full_quantity: 1,
            partial_quantity: 0,
          },
        ],
      }),
    })

    assert.equal(response.status, 200)
    assert.equal(rpcCalls.length, 1)
    assert.equal(rpcCalls[0].params[4], 'Nguyễn Văn A')
  } finally {
    pool.query = originalQuery
  }
}

await testStoresPerformerFullName()
console.log('transfer-reserved performer test passed')
