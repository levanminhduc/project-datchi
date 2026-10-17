import assert from 'node:assert/strict'
import { buildAiTestApp, callTool, listTools, withStubbedPool } from '../testing'

function weekRow(id: number, weekName: string) {
  return {
    id, week_name: weekName, start_date: '2026-10-12', end_date: '2026-10-18', status: 'CONFIRMED',
    notes: null, created_by: 'Nguyễn Văn A', created_at: '2026-10-10T00:00:00.000Z', item_count: 2,
  }
}

function listResponder(text: string): Record<string, unknown>[] {
  if (text.includes('count(*)::int AS count FROM thread_order_weeks')) return [{ count: 57 }]
  if (text.includes('AS item_count')) return [weekRow(42, 'Tuần 42'), weekRow(41, 'Tuần 41')]
  return []
}

async function testSearchWeeklyOrdersByName() {
  await withStubbedPool(listResponder, async (calls) => {
    const { status, body } = await callTool(buildAiTestApp(), 'search_weekly_orders', { name: 'tuần  42', status: 'CONFIRMED' }, 'kho')
    assert.equal(status, 200, JSON.stringify(body))
    assert.equal(body.data?.total, 1)
    assert.deepEqual(body.data?.result, [{
      week_id: 42, week_name: 'Tuần 42', status: 'CONFIRMED', start_date: '2026-10-12', end_date: '2026-10-18',
      item_count: 2, created_by: 'Nguyễn Văn A', created_at: '2026-10-10T00:00:00.000Z',
    }])
    const list = calls.find((call) => call.text.includes('AS item_count'))
    assert.ok(list)
    assert.ok(list.params.includes('CONFIRMED'))
    assert.ok(list.params.includes(100))
  })
}

async function testSearchWeeklyOrdersReportsRealTotal() {
  await withStubbedPool(listResponder, async () => {
    const { status, body } = await callTool(buildAiTestApp(), 'search_weekly_orders', {}, 'kho')
    assert.equal(status, 200, JSON.stringify(body))
    assert.equal(body.data?.total, 57)
  })
}

async function testGetWeeklyOrderItems() {
  const responder = (text: string): Record<string, unknown>[] => {
    if (!text.includes('LEFT JOIN employees e ON e.id = w.leader_signed_by')) return []
    return [{
      ...weekRow(42, 'Tuần 42'), leader_signed_at: null, leader: { id: 7, full_name: 'Trần B' },
      items: [
        {
          po_id: 9, style_id: 5, style_color_id: 3, quantity: 1200, po: { id: 9, po_number: 'PO-2026-001' },
          style: { id: 5, style_code: 'ST-001', style_name: 'Áo polo nam' }, style_color: { id: 3, color_name: 'Đen' }, sub_art: null,
        },
        {
          po_id: 9, style_id: 5, style_color_id: 4, quantity: 300, po: { id: 9, po_number: 'PO-2026-001' },
          style: { id: 5, style_code: 'ST-001', style_name: 'Áo polo nam' }, style_color: { id: 4, color_name: 'Trắng' }, sub_art: null,
        },
      ],
    }]
  }
  await withStubbedPool(responder, async () => {
    const { status, body } = await callTool(buildAiTestApp(), 'get_weekly_order', { week_id: 42 }, 'kho')
    assert.equal(status, 200, JSON.stringify(body))
    const result = body.data?.result as { leader_signed_by: string; total_products: number; items: Array<Record<string, unknown>> }
    assert.equal(result.leader_signed_by, 'Trần B')
    assert.equal(result.total_products, 1500)
    assert.deepEqual(result.items[1], {
      po_number: 'PO-2026-001', style_code: 'ST-001', style_name: 'Áo polo nam', style_color: 'Trắng', sub_art: null,
      quantity: 300, po_id: 9, style_id: 5, style_color_id: 4,
    })
  })
}

function threadsResponder(withResults: boolean) {
  return (text: string): Record<string, unknown>[] => {
    if (text.includes('fn_parse_calculation_cones')) {
      return [
        { thread_type_id: 10, color_id: 100, needed_cones: 10 },
        { thread_type_id: 11, color_id: 101, needed_cones: 5 },
      ]
    }
    if (text.includes('SELECT id, name FROM thread_types')) return [{ id: 10, name: 'Epic 40' }, { id: 11, name: 'Saba 60' }]
    if (text.includes('SELECT id, name FROM colors')) return [{ id: 100, name: 'C9700' }, { id: 101, name: 'C1000' }]
    if (text.includes('FROM system_settings')) return [{ value: 0.3 }]
    if (text.includes("reserved_week_id = $1 AND status = 'RESERVED_FOR_ORDER'")) {
      return [
        ...Array.from({ length: 3 }, () => ({ thread_type_id: 10, color_id: 100, is_partial: false })),
        { thread_type_id: 10, color_id: 100, is_partial: true },
      ]
    }
    if (text.includes('d.received_quantity')) {
      return [
        {
          id: 1, thread_type_id: 10, supplier_id: 1, quantity_cones: 8, received_quantity: 5, status: 'DELIVERED',
          thread_color: 'C9700', thread_color_code: null, supplier: { id: 1, name: 'Coats' },
          thread_type: { id: 10, name: 'Epic 40', tex_number: '40', color_data: null },
        },
        {
          id: 2, thread_type_id: 11, supplier_id: 2, quantity_cones: 5, received_quantity: 0, status: 'PENDING',
          thread_color: 'c1000 ', thread_color_code: null, supplier: { id: 2, name: 'Amann' },
          thread_type: { id: 11, name: 'Saba 60', tex_number: '60', color_data: null },
        },
      ]
    }
    if (text.includes('SELECT * FROM thread_order_results') && withResults) {
      return [{
        week_id: 42,
        summary_data: [
          { thread_type_id: 10, thread_type_name: 'Epic 40', supplier_name: 'Coats', tex_number: '40' },
          { thread_type_id: 11, thread_type_name: 'Saba 60', supplier_name: 'Amann', tex_number: '60' },
        ],
      }]
    }
    return []
  }
}

interface ThreadsResult {
  thread_type_count: number
  open_thread_type_count: number
  totals: Record<string, number>
  threads: Array<Record<string, unknown>>
}

async function testWeeklyOrderThreadsMergesByThreadAndColor() {
  await withStubbedPool(threadsResponder(true), async () => {
    const { status, body } = await callTool(buildAiTestApp(), 'get_weekly_order_threads', { week_id: 42 }, 'kho')
    assert.equal(status, 200, JSON.stringify(body))
    const result = body.data?.result as ThreadsResult
    assert.equal(result.thread_type_count, 2)
    assert.deepEqual(result.totals, {
      needed_cones: 15, reserved_cones: 3.3, shortage_cones: 11.7,
      ordered_from_supplier: 13, delivered_by_supplier: 8, received_into_stock: 5, percent_received: 38,
    })
    assert.deepEqual(result.threads[0], {
      thread_name: 'Epic 40', supplier: 'Coats', tex: '40', color: 'C9700',
      needed_cones: 10, reserved_cones: 3.3, reserved_physical_cones: 4, shortage_cones: 6.7,
      ordered_from_supplier: 8, delivered_by_supplier: 8, received_into_stock: 5,
      pending_delivery: 0, pending_receive: 3, cancelled: 0,
    })
    assert.deepEqual(result.threads[1], {
      thread_name: 'Saba 60', supplier: 'Amann', tex: '60', color: 'C1000',
      needed_cones: 5, reserved_cones: 0, reserved_physical_cones: 0, shortage_cones: 5,
      ordered_from_supplier: 5, delivered_by_supplier: 0, received_into_stock: 0,
      pending_delivery: 5, pending_receive: 0, cancelled: 0,
    })
  })
}

async function testWeeklyOrderThreadsFilters() {
  await withStubbedPool(threadsResponder(true), async () => {
    const { body } = await callTool(buildAiTestApp(), 'get_weekly_order_threads', { week_id: 42, search: 'amann' }, 'kho')
    const result = body.data?.result as ThreadsResult
    assert.equal(body.data?.total, 1)
    assert.equal(result.threads[0]?.color, 'C1000')
  })
}

async function testWeeklyOrderThreadsWithoutCalculationResults() {
  await withStubbedPool(threadsResponder(false), async () => {
    const { status, body } = await callTool(buildAiTestApp(), 'get_weekly_order_threads', { week_id: 42 }, 'kho')
    assert.equal(status, 200, JSON.stringify(body))
    const result = body.data?.result as ThreadsResult
    assert.equal(result.threads[0]?.thread_name, 'Epic 40')
    assert.equal(result.threads[0]?.supplier, 'Coats')
  })
}

async function testWeeklyToolsNeedAllocationPermission() {
  await withStubbedPool(listResponder, async () => {
    assert.equal((await callTool(buildAiTestApp(), 'search_weekly_orders', {}, 'kehoach')).status, 403)
    const { body } = await listTools(buildAiTestApp(), 'kho')
    const names = body.data?.tools.map((tool) => tool.name) ?? []
    assert.ok(names.includes('get_weekly_order_threads'))
    assert.ok(!names.includes('search_issues'))
    assert.ok(!names.includes('get_dept_allocation'))
  })
}

async function main() {
  await testSearchWeeklyOrdersByName()
  await testSearchWeeklyOrdersReportsRealTotal()
  await testGetWeeklyOrderItems()
  await testWeeklyOrderThreadsMergesByThreadAndColor()
  await testWeeklyOrderThreadsFilters()
  await testWeeklyOrderThreadsWithoutCalculationResults()
  await testWeeklyToolsNeedAllocationPermission()
  console.log('ai-tools weekly-order tests passed')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
