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
  thread_color_id: number
  supplier_name: string
  tex_number: string
  color_name: string
  quota_cones: number
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
