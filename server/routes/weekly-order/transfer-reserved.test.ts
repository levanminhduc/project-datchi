import assert from 'node:assert/strict'
import { Hono } from 'hono'
import transferReservedRoutes from './transfer-reserved'
import type { AppEnv } from '../../types/hono-env'
import { supabaseAdmin } from '../../db/supabase'

async function testStoresPerformerFullName() {
  const rpcCalls: Array<{ name: string; params: Record<string, unknown> }> = []
  const originalRpc = supabaseAdmin.rpc
  const originalFrom = supabaseAdmin.from

  supabaseAdmin.rpc = (async (name: string, params: Record<string, unknown>) => {
    rpcCalls.push({ name, params })
    return { data: { transaction_id: 1, total_cones: 1, per_item: [] }, error: null }
  }) as unknown as typeof supabaseAdmin.rpc

  supabaseAdmin.from = ((table: string) => {
    if (table !== 'employees') return originalFrom.call(supabaseAdmin, table)

    return {
      select() {
        return {
          eq() {
            return {
              async single() {
                return { data: { full_name: 'Nguyễn Văn A' }, error: null }
              },
            }
          },
        }
      },
    }
  }) as typeof supabaseAdmin.from

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
    assert.equal(rpcCalls[0].name, 'fn_transfer_reserved_cones')
    assert.equal(rpcCalls[0].params.p_performed_by, 'Nguyễn Văn A')
  } finally {
    supabaseAdmin.rpc = originalRpc
    supabaseAdmin.from = originalFrom
  }
}

await testStoresPerformerFullName()
console.log('transfer-reserved performer test passed')
