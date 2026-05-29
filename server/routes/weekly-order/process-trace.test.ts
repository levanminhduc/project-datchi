import assert from 'node:assert/strict'
import { Hono } from 'hono'
import processTraceRoutes from './process-trace'
import type { AppEnv } from '../../types/hono-env'
import { supabaseAdmin } from '../../db/supabase'

async function testProcessTraceRowsFollowSummarySnapshot() {
  const weekId = 67
  const { data: result, error } = await supabaseAdmin
    .from('thread_order_results')
    .select('summary_data')
    .eq('week_id', weekId)
    .maybeSingle()

  if (error) throw error
  const summaryData = Array.isArray(result?.summary_data) ? result.summary_data : []
  if (summaryData.length === 0) {
    console.warn(`process-trace test skipped: week ${weekId} has no summary_data`)
    return
  }

  const app = new Hono<AppEnv>()
  app.use('*', async (c, next) => {
    c.set('auth', {
      employeeId: 1,
      employeeCode: 'TEST',
      roles: ['root'],
      isRoot: true,
      isAdmin: true,
      permissions: ['*'],
    })
    await next()
  })
  app.route('/', processTraceRoutes)

  const response = await app.request(`/${weekId}/process-trace`)
  assert.equal(response.status, 200)

  const payload = await response.json()
  assert.equal(payload.error, null)
  assert.equal(
    payload.data.rows.length,
    summaryData.length,
    'process-trace rows must follow weekly-order summary_data row count',
  )

  const summaryKeys = new Set(
    summaryData.map((row: any) => `${row.thread_type_id}_${row.thread_color_id ?? ''}`),
  )
  for (const row of payload.data.rows) {
    assert.equal(
      summaryKeys.has(`${row.thread_type_id}_${row.thread_color_id ?? ''}`),
      true,
      `unexpected process-trace row ${row.thread_type_id}_${row.thread_color_id ?? ''}`,
    )
  }
}

await testProcessTraceRowsFollowSummarySnapshot()
console.log('process-trace summary snapshot test passed')
