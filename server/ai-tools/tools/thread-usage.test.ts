import assert from 'node:assert/strict'
import { THREAD_USAGE_SQL } from '../queries/thread-usage'
import { buildAiTestApp, callTool, withStubbedPool } from '../testing'

const SECTION_ROWS = new Map<string, Record<string, unknown>[]>([
  [THREAD_USAGE_SQL.styles, [{
    style_code: 'ST-001', style_name: 'Áo polo nam', style_color: 'Đen', process_name: 'May cổ',
    supplier_name: 'Coats', tex_number: '40', thread_color: 'C9700', meters_per_unit: '12.5000', total: 1,
  }]],
  [THREAD_USAGE_SQL.purchaseOrders, [{
    po_number: 'PO-2026-001', customer_name: 'ABC', status: 'CONFIRMED', week: '42',
    delivery_date: '2026-11-01T00:00:00.000Z', style_code: 'ST-001', quantity: 1200, total: 1,
  }]],
  [THREAD_USAGE_SQL.weeklyOrders, [{
    week_name: 'Tuần 42', po_number: 'PO-2026-001', style_code: 'ST-001', style_color_name: 'Đen', quantity: 1200, total: 1,
  }]],
  [THREAD_USAGE_SQL.issued, [{
    po_number: 'PO-2026-001', style_code: 'ST-001', style_color_name: 'Đen', supplier_name: 'Coats', tex_number: '40',
    color_name: 'C9700', issued_full: 10, issued_partial: 1, returned_full: 0, returned_partial: 0,
    last_issued_at: '2026-10-10T00:00:00.000Z', total: 1,
  }]],
])

const responder = (text: string) => SECTION_ROWS.get(text) ?? []

async function testRootSeesAllSections() {
  await withStubbedPool(responder, async (calls) => {
    const { status, body } = await callTool(buildAiTestApp(), 'find_thread_usage', { search: 'C9700', tex: '40' })
    assert.equal(status, 200, JSON.stringify(body))
    const result = body.data?.result as Record<string, unknown>
    assert.equal(result.styles_total, 1)
    assert.equal(result.open_purchase_orders_total, 1)
    assert.equal(result.weekly_orders_total, 1)
    assert.equal(result.issued_total, 1)
    assert.equal(result.not_permitted, undefined)
    assert.ok(!('total' in ((result.styles as Record<string, unknown>[])[0] ?? {})), 'cột total phải bị bỏ khỏi từng dòng')
    assert.equal(calls.length, 4)
    for (const call of calls) assert.deepEqual(call.params, ['%C9700%', '40'])
  })
}

async function testPlanningSeesStylesAndOrdersOnly() {
  await withStubbedPool(responder, async (calls) => {
    const { body } = await callTool(buildAiTestApp(), 'find_thread_usage', { search: 'C9700' }, 'kehoach')
    const result = body.data?.result as Record<string, unknown>
    assert.ok(result.styles)
    assert.ok(result.open_purchase_orders)
    assert.equal(result.weekly_orders, undefined)
    assert.equal(result.issued, undefined)
    assert.deepEqual(result.not_permitted, ['tuần đặt hàng', 'lịch sử xuất kho'])
    assert.equal(calls.length, 2, 'phần không có quyền thì không chạy SQL')
    for (const call of calls) assert.deepEqual(call.params, ['%C9700%', null])
  })
}

async function testStylesOnlyUser() {
  await withStubbedPool(responder, async (calls) => {
    const { body } = await callTool(buildAiTestApp(), 'find_thread_usage', { search: 'C9700' }, 'kythuat')
    const result = body.data?.result as Record<string, unknown>
    assert.deepEqual(result.not_permitted, ['PO đang mở', 'tuần đặt hàng', 'lịch sử xuất kho'])
    assert.equal(calls.length, 1)
  })
}

async function testNeedsStylesPermission() {
  await withStubbedPool(responder, async (calls) => {
    const { status } = await callTool(buildAiTestApp(), 'find_thread_usage', { search: 'C9700' }, 'kho')
    assert.equal(status, 403)
    assert.equal(calls.length, 0)
  })
}

async function testWildcardOnlySearchIsRejected() {
  await withStubbedPool(responder, async (calls) => {
    const { status, body } = await callTool(buildAiTestApp(), 'find_thread_usage', { search: '%%__' })
    assert.equal(status, 400)
    assert.equal(body.error?.code, 'invalid_input')
    assert.equal(calls.length, 0)
  })
}

async function testTexIsNormalized() {
  const cases: Array<[string, string]> = [['Tex 40', '40'], ['tex40', '40'], [' 40 ', '40'], ['40/2', '40/2'], ['TEX 40 / 2', '40/2']]
  for (const [raw, expected] of cases) {
    await withStubbedPool(responder, async (calls) => {
      const { status } = await callTool(buildAiTestApp(), 'find_thread_usage', { search: 'C9700', tex: raw })
      assert.equal(status, 200, raw)
      assert.ok(calls.length > 0)
      for (const call of calls) assert.deepEqual(call.params, ['%C9700%', expected], raw)
    })
  }
}

async function testInvalidTexIsRejected() {
  for (const raw of ['abc', '%', 'Tex', '40a', '40/', '4 0x']) {
    await withStubbedPool(responder, async (calls) => {
      const { status, body } = await callTool(buildAiTestApp(), 'find_thread_usage', { search: 'C9700', tex: raw })
      assert.equal(status, 400, raw)
      assert.equal(body.error?.code, 'invalid_input', raw)
      assert.equal(calls.length, 0, raw)
    })
  }
}

function testSqlShape() {
  for (const sql of Object.values(THREAD_USAGE_SQL)) {
    assert.ok(sql.includes(`tt.tex_number ~ ('(^|[^0-9/])' || $2 || '($|[^0-9/])')`), 'tex phải khớp cả dạng chuỗi tự do')
  }
  assert.ok(THREAD_USAGE_SQL.issued.includes(`i.status IN ('CONFIRMED', 'RETURNED')`), 'phải gồm phiếu đã trả hết')
  assert.ok(!THREAD_USAGE_SQL.issued.includes(`i.status = 'CONFIRMED'`))
}

function testNeverReadsThreadTypeColor() {
  for (const sql of Object.values(THREAD_USAGE_SQL)) {
    assert.ok(!sql.includes('tt.color_id'), 'không được dùng thread_types.color_id')
  }
}

function testSectionsReadUpToFiveHundredRows() {
  for (const sql of Object.values(THREAD_USAGE_SQL)) assert.ok(sql.trimEnd().endsWith('LIMIT 500'), sql)
}

async function main() {
  await testRootSeesAllSections()
  await testPlanningSeesStylesAndOrdersOnly()
  await testStylesOnlyUser()
  await testNeedsStylesPermission()
  await testWildcardOnlySearchIsRejected()
  await testTexIsNormalized()
  await testInvalidTexIsRejected()
  testSqlShape()
  testNeverReadsThreadTypeColor()
  testSectionsReadUpToFiveHundredRows()
  console.log('thread-usage tool tests passed')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
