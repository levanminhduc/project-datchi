import assert from 'node:assert/strict'
import {
  applySummaryQuotaSnapshot,
  buildPoStyleColorQuotaMap,
  buildPoStyleQuotaMap,
  buildSummaryOnlyProgressPo,
  type CalculationDataRow,
  type SpecRow,
  type StyleQuotaThread,
  type ThreadOrderItem,
} from './progress-helpers'

function makeThread(
  quotaCones: number,
  overrides: Partial<StyleQuotaThread> = {},
): StyleQuotaThread {
  return {
    thread_type_id: 10,
    thread_color_id: 20,
    supplier_name: 'NCC A',
    tex_number: '40',
    color_name: 'Red',
    quota_cones: quotaCones,
    ...overrides,
  }
}

function makeQuotaMap(lines: Array<{ poId: number; styleId: number; key: string; thread: StyleQuotaThread }>) {
  const poStyleQuotaMap = new Map<number | null, Map<number, Map<string, StyleQuotaThread>>>()
  for (const line of lines) {
    if (!poStyleQuotaMap.has(line.poId)) poStyleQuotaMap.set(line.poId, new Map())
    const styleMap = poStyleQuotaMap.get(line.poId)!
    if (!styleMap.has(line.styleId)) styleMap.set(line.styleId, new Map())
    styleMap.get(line.styleId)!.set(line.key, line.thread)
  }
  return poStyleQuotaMap
}

function sumQuotaByKey(
  poStyleQuotaMap: Map<number | null, Map<number, Map<string, StyleQuotaThread>>>,
  key: string,
) {
  let total = 0
  for (const styleMap of poStyleQuotaMap.values()) {
    for (const threadMap of styleMap.values()) {
      total += threadMap.get(key)?.quota_cones ?? 0
    }
  }
  return Math.round((total + Number.EPSILON) * 100) / 100
}

function testDistributesSummaryQuotaAcrossPoStyleLines() {
  const first = makeThread(3)
  const second = makeThread(1)
  const poStyleQuotaMap = makeQuotaMap([
    { poId: 101, styleId: 1, key: '10_20', thread: first },
    { poId: 102, styleId: 2, key: '10_20', thread: second },
  ])

  const summaryOnly = applySummaryQuotaSnapshot(
    poStyleQuotaMap,
    [{
      thread_type_id: 10,
      thread_color_id: 20,
      thread_color: 'Red',
      quota_cones: 8,
      total_cones: 4,
      tex_number: '40',
      supplier_name: 'NCC A',
    }],
    new Map([['Red', 20]]),
  )

  assert.equal(summaryOnly.length, 0)
  assert.equal(first.quota_cones, 6)
  assert.equal(second.quota_cones, 2)
  assert.equal(sumQuotaByKey(poStyleQuotaMap, '10_20'), 8)
}

function testManualQuotaOverrideCanSetNeedToZero() {
  const first = makeThread(3)
  const second = makeThread(1)
  const poStyleQuotaMap = makeQuotaMap([
    { poId: 101, styleId: 1, key: '10_20', thread: first },
    { poId: 102, styleId: 2, key: '10_20', thread: second },
  ])

  applySummaryQuotaSnapshot(
    poStyleQuotaMap,
    [{
      thread_type_id: 10,
      thread_color_id: 20,
      thread_color: 'Red',
      quota_cones: 0,
      total_cones: 4,
      tex_number: '40',
      supplier_name: 'NCC A',
    }],
    new Map([['Red', 20]]),
  )

  assert.equal(first.quota_cones, 0)
  assert.equal(second.quota_cones, 0)
  assert.equal(sumQuotaByKey(poStyleQuotaMap, '10_20'), 0)
}

function testUnmatchedSummaryRowsProduceSyntheticFlatPo() {
  const poStyleQuotaMap = makeQuotaMap([])
  const summaryOnly = applySummaryQuotaSnapshot(
    poStyleQuotaMap,
    [{
      thread_type_id: 99,
      thread_color_id: 88,
      thread_color: 'Blue',
      quota_cones: null,
      total_meters: 2500,
      meters_per_cone: 1000,
      total_cones: 2,
      tex_number: '60',
      supplier_name: 'NCC B',
    }],
    new Map([['Blue', 88]]),
  )

  assert.equal(summaryOnly.length, 1)
  assert.equal(summaryOnly[0].quota_cones, 2)

  const syntheticPo = buildSummaryOnlyProgressPo(summaryOnly, 7)
  assert.equal(syntheticPo.po_id, null)
  assert.equal(syntheticPo.po_number, '(Tổng hợp)')
  assert.equal(syntheticPo.display_order, 7)
  assert.equal(syntheticPo.styles.length, 0)
  assert.equal(syntheticPo.summary.total_quota_cones, 2)
  assert.equal(syntheticPo.summary.total_pending_cones, 2)
  assert.equal(syntheticPo.thread_lines.length, 1)
  assert.equal(syntheticPo.thread_lines[0].quota_cones, 2)
}

function testSummaryFallsBackToMetersWhenTotalConesMissing() {
  const summaryOnly = applySummaryQuotaSnapshot(
    makeQuotaMap([]),
    [{
      thread_type_id: 99,
      thread_color_id: 88,
      thread_color: 'Blue',
      quota_cones: null,
      total_meters: 2500,
      meters_per_cone: 1000,
      total_cones: null,
      tex_number: '60',
      supplier_name: 'NCC B',
    }],
    new Map([['Blue', 88]]),
  )

  assert.equal(summaryOnly[0].quota_cones, 3)
}

const twoProcessCalcData: CalculationDataRow[] = [{
  style_id: 1,
  calculations: [11, 12].map(specId => ({
    spec_id: specId,
    thread_type_id: 10,
    tex_number: '40',
    supplier_id: 1,
    supplier_name: 'NCC A',
    color_breakdown: [{
      color_id: 100,
      thread_color: 'Red',
      thread_color_id: 20,
      thread_type_id: 10,
      supplier_name: 'NCC A',
      tex_number: '40',
      meters_per_unit: specId === 11 ? 1.2 : 0.4,
      meters_per_cone: 1000,
    }],
  })),
}]

const twoProcessSpecs: SpecRow[] = [
  { style_color_id: 100, style_thread_spec_id: 11, thread_type_id: 10, thread_color_id: 20 },
  { style_color_id: 100, style_thread_spec_id: 12, thread_type_id: 10, thread_color_id: 20 },
]

const twoProcessItems: ThreadOrderItem[] = [
  { id: 1, po_id: 501, style_color_id: 100, style_id: 1, quantity: 1000 },
]

function testStyleQuotaRoundsAfterSummingProcesses() {
  const { poStyleQuotaMap } = buildPoStyleQuotaMap(
    twoProcessItems,
    twoProcessSpecs,
    twoProcessCalcData,
    new Map([['Red', 20]]),
    new Map([[20, 'Red']]),
  )

  assert.equal(poStyleQuotaMap.get(501)?.get(1)?.get('10_20')?.quota_cones, 2)
}

function testStyleColorQuotaRoundsAfterSummingProcesses() {
  const { poStyleColorThreadMap } = buildPoStyleColorQuotaMap(
    twoProcessItems,
    twoProcessSpecs,
    twoProcessCalcData,
    new Map([['Red', 20]]),
    new Map([[20, 'Red']]),
  )

  assert.equal(poStyleColorThreadMap.get(501)?.get(1)?.get(100)?.get('10_20')?.quota_cones, 2)
}

function testStyleQuotaRoundsEachStyleColorSeparately() {
  const calcData: CalculationDataRow[] = [{
    style_id: 1,
    calculations: [{
      ...twoProcessCalcData[0].calculations[0],
      color_breakdown: [100, 101].map(colorId => ({
        ...twoProcessCalcData[0].calculations[0].color_breakdown[0],
        color_id: colorId,
        meters_per_unit: 0.4,
      })),
    }],
  }]
  const { poStyleQuotaMap } = buildPoStyleQuotaMap(
    [
      { id: 1, po_id: 501, style_color_id: 100, style_id: 1, quantity: 1000 },
      { id: 2, po_id: 501, style_color_id: 101, style_id: 1, quantity: 1000 },
    ],
    [
      { style_color_id: 100, style_thread_spec_id: 11, thread_type_id: 10, thread_color_id: 20 },
      { style_color_id: 101, style_thread_spec_id: 11, thread_type_id: 10, thread_color_id: 20 },
    ],
    calcData,
    new Map([['Red', 20]]),
    new Map([[20, 'Red']]),
  )

  assert.equal(poStyleQuotaMap.get(501)?.get(1)?.get('10_20')?.quota_cones, 2)
}

testDistributesSummaryQuotaAcrossPoStyleLines()
testManualQuotaOverrideCanSetNeedToZero()
testUnmatchedSummaryRowsProduceSyntheticFlatPo()
testSummaryFallsBackToMetersWhenTotalConesMissing()
testStyleQuotaRoundsAfterSummingProcesses()
testStyleColorQuotaRoundsAfterSummingProcesses()
testStyleQuotaRoundsEachStyleColorSeparately()
console.log('progress-summary quota snapshot tests passed')
