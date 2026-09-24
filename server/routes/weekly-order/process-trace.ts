import { Hono } from 'hono'
import { queryOne, query } from '../../db/query'
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
  lot_number: string | null
  original_week_id: number | null
  reserved_from_available: boolean | null
  warehouse:{ id: number; code: string; name: string } | { id: number; code: string; name: string }[] | null
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
} & ReservedBySource

type ReservedBySource = {
  from_receive_cones: number
  from_stock_cones: number
  from_other_week_cones: number
}

type ReserveSource = keyof ReservedBySource

type SharedWeekRow = {
  po_id: number
  style_id: number
  style_color_id: number
  week_names: string[]
}

type LoanSummaryRow = {
  stock_withdraw_logged_cones: number | string | null
  lent_out_cones: number | string | null
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
  issued_from_other_week_reserved_cones: number
  issued_from_available_cones: number
  issued_from_other_cones: number
  returned_cones: number
  shared_week_names: string[]
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
  ordered_ncc_cones: number
  cancelled_ncc_cones: number
  pending_delivery_cones: number
  pending_receive_cones: number
  received_cones: number
  reserved_cones: number
  reserved_physical_cones: number
  reserved_by_source: ReservedBySource
  issued_gross_cones: number
  issued_from_reserved_cones: number
  issued_from_other_week_reserved_cones: number
  issued_from_available_cones: number
  issued_from_other_cones: number
  returned_cones: number
  released_cones: number
  transferred_out_cones: number
  assigned_week_cones: number
  assignment_gap_cones: number
  unplanned: boolean
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
  issued_from_other_week_reserved_cones: number
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
  reserved_week_id: number | string | null
}

type ReleasedAuditRow = {
  thread_type_id: number | null
  color_id: number | null
  is_partial: boolean | null
  released_count: number | string
  transferred_out_count: number | string
}

type ReleasedCones = {
  released_cones: number
  transferred_out_cones: number
}

const AVAILABLE_ISSUE_SOURCE_STATUSES = new Set(['AVAILABLE', 'RECEIVED', 'INSPECTED'])

function makeTraceKey(threadTypeId: number, colorId: number | null | undefined): TraceKey {
  return `${threadTypeId}_${colorId ?? ''}`
}

function emptyReservedBySource(): ReservedBySource {
  return { from_receive_cones: 0, from_stock_cones: 0, from_other_week_cones: 0 }
}

function classifyReserveSource(cone: ReservedConeRow, weekId: number): ReserveSource {
  if (cone.original_week_id != null && cone.original_week_id !== weekId) return 'from_other_week_cones'
  if (cone.lot_number === `WO-${weekId}`) return 'from_receive_cones'
  if (cone.lot_number?.startsWith('WO-') && !cone.reserved_from_available) return 'from_other_week_cones'
  return 'from_stock_cones'
}

function roundReservedBySource(source: ReservedBySource): ReservedBySource {
  return {
    from_receive_cones: roundToTwoDecimals(source.from_receive_cones),
    from_stock_cones: roundToTwoDecimals(source.from_stock_cones),
    from_other_week_cones: roundToTwoDecimals(source.from_other_week_cones),
  }
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
      ordered_ncc_cones: 0,
      cancelled_ncc_cones: 0,
      pending_delivery_cones: 0,
      pending_receive_cones: 0,
      received_cones: 0,
      reserved_cones: 0,
      reserved_physical_cones: 0,
      reserved_by_source: emptyReservedBySource(),
      issued_gross_cones: 0,
      issued_from_reserved_cones: 0,
      issued_from_other_week_reserved_cones: 0,
      issued_from_available_cones: 0,
      issued_from_other_cones: 0,
      returned_cones: 0,
      released_cones: 0,
      transferred_out_cones: 0,
      assigned_week_cones: 0,
      assignment_gap_cones: 0,
      unplanned: false,
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

  const totalCones = toFiniteNumber(row.total_cones)
  if (totalCones != null) return totalCones

  const totalMeters = toFiniteNumber(row.total_meters)
  const metersPerCone = toFiniteNumber(row.meters_per_cone)
  if (totalMeters != null && metersPerCone != null && metersPerCone > 0) {
    return Math.ceil(totalMeters / metersPerCone)
  }

  return 0
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

function findOrCreateActualRow(
  rows: Map<TraceKey, TraceRow>,
  lineMaps: Map<TraceKey, Map<string, TracePoLine>>,
  threadTypeId: number,
  colorId: number | null,
  defaults: Partial<Pick<TraceRow, 'supplier_name' | 'tex_number' | 'color_name'>> = {},
): TraceRow {
  const existing = findExistingTraceRow(rows, threadTypeId, colorId)
  if (existing) return existing
  const row = ensureRow(rows, lineMaps, threadTypeId, colorId, defaults)
  row.unplanned = true
  return row
}

async function fetchColorIdsByName(names: string[]): Promise<Map<string, number>> {
  if (names.length === 0) return new Map()
  const data = await query<ColorDisplayRow>(
    `SELECT id, name FROM colors WHERE name = ANY($1) LIMIT $2`,
    [names, names.length],
  )
  return new Map(((data ?? []) as ColorDisplayRow[]).map(color => [color.name, color.id]))
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

  const items = await query<{ po_id: number | null; style_id: number | null; style_color_id: number | null }>(
    `SELECT po_id, style_id, style_color_id FROM thread_order_items
     WHERE week_id = ANY($1) AND po_id IS NOT NULL
     LIMIT 50000`,
    [weekIds],
  )
  if (!items || items.length === 0) return []

  const poIds = Array.from(new Set(items.map(i => i.po_id).filter((v): v is number => v != null)))
  const styleColorIds = Array.from(new Set(items.map(i => i.style_color_id).filter((v): v is number => v != null)))
  if (poIds.length === 0 || styleColorIds.length === 0) return []

  const lines = await query<IssueSourceLineRow>(
    `SELECT l.id, l.po_id, l.style_id, l.style_color_id, l.thread_type_id, l.thread_color_id
     FROM thread_issue_lines l
     INNER JOIN thread_issues ti ON ti.id = l.issue_id
     WHERE l.po_id = ANY($1) AND l.style_color_id = ANY($2) AND ti.status = 'CONFIRMED'
     LIMIT 100000`,
    [poIds, styleColorIds],
  )
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
    const data = await query<{ id: number; meters_per_cone: number | string | null }>(
      `SELECT id, meters_per_cone FROM thread_types WHERE id = ANY($1) LIMIT $2`,
      [chunk, chunk.length],
    )
    for (const row of (data ?? []) as Array<{ id: number; meters_per_cone: number | string | null }>) {
      metersPerConeByThreadType.set(row.id, toFiniteNumber(row.meters_per_cone) ?? 0)
    }
  }

  const lineById = new Map(issueLines.map(line => [line.id, line]))
  const issueMovements: IssueMovementRow[] = []
  for (const chunk of chunkArray(Array.from(lineById.keys()).map(String), 500)) {
    const data = await query<IssueMovementRow>(
      `SELECT m.reference_id, m.quantity_meters, m.from_status,
         CASE WHEN m.from_status = 'RESERVED_FOR_ORDER' THEN (
           SELECT (a.old_values->>'reserved_week_id')::int FROM thread_audit_log a
           WHERE a.table_name = 'thread_inventory' AND a.record_id = m.cone_id AND a.action = 'UPDATE'
             AND a.old_values->>'status' = 'RESERVED_FOR_ORDER'
             AND a.new_values->>'status' IS DISTINCT FROM 'RESERVED_FOR_ORDER'
             AND a.created_at BETWEEN m.created_at - interval '5 minutes' AND m.created_at + interval '5 minutes'
           ORDER BY abs(extract(epoch FROM a.created_at - m.created_at)) LIMIT 1
         ) END AS reserved_week_id
       FROM thread_movements m
       WHERE m.reference_id = ANY($1) AND m.movement_type = 'ISSUE' AND m.reference_type = 'ISSUE_LINE'
       LIMIT 100000`,
      [chunk],
    )
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
      issued_from_other_week_reserved_cones: 0,
      issued_from_available_cones: 0,
      issued_from_other_cones: 0,
    }
    const equivalentCones = getIssuedMovementEquivalentCones(movement, line, metersPerConeByThreadType, ratio)
    const fromStatus = movement.from_status ?? null

    const reservedWeekId = toFiniteNumber(movement.reserved_week_id)
    if (fromStatus === 'RESERVED_FOR_ORDER' && reservedWeekId != null && !weekIds.includes(reservedWeekId)) {
      row.issued_from_other_week_reserved_cones += equivalentCones
    } else if (fromStatus === 'RESERVED_FOR_ORDER') {
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
    issued_from_other_week_reserved_cones: roundToTwoDecimals(row.issued_from_other_week_reserved_cones),
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
  const [poData, styleData, styleColorData] = await Promise.all([
    poIds.length
      ? query<PoDisplayRow>(`SELECT id, po_number FROM purchase_orders WHERE id = ANY($1) LIMIT $2`, [poIds, poIds.length])
      : Promise.resolve([] as PoDisplayRow[]),
    styleIds.length
      ? query<StyleDisplayRow>(`SELECT id, style_code, style_name FROM styles WHERE id = ANY($1) LIMIT $2`, [styleIds, styleIds.length])
      : Promise.resolve([] as StyleDisplayRow[]),
    styleColorIds.length
      ? query<StyleColorDisplayRow>(`SELECT id, color_name FROM style_colors WHERE id = ANY($1) LIMIT $2`, [styleColorIds, styleColorIds.length])
      : Promise.resolve([] as StyleColorDisplayRow[]),
  ])

  return {
    poNumbers: new Map(((poData ?? []) as PoDisplayRow[]).map(p => [p.id, p.po_number])),
    styles: new Map(((styleData ?? []) as StyleDisplayRow[]).map(s => [s.id, { style_code: s.style_code, style_name: s.style_name }])),
    styleColors: new Map(((styleColorData ?? []) as StyleColorDisplayRow[]).map(s => [s.id, s.color_name])),
  }
}

async function fetchReservedByWarehouse(weekId: number, ratio: number) {
  const data = await query<ReservedConeRow>(
    `SELECT ti.thread_type_id, ti.color_id, ti.warehouse_id, ti.is_partial, ti.lot_number, ti.original_week_id,
       CASE WHEN ti.lot_number LIKE 'WO-%' AND ti.lot_number <> 'WO-' || $1::int::text THEN (
         SELECT a.action = 'UPDATE' AND a.old_values->>'status' = 'AVAILABLE'
         FROM thread_audit_log a
         WHERE a.table_name = 'thread_inventory' AND a.record_id = ti.id
           AND a.new_values->>'reserved_week_id' = $1::int::text
           AND a.old_values->>'reserved_week_id' IS DISTINCT FROM $1::int::text
         ORDER BY a.created_at DESC LIMIT 1) END AS reserved_from_available,
       CASE WHEN w.id IS NULL THEN NULL
            ELSE json_build_object('id', w.id, 'code', w.code, 'name', w.name) END AS warehouse
     FROM thread_inventory ti
     LEFT JOIN warehouses w ON w.id = ti.warehouse_id
     WHERE ti.reserved_week_id = $1 AND ti.status = 'RESERVED_FOR_ORDER'
     LIMIT 500000`,
    [weekId],
  )

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
      ...emptyReservedBySource(),
    }
    const equivalentCones = cone.is_partial ? ratio : 1
    current.physical_cones += 1
    current.equivalent_cones += equivalentCones
    current[classifyReserveSource(cone, weekId)] += equivalentCones
    if (cone.is_partial) current.partial_cones += 1
    else current.full_cones += 1
    warehouseMap.set(warehouseId, current)
    map.set(key, warehouseMap)
  }
  return map
}

async function fetchReleasedByKey(weekId: number, ratio: number) {
  const data = await query<ReleasedAuditRow>(
    `SELECT (a.old_values->>'thread_type_id')::int AS thread_type_id,
       (a.old_values->>'color_id')::int AS color_id,
       COALESCE((a.old_values->>'is_partial')::boolean, false) AS is_partial,
       COUNT(*) FILTER (WHERE a.new_values->>'status' = 'AVAILABLE') AS released_count,
       COUNT(*) FILTER (WHERE a.new_values->>'status' = 'RESERVED_FOR_ORDER'
         AND a.new_values->>'reserved_week_id' IS DISTINCT FROM $1::text) AS transferred_out_count
     FROM thread_audit_log a
     WHERE a.table_name = 'thread_inventory' AND a.action = 'UPDATE'
       AND a.old_values->>'status' = 'RESERVED_FOR_ORDER'
       AND a.old_values->>'reserved_week_id' = $1::text
     GROUP BY 1, 2, 3
     LIMIT 100000`,
    [weekId],
  )

  const map = new Map<TraceKey, ReleasedCones>()
  for (const row of (data ?? []) as ReleasedAuditRow[]) {
    if (row.thread_type_id == null) continue
    const unit = row.is_partial ? ratio : 1
    const released = (toFiniteNumber(row.released_count) ?? 0) * unit
    const transferredOut = (toFiniteNumber(row.transferred_out_count) ?? 0) * unit
    if (released === 0 && transferredOut === 0) continue
    const key = makeTraceKey(row.thread_type_id, row.color_id)
    const current = map.get(key) ?? { released_cones: 0, transferred_out_cones: 0 }
    current.released_cones += released
    current.transferred_out_cones += transferredOut
    map.set(key, current)
  }
  return map
}

async function fetchLoanSummary(weekId: number) {
  const row = await queryOne<LoanSummaryRow>(
    `SELECT
       COALESCE(SUM(quantity_cones) FILTER (WHERE from_week_id IS NULL AND to_week_id = $1), 0) AS stock_withdraw_logged_cones,
       COALESCE(SUM(GREATEST(quantity_cones - COALESCE(returned_cones, 0), 0))
         FILTER (WHERE from_week_id = $1 AND status = 'ACTIVE'), 0) AS lent_out_cones
     FROM thread_order_loans
     WHERE deleted_at IS NULL AND (from_week_id = $1 OR to_week_id = $1)`,
    [weekId],
  )
  return {
    stock_withdraw_logged_cones: roundToTwoDecimals(toFiniteNumber(row?.stock_withdraw_logged_cones) ?? 0),
    lent_out_cones: roundToTwoDecimals(toFiniteNumber(row?.lent_out_cones) ?? 0),
  }
}

async function fetchSharedWeekNames(weekId: number) {
  const data = await query<SharedWeekRow>(
    `SELECT cur.po_id, cur.style_id, cur.style_color_id,
       array_agg(DISTINCT w.week_name ORDER BY w.week_name) AS week_names
     FROM (SELECT DISTINCT po_id, style_id, style_color_id FROM thread_order_items
           WHERE week_id = $1 AND po_id IS NOT NULL) cur
     INNER JOIN thread_order_items oth
       ON oth.po_id = cur.po_id AND oth.style_id = cur.style_id
       AND oth.style_color_id = cur.style_color_id AND oth.week_id <> $1
     INNER JOIN thread_order_weeks w ON w.id = oth.week_id AND w.status <> 'CANCELLED'
     GROUP BY cur.po_id, cur.style_id, cur.style_color_id`,
    [weekId],
  )
  const map = new Map<string, string[]>()
  for (const row of (data ?? []) as SharedWeekRow[]) {
    map.set(`${row.po_id}_${row.style_id}_${row.style_color_id}`, row.week_names)
  }
  return map
}

async function fillThreadDisplay(rows: Map<TraceKey, TraceRow>) {
  const threadTypeIds = Array.from(new Set(Array.from(rows.values()).map(row => row.thread_type_id)))
  const colorIds = Array.from(new Set(Array.from(rows.values()).map(row => row.thread_color_id).filter((id): id is number => id != null)))

  const [threadTypesData, colorsData] = await Promise.all([
    threadTypeIds.length
      ? query<ThreadTypeDisplayRow>(
          `SELECT tt.id, tt.tex_number,
             CASE WHEN sup.id IS NULL THEN NULL ELSE json_build_object('name', sup.name) END AS suppliers,
             CASE WHEN col.id IS NULL THEN NULL ELSE json_build_object('name', col.name) END AS color_data
           FROM thread_types tt
           LEFT JOIN suppliers sup ON sup.id = tt.supplier_id
           LEFT JOIN colors col ON col.id = tt.color_id
           WHERE tt.id = ANY($1) LIMIT $2`,
          [threadTypeIds, threadTypeIds.length],
        )
      : Promise.resolve([] as ThreadTypeDisplayRow[]),
    colorIds.length
      ? query<ColorDisplayRow>(`SELECT id, name FROM colors WHERE id = ANY($1) LIMIT $2`, [colorIds, colorIds.length])
      : Promise.resolve([] as ColorDisplayRow[]),
  ])

  const threadTypeMap = new Map<number, { supplier_name: string; tex_number: string; color_name: string }>()
  for (const threadType of (threadTypesData ?? []) as unknown as ThreadTypeDisplayRow[]) {
    const supplier = Array.isArray(threadType.suppliers) ? threadType.suppliers[0] : threadType.suppliers
    const color = Array.isArray(threadType.color_data) ? threadType.color_data[0] : threadType.color_data
    threadTypeMap.set(threadType.id, {
      supplier_name: supplier?.name ?? '',
      tex_number: threadType.tex_number ?? '',
      color_name: color?.name ?? '',
    })
  }
  const colorMap = new Map<number, string>(((colorsData ?? []) as ColorDisplayRow[]).map(color => [color.id, color.name]))

  for (const row of rows.values()) {
    const threadType = threadTypeMap.get(row.thread_type_id)
    row.supplier_name ||= threadType?.supplier_name ?? ''
    row.tex_number ||= threadType?.tex_number ?? ''
    row.color_name ||= row.thread_color_id != null ? colorMap.get(row.thread_color_id) ?? '' : threadType?.color_name ?? ''
  }
}

async function applyCurrentColorNames(rows: Map<TraceKey, TraceRow>) {
  const colorIds = Array.from(new Set(Array.from(rows.values()).map(row => row.thread_color_id).filter((id): id is number => id != null)))
  if (colorIds.length === 0) return
  const data = await query<ColorDisplayRow>(`SELECT id, name FROM colors WHERE id = ANY($1) LIMIT $2`, [colorIds, colorIds.length])
  const colorMap = new Map<number, string>(((data ?? []) as ColorDisplayRow[]).map(color => [color.id, color.name]))
  for (const row of rows.values()) {
    const currentName = row.thread_color_id != null ? colorMap.get(row.thread_color_id) : undefined
    if (currentName) row.color_name = currentName
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

    const week = await queryOne<{ id: number; week_name: string; status: string }>(
      `SELECT id, week_name, status FROM thread_order_weeks WHERE id = $1`,
      [weekId],
    )
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

    const [{ poStyleColorThreadMap }, issuedRows, issuedSourceRows, reservedMap, loanSummary, sharedWeekNames, releasedMap] = await Promise.all([
      Promise.resolve(buildProcessTracePoLineMap(orderItems, specs, calculation_data, colorByName, colorById)),
      fetchIssuedByPoStyleColorMultiWeek([weekId], ratio),
      fetchIssueSourceByPoStyleColorMultiWeek([weekId], ratio),
      fetchReservedByWarehouse(weekId, ratio),
      fetchLoanSummary(weekId),
      fetchSharedWeekNames(weekId),
      fetchReleasedByKey(weekId, ratio),
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
              issued_from_other_week_reserved_cones: 0,
              issued_from_available_cones: 0,
              issued_from_other_cones: 0,
              returned_cones: 0,
              shared_week_names: [],
            }
            line.required_cones += thread.required_cones
            lineMap.set(lineKey, line)
          }
        }
      }
    }

    for (const [key, warehouses] of reservedMap) {
      const [threadTypeIdRaw, colorIdRaw] = key.split('_')
      const row = findOrCreateActualRow(rows, lineMaps, Number(threadTypeIdRaw), colorIdRaw ? Number(colorIdRaw) : null)
      row.warehouses = Array.from(warehouses.values()).map((warehouse) => ({
        ...warehouse,
        ...roundReservedBySource(warehouse),
        equivalent_cones: roundToTwoDecimals(warehouse.equivalent_cones),
      }))
      row.reserved_cones = roundToTwoDecimals(row.warehouses.reduce((sum, warehouse) => sum + warehouse.equivalent_cones, 0))
      row.reserved_physical_cones = row.warehouses.reduce((sum, warehouse) => sum + warehouse.physical_cones, 0)
      row.reserved_by_source = roundReservedBySource(row.warehouses.reduce((acc, warehouse) => ({
        from_receive_cones: acc.from_receive_cones + warehouse.from_receive_cones,
        from_stock_cones: acc.from_stock_cones + warehouse.from_stock_cones,
        from_other_week_cones: acc.from_other_week_cones + warehouse.from_other_week_cones,
      }), emptyReservedBySource()))
    }

    for (const issue of issuedRows) {
      const row = findOrCreateActualRow(rows, lineMaps, issue.thread_type_id, issue.thread_color_id)
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
        issued_from_other_week_reserved_cones: 0,
        issued_from_available_cones: 0,
        issued_from_other_cones: 0,
        returned_cones: 0,
        shared_week_names: [],
      }
      line.issued_gross_cones += issue.issued_cones
      line.returned_cones += issue.returned_cones
      lineMap.set(lineKey, line)
    }

    for (const issue of issuedSourceRows) {
      const row = findOrCreateActualRow(rows, lineMaps, issue.thread_type_id, issue.thread_color_id)
      row.issued_from_reserved_cones += issue.issued_from_reserved_cones
      row.issued_from_other_week_reserved_cones += issue.issued_from_other_week_reserved_cones
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
        issued_from_other_week_reserved_cones: 0,
        issued_from_available_cones: 0,
        issued_from_other_cones: 0,
        returned_cones: 0,
        shared_week_names: [],
      }
      line.issued_from_reserved_cones += issue.issued_from_reserved_cones
      line.issued_from_other_week_reserved_cones += issue.issued_from_other_week_reserved_cones
      line.issued_from_available_cones += issue.issued_from_available_cones
      line.issued_from_other_cones += issue.issued_from_other_cones
      lineMap.set(lineKey, line)
    }

    for (const [key, released] of releasedMap) {
      const [threadTypeIdRaw, colorIdRaw] = key.split('_')
      const row = findExistingTraceRow(rows, Number(threadTypeIdRaw), colorIdRaw ? Number(colorIdRaw) : null)
      if (!row) continue
      row.released_cones += released.released_cones
      row.transferred_out_cones += released.transferred_out_cones
    }

    await fillThreadDisplay(rows)
    const deliveryKeyToTraceKey = new Map<string, TraceKey>()
    for (const row of rows.values()) {
      if (row.unplanned || !row.color_name) continue
      const deliveryKey = getDeliveryTraceKey(row.thread_type_id, row.color_name)
      if (!deliveryKeyToTraceKey.has(deliveryKey)) deliveryKeyToTraceKey.set(deliveryKey, row.row_key)
    }
    const unmatchedDeliveries = deliverySummary.by_supplier.filter(delivery =>
      !deliveryKeyToTraceKey.has(getDeliveryTraceKey(delivery.thread_type_id, delivery.color_name)))
    const unmatchedColorIds = await fetchColorIdsByName(
      Array.from(new Set(unmatchedDeliveries.map(delivery => delivery.color_name).filter(Boolean))),
    )
    for (const delivery of deliverySummary.by_supplier) {
      const key = deliveryKeyToTraceKey.get(getDeliveryTraceKey(delivery.thread_type_id, delivery.color_name))
      const row = (key ? rows.get(key) : null)
        ?? findOrCreateActualRow(rows, lineMaps, delivery.thread_type_id, unmatchedColorIds.get(delivery.color_name) ?? null, {
          color_name: delivery.color_name,
        })
      row.ordered_ncc_cones += delivery.ordered
      row.cancelled_ncc_cones += delivery.cancelled
      row.pending_delivery_cones += delivery.pending_delivery
      row.pending_receive_cones += delivery.pending_receive
      row.received_cones += delivery.received
      row.delivery_lines.push(...delivery.deliveries)
    }
    if (unmatchedDeliveries.length > 0) await fillThreadDisplay(rows)
    await applyCurrentColorNames(rows)

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
        ordered_ncc_cones: roundToTwoDecimals(row.ordered_ncc_cones),
        cancelled_ncc_cones: roundToTwoDecimals(row.cancelled_ncc_cones),
        pending_delivery_cones: pendingDeliveryCones,
        pending_receive_cones: pendingReceiveCones,
        received_cones: roundToTwoDecimals(row.received_cones),
        reserved_cones: reservedCones,
        issued_gross_cones: roundToTwoDecimals(row.issued_gross_cones),
        issued_from_reserved_cones: issuedFromReservedCones,
        issued_from_other_week_reserved_cones: roundToTwoDecimals(row.issued_from_other_week_reserved_cones),
        issued_from_available_cones: roundToTwoDecimals(row.issued_from_available_cones),
        issued_from_other_cones: roundToTwoDecimals(row.issued_from_other_cones),
        returned_cones: roundToTwoDecimals(row.returned_cones),
        released_cones: roundToTwoDecimals(row.released_cones),
        transferred_out_cones: roundToTwoDecimals(row.transferred_out_cones),
        assigned_week_cones: assignedWeekCones,
        assignment_gap_cones: roundToTwoDecimals(assignmentTargetCones - assignedWeekCones),
        warehouses: row.warehouses.sort((a, b) => a.warehouse_name.localeCompare(b.warehouse_name)),
        po_lines: Array.from(lineMaps.get(row.row_key)?.values() ?? [])
          .map(line => ({
            ...line,
            required_cones: roundToTwoDecimals(line.required_cones),
            issued_gross_cones: roundToTwoDecimals(line.issued_gross_cones),
            issued_from_reserved_cones: roundToTwoDecimals(line.issued_from_reserved_cones),
            issued_from_other_week_reserved_cones: roundToTwoDecimals(line.issued_from_other_week_reserved_cones),
            issued_from_available_cones: roundToTwoDecimals(line.issued_from_available_cones),
            issued_from_other_cones: roundToTwoDecimals(line.issued_from_other_cones),
            returned_cones: roundToTwoDecimals(line.returned_cones),
            shared_week_names: sharedWeekNames.get(`${line.po_id}_${line.style_id}_${line.style_color_id}`) ?? [],
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
          ordered_ncc_cones: roundToTwoDecimals(traceRows.reduce((sum, row) => sum + row.ordered_ncc_cones, 0)),
          cancelled_ncc_cones: roundToTwoDecimals(traceRows.reduce((sum, row) => sum + row.cancelled_ncc_cones, 0)),
          pending_delivery_cones: roundToTwoDecimals(traceRows.reduce((sum, row) => sum + row.pending_delivery_cones, 0)),
          pending_receive_cones: roundToTwoDecimals(traceRows.reduce((sum, row) => sum + row.pending_receive_cones, 0)),
          received_cones: roundToTwoDecimals(traceRows.reduce((sum, row) => sum + row.received_cones, 0)),
          reserved_cones: roundToTwoDecimals(traceRows.reduce((sum, row) => sum + row.reserved_cones, 0)),
          reserved_physical_cones: traceRows.reduce((sum, row) => sum + row.reserved_physical_cones, 0),
          reserved_by_source: roundReservedBySource(traceRows.reduce((acc, row) => ({
            from_receive_cones: acc.from_receive_cones + row.reserved_by_source.from_receive_cones,
            from_stock_cones: acc.from_stock_cones + row.reserved_by_source.from_stock_cones,
            from_other_week_cones: acc.from_other_week_cones + row.reserved_by_source.from_other_week_cones,
          }), emptyReservedBySource())),
          stock_withdraw_logged_cones: loanSummary.stock_withdraw_logged_cones,
          lent_out_cones: loanSummary.lent_out_cones,
          issued_gross_cones: roundToTwoDecimals(traceRows.reduce((sum, row) => sum + row.issued_gross_cones, 0)),
          issued_from_reserved_cones: roundToTwoDecimals(traceRows.reduce((sum, row) => sum + row.issued_from_reserved_cones, 0)),
          issued_from_other_week_reserved_cones: roundToTwoDecimals(traceRows.reduce((sum, row) => sum + row.issued_from_other_week_reserved_cones, 0)),
          issued_from_available_cones: roundToTwoDecimals(traceRows.reduce((sum, row) => sum + row.issued_from_available_cones, 0)),
          issued_from_other_cones: roundToTwoDecimals(traceRows.reduce((sum, row) => sum + row.issued_from_other_cones, 0)),
          returned_cones: roundToTwoDecimals(traceRows.reduce((sum, row) => sum + row.returned_cones, 0)),
          released_cones: roundToTwoDecimals(Array.from(releasedMap.values()).reduce((sum, released) => sum + released.released_cones, 0)),
          transferred_out_cones: roundToTwoDecimals(Array.from(releasedMap.values()).reduce((sum, released) => sum + released.transferred_out_cones, 0)),
          assigned_week_cones: roundToTwoDecimals(traceRows.reduce((sum, row) => sum + row.assigned_week_cones, 0)),
          assignment_gap_cones: roundToTwoDecimals(traceRows.reduce((sum, row) => sum + row.assignment_gap_cones, 0)),
          shortage_cones: roundToTwoDecimals(traceRows.reduce((sum, row) => sum + Math.max(row.assignment_gap_cones, 0), 0)),
          surplus_cones: roundToTwoDecimals(traceRows.reduce((sum, row) => sum + Math.max(-row.assignment_gap_cones, 0), 0)),
          unplanned_row_count: traceRows.filter(row => row.unplanned).length,
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
