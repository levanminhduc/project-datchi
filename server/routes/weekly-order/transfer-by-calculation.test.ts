import assert from 'node:assert/strict'
import { buildPoQuotaMap } from './transfer-by-calculation'

function makeBreakdown(colorId: number, metersPerUnit: number) {
  return {
    color_id: colorId,
    color_name: '',
    thread_color: 'Red',
    thread_color_id: 20,
    thread_type_id: 10,
    supplier_name: 'NCC A',
    tex_number: '40',
    total_meters: 0,
    meters_per_cone: 1000,
    meters_per_unit: metersPerUnit,
  }
}

function makeCalc(specId: number, breakdown: ReturnType<typeof makeBreakdown>[]) {
  return {
    spec_id: specId,
    thread_type_id: 10,
    tex_number: '40',
    supplier_id: 1,
    supplier_name: 'NCC A',
    color_breakdown: breakdown,
  }
}

const colorByName = new Map([['Red', 20]])
const colorById = new Map([[20, 'Red']])

function testPoQuotaRoundsAfterSummingProcesses() {
  const { poQuotaMap } = buildPoQuotaMap(
    [
      { id: 1, po_id: 501, style_color_id: 100, style_id: 1, quantity: 1000 },
      { id: 2, po_id: 502, style_color_id: 101, style_id: 1, quantity: 1000 },
    ],
    [
      { style_color_id: 100, style_thread_spec_id: 11, thread_type_id: 10, thread_color_id: 20 },
      { style_color_id: 100, style_thread_spec_id: 12, thread_type_id: 10, thread_color_id: 20 },
      { style_color_id: 101, style_thread_spec_id: 11, thread_type_id: 10, thread_color_id: 20 },
      { style_color_id: 101, style_thread_spec_id: 12, thread_type_id: 10, thread_color_id: 20 },
    ],
    [{
      style_id: 1,
      calculations: [
        makeCalc(11, [makeBreakdown(100, 1.2), makeBreakdown(101, 0.3)]),
        makeCalc(12, [makeBreakdown(100, 0.4), makeBreakdown(101, 0.3)]),
      ],
    }],
    colorByName,
    colorById,
  )

  assert.equal(poQuotaMap.get(501)?.get('10_20')?.quota_cones, 2)
  assert.equal(poQuotaMap.get(502)?.get('10_20')?.quota_cones, 1)
}

function testPoQuotaRoundsEachStyleColorSeparately() {
  const { poQuotaMap } = buildPoQuotaMap(
    [
      { id: 1, po_id: 501, style_color_id: 100, style_id: 1, quantity: 1000 },
      { id: 2, po_id: 501, style_color_id: 101, style_id: 1, quantity: 1000 },
    ],
    [
      { style_color_id: 100, style_thread_spec_id: 11, thread_type_id: 10, thread_color_id: 20 },
      { style_color_id: 101, style_thread_spec_id: 11, thread_type_id: 10, thread_color_id: 20 },
    ],
    [{
      style_id: 1,
      calculations: [makeCalc(11, [makeBreakdown(100, 0.4), makeBreakdown(101, 0.4)])],
    }],
    colorByName,
    colorById,
  )

  assert.equal(poQuotaMap.get(501)?.get('10_20')?.quota_cones, 2)
}

testPoQuotaRoundsAfterSummingProcesses()
testPoQuotaRoundsEachStyleColorSeparately()
console.log('transfer-by-calculation quota rounding tests passed')
