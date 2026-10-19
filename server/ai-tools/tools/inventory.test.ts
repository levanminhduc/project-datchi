import assert from 'node:assert/strict'
import { Hono } from 'hono'
import type { AppEnv } from '../../types/hono-env'
import { createAiToolsRouter } from '../router'
import { buildAiTestApp, callTool, useTestAuth, withStubbedPool } from '../testing'
import { searchInventory } from './search-inventory'

function coneRpcRow(id: number) {
  return {
    thread_type_id: id,
    thread_code: `CT40-${id}`,
    thread_name: 'Coats Epic 40',
    color_id: 12,
    color_name: 'C9700',
    color_hex: '#111111',
    material: 'POLYESTER',
    tex_number: '40',
    meters_per_cone: '5000',
    supplier_id: 3,
    full_cones: '120',
    partial_cones: '3',
    partial_meters: '4500.5',
    partial_weight_grams: '210',
    total_full_cones: '130',
    total_partial_cones: '4',
  }
}

const WAREHOUSE_ROW = {
  warehouse_id: 1,
  warehouse_code: 'DB-K1',
  warehouse_name: 'Kho 1',
  locations: 'Điện Bàn',
  full_cones: '100',
  partial_cones: '2',
  partial_meters: '3000',
}

function inventoryResponder(coneRows: Record<string, unknown>[], texNumber = '40') {
  return (text: string): Record<string, unknown>[] => {
    if (text.includes('fn_cone_summary_filtered')) return coneRows
    if (text.includes('FROM thread_types WHERE id = ANY')) {
      return coneRows.map((row) => ({ id: row.thread_type_id, tex_number: texNumber, tex_label: 'Tex 40' }))
    }
    if (text.includes('FROM suppliers WHERE id = ANY')) return [{ id: 3, name: 'Coats' }]
    if (text.includes('fn_warehouse_breakdown')) return [WAREHOUSE_ROW]
    return []
  }
}

async function testSearchInventoryMapsScreenNumbers() {
  await withStubbedPool(inventoryResponder([coneRpcRow(7)]), async (calls) => {
    const { status, body } = await callTool(buildAiTestApp(), 'search_inventory', { search: 'C9700' }, 'kho')
    assert.equal(status, 200, JSON.stringify(body))
    assert.deepEqual(body.data?.result, [{
      thread_type_id: 7,
      thread_code: 'CT40-7',
      thread_name: 'Coats Epic 40',
      supplier: 'Coats',
      tex: 'Tex 40',
      color_id: 12,
      color: 'C9700',
      available_full_cones: 120,
      available_partial_cones: 3,
      available_partial_meters: 4500.5,
      total_full_cones: 130,
      total_partial_cones: 4,
    }])
    assert.equal(body.data?.total, 1)
    assert.equal(body.data?.truncated, false)
    const rpc = calls.find((call) => call.text.includes('fn_cone_summary_filtered'))
    assert.ok(rpc)
    assert.equal(rpc.params[4], '%C9700%')
  })
}

async function testTexFilter() {
  await withStubbedPool(inventoryResponder([coneRpcRow(7)]), async () => {
    const app = buildAiTestApp()
    const other = await callTool(app, 'search_inventory', { search: 'C9700', tex: '30' })
    assert.deepEqual(other.body.data?.result, [])
    assert.equal(other.body.data?.total, 0)
    const same = await callTool(app, 'search_inventory', { search: 'C9700', tex: '40' })
    assert.equal(same.body.data?.total, 1)
  })
}

async function testTexFilterMatchesFreeTextAndWholeNumbers() {
  const search = async (texNumber: string, tex: string) => {
    let total = -1
    await withStubbedPool(inventoryResponder([coneRpcRow(7)], texNumber), async () => {
      const { status, body } = await callTool(buildAiTestApp(), 'search_inventory', { search: 'C9700', tex })
      assert.equal(status, 200, JSON.stringify(body))
      total = Number(body.data?.total)
    })
    return total
  }
  assert.equal(await search('#50 (28/2) Tex 40', '40'), 1)
  assert.equal(await search('40/2', '40'), 0)
  assert.equal(await search('40', 'Tex 40'), 1)
}

async function testTexFilterRejectsInvalidTex() {
  await withStubbedPool(inventoryResponder([coneRpcRow(7)]), async (calls) => {
    const { status, body } = await callTool(buildAiTestApp(), 'search_inventory', { search: 'C9700', tex: 'abc' })
    assert.equal(status, 400)
    assert.equal(body.error?.code, 'invalid_input')
    assert.equal(calls.length, 0)
  })
}

async function testRequiresInventoryPermission() {
  await withStubbedPool(inventoryResponder([coneRpcRow(7)]), async (calls) => {
    const { status, body } = await callTool(buildAiTestApp(), 'search_inventory', { search: 'C9700' }, 'kehoach')
    assert.equal(status, 403)
    assert.equal(body.error?.code, 'forbidden')
    assert.equal(calls.length, 0, 'thiếu quyền thì không chạm DB')
  })
}

async function testLargeResultIsTruncated() {
  const rows = Array.from({ length: 2000 }, (_, index) => coneRpcRow(index + 1))
  await withStubbedPool(inventoryResponder(rows), async () => {
    const { status, body } = await callTool(buildAiTestApp(), 'search_inventory', { search: '40' })
    assert.equal(status, 200)
    assert.equal(body.data?.truncated, true)
    assert.equal(body.data?.total, 2000)
    assert.ok((body.data?.result as unknown[]).length < 2000)
  })
}

async function testSpecialCharactersStayParameterized() {
  await withStubbedPool(inventoryResponder([]), async (calls) => {
    const raw = "C97'00%_"
    const { status } = await callTool(buildAiTestApp(), 'search_inventory', { search: raw })
    assert.equal(status, 200)
    for (const call of calls) assert.ok(!call.text.includes(raw), 'giá trị không được nội suy vào SQL')
    const rpc = calls.find((call) => call.text.includes('fn_cone_summary_filtered'))
    assert.ok(rpc)
    assert.ok(String(rpc.params[4]).includes('C97'))
  })
}

async function testRenamedFieldBreaksContract() {
  const app = new Hono<AppEnv>()
  useTestAuth(app)
  app.get('/api/inventory/summary/by-cone', (c) => c.json({
    data: [{
      thread_type_id: 7, thread_code: 'CT40-7', thread_name: 'Coats Epic 40', supplier_name: 'Coats',
      color_id: 12, color_data: { name: 'C9700', hex_code: null }, tex_number: '40', tex_label: 'Tex 40',
      kd_full_cones: 120, partial_cones: 3, partial_meters: 4500.5, total_full_cones: 130, total_partial_cones: 4,
    }],
    error: null,
  }))
  app.route('/api/ai', createAiToolsRouter((request) => app.fetch(request), { tools: [searchInventory] }))
  const { status, body } = await callTool(app, 'search_inventory', { search: 'C9700' })
  assert.equal(status, 502)
  assert.equal(body.error?.code, 'contract_mismatch')
}

async function testWarehouseBreakdown() {
  await withStubbedPool(inventoryResponder([coneRpcRow(7)]), async (calls) => {
    const { status, body } = await callTool(
      buildAiTestApp(), 'get_inventory_by_warehouse', { thread_type_id: 7, color_id: 12 }, 'kho',
    )
    assert.equal(status, 200, JSON.stringify(body))
    assert.deepEqual(body.data?.result, [{
      warehouse_code: 'DB-K1',
      warehouse: 'Kho 1',
      location: 'Điện Bàn',
      full_cones: 100,
      partial_cones: 2,
      partial_meters: 3000,
    }])
    const rpc = calls.find((call) => call.text.includes('fn_warehouse_breakdown'))
    assert.ok(rpc)
    assert.equal(rpc.params[0], 7)
    assert.equal(rpc.params[2], 12)
  })
}

async function testWarehouseRejectsBadId() {
  await withStubbedPool(inventoryResponder([]), async (calls) => {
    const { status, body } = await callTool(buildAiTestApp(), 'get_inventory_by_warehouse', { thread_type_id: 0 })
    assert.equal(status, 400)
    assert.equal(body.error?.code, 'invalid_input')
    assert.equal(calls.length, 0)
  })
}

async function main() {
  await testSearchInventoryMapsScreenNumbers()
  await testTexFilter()
  await testTexFilterMatchesFreeTextAndWholeNumbers()
  await testTexFilterRejectsInvalidTex()
  await testRequiresInventoryPermission()
  await testLargeResultIsTruncated()
  await testSpecialCharactersStayParameterized()
  await testRenamedFieldBreaksContract()
  await testWarehouseBreakdown()
  await testWarehouseRejectsBadId()
  console.log('inventory tool tests passed')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
