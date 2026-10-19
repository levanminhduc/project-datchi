import assert from 'node:assert/strict'
import { buildAiTestApp, callTool, withStubbedPool } from '../testing'

function poRow(itemCount: number, status: string | null = 'CONFIRMED') {
  return {
    id: 9, po_number: 'PO-2026-001', customer_name: 'ABC', order_date: '2026-10-01T00:00:00.000Z',
    delivery_date: '2026-11-01T00:00:00.000Z', status, priority: 'NORMAL', notes: null, week: '42',
    created_at: '2026-10-01T00:00:00.000Z', updated_at: '2026-10-01T00:00:00.000Z', deleted_at: null,
    items: Array.from({ length: itemCount }, (_, index) => ({
      id: index + 1, po_id: 9, style_id: 5, quantity: 100 * (index + 1), finished_product_code: null,
      style: { id: 5, style_code: `ST-00${index + 1}`, style_name: 'Áo polo nam', description: null },
    })),
  }
}

function poResponder(itemCount: number, status: string | null = 'CONFIRMED') {
  return (text: string): Record<string, unknown>[] => {
    if (text.includes('count(*)::int AS count FROM purchase_orders po')) return [{ count: 1 }]
    if (text.includes('SELECT po.*')) return [poRow(itemCount, status)]
    return []
  }
}

async function testSearchPurchaseOrders() {
  await withStubbedPool(poResponder(2), async (calls) => {
    const { status, body } = await callTool(
      buildAiTestApp(), 'search_purchase_orders', { po_number: 'PO-2026', status: 'CONFIRMED' }, 'kehoach',
    )
    assert.equal(status, 200, JSON.stringify(body))
    assert.equal(body.data?.total, 1)
    assert.deepEqual(body.data?.result, [{
      po_number: 'PO-2026-001', customer: 'ABC', status: 'CONFIRMED', priority: 'NORMAL',
      order_date: '2026-10-01T00:00:00.000Z', delivery_date: '2026-11-01T00:00:00.000Z', week: '42',
      item_count: 2,
      items: [
        { style_code: 'ST-001', style_name: 'Áo polo nam', quantity: 100 },
        { style_code: 'ST-002', style_name: 'Áo polo nam', quantity: 200 },
      ],
    }])
    const list = calls.find((call) => call.text.includes('SELECT po.*'))
    assert.ok(list)
    assert.ok(list.text.includes('EXISTS (SELECT 1 FROM po_items'))
    assert.ok(list.params.includes('%PO-2026%'))
    assert.ok(list.params.includes('CONFIRMED'))
    assert.ok(list.params.includes(100))
  })
}

async function testNullStatusIsAccepted() {
  await withStubbedPool(poResponder(1, null), async () => {
    const { status, body } = await callTool(buildAiTestApp(), 'search_purchase_orders', {}, 'kehoach')
    assert.equal(status, 200, JSON.stringify(body))
    const [po] = body.data?.result as Array<{ status: string | null }>
    assert.ok(po)
    assert.equal(po.status, null)
  })
}

async function testKeepsAllItemsOfPo() {
  await withStubbedPool(poResponder(12), async () => {
    const { body } = await callTool(buildAiTestApp(), 'search_purchase_orders', {})
    const [po] = body.data?.result as Array<{ item_count: number; items: unknown[] }>
    assert.ok(po)
    assert.equal(po.item_count, 12)
    assert.equal(po.items.length, 12)
  })
}

async function testPagesThroughPurchaseOrders() {
  const responder = (text: string, params: unknown[]): Record<string, unknown>[] => {
    if (text.includes('count(*)::int AS count FROM purchase_orders po')) return [{ count: 250 }]
    if (!text.includes('SELECT po.*')) return []
    const offset = Number(params.at(-1))
    return Array.from({ length: Math.min(100, 250 - offset) }, () => poRow(1))
  }
  await withStubbedPool(responder, async (calls) => {
    const { status, body } = await callTool(buildAiTestApp(), 'search_purchase_orders', {})
    assert.equal(status, 200, JSON.stringify(body))
    assert.equal(body.data?.total, 250)
    assert.equal((body.data?.result as unknown[]).length, 250)
    assert.equal(calls.filter((call) => call.text.includes('SELECT po.*')).length, 3)
  })
}

async function testRejectsUnknownStatus() {
  await withStubbedPool(poResponder(1), async (calls) => {
    const { status, body } = await callTool(buildAiTestApp(), 'search_purchase_orders', { status: 'DONE' })
    assert.equal(status, 400)
    assert.equal(body.error?.code, 'invalid_input')
    assert.equal(calls.length, 0)
  })
}

async function testNeedsPurchaseOrderPermission() {
  await withStubbedPool(poResponder(1), async () => {
    assert.equal((await callTool(buildAiTestApp(), 'search_purchase_orders', {}, 'kho')).status, 403)
  })
}

async function main() {
  await testSearchPurchaseOrders()
  await testNullStatusIsAccepted()
  await testKeepsAllItemsOfPo()
  await testPagesThroughPurchaseOrders()
  await testRejectsUnknownStatus()
  await testNeedsPurchaseOrderPermission()
  console.log('purchase-order tool tests passed')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
