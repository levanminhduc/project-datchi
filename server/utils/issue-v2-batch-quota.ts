import { supabaseAdmin as supabase } from '../db/supabase'

const roundToTwoDecimals = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100

const calcIssued = (full: number, partial: number, ratio: number): number =>
  full + partial * ratio

function computeQuotaPerType(
  threadTypeIds: number[],
  totalQty: number,
  specs: any[],
  types: any[],
  styleId: number,
  issuedByType: Map<number, number>
): Map<number, number | null> {
  const result = new Map<number, number | null>()
  for (const ttId of threadTypeIds) {
    const spec = specs.find(
      (s: any) => s.thread_type_id === ttId && s.style_thread_specs?.style_id === styleId
    )
    const tt = types.find((t: any) => t.id === ttId)
    if (!spec?.style_thread_specs?.meters_per_unit || !tt?.meters_per_cone) {
      result.set(ttId, null)
      continue
    }
    const totalMeters = totalQty * (spec.style_thread_specs.meters_per_unit as number)
    const baseQuota = Math.ceil(totalMeters / tt.meters_per_cone)
    const issuedNet = issuedByType.get(ttId) || 0
    result.set(ttId, roundToTwoDecimals(Math.max(0, baseQuota - issuedNet)))
  }
  return result
}

function buildIssuedMap(data: any[], ratio: number, withReturns: boolean): Map<number, number> {
  const map = new Map<number, number>()
  for (const line of data) {
    const prev = map.get(line.thread_type_id) || 0
    const issued = calcIssued(line.issued_full || 0, line.issued_partial || 0, ratio)
    const returned = withReturns ? calcIssued(line.returned_full || 0, line.returned_partial || 0, ratio) : 0
    map.set(line.thread_type_id, prev + Math.max(0, issued - returned))
  }
  return map
}

async function fetchSpecsAndTypes(threadTypeIds: number[], colorId: number) {
  const [specsResult, typesResult] = await Promise.all([
    supabase
      .from('style_color_thread_specs')
      .select('thread_type_id, style_thread_specs:style_thread_spec_id(style_id, meters_per_unit)')
      .eq('style_color_id', colorId)
      .in('thread_type_id', threadTypeIds)
      .limit(10000),
    supabase
      .from('thread_types')
      .select('id, meters_per_cone')
      .in('id', threadTypeIds)
      .limit(1000),
  ])
  return { specs: specsResult.data || [], types: typesResult.data || [] }
}

export async function batchGetBaseQuotaCones(
  threadTypeIds: number[],
  poId: number,
  styleId: number,
  colorId: number
): Promise<Map<number, number | null>> {
  if (threadTypeIds.length === 0) return new Map()

  const [orderResult, { specs, types }] = await Promise.all([
    supabase
      .from('thread_order_items')
      .select('quantity, thread_order_weeks!inner(status)')
      .eq('po_id', poId).eq('style_id', styleId).eq('style_color_id', colorId)
      .eq('thread_order_weeks.status', 'CONFIRMED').limit(10000),
    fetchSpecsAndTypes(threadTypeIds, colorId),
  ])

  const totalQty = (orderResult.data || []).reduce((s: number, i: any) => s + (i.quantity || 0), 0)
  if (totalQty <= 0) {
    const r = new Map<number, number | null>()
    for (const id of threadTypeIds) r.set(id, null)
    return r
  }

  return computeQuotaPerType(threadTypeIds, totalQty, specs, types, styleId, new Map())
}

export async function batchGetQuotaCones(
  threadTypeIds: number[],
  poId: number,
  styleId: number,
  colorId: number,
  ratio: number,
  department?: string
): Promise<Map<number, number | null>> {
  if (threadTypeIds.length === 0) return new Map()

  if (department) {
    const { data: allocation } = await supabase
      .from('dept_product_allocations')
      .select('id, product_quantity')
      .eq('po_id', poId).eq('style_id', styleId).eq('style_color_id', colorId)
      .eq('department', department).is('deleted_at', null).maybeSingle()

    if (allocation) {
      const [{ specs, types }, issuedResult] = await Promise.all([
        fetchSpecsAndTypes(threadTypeIds, colorId),
        supabase
          .from('thread_issue_lines')
          .select('thread_type_id, issued_full, issued_partial, returned_full, returned_partial, thread_issues!inner(status, department)')
          .eq('po_id', poId).eq('style_id', styleId).eq('style_color_id', colorId)
          .in('thread_type_id', threadTypeIds)
          .eq('thread_issues.status', 'CONFIRMED').eq('thread_issues.department', department)
          .limit(10000),
      ])
      const issuedByType = buildIssuedMap((issuedResult.data || []) as any[], ratio, true)
      return computeQuotaPerType(threadTypeIds, allocation.product_quantity, specs, types, styleId, issuedByType)
    }
  }

  const [orderResult, { specs, types }, issuedResult] = await Promise.all([
    supabase
      .from('thread_order_items')
      .select('quantity, thread_order_weeks!inner(status)')
      .eq('po_id', poId).eq('style_id', styleId).eq('style_color_id', colorId)
      .eq('thread_order_weeks.status', 'CONFIRMED').limit(10000),
    fetchSpecsAndTypes(threadTypeIds, colorId),
    supabase
      .from('thread_issue_lines')
      .select('thread_type_id, issued_full, issued_partial, returned_full, returned_partial, thread_issues!inner(status)')
      .eq('po_id', poId).eq('style_id', styleId).eq('style_color_id', colorId)
      .in('thread_type_id', threadTypeIds)
      .eq('thread_issues.status', 'CONFIRMED').limit(10000),
  ])

  const totalQty = (orderResult.data || []).reduce((s: number, i: any) => s + (i.quantity || 0), 0)
  if (totalQty <= 0) {
    const r = new Map<number, number | null>()
    for (const id of threadTypeIds) r.set(id, null)
    return r
  }

  const issuedByType = buildIssuedMap((issuedResult.data || []) as any[], ratio, true)
  return computeQuotaPerType(threadTypeIds, totalQty, specs, types, styleId, issuedByType)
}
