import assert from 'node:assert/strict'
import { Hono } from 'hono'
import processTraceRoutes from './process-trace'
import type { AppEnv } from '../../types/hono-env'
import { queryOne } from '../../db/query'

type TraceDeliveryLine = { id: number; status: string; quantity_cones: number; pending_delivery: number }
type TraceRowPayload = {
  row_key: string
  reserved_cones: number
  ordered_ncc_cones: number
  cancelled_ncc_cones: number
  reserved_by_source: { from_receive_cones: number; from_stock_cones: number; from_other_week_cones: number }
  issued_gross_cones: number
  issued_from_reserved_cones: number
  issued_from_other_week_reserved_cones: number
  issued_from_available_cones: number
  issued_from_other_cones: number
  delivery_lines: TraceDeliveryLine[]
}
type TracePayload = {
  summary: {
    ordered_ncc_cones: number
    assignment_gap_cones: number
    shortage_cones: number
    surplus_cones: number
    issued_from_other_week_reserved_cones: number
  }
  rows: TraceRowPayload[]
}

function createApp() {
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
  return app
}

function assertNearlyEqual(actual: number, expected: number, message: string) {
  assert.ok(Math.abs(actual - expected) < 0.05, `${message}: ${actual} != ${expected}`)
}

function assertNodeConsistency(data: TracePayload) {
  for (const row of data.rows) {
    const source = row.reserved_by_source
    assertNearlyEqual(
      source.from_receive_cones + source.from_stock_cones + source.from_other_week_cones,
      row.reserved_cones,
      `reserved_by_source must add up to reserved_cones for ${row.row_key}`,
    )
    const activeLines = row.delivery_lines.filter((line) => line.status !== 'CANCELLED')
    const cancelledLines = row.delivery_lines.filter((line) => line.status === 'CANCELLED')
    assertNearlyEqual(
      row.ordered_ncc_cones,
      activeLines.reduce((sum, line) => sum + line.quantity_cones, 0),
      `ordered_ncc_cones must exclude cancelled deliveries for ${row.row_key}`,
    )
    assertNearlyEqual(
      row.cancelled_ncc_cones,
      cancelledLines.reduce((sum, line) => sum + line.quantity_cones, 0),
      `cancelled_ncc_cones mismatch for ${row.row_key}`,
    )
    for (const line of cancelledLines) {
      assert.equal(line.pending_delivery, 0, `cancelled delivery ${line.id} must not be pending`)
    }
    assertNearlyEqual(
      row.issued_from_reserved_cones + row.issued_from_other_week_reserved_cones
        + row.issued_from_available_cones + row.issued_from_other_cones,
      row.issued_gross_cones,
      `issue sources must add up to issued_gross_cones for ${row.row_key}`,
    )
  }
  assertNearlyEqual(
    data.summary.shortage_cones - data.summary.surplus_cones,
    data.summary.assignment_gap_cones,
    'summary shortage - surplus must equal net gap',
  )
  assertNearlyEqual(
    data.summary.ordered_ncc_cones,
    data.rows.reduce((sum, row) => sum + row.ordered_ncc_cones, 0),
    'summary.ordered_ncc_cones must equal sum of rows',
  )
}

async function testProcessTraceNodeConsistency() {
  const app = createApp()
  const cancelledWeek = await queryOne<{ week_id: number }>(
    `SELECT week_id FROM thread_order_deliveries WHERE status = 'CANCELLED' ORDER BY week_id DESC LIMIT 1`,
  )
  const weekIds = Array.from(new Set([64, 67, cancelledWeek?.week_id].filter((id): id is number => id != null)))
  for (const weekId of weekIds) {
    const response = await app.request(`/${weekId}/process-trace`)
    assert.equal(response.status, 200)
    const payload = await response.json()
    assert.equal(payload.error, null)
    assertNodeConsistency(payload.data)
  }
}

async function testProcessTraceRowsFollowSummarySnapshot() {
  const weekId = 67
  const result = await queryOne<{ summary_data: unknown }>(
    'SELECT summary_data FROM thread_order_results WHERE week_id = $1',
    [weekId]
  )

  const summaryData = Array.isArray(result?.summary_data) ? result.summary_data : []
  if (summaryData.length === 0) {
    console.warn(`process-trace test skipped: week ${weekId} has no summary_data`)
    return
  }

  const app = createApp()

  const response = await app.request(`/${weekId}/process-trace`)
  assert.equal(response.status, 200)

  const payload = await response.json()
  assert.equal(payload.error, null)
  const plannedRows = payload.data.rows.filter((row: { unplanned: boolean }) => !row.unplanned)
  assert.equal(
    plannedRows.length,
    summaryData.length,
    'process-trace planned rows must follow weekly-order summary_data row count',
  )
  for (const row of payload.data.rows.filter((row: { unplanned: boolean }) => row.unplanned)) {
    assert.equal(row.assignment_target_cones, 0, `unplanned row ${row.row_key} must not have a target`)
  }

  const summaryKeys = new Set(
    summaryData.map((row: any) => `${row.thread_type_id}_${row.thread_color_id ?? ''}`),
  )
  for (const row of plannedRows) {
    assert.equal(
      summaryKeys.has(`${row.thread_type_id}_${row.thread_color_id ?? ''}`),
      true,
      `unexpected process-trace row ${row.thread_type_id}_${row.thread_color_id ?? ''}`,
    )
  }
}

async function testIssuedFromOtherWeekReservedIsSeparated() {
  const weekId = 64
  const week = await queryOne<{ id: number }>('SELECT id FROM thread_order_weeks WHERE id = $1', [weekId])
  if (!week) {
    console.warn(`process-trace test skipped: week ${weekId} does not exist`)
    return
  }
  const response = await createApp().request(`/${weekId}/process-trace`)
  assert.equal(response.status, 200)
  const payload = await response.json()
  assert.equal(payload.error, null)
  const summary = (payload.data as TracePayload).summary
  assert.ok(summary.issued_from_other_week_reserved_cones > 0, 'week 64 must have issues from cones reserved for another week')
  assert.ok(summary.assignment_gap_cones > -200, `week 64 net gap must not double count other-week issues: ${summary.assignment_gap_cones}`)
}

await testProcessTraceRowsFollowSummarySnapshot()
console.log('process-trace summary snapshot test passed')
await testProcessTraceNodeConsistency()
console.log('process-trace node consistency test passed')
await testIssuedFromOtherWeekReservedIsSeparated()
console.log('process-trace other-week issue test passed')
