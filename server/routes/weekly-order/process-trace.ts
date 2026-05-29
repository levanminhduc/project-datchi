import { Hono } from 'hono'
import { supabaseAdmin } from '../../db/supabase'
import { requirePermission } from '../../middleware/auth'
import type { AppEnv } from '../../types/hono-env'
import { getPartialConeRatio } from '../../utils/settings-helper'
import {
  fetchCalculationData,
  fetchColorNameToIdMap,
  fetchOrderItems,
  fetchSpecsByStyleColors,
} from './transfer-by-calculation'
import {
  fetchIssuedByPoStyleColorMultiWeek,
  roundToTwoDecimals,
} from './progress-helpers'
import {
  getDeliveryTraceKey,
  getWeeklyOrderDeliverySummary,
  type DeliveryTraceLine,
} from './delivery-summary-helper'

type TraceKey = string

type DisplayMaps = {
  poNumbers: Map<number, string>
  styles: Map<number, { style_code: string; style_name: string }>
  styleColors: Map<number, string>
}

type PoDisplayRow = { id: number; po_number: string }
type StyleDisplayRow = { id: number; style_code: string; style_name: string }
type StyleColorDisplayRow = { id: number; color_name: string }
type ReservedConeRow = {
  thread_type_id: number
  color_id: number | null
  warehouse_id: number
  is_partial: boolean
  warehouse: { id: number; code: string; name: string } | { id: number; code: string; name: string }[] | null
}
type ThreadTypeDisplayRow = {
  id: number
  tex_number: string | null
  suppliers: { name: string } | { name: string }[] | null
  color_data: { name: string } | { name: string }[] | null
}
type ColorDisplayRow = { id: number; name: string }
type CalculationDataRow = Awaited<ReturnType<typeof fetchCalculationData>>['calculation_data'][number]
type ThreadOrderItem = Awaited<ReturnType<typeof fetchOrderItems>>[number]
type SpecRow = Awaited<ReturnType<typeof fetchSpecsByStyleColors>>[number]
type SummaryDataRow = Awaited<ReturnType<typeof fetchCalculationData>>['summary_data'][number]

type TraceWarehouse = {
  warehouse_id: number
  warehouse_code: string
  warehouse_name: string
  equivalent_cones: number
  physical_cones: number
  full_cones: number
  partial_cones: number
}

type TracePoLine = {
  po_id: number | null
  po_number: string
  style_id: number | null
  style_code: string
  style_name: string
  style_color_id: number | null
  style_color_name: string
  thread_type_id: number
  thread_color_id: number | null
  required_cones: number
  issued_gross_cones: number
  issued_from_reserved_cones: number
  issued_from_available_cones: number
  issued_from_other_cones: number
  returned_cones: number
}

type TraceRow = {
  row_key: string
  thread_type_id: number
  thread_color_id: number | null
  supplier_name: string
  tex_number: string
  color_name: string
  required_cones: number
  additional_order_cones: number
  assignment_target_cones: number
  pending_delivery_cones: number
  pending_receive_cones: number
  received_cones: number
  reserved_cones: number
  reserved_physical_cones: number
  issued_gross_cones: number
  issued_from_reserved_cones: number
  issued_from_available_cones: number
  issued_from_other_cones: number
  returned_cones: number
  assigned_week_cones: number
  assignment_gap_cones: number
  warehouses: TraceWarehouse[]
  po_lines: TracePoLine[]
  delivery_lines: DeliveryTraceLine[]
}

type TraceQuotaThread = {
  thread_type_id: number
  thread_color_id: number | null
  supplier_name: string
  tex_number: string
  color_name: string
  required_cones: number
  product_quantity: number
}

type IssueSourceRow = {
  po_id: number | null
  style_id: number | null
  style_color_id: number
  thread_type_id: number
  thread_color_id: number | null
  issued_from_reserved_cones: number
  issued_from_available_cones: number
  issued_from_other_cones: number
}

type IssueSourceLineRow = {
  id: number
  po_id: number | null
  style_id: number | null
  style_color_id: number
  thread_type_id: number
  thread_color_id: number | null
}

type IssueMovementRow = {
  reference_id: string | null
  quantity_meters: number | string | null
  from_status: string | null
}

const AVAILABLE_ISSUE_SOURCE_STATUSES = new Set(['AVAILABLE', 'RECEIVED', 'INSPECTED'])

function makeTraceKey(threadTypeId: number, colorId: number | null | undefined): TraceKey {
  return `${threadTypeId}_${colorId ?? ''}`
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
  return chunks
}

function ensureRow(
  rows: Map<TraceKey, TraceRow>,
  lineMaps: Map<TraceKey, Map<string, TracePoLine>>,
  threadTypeId: number,
  colorId: number | null,
  defaults: Partial<Pick<TraceRow, 'supplier_name' | 'tex_number' | 'color_name'>> = {},
): TraceRow {
  const key = makeTraceKey(threadTypeId, colorId)
  let row = rows.get(key)
  if (!row) {
    row = {
      row_key: key,
      thread_type_id: threadTypeId,
      thread_color_id: colorId,
      supplier_name: defaults.supplier_name ?? '',
      tex_number: defaults.tex_number ?? '',
      color_name: defaults.color_name ?? '',
      required_cones: 0,
      additional_order_cones: 0,
      assignment_target_cones: 0,
      pending_delivery_cones: 0,
      pending_receive_cones: 0,
      received_cones: 0,
      reserved_cones: 0,
      reserved_physical_cones: 0,
      issued_gross_cones: 0,
      issued_from_reserved_cones: 0,
      issued_from_available_cones: 0,
      issued_from_other_cones: 0,
      returned_cones: 0,
      assigned_week_cones: 0,
      assignment_gap_cones: 0,
      warehouses: [],
      po_lines: [],
      delivery_lines: [],
    }
    rows.set(key, row)
    lineMaps.set(key, new Map())
  } else {
    row.supplier_name ||= defaults.supplier_name ?? ''
    row.tex_number ||= defaults.tex_number ?? ''
    row.color_name ||= defaults.color_name ?? ''
  }
  return row
}

function normalizeTraceName(value: string | null | undefined) {
  return (value ?? '').trim().toLowerCase()
}

function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : null
}

function getSummaryRequiredCones(row: SummaryDataRow): number {
  const quotaCones = toFiniteNumber(row.quota_cones)
  if (quotaCones != null) return quotaCones

  const totalMeters = toFiniteNumber(row.total_meters)
  const metersPerCone = toFiniteNumber(row.meters_per_cone)
  if (totalMeters != null && metersPerCone != null && metersPerCone > 0) {
    return Math.ceil(totalMeters / metersPerCone)
  }

  return toFiniteNumber(row.total_cones) ?? 0
}

function getSummaryAdditionalOrderCones(row: SummaryDataRow): number {
  return Math.max(0, toFiniteNumber(row.additional_order) ?? 0)
}

function getIssuedMovementEquivalentCones(
  movement: IssueMovementRow,
  line: IssueSourceLineRow,
  metersPerConeByThreadType: Map<number, number>,
  ratio: number,
) {
  const quantityMeters = toFiniteNumber(movement.quantity_meters)
  const metersPerCone = metersPerConeByThreadType.get(line.thread_type_id) ?? 0
  if (quantityMeters != null && metersPerCone > 0 && quantityMeters < metersPerCone) return ratio
  return 1
}

function getSummaryColorName(row: SummaryDataRow): string {
  return typeof row.thread_color === 'string' ? row.thread_color : ''
}

function resolveSummaryColorId(row: SummaryDataRow, colorByName: Map<string, number>): number | null {
  const directColorId = toFiniteNumber(row.thread_color_id)
  if (directColorId != null && directColorId > 0) return directColorId

  const colorName = getSummaryColorName(row)
  if (!colorName) return null
  const exactMatch = colorByName.get(colorName)
  if (exactMatch != null) return exactMatch

  const normalizedColorName = normalizeTraceName(colorName)
  const normalizedMatches = Array.from(colorByName.entries())
    .filter(([name]) => normalizeTraceName(name) === normalizedColorName)
  return normalizedMatches.length === 1 ? normalizedMatches[0]?.[1] ?? null : null
}

function findUniqueRowByColorName(
  rows: Map<TraceKey, TraceRow>,
  threadTypeId: number,
  colorName: string,
): TraceRow | null {
  const normalizedColorName = normalizeTraceName(colorName)
  if (!normalizedColorName) return null

  const matches = Array.from(rows.values()).filter(row =>
    row.thread_type_id === threadTypeId &&
    normalizeTraceName(row.color_name) === normalizedColorName,
  )
  const uniqueKeys = new Set(matches.map(row => row.row_key))
  return uniqueKeys.size === 1 ? matches[0] ?? null : null
}

function findExistingTraceRow(
  rows: Map<TraceKey, TraceRow>,
  threadTypeId: number,
  colorId: number | null,
  colorName = '',
): TraceRow | null {
  return rows.get(makeTraceKey(threadTypeId, colorId))
    ?? findUniqueRowByColorName(rows, threadTypeId, colorName)
}

function applySummaryRequiredCones(
  rows: Map<TraceKey, TraceRow>,
  lineMaps: Map<TraceKey, Map<string, TracePoLine>>,
  summaryData: SummaryDataRow[],
  colorByName: Map<string, number>,
) {
  for (const summary of summaryData) {
    const threadTypeId = toFiniteNumber(summary.thread_type_id)
    if (threadTypeId == null || threadTypeId <= 0) continue

    const colorName = getSummaryColorName(summary)
    const colorId = resolveSummaryColorId(summary, colorByName)
    const exactKey = colorId != null ? makeTraceKey(threadTypeId, colorId) : null
    const row = (exactKey ? rows.get(exactKey) : null)
      ?? findUniqueRowByColorName(rows, threadTypeId, colorName)
      ?? ensureRow(rows, lineMaps, threadTypeId, colorId, {
        supplier_name: summary.supplier_name ?? '',
        tex_number: summary.tex_number ?? '',
        color_name: colorName,
      })

    row.supplier_name ||= summary.supplier_name ?? ''
    row.tex_number ||= summary.tex_number ?? ''
    row.color_name ||= colorName
    row.required_cones = getSummaryRequiredCones(summary)
    row.additional_order_cones = getSummaryAdditionalOrderCones(summary)
  }
}

async function fetchIssueSourceByPoStyleColorMultiWeek(
  weekIds: number[],
  ratio: number,
): Promise<IssueSourceRow[]> {
  if (weekIds.length === 0) return []

  const { data: items, error: itemsErr } = await supabaseAdmin
    .from('thread_order_items')
    .select('po_id, style_id, style_color_id')
    .in('week_id', weekIds)
    .not('po_id', 'is', null)
    .limit(50000)
  if (itemsErr) throw itemsErr
  if (!items || items.length === 0) return []

  const poIds = Array.from(new Set(items.map(i => i.po_id).filter((v): v is number => v != null)))
  const styleColorIds = Array.from(new Set(items.map(i => i.style_color_id).filter((v): v is number => v != null)))
  if (poIds.length === 0 || styleColorIds.length === 0) return []

  const { data: lines, error: linesErr } = await supabaseAdmin
    .from('thread_issue_lines')
    .select('id, po_id, style_id, style_color_id, thread_type_id, thread_color_id, thread_issues!inner(status)')
    .in('po_id', poIds)
    .in('style_color_id', styleColorIds)
    .eq('thread_issues.status', 'CONFIRMED')
    .limit(100000)
  if (linesErr) throw linesErr
  if (!lines || lines.length === 0) return []

  const validKeys = new Set<string>()
  for (const item of items as Array<{ po_id: number | null; style_id: number | null; style_color_id: number | null }>) {
    validKeys.add(`${item.po_id ?? 'null'}_${item.style_id ?? 'null'}_${item.style_color_id ?? 'null'}`)
  }

  const issueLines = ((lines ?? []) as IssueSourceLineRow[]).filter((line) =>
    validKeys.has(`${line.po_id ?? 'null'}_${line.style_id ?? 'null'}_${line.style_color_id ?? 'null'}`),
  )
  if (issueLines.length === 0) return []

  const threadTypeIds = Array.from(new Set(issueLines.map(line => line.thread_type_id)))
  const metersPerConeByThreadType = new Map<number, number>()
  for (const chunk of chunkArray(threadTypeIds, 500)) {
    const { data, error } = await supabaseAdmin
      .from('thread_types')
      .select('id, meters_per_cone')
      .in('id', chunk)
      .limit(chunk.length)
    if (error) throw error
    for (const row of (data ?? []) as Array<{ id: number; meters_per_cone: number | string | null }>) {
      metersPerConeByThreadType.set(row.id, toFiniteNumber(row.meters_per_cone) ?? 0)
    }
  }

  const lineById = new Map(issueLines.map(line => [line.id, line]))
  const issueMovements: IssueMovementRow[] = []
  for (const chunk of chunkArray(Array.from(lineById.keys()).map(String), 500)) {
    const { data, error } = await supabaseAdmin
      .from('thread_movements')
      .select('reference_id, quantity_meters, from_status')
      .in('reference_id', chunk)
      .eq('movement_type', 'ISSUE')
      .eq('reference_type', 'ISSUE_LINE')
      .limit(100000)
    if (error) throw error
    issueMovements.push(...((data ?? []) as IssueMovementRow[]))
  }
  if (issueMovements.length === 0) return []

  const grouped = new Map<string, IssueSourceRow>()
  for (const movement of issueMovements) {
    const lineId = toFiniteNumber(movement.reference_id)
    if (lineId == null) continue
    const line = lineById.get(lineId)
    if (!line) continue

    const groupKey = `${line.po_id ?? 'null'}_${line.style_id ?? 'null'}_${line.style_color_id}_${line.thread_type_id}_${line.thread_color_id ?? ''}`
    const row = grouped.get(groupKey) ?? {
      po_id: line.po_id,
      style_id: line.style_id,
      style_color_id: line.style_color_id,
      thread_type_id: line.thread_type_id,
      thread_color_id: line.thread_color_id,
      issued_from_reserved_cones: 0,
      issued_from_available_cones: 0,
      issued_from_other_cones: 0,
    }
    const equivalentCones = getIssuedMovementEquivalentCones(movement, line, metersPerConeByThreadType, ratio)
    const fromStatus = movement.from_status ?? null

    if (fromStatus === 'RESERVED_FOR_ORDER') {
      row.issued_from_reserved_cones += equivalentCones
    } else if (fromStatus != null && AVAILABLE_ISSUE_SOURCE_STATUSES.has(fromStatus)) {
      row.issued_from_available_cones += equivalentCones
    } else {
      row.issued_from_other_cones += equivalentCones
    }
    grouped.set(groupKey, row)
  }

  return Array.from(grouped.values()).map(row => ({
    ...row,
    issued_from_reserved_cones: roundToTwoDecimals(row.issued_from_reserved_cones),
    issued_from_available_cones: roundToTwoDecimals(row.issued_from_available_cones),
    issued_from_other_cones: roundToTwoDecimals(row.issued_from_other_cones),
  }))
}

function buildProcessTracePoLineMap(
  orderItems: ThreadOrderItem[],
  specs: SpecRow[],
  calcData: CalculationDataRow[],
  colorByName: Map<string, number>,
  colorById: Map<number, string>,
) {
  const specByStyleColor = new Map<number, SpecRow[]>()
  for (const spec of specs) {
    const arr = specByStyleColor.get(spec.style_color_id) ?? []
    arr.push(spec)
    specByStyleColor.set(spec.style_color_id, arr)
  }

  const calcByStyle = new Map<number, CalculationDataRow>()
  for (const calc of calcData) calcByStyle.set(calc.style_id, calc)

  const poStyleColorThreadMap = new Map<
    number | null,
    Map<number, Map<number, Map<string, TraceQuotaThread>>>
  >()

  for (const item of orderItems) {
    const poId = item.po_id ?? null
    const styleId = item.style_id
    if (styleId == null) continue

    if (!poStyleColorThreadMap.has(poId)) poStyleColorThreadMap.set(poId, new Map())
    const styleMap = poStyleColorThreadMap.get(poId)!
    if (!styleMap.has(styleId)) styleMap.set(styleId, new Map())
    const styleColorMap = styleMap.get(styleId)!
    if (!styleColorMap.has(item.style_color_id)) styleColorMap.set(item.style_color_id, new Map())
    const threadMap = styleColorMap.get(item.style_color_id)!

    const itemSpecs = specByStyleColor.get(item.style_color_id) ?? []
    const calcRow = calcByStyle.get(styleId)
    if (!calcRow) continue

    for (const spec of itemSpecs) {
      const calcEntry = calcRow.calculations.find(calc => calc.spec_id === spec.style_thread_spec_id)
      const matchColor = calcEntry?.color_breakdown.find(color =>
        color.color_id === item.style_color_id &&
        color.thread_type_id === spec.thread_type_id &&
        (
          color.thread_color_id === spec.thread_color_id ||
          (
            color.thread_color_id == null &&
            color.thread_color != null &&
            colorByName.get(color.thread_color) === spec.thread_color_id
          )
        ),
      )
      if (!matchColor) continue

      const meters = (matchColor.meters_per_unit ?? 0) * (item.quantity ?? 0)
      if (meters <= 0 || matchColor.meters_per_cone <= 0) continue

      const requiredCones = meters / matchColor.meters_per_cone
      const threadColorId = spec.thread_color_id ?? null
      const key = `${spec.thread_type_id}_${threadColorId ?? ''}`
      const existing = threadMap.get(key)
      if (existing) {
        existing.required_cones += requiredCones
        existing.product_quantity += item.quantity ?? 0
      } else {
        threadMap.set(key, {
          thread_type_id: spec.thread_type_id,
          thread_color_id: threadColorId,
          supplier_name: matchColor.supplier_name || calcEntry?.supplier_name || '',
          tex_number: matchColor.tex_number || calcEntry?.tex_number || '',
          color_name: threadColorId != null ? colorById.get(threadColorId) ?? '' : '',
          required_cones: requiredCones,
          product_quantity: item.quantity ?? 0,
        })
      }
    }
  }

  return { poStyleColorThreadMap }
}

async function fetchDisplayMaps(poIds: number[], styleIds: number[], styleColorIds: number[]): Promise<DisplayMaps> {
  const [poRes, styleRes, styleColorRes] = await Promise.all([
    poIds.length
      ? supabaseAdmin.from('purchase_orders').select('id, po_number').in('id', poIds).limit(poIds.length)
      : Promise.resolve({ data: [], error: null }),
    styleIds.length
      ? supabaseAdmin.from('styles').select('id, style_code, style_name').in('id', styleIds).limit(styleIds.length)
      : Promise.resolve({ data: [], error: null }),
    styleColorIds.length
      ? supabaseAdmin.from('style_colors').select('id, color_name').in('id', styleColorIds).limit(styleColorIds.length)
      : Promise.resolve({ data: [], error: null }),
  ])
  if (poRes.error) throw poRes.error
  if (styleRes.error) throw styleRes.error
  if (styleColorRes.error) throw styleColorRes.error

  return {
    poNumbers: new Map(((poRes.data ?? []) as PoDisplayRow[]).map(p => [p.id, p.po_number])),
    styles: new Map(((styleRes.data ?? []) as StyleDisplayRow[]).map(s => [s.id, { style_code: s.style_code, style_name: s.style_name }])),
    styleColors: new Map(((styleColorRes.data ?? []) as StyleColorDisplayRow[]).map(s => [s.id, s.color_name])),
  }
}

async function fetchReservedByWarehouse(weekId: number, ratio: number) {
  const { data, error } = await supabaseAdmin
    .from('thread_inventory')
    .select('thread_type_id, color_id, warehouse_id, is_partial, warehouse:warehouses(id, code, name)')
    .eq('reserved_week_id', weekId)
    .eq('status', 'RESERVED_FOR_ORDER')
    .limit(500000)
  if (error) throw error

  const map = new Map<TraceKey, Map<number, TraceWarehouse>>()
  for (const cone of (data ?? []) as unknown as ReservedConeRow[]) {
    const key = makeTraceKey(cone.thread_type_id, cone.color_id)
    const warehouseId = cone.warehouse_id
    const warehouseMap = map.get(key) ?? new Map<number, TraceWarehouse>()
    const warehouse = Array.isArray(cone.warehouse) ? cone.warehouse[0] : cone.warehouse
    const current = warehouseMap.get(warehouseId) ?? {
      warehouse_id: warehouseId,
      warehouse_code: warehouse?.code ?? '',
      warehouse_name: warehouse?.name ?? '',
      equivalent_cones: 0,
      physical_cones: 0,
      full_cones: 0,
      partial_cones: 0,
    }
    current.physical_cones += 1
    current.equivalent_cones += cone.is_partial ? ratio : 1
    if (cone.is_partial) current.partial_cones += 1
    else current.full_cones += 1
    warehouseMap.set(warehouseId, current)
    map.set(key, warehouseMap)
  }
  return map
}

async function fillThreadDisplay(rows: Map<TraceKey, TraceRow>) {
  const threadTypeIds = Array.from(new Set(Array.from(rows.values()).map(row => row.thread_type_id)))
  const colorIds = Array.from(new Set(Array.from(rows.values()).map(row => row.thread_color_id).filter((id): id is number => id != null)))

  const [threadTypesRes, colorsRes] = await Promise.all([
    threadTypeIds.length
      ? supabaseAdmin.from('thread_types').select('id, tex_number, suppliers(name), color_data:colors!color_id(name)').in('id', threadTypeIds).limit(threadTypeIds.length)
      : Promise.resolve({ data: [], error: null }),
    colorIds.length
      ? supabaseAdmin.from('colors').select('id, name').in('id', colorIds).limit(colorIds.length)
      : Promise.resolve({ data: [], error: null }),
  ])
  if (threadTypesRes.error) throw threadTypesRes.error
  if (colorsRes.error) throw colorsRes.error

  const threadTypeMap = new Map<number, { supplier_name: string; tex_number: string; color_name: string }>()
  for (const threadType of (threadTypesRes.data ?? []) as unknown as ThreadTypeDisplayRow[]) {
    const supplier = Array.isArray(threadType.suppliers) ? threadType.suppliers[0] : threadType.suppliers
    const color = Array.isArray(threadType.color_data) ? threadType.color_data[0] : threadType.color_data
    threadTypeMap.set(threadType.id, {
      supplier_name: supplier?.name ?? '',
      tex_number: threadType.tex_number ?? '',
      color_name: color?.name ?? '',
    })
  }
  const colorMap = new Map<number, string>(((colorsRes.data ?? []) as ColorDisplayRow[]).map(color => [color.id, color.name]))

  for (const row of rows.values()) {
    const threadType = threadTypeMap.get(row.thread_type_id)
    row.supplier_name ||= threadType?.supplier_name ?? ''
    row.tex_number ||= threadType?.tex_number ?? ''
    row.color_name ||= row.thread_color_id != null ? colorMap.get(row.thread_color_id) ?? '' : threadType?.color_name ?? ''
  }
}

const router = new Hono<AppEnv>()

router.get('/:weekId/process-trace', requirePermission('thread.weekly-order.view'), async (c) => {
  try {
    const weekIdRaw = c.req.param('weekId')
    if (!/^\d+$/.test(weekIdRaw)) {
      return c.json({ data: null, error: 'weekId không hợp lệ' }, 400)
    }
    const weekId = Number(weekIdRaw)

    const { data: week, error: weekErr } = await supabaseAdmin
      .from('thread_order_weeks')
      .select('id, week_name, status')
      .eq('id', weekId)
      .maybeSingle()
    if (weekErr) throw weekErr
    if (!week) return c.json({ data: null, error: 'Tuần không tồn tại' }, 404)

    const [{ calculation_data, summary_data }, orderItems, ratio, deliverySummary] = await Promise.all([
      fetchCalculationData(weekId),
      fetchOrderItems(weekId),
      getPartialConeRatio(),
      getWeeklyOrderDeliverySummary(weekId),
    ])
    const styleColorIds = Array.from(new Set(orderItems.map(item => item.style_color_id).filter((id): id is number => id != null)))
    const specs = await fetchSpecsByStyleColors(styleColorIds)
    const threadColorIds = Array.from(new Set(specs.map(spec => spec.thread_color_id).filter((id): id is number => id != null)))
    const colorByName = await fetchColorNameToIdMap(threadColorIds)
    const colorById = new Map<number, string>()
    for (const [name, id] of colorByName) colorById.set(id, name)

    const [{ poStyleColorThreadMap }, issuedRows, issuedSourceRows, reservedMap] = await Promise.all([
      Promise.resolve(buildProcessTracePoLineMap(orderItems, specs, calculation_data, colorByName, colorById)),
      fetchIssuedByPoStyleColorMultiWeek([weekId], ratio),
      fetchIssueSourceByPoStyleColorMultiWeek([weekId], ratio),
      fetchReservedByWarehouse(weekId, ratio),
    ])

    const poIds = Array.from(new Set(orderItems.map(item => item.po_id).filter((id): id is number => id != null)))
    const styleIds = Array.from(new Set(orderItems.map(item => item.style_id).filter((id): id is number => id != null)))
    const displayMaps = await fetchDisplayMaps(poIds, styleIds, styleColorIds)
    const rows = new Map<TraceKey, TraceRow>()
    const lineMaps = new Map<TraceKey, Map<string, TracePoLine>>()

    applySummaryRequiredCones(rows, lineMaps, summary_data, colorByName)

    for (const [poId, styleMap] of poStyleColorThreadMap) {
      for (const [styleId, styleColorMap] of styleMap) {
        for (const [styleColorId, threadMap] of styleColorMap) {
          for (const thread of threadMap.values()) {
            const row = findExistingTraceRow(rows, thread.thread_type_id, thread.thread_color_id, thread.color_name)
            if (!row) continue
            const lineKey = `${poId ?? 'null'}_${styleId}_${styleColorId}_${row.row_key}`
            const lineMap = lineMaps.get(row.row_key)
            if (!lineMap) continue
            const style = displayMaps.styles.get(styleId)
            const line = lineMap.get(lineKey) ?? {
              po_id: poId,
              po_number: poId != null ? displayMaps.poNumbers.get(poId) ?? '' : '(Không có PO)',
              style_id: styleId,
              style_code: style?.style_code ?? '',
              style_name: style?.style_name ?? '',
              style_color_id: styleColorId,
              style_color_name: displayMaps.styleColors.get(styleColorId) ?? '',
              thread_type_id: thread.thread_type_id,
              thread_color_id: thread.thread_color_id,
              required_cones: 0,
              issued_gross_cones: 0,
              issued_from_reserved_cones: 0,
              issued_from_available_cones: 0,
              issued_from_other_cones: 0,
              returned_cones: 0,
            }
            line.required_cones += thread.required_cones
            lineMap.set(lineKey, line)
          }
        }
      }
    }

    for (const [key, warehouses] of reservedMap) {
      const [threadTypeIdRaw, colorIdRaw] = key.split('_')
      const row = findExistingTraceRow(rows, Number(threadTypeIdRaw), colorIdRaw ? Number(colorIdRaw) : null)
      if (!row) continue
      row.warehouses = Array.from(warehouses.values()).map((warehouse) => ({
        ...warehouse,
        equivalent_cones: roundToTwoDecimals(warehouse.equivalent_cones),
      }))
      row.reserved_cones = roundToTwoDecimals(row.warehouses.reduce((sum, warehouse) => sum + warehouse.equivalent_cones, 0))
      row.reserved_physical_cones = row.warehouses.reduce((sum, warehouse) => sum + warehouse.physical_cones, 0)
    }

    for (const issue of issuedRows) {
      const row = findExistingTraceRow(rows, issue.thread_type_id, issue.thread_color_id)
      if (!row) continue
      row.issued_gross_cones += issue.issued_cones
      row.returned_cones += issue.returned_cones
      const lineKey = `${issue.po_id ?? 'null'}_${issue.style_id ?? 'null'}_${issue.style_color_id}_${row.row_key}`
      const lineMap = lineMaps.get(row.row_key)
      if (!lineMap) continue
      const style = issue.style_id != null ? displayMaps.styles.get(issue.style_id) : undefined
      const line = lineMap.get(lineKey) ?? {
        po_id: issue.po_id,
        po_number: issue.po_id != null ? displayMaps.poNumbers.get(issue.po_id) ?? '' : '(Không có PO)',
        style_id: issue.style_id,
        style_code: style?.style_code ?? '',
        style_name: style?.style_name ?? '',
        style_color_id: issue.style_color_id,
        style_color_name: displayMaps.styleColors.get(issue.style_color_id) ?? '',
        thread_type_id: issue.thread_type_id,
        thread_color_id: issue.thread_color_id,
        required_cones: 0,
        issued_gross_cones: 0,
        issued_from_reserved_cones: 0,
        issued_from_available_cones: 0,
        issued_from_other_cones: 0,
        returned_cones: 0,
      }
      line.issued_gross_cones += issue.issued_cones
      line.returned_cones += issue.returned_cones
      lineMap.set(lineKey, line)
    }

    for (const issue of issuedSourceRows) {
      const row = findExistingTraceRow(rows, issue.thread_type_id, issue.thread_color_id)
      if (!row) continue
      row.issued_from_reserved_cones += issue.issued_from_reserved_cones
      row.issued_from_available_cones += issue.issued_from_available_cones
      row.issued_from_other_cones += issue.issued_from_other_cones
      const lineKey = `${issue.po_id ?? 'null'}_${issue.style_id ?? 'null'}_${issue.style_color_id}_${row.row_key}`
      const lineMap = lineMaps.get(row.row_key)
      if (!lineMap) continue
      const style = issue.style_id != null ? displayMaps.styles.get(issue.style_id) : undefined
      const line = lineMap.get(lineKey) ?? {
        po_id: issue.po_id,
        po_number: issue.po_id != null ? displayMaps.poNumbers.get(issue.po_id) ?? '' : '(Không có PO)',
        style_id: issue.style_id,
        style_code: style?.style_code ?? '',
        style_name: style?.style_name ?? '',
        style_color_id: issue.style_color_id,
        style_color_name: displayMaps.styleColors.get(issue.style_color_id) ?? '',
        thread_type_id: issue.thread_type_id,
        thread_color_id: issue.thread_color_id,
        required_cones: 0,
        issued_gross_cones: 0,
        issued_from_reserved_cones: 0,
        issued_from_available_cones: 0,
        issued_from_other_cones: 0,
        returned_cones: 0,
      }
      line.issued_from_reserved_cones += issue.issued_from_reserved_cones
      line.issued_from_available_cones += issue.issued_from_available_cones
      line.issued_from_other_cones += issue.issued_from_other_cones
      lineMap.set(lineKey, line)
    }

    await fillThreadDisplay(rows)
    const deliveryKeyToTraceKey = new Map<string, TraceKey>()
    for (const row of rows.values()) {
      if (row.color_name) deliveryKeyToTraceKey.set(getDeliveryTraceKey(row.thread_type_id, row.color_name), row.row_key)
    }
    for (const delivery of deliverySummary.by_supplier) {
      const key = deliveryKeyToTraceKey.get(getDeliveryTraceKey(delivery.thread_type_id, delivery.color_name))
      if (!key) continue
      const row = rows.get(key)
      if (!row) continue
      row.pending_delivery_cones += delivery.pending_delivery
      row.pending_receive_cones += delivery.pending_receive
      row.received_cones += delivery.received
      row.delivery_lines.push(...delivery.deliveries)
    }

    const traceRows = Array.from(rows.values()).map((row) => {
      const requiredCones = roundToTwoDecimals(row.required_cones)
      const additionalOrderCones = roundToTwoDecimals(row.additional_order_cones)
      const assignmentTargetCones = roundToTwoDecimals(requiredCones + additionalOrderCones)
      const pendingDeliveryCones = roundToTwoDecimals(row.pending_delivery_cones)
      const pendingReceiveCones = roundToTwoDecimals(row.pending_receive_cones)
      const reservedCones = roundToTwoDecimals(row.reserved_cones)
      const issuedFromReservedCones = roundToTwoDecimals(row.issued_from_reserved_cones)
      const assignedWeekCones = roundToTwoDecimals(
        pendingDeliveryCones + pendingReceiveCones + reservedCones + issuedFromReservedCones,
      )

      return {
        ...row,
        required_cones: requiredCones,
        additional_order_cones: additionalOrderCones,
        assignment_target_cones: assignmentTargetCones,
        pending_delivery_cones: pendingDeliveryCones,
        pending_receive_cones: pendingReceiveCones,
        received_cones: roundToTwoDecimals(row.received_cones),
        reserved_cones: reservedCones,
        issued_gross_cones: roundToTwoDecimals(row.issued_gross_cones),
        issued_from_reserved_cones: issuedFromReservedCones,
        issued_from_available_cones: roundToTwoDecimals(row.issued_from_available_cones),
        issued_from_other_cones: roundToTwoDecimals(row.issued_from_other_cones),
        returned_cones: roundToTwoDecimals(row.returned_cones),
        assigned_week_cones: assignedWeekCones,
        assignment_gap_cones: roundToTwoDecimals(assignmentTargetCones - assignedWeekCones),
        warehouses: row.warehouses.sort((a, b) => a.warehouse_name.localeCompare(b.warehouse_name)),
        po_lines: Array.from(lineMaps.get(row.row_key)?.values() ?? [])
          .map(line => ({
            ...line,
            required_cones: roundToTwoDecimals(line.required_cones),
            issued_gross_cones: roundToTwoDecimals(line.issued_gross_cones),
            issued_from_reserved_cones: roundToTwoDecimals(line.issued_from_reserved_cones),
            issued_from_available_cones: roundToTwoDecimals(line.issued_from_available_cones),
            issued_from_other_cones: roundToTwoDecimals(line.issued_from_other_cones),
            returned_cones: roundToTwoDecimals(line.returned_cones),
          }))
          .sort((a, b) => a.po_number.localeCompare(b.po_number) || a.style_code.localeCompare(b.style_code) || a.style_color_name.localeCompare(b.style_color_name)),
      }
    }).sort((a, b) => a.supplier_name.localeCompare(b.supplier_name) || a.tex_number.localeCompare(b.tex_number) || a.color_name.localeCompare(b.color_name))

    return c.json({
      data: {
        week,
        summary: {
          required_cones: roundToTwoDecimals(traceRows.reduce((sum, row) => sum + row.required_cones, 0)),
          additional_order_cones: roundToTwoDecimals(traceRows.reduce((sum, row) => sum + row.additional_order_cones, 0)),
          assignment_target_cones: roundToTwoDecimals(traceRows.reduce((sum, row) => sum + row.assignment_target_cones, 0)),
          pending_delivery_cones: roundToTwoDecimals(traceRows.reduce((sum, row) => sum + row.pending_delivery_cones, 0)),
          pending_receive_cones: roundToTwoDecimals(traceRows.reduce((sum, row) => sum + row.pending_receive_cones, 0)),
          received_cones: roundToTwoDecimals(traceRows.reduce((sum, row) => sum + row.received_cones, 0)),
          reserved_cones: roundToTwoDecimals(traceRows.reduce((sum, row) => sum + row.reserved_cones, 0)),
          reserved_physical_cones: traceRows.reduce((sum, row) => sum + row.reserved_physical_cones, 0),
          issued_gross_cones: roundToTwoDecimals(traceRows.reduce((sum, row) => sum + row.issued_gross_cones, 0)),
          issued_from_reserved_cones: roundToTwoDecimals(traceRows.reduce((sum, row) => sum + row.issued_from_reserved_cones, 0)),
          issued_from_available_cones: roundToTwoDecimals(traceRows.reduce((sum, row) => sum + row.issued_from_available_cones, 0)),
          issued_from_other_cones: roundToTwoDecimals(traceRows.reduce((sum, row) => sum + row.issued_from_other_cones, 0)),
          returned_cones: roundToTwoDecimals(traceRows.reduce((sum, row) => sum + row.returned_cones, 0)),
          assigned_week_cones: roundToTwoDecimals(traceRows.reduce((sum, row) => sum + row.assigned_week_cones, 0)),
          assignment_gap_cones: roundToTwoDecimals(traceRows.reduce((sum, row) => sum + row.assignment_gap_cones, 0)),
        },
        rows: traceRows,
      },
      error: null,
    })
  } catch (err) {
    console.error('[process-trace] failed:', err)
    return c.json({ data: null, error: err instanceof Error ? err.message : 'Lỗi truy vấn dữ liệu' }, 500)
  }
})

export default router
