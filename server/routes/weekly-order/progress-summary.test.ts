import assert from 'node:assert/strict'
import {
  applySummaryQuotaSnapshot,
  buildSummaryOnlyProgressPo,
  type StyleQuotaThread,
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
  assert.equal(summaryOnly[0].quota_cones, 3)

  const syntheticPo = buildSummaryOnlyProgressPo(summaryOnly, 7)
  assert.equal(syntheticPo.po_id, null)
  assert.equal(syntheticPo.po_number, '(Tổng hợp)')
  assert.equal(syntheticPo.display_order, 7)
  assert.equal(syntheticPo.styles.length, 0)
  assert.equal(syntheticPo.summary.total_quota_cones, 3)
  assert.equal(syntheticPo.summary.total_pending_cones, 3)
  assert.equal(syntheticPo.thread_lines.length, 1)
  assert.equal(syntheticPo.thread_lines[0].quota_cones, 3)
}

testDistributesSummaryQuotaAcrossPoStyleLines()
testManualQuotaOverrideCanSetNeedToZero()
testUnmatchedSummaryRowsProduceSyntheticFlatPo()
console.log('progress-summary quota snapshot tests passed')
