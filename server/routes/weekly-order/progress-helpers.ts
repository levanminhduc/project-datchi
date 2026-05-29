import { supabaseAdmin } from '../../db/supabase'

export type IssuedRow = {
  po_id: number | null
  style_id: number | null
  thread_type_id: number
  thread_color_id: number | null
  issued_cones: number
  returned_cones: number
}

export type StyleQuotaThread = {
  thread_type_id: number
  thread_color_id: number | null
  supplier_name: string
  tex_number: string
  color_name: string
  quota_cones: number
}

export type SummaryQuotaRow = {
  thread_type_id: number | string | null
  thread_color: string | null
  thread_color_id?: number | string | null
  total_meters?: number | string | null
  meters_per_cone?: number | string | null
  total_cones?: number | string | null
  quota_cones?: number | string | null
  tex_number?: string | null
  supplier_name?: string | null
}

export type CalculationDataRow = {
  style_id: number
  calculations: Array<{
    spec_id?: number
    thread_type_id: number
    tex_number: string
    supplier_id: number
    supplier_name: string
    color_breakdown: Array<{
      color_id: number
      thread_color: string | null
      thread_color_id?: number | null
      thread_type_id: number
      supplier_name: string
      tex_number: string
      meters_per_unit: number
      meters_per_cone: number
    }>
  }>
}

export type SpecRow = {
  style_color_id: number
  style_thread_spec_id: number
  thread_type_id: number
  thread_color_id: number
}

export type ThreadOrderItem = {
  id: number
  po_id: number | null
  style_color_id: number
  style_id: number | null
  quantity: number
}

export function roundToTwoDecimals(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : null
}

function normalizeName(value: string | null | undefined) {
  return (value ?? '').trim().toLowerCase()
}

function makeThreadKey(threadTypeId: number, colorId: number | null | undefined) {
  return `${threadTypeId}_${colorId ?? ''}`
}

function getSummaryRequiredCones(row: SummaryQuotaRow): number {
  const quotaCones = toFiniteNumber(row.quota_cones)
  if (quotaCones != null) return Math.max(0, quotaCones)

  const totalMeters = toFiniteNumber(row.total_meters)
  const metersPerCone = toFiniteNumber(row.meters_per_cone)
  if (totalMeters != null && metersPerCone != null && metersPerCone > 0) {
    return Math.max(0, Math.ceil(totalMeters / metersPerCone))
  }

  return Math.max(0, toFiniteNumber(row.total_cones) ?? 0)
}

function resolveSummaryColorId(row: SummaryQuotaRow, colorByName: Map<string, number>): number | null {
  const directColorId = toFiniteNumber(row.thread_color_id)
  if (directColorId != null && directColorId > 0) return directColorId

  const colorName = typeof row.thread_color === 'string' ? row.thread_color : ''
  if (!colorName) return null

  const exactMatch = colorByName.get(colorName)
  if (exactMatch != null) return exactMatch

  const normalizedColorName = normalizeName(colorName)
  const normalizedMatches = Array.from(colorByName.entries())
    .filter(([name]) => normalizeName(name) === normalizedColorName)
  return normalizedMatches.length === 1 ? normalizedMatches[0]?.[1] ?? null : null
}

function buildUniqueColorNameKeyMap(
  poStyleQuotaMap: Map<number | null, Map<number, Map<string, StyleQuotaThread>>>,
) {
  const keysByThreadAndColorName = new Map<string, Set<string>>()

  for (const styleMap of poStyleQuotaMap.values()) {
    for (const threadMap of styleMap.values()) {
      for (const [key, thread] of threadMap) {
        const normalizedColorName = normalizeName(thread.color_name)
        if (!normalizedColorName) continue
        const nameKey = `${thread.thread_type_id}_${normalizedColorName}`
        const keys = keysByThreadAndColorName.get(nameKey) ?? new Set<string>()
        keys.add(key)
        keysByThreadAndColorName.set(nameKey, keys)
      }
    }
  }

  const uniqueMap = new Map<string, string>()
  for (const [nameKey, keys] of keysByThreadAndColorName) {
    if (keys.size === 1) uniqueMap.set(nameKey, Array.from(keys)[0]!)
  }
  return uniqueMap
}

function parseColorIdFromThreadKey(key: string): number | null {
  const [, colorIdRaw] = key.split('_')
  const colorId = toFiniteNumber(colorIdRaw)
  return colorId != null && colorId > 0 ? colorId : null
}

function resolveSummaryThreadKey(
  row: SummaryQuotaRow,
  threadTypeId: number,
  colorByName: Map<string, number>,
  uniqueColorNameKeyMap: Map<string, string>,
) {
  const colorId = resolveSummaryColorId(row, colorByName)
  if (colorId != null) return makeThreadKey(threadTypeId, colorId)

  const normalizedColorName = normalizeName(row.thread_color)
  if (normalizedColorName) {
    const uniqueKey = uniqueColorNameKeyMap.get(`${threadTypeId}_${normalizedColorName}`)
    if (uniqueKey) return uniqueKey
  }

  return makeThreadKey(threadTypeId, null)
}

function allocateSummaryQuota(
  lineRefs: Array<{ thread: StyleQuotaThread; originalQuota: number }>,
  targetQuota: number,
) {
  if (lineRefs.length === 0) return

  const roundedTarget = roundToTwoDecimals(targetQuota)
  const originalTotal = lineRefs.reduce((sum, line) => sum + line.originalQuota, 0)
  let remaining = roundedTarget

  lineRefs.forEach((line, index) => {
    const isLast = index === lineRefs.length - 1
    const allocated = isLast
      ? remaining
      : originalTotal > 0
        ? roundToTwoDecimals(roundedTarget * (line.originalQuota / originalTotal))
        : 0

    line.thread.quota_cones = roundToTwoDecimals(Math.max(0, allocated))
    remaining = roundToTwoDecimals(remaining - line.thread.quota_cones)
  })
}

export function applySummaryQuotaSnapshot(
  poStyleQuotaMap: Map<number | null, Map<number, Map<string, StyleQuotaThread>>>,
  summaryData: SummaryQuotaRow[],
  colorByName: Map<string, number>,
): StyleQuotaThread[] {
  if (summaryData.length === 0) return []

  const lineRefsByKey = new Map<string, Array<{ thread: StyleQuotaThread; originalQuota: number }>>()
  for (const styleMap of poStyleQuotaMap.values()) {
    for (const threadMap of styleMap.values()) {
      for (const [key, thread] of threadMap) {
        const refs = lineRefsByKey.get(key) ?? []
        refs.push({
          thread,
          originalQuota: Math.max(0, toFiniteNumber(thread.quota_cones) ?? 0),
        })
        lineRefsByKey.set(key, refs)
      }
    }
  }

  const uniqueColorNameKeyMap = buildUniqueColorNameKeyMap(poStyleQuotaMap)
  const summaryByKey = new Map<string, StyleQuotaThread>()

  for (const summary of summaryData) {
    const threadTypeId = toFiniteNumber(summary.thread_type_id)
    if (threadTypeId == null || threadTypeId <= 0) continue

    const key = resolveSummaryThreadKey(summary, threadTypeId, colorByName, uniqueColorNameKeyMap)
    const requiredCones = roundToTwoDecimals(getSummaryRequiredCones(summary))
    const existing = summaryByKey.get(key)
    if (existing) {
      existing.quota_cones = roundToTwoDecimals(existing.quota_cones + requiredCones)
      existing.supplier_name ||= summary.supplier_name ?? ''
      existing.tex_number ||= summary.tex_number ?? ''
      existing.color_name ||= summary.thread_color ?? ''
      continue
    }

    const firstMatchingLine = lineRefsByKey.get(key)?.[0]?.thread
    summaryByKey.set(key, {
      thread_type_id: threadTypeId,
      thread_color_id: parseColorIdFromThreadKey(key),
      supplier_name: summary.supplier_name ?? firstMatchingLine?.supplier_name ?? '',
      tex_number: summary.tex_number ?? firstMatchingLine?.tex_number ?? '',
      color_name: summary.thread_color ?? firstMatchingLine?.color_name ?? '',
      quota_cones: requiredCones,
    })
  }

  const summaryOnlyThreads: StyleQuotaThread[] = []
  for (const [key, summaryThread] of summaryByKey) {
    const lineRefs = lineRefsByKey.get(key) ?? []
    if (lineRefs.length > 0) {
      allocateSummaryQuota(lineRefs, summaryThread.quota_cones)
    } else {
      summaryOnlyThreads.push(summaryThread)
    }
  }

  return summaryOnlyThreads
}

export function buildSummaryOnlyProgressPo(summaryOnlyThreads: StyleQuotaThread[], displayOrder: number) {
  const thread_lines = summaryOnlyThreads
    .map(thread => ({
      thread_type_id: thread.thread_type_id,
      thread_color_id: thread.thread_color_id,
      supplier_name: thread.supplier_name,
      tex_number: thread.tex_number,
      color_name: thread.color_name,
      quota_cones: roundToTwoDecimals(thread.quota_cones),
      issued_cones: 0,
      returned_cones: 0,
      net_issued: 0,
      pending_cones: roundToTwoDecimals(thread.quota_cones),
    }))
    .sort((a, b) => {
      if (a.supplier_name !== b.supplier_name) return a.supplier_name.localeCompare(b.supplier_name)
      if (a.tex_number !== b.tex_number) return a.tex_number.localeCompare(b.tex_number)
      return a.color_name.localeCompare(b.color_name)
    })

  const total_quota = roundToTwoDecimals(thread_lines.reduce((sum, line) => sum + line.quota_cones, 0))

  return {
    po_id: null,
    po_number: '(Tổng hợp)',
    display_order: displayOrder,
    summary: {
      total_quota_cones: total_quota,
      total_issued_cones: 0,
      total_returned_cones: 0,
      total_net_issued: 0,
      total_pending_cones: total_quota,
      over_quota_cones: 0,
    },
    styles: [],
    thread_lines,
  }
}

export function buildPoStyleQuotaMap(
  orderItems: ThreadOrderItem[],
  specs: SpecRow[],
  calcData: CalculationDataRow[],
  colorByName: Map<string, number>,
  colorById: Map<number, string>,
) {
  const specByStyleColor = new Map<number, SpecRow[]>()
  for (const s of specs) {
    const arr = specByStyleColor.get(s.style_color_id) ?? []
    arr.push(s)
    specByStyleColor.set(s.style_color_id, arr)
  }

  const calcByStyle = new Map<number, CalculationDataRow>()
  for (const c of calcData) calcByStyle.set(c.style_id, c)

  const poDisplayOrder = new Map<number | null, number>()
  const poStyleQuotaMap = new Map<number | null, Map<number, Map<string, StyleQuotaThread>>>()
  const poStyleColorMap = new Map<number | null, Map<number, Set<number>>>()

  for (const item of orderItems) {
    const poId = item.po_id ?? null
    const styleId = item.style_id
    if (styleId == null) continue

    if (!poDisplayOrder.has(poId)) {
      poDisplayOrder.set(poId, poDisplayOrder.size + 1)
    }

    if (!poStyleQuotaMap.has(poId)) poStyleQuotaMap.set(poId, new Map())
    if (!poStyleColorMap.has(poId)) poStyleColorMap.set(poId, new Map())

    const styleMap = poStyleQuotaMap.get(poId)!
    if (!styleMap.has(styleId)) styleMap.set(styleId, new Map())

    const scMap = poStyleColorMap.get(poId)!
    if (!scMap.has(styleId)) scMap.set(styleId, new Set())
    scMap.get(styleId)!.add(item.style_color_id)

    const itemSpecs = specByStyleColor.get(item.style_color_id) ?? []
    const calcRow = calcByStyle.get(styleId)
    if (!calcRow) continue

    for (const spec of itemSpecs) {
      const calcEntry = calcRow.calculations.find(c => c.spec_id === spec.style_thread_spec_id)
      const matchColor = calcEntry?.color_breakdown.find(cb =>
        cb.color_id === item.style_color_id &&
        cb.thread_type_id === spec.thread_type_id &&
        (
          cb.thread_color_id === spec.thread_color_id ||
          (
            cb.thread_color_id == null &&
            cb.thread_color != null &&
            colorByName.get(cb.thread_color) === spec.thread_color_id
          )
        ),
      )
      if (!matchColor) continue

      const meters = (matchColor.meters_per_unit ?? 0) * (item.quantity ?? 0)
      if (meters <= 0 || matchColor.meters_per_cone <= 0) continue
      const conesNeeded = Math.ceil(meters / matchColor.meters_per_cone)
      if (conesNeeded === 0) continue

      const supplierName = matchColor.supplier_name || calcEntry?.supplier_name || ''
      const texNumber = matchColor.tex_number || calcEntry?.tex_number || ''
      const key = `${spec.thread_type_id}_${spec.thread_color_id}`
      const threadMap = styleMap.get(styleId)!
      const existing = threadMap.get(key)
      if (existing) {
        existing.quota_cones += conesNeeded
      } else {
        threadMap.set(key, {
          thread_type_id: spec.thread_type_id,
          thread_color_id: spec.thread_color_id,
          supplier_name: supplierName,
          tex_number: texNumber,
          color_name: colorById.get(spec.thread_color_id) ?? '',
          quota_cones: conesNeeded,
        })
      }
    }
  }

  const poOrder = Array.from(poDisplayOrder.entries())
    .sort((a, b) => a[1] - b[1])
    .map(([po_id, display_order]) => ({ po_id, po_number: null as string | null, display_order }))

  return { poOrder, poStyleQuotaMap, poStyleColorMap }
}

export async function fetchIssuedByPoStyleMultiWeek(
  weekIds: number[],
  ratio: number,
  department?: string,
  scopedPoIds?: number[],
): Promise<IssuedRow[]> {
  if (weekIds.length === 0) return []

  let itemQuery = supabaseAdmin
    .from('thread_order_items')
    .select('po_id, style_id, style_color_id')
    .in('week_id', weekIds)
    .not('po_id', 'is', null)
  if (scopedPoIds && scopedPoIds.length > 0) {
    itemQuery = itemQuery.in('po_id', scopedPoIds)
  }
  const { data: items, error: itemsErr } = await itemQuery.limit(50000)
  if (itemsErr) throw itemsErr
  if (!items || items.length === 0) return []

  const poIds = scopedPoIds ?? Array.from(new Set(items.map(i => i.po_id).filter((v): v is number => v != null)))
  const styleColorIds = Array.from(new Set(items.map(i => i.style_color_id).filter((v): v is number => v != null)))
  if (poIds.length === 0 || styleColorIds.length === 0) return []

  let query = supabaseAdmin
    .from('thread_issue_lines')
    .select('po_id, style_id, style_color_id, thread_type_id, thread_color_id, issued_full, issued_partial, returned_full, returned_partial, thread_issues!inner(status, department)')
    .in('po_id', poIds)
    .in('style_color_id', styleColorIds)
    .eq('thread_issues.status', 'CONFIRMED')
    .limit(100000)

  if (department) {
    query = query.eq('thread_issues.department', department)
  }

  const { data: lines, error: linesErr } = await query
  if (linesErr) throw linesErr
  if (!lines || lines.length === 0) return []

  const validKeys = new Set<string>()
  for (const it of items as Array<{ po_id: number | null; style_id: number | null; style_color_id: number | null }>) {
    validKeys.add(`${it.po_id ?? 'null'}_${it.style_id ?? 'null'}_${it.style_color_id ?? 'null'}`)
  }

  const grouped = new Map<string, IssuedRow>()
  for (const line of lines as Array<{
    po_id: number | null
    style_id: number | null
    style_color_id: number | null
    thread_type_id: number
    thread_color_id: number | null
    issued_full: number | null
    issued_partial: number | null
    returned_full: number | null
    returned_partial: number | null
  }>) {
    const itemKey = `${line.po_id ?? 'null'}_${line.style_id ?? 'null'}_${line.style_color_id ?? 'null'}`
    if (!validKeys.has(itemKey)) continue
    const key = `${line.po_id ?? 'null'}_${line.style_id ?? 'null'}_${line.thread_type_id}_${line.thread_color_id ?? ''}`
    const issued = roundToTwoDecimals((line.issued_full ?? 0) + (line.issued_partial ?? 0) * ratio)
    const returned = roundToTwoDecimals((line.returned_full ?? 0) + (line.returned_partial ?? 0) * ratio)
    const existing = grouped.get(key)
    if (existing) {
      existing.issued_cones += issued
      existing.returned_cones += returned
    } else {
      grouped.set(key, {
        po_id: line.po_id,
        style_id: line.style_id,
        thread_type_id: line.thread_type_id,
        thread_color_id: line.thread_color_id,
        issued_cones: issued,
        returned_cones: returned,
      })
    }
  }
  return Array.from(grouped.values())
}

export async function fetchOrderItemsForWeeks(
  weekIds: number[],
): Promise<Array<{ id: number; week_id: number; po_id: number | null; style_color_id: number; style_id: number | null; quantity: number }>> {
  if (weekIds.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from('thread_order_items')
    .select('id, week_id, po_id, style_color_id, style_id, quantity')
    .in('week_id', weekIds)
    .not('po_id', 'is', null)
    .limit(50000)

  if (error) throw error
  return (data ?? []) as Array<{ id: number; week_id: number; po_id: number | null; style_color_id: number; style_id: number | null; quantity: number }>
}

export async function fetchLastIssuedAtByPo(
  poIds: number[],
  department?: string,
): Promise<Map<number, string>> {
  if (poIds.length === 0) return new Map()

  let query = supabaseAdmin
    .from('thread_issue_lines')
    .select('po_id, thread_issues!inner(created_at, status, department)')
    .in('po_id', poIds)
    .eq('thread_issues.status', 'CONFIRMED')
    .order('created_at', { ascending: false, referencedTable: 'thread_issues' })
    .limit(50000)

  if (department) {
    query = query.eq('thread_issues.department', department)
  }

  const { data, error } = await query
  if (error) throw error

  const map = new Map<number, string>()
  for (const row of (data ?? []) as unknown as Array<{ po_id: number | null; thread_issues: { created_at: string } }>) {
    if (row.po_id == null) continue
    if (!map.has(row.po_id)) {
      map.set(row.po_id, row.thread_issues.created_at)
    }
  }
  return map
}

export type StyleColorQuotaThread = {
  thread_type_id: number
  thread_color_id: number
  supplier_name: string
  tex_number: string
  color_name: string
  quota_cones: number
  product_quantity: number
}

export function buildPoStyleColorQuotaMap(
  orderItems: ThreadOrderItem[],
  specs: SpecRow[],
  calcData: CalculationDataRow[],
  colorByName: Map<string, number>,
  colorById: Map<number, string>,
) {
  const specByStyleColor = new Map<number, SpecRow[]>()
  for (const s of specs) {
    const arr = specByStyleColor.get(s.style_color_id) ?? []
    arr.push(s)
    specByStyleColor.set(s.style_color_id, arr)
  }

  const calcByStyle = new Map<number, CalculationDataRow>()
  for (const c of calcData) calcByStyle.set(c.style_id, c)

  const poStyleColorThreadMap = new Map<
    number | null,
    Map<number, Map<number, Map<string, StyleColorQuotaThread>>>
  >()

  for (const item of orderItems) {
    const poId = item.po_id ?? null
    const styleId = item.style_id
    if (styleId == null) continue

    if (!poStyleColorThreadMap.has(poId)) poStyleColorThreadMap.set(poId, new Map())
    const styleMap = poStyleColorThreadMap.get(poId)!

    if (!styleMap.has(styleId)) styleMap.set(styleId, new Map())
    const scMap = styleMap.get(styleId)!

    if (!scMap.has(item.style_color_id)) scMap.set(item.style_color_id, new Map())
    const threadMap = scMap.get(item.style_color_id)!

    const itemSpecs = specByStyleColor.get(item.style_color_id) ?? []
    const calcRow = calcByStyle.get(styleId)
    if (!calcRow) continue

    for (const spec of itemSpecs) {
      const calcEntry = calcRow.calculations.find(c => c.spec_id === spec.style_thread_spec_id)
      const matchColor = calcEntry?.color_breakdown.find(cb =>
        cb.color_id === item.style_color_id &&
        cb.thread_type_id === spec.thread_type_id &&
        (
          cb.thread_color_id === spec.thread_color_id ||
          (
            cb.thread_color_id == null &&
            cb.thread_color != null &&
            colorByName.get(cb.thread_color) === spec.thread_color_id
          )
        ),
      )
      if (!matchColor) continue

      const meters = (matchColor.meters_per_unit ?? 0) * (item.quantity ?? 0)
      if (meters <= 0 || matchColor.meters_per_cone <= 0) continue
      const conesNeeded = Math.ceil(meters / matchColor.meters_per_cone)
      if (conesNeeded === 0) continue

      const supplierName = matchColor.supplier_name || calcEntry?.supplier_name || ''
      const texNumber = matchColor.tex_number || calcEntry?.tex_number || ''
      const key = `${spec.thread_type_id}_${spec.thread_color_id}`
      const existing = threadMap.get(key)
      if (existing) {
        existing.quota_cones += conesNeeded
      } else {
        threadMap.set(key, {
          thread_type_id: spec.thread_type_id,
          thread_color_id: spec.thread_color_id,
          supplier_name: supplierName,
          tex_number: texNumber,
          color_name: colorById.get(spec.thread_color_id) ?? '',
          quota_cones: conesNeeded,
          product_quantity: item.quantity ?? 0,
        })
      }
    }
  }

  return { poStyleColorThreadMap }
}

export type IssuedByStyleColorRow = {
  po_id: number | null
  style_id: number | null
  style_color_id: number
  thread_type_id: number
  thread_color_id: number | null
  issued_cones: number
  returned_cones: number
}

export async function fetchIssuedByPoStyleColorMultiWeek(
  weekIds: number[],
  ratio: number,
): Promise<IssuedByStyleColorRow[]> {
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
    .select('po_id, style_id, style_color_id, thread_type_id, thread_color_id, issued_full, issued_partial, returned_full, returned_partial, thread_issues!inner(status)')
    .in('po_id', poIds)
    .in('style_color_id', styleColorIds)
    .eq('thread_issues.status', 'CONFIRMED')
    .limit(100000)
  if (linesErr) throw linesErr
  if (!lines || lines.length === 0) return []

  const validKeys = new Set<string>()
  for (const it of items as Array<{ po_id: number | null; style_id: number | null; style_color_id: number | null }>) {
    validKeys.add(`${it.po_id ?? 'null'}_${it.style_id ?? 'null'}_${it.style_color_id ?? 'null'}`)
  }

  const grouped = new Map<string, IssuedByStyleColorRow>()
  for (const line of lines as Array<{
    po_id: number | null
    style_id: number | null
    style_color_id: number
    thread_type_id: number
    thread_color_id: number | null
    issued_full: number | null
    issued_partial: number | null
    returned_full: number | null
    returned_partial: number | null
  }>) {
    const lineKey = `${line.po_id ?? 'null'}_${line.style_id ?? 'null'}_${line.style_color_id ?? 'null'}`
    if (!validKeys.has(lineKey)) continue

    const issued = (line.issued_full ?? 0) + (line.issued_partial ?? 0) * ratio
    const returned = (line.returned_full ?? 0) + (line.returned_partial ?? 0) * ratio
    const groupKey = `${line.po_id ?? 'null'}_${line.style_id ?? 'null'}_${line.style_color_id}_${line.thread_type_id}_${line.thread_color_id ?? ''}`
    const existing = grouped.get(groupKey)
    if (existing) {
      existing.issued_cones += issued
      existing.returned_cones += returned
    } else {
      grouped.set(groupKey, {
        po_id: line.po_id,
        style_id: line.style_id,
        style_color_id: line.style_color_id,
        thread_type_id: line.thread_type_id,
        thread_color_id: line.thread_color_id,
        issued_cones: issued,
        returned_cones: returned,
      })
    }
  }

  return Array.from(grouped.values())
}
