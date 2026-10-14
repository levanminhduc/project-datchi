import assert from 'node:assert/strict'
import { buildAiTestApp, callTool, withStubbedPool } from '../testing'

const STYLE_ROW = {
  id: 5, style_code: 'ST-001', style_name: 'Áo polo nam', description: null, fabric_type: 'Cotton',
  created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z', deleted_at: null,
}

function specRow(id: number, processName: string, meters: string, displayOrder: number) {
  return {
    id, style_id: 5, supplier_id: 3, process_name: processName, thread_type_id: 7, meters_per_unit: meters,
    notes: null, display_order: displayOrder, created_at: '2026-01-01T00:00:00.000Z',
    suppliers: { id: 3, name: 'Coats' },
    thread_types: { id: 7, tex_number: '40', tex_label: 'Tex 40', name: 'Coats Epic 40' },
  }
}

function stylesResponder(text: string): Record<string, unknown>[] {
  if (/FROM "?styles"?(\s|$)/.test(text)) return [STYLE_ROW]
  if (text.includes('FROM style_thread_specs sts')) return [specRow(2, 'May thân', '30.5000', 2), specRow(1, 'May cổ', '12.5000', 1)]
  return []
}

async function testSearchStyles() {
  await withStubbedPool(stylesResponder, async (calls) => {
    const { status, body } = await callTool(buildAiTestApp(), 'search_styles', { search: 'ST-001' }, 'kehoach')
    assert.equal(status, 200, JSON.stringify(body))
    assert.deepEqual(body.data?.result, [{ style_id: 5, style_code: 'ST-001', style_name: 'Áo polo nam', fabric_type: 'Cotton' }])
    const list = calls.find((call) => /FROM "?styles"?/.test(call.text))
    assert.ok(list)
    assert.ok(list.params.includes('%ST-001%'))
    assert.ok(list.params.includes(20))
  })
}

async function testStyleThreadSpecsSortedByDisplayOrder() {
  await withStubbedPool(stylesResponder, async (calls) => {
    const { status, body } = await callTool(buildAiTestApp(), 'get_style_thread_specs', { style_id: 5 }, 'kythuat')
    assert.equal(status, 200, JSON.stringify(body))
    assert.deepEqual(body.data?.result, [
      { process: 'May cổ', meters_per_unit: 12.5, supplier: 'Coats', thread_type: 'Coats Epic 40', tex: 'Tex 40' },
      { process: 'May thân', meters_per_unit: 30.5, supplier: 'Coats', thread_type: 'Coats Epic 40', tex: 'Tex 40' },
    ])
    const specs = calls.find((call) => call.text.includes('FROM style_thread_specs sts'))
    assert.ok(specs)
    assert.deepEqual(specs.params, [5])
  })
}

async function testStylesNeedPermission() {
  await withStubbedPool(stylesResponder, async (calls) => {
    assert.equal((await callTool(buildAiTestApp(), 'search_styles', { search: 'ST' }, 'kho')).status, 403)
    assert.equal((await callTool(buildAiTestApp(), 'get_style_thread_specs', { style_id: 5 }, 'kho')).status, 403)
    assert.equal(calls.length, 0)
  })
}

async function testStyleIdMustBePositive() {
  await withStubbedPool(stylesResponder, async () => {
    const { status, body } = await callTool(buildAiTestApp(), 'get_style_thread_specs', { style_id: 0 })
    assert.equal(status, 400)
    assert.equal(body.error?.code, 'invalid_input')
  })
}

async function main() {
  await testSearchStyles()
  await testStyleThreadSpecsSortedByDisplayOrder()
  await testStylesNeedPermission()
  await testStyleIdMustBePositive()
  console.log('styles tool tests passed')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
