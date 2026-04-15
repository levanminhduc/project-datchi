import { supabaseAdmin as supabase } from '../db/supabase'

export type ThreadColorItem = { threadTypeId: number; threadColorId: number | null }

export function compositeKey(threadTypeId: number, threadColorId: number | null | undefined): string {
  return `${threadTypeId}:${threadColorId ?? 'null'}`
}

const roundToTwoDecimals = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100

const calcIssued = (full: number, partial: number, ratio: number): number =>
  full + partial * ratio

function computeQuotaPerItem(
  items: ThreadColorItem[],
  totalQty: number,
  specs: any[],
  types: any[],
  styleId: number,
  issuedByKey: Map<string, number>
): Map<string, number | null> {
  const result = new Map<string, number | null>()

  for (const item of items) {
    const key = compositeKey(item.threadTypeId, item.threadColorId)
    if (result.has(key)) continue

    const matchingSpecs = specs.filter(
      (s: any) =>
        s.thread_type_id === item.threadTypeId &&
        (s.thread_color_id ?? null) === item.threadColorId &&
        s.style_thread_specs?.style_id === styleId
    )
    const tt = types.find((t: any) => t.id === item.threadTypeId)

    if (matchingSpecs.length === 0 || !tt?.meters_per_cone) {
      result.set(key, null)
      continue
    }

    const totalMetersPerUnit = matchingSpecs.reduce(
      (sum: number, s: any) => sum + (s.style_thread_specs.meters_per_unit as number),
      0
    )
    const totalMeters = totalQty * totalMetersPerUnit
    const baseQuota = Math.ceil(totalMeters / tt.meters_per_cone)
    const issuedNet = issuedByKey.get(key) || 0
    result.set(key, roundToTwoDecimals(Math.max(0, baseQuota - issuedNet)))
  }

  return result
}

function buildIssuedMap(data: any[], ratio: number, withReturns: boolean): Map<string, number> {
  const map = new Map<string, number>()
  for (const line of data) {
    const key = compositeKey(line.thread_type_id, line.thread_color_id ?? null)
    const prev = map.get(key) || 0
    const issued = calcIssued(line.issued_full || 0, line.issued_partial || 0, ratio)
    const returned = withReturns ? calcIssued(line.returned_full || 0, line.returned_partial || 0, ratio) : 0
    map.set(key, prev + Math.max(0, issued - returned))
  }
  return map
}

async function fetchSpecsAndTypes(threadTypeIds: number[], colorId: number) {
  const [specsResult, typesResult] = await Promise.all([
    supabase
      .from('style_color_thread_specs')
      .select('thread_type_id, thread_color_id, style_thread_specs:style_thread_spec_id(style_id, meters_per_unit)')
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

async function getTotalAllocatedQty(
  poId: number, styleId: number, colorId: number
): Promise<number> {
  const { data } = await supabase
    .from('dept_product_allocations')
    .select('product_quantity')
    .eq('po_id', poId).eq('style_id', styleId).eq('style_color_id', colorId)
    .is('deleted_at', null)
    .limit(1000)
  return (data || []).reduce((sum: number, a: any) => sum + (a.product_quantity || 0), 0)
}

export async function batchGetBaseQuotaCones(
  items: ThreadColorItem[],
  poId: number,
  styleId: number,
  colorId: number,
  department?: string
): Promise<Map<string, number | null>> {
  if (items.length === 0) return new Map()

  const threadTypeIds = [...new Set(items.map((i) => i.threadTypeId))]

  if (department) {
    const { data: allocation } = await supabase
      .from('dept_product_allocations')
      .select('id, product_quantity')
      .eq('po_id', poId).eq('style_id', styleId).eq('style_color_id', colorId)
      .eq('department', department).is('deleted_at', null).maybeSingle()

    if (allocation) {
      const { specs, types } = await fetchSpecsAndTypes(threadTypeIds, colorId)
      return computeQuotaPerItem(items, allocation.product_quantity, specs, types, styleId, new Map())
    }

    const [totalAllocated, orderResult, { specs, types }] = await Promise.all([
      getTotalAllocatedQty(poId, styleId, colorId),
      supabase
        .from('thread_order_items')
        .select('quantity, thread_order_weeks!inner(status)')
        .eq('po_id', poId).eq('style_id', styleId).eq('style_color_id', colorId)
        .eq('thread_order_weeks.status', 'CONFIRMED').limit(10000),
      fetchSpecsAndTypes(threadTypeIds, colorId),
    ])

    const globalTotal = (orderResult.data || []).reduce((s: number, i: any) => s + (i.quantity || 0), 0)
    const remaining = Math.max(0, globalTotal - totalAllocated)
    if (remaining <= 0) {
      const r = new Map<string, number | null>()
      for (const item of items) r.set(compositeKey(item.threadTypeId, item.threadColorId), null)
      return r
    }
    return computeQuotaPerItem(items, remaining, specs, types, styleId, new Map())
  }

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
    const r = new Map<string, number | null>()
    for (const item of items) r.set(compositeKey(item.threadTypeId, item.threadColorId), null)
    return r
  }

  return computeQuotaPerItem(items, totalQty, specs, types, styleId, new Map())
}

export async function batchGetQuotaConesWithPending(
  items: ThreadColorItem[],
  poId: number,
  styleId: number,
  colorId: number,
  ratio: number,
  department?: string,
  pendingConsumption?: Map<string, number>
): Promise<Map<string, number | null>> {
  const baseResult = await batchGetQuotaCones(items, poId, styleId, colorId, ratio, department)

  if (!pendingConsumption || pendingConsumption.size === 0) return baseResult

  const adjusted = new Map<string, number | null>()
  for (const [key, quota] of baseResult) {
    if (quota === null) {
      adjusted.set(key, null)
      continue
    }
    const pending = pendingConsumption.get(key) || 0
    adjusted.set(key, Math.max(0, roundToTwoDecimals(quota - pending)))
  }
  return adjusted
}

export async function batchGetQuotaCones(
  items: ThreadColorItem[],
  poId: number,
  styleId: number,
  colorId: number,
  ratio: number,
  department?: string
): Promise<Map<string, number | null>> {
  if (items.length === 0) return new Map()

  const threadTypeIds = [...new Set(items.map((i) => i.threadTypeId))]

  if (department) {
    const { data: allocation } = await supabase
      .from('dept_product_allocations')
      .select('id, product_quantity')
      .eq('po_id', poId).eq('style_id', styleId).eq('style_color_id', colorId)
      .eq('department', department).is('deleted_at', null).maybeSingle()

    if (allocation) {
      const [{ specs, types }, issuedResult, globalIssuedResult, globalOrderResult] = await Promise.all([
        fetchSpecsAndTypes(threadTypeIds, colorId),
        supabase
          .from('thread_issue_lines')
          .select('thread_type_id, thread_color_id, issued_full, issued_partial, returned_full, returned_partial, thread_issues!inner(status, department)')
          .eq('po_id', poId).eq('style_id', styleId).eq('style_color_id', colorId)
          .in('thread_type_id', threadTypeIds)
          .eq('thread_issues.status', 'CONFIRMED').eq('thread_issues.department', department)
          .limit(10000),
        supabase
          .from('thread_issue_lines')
          .select('thread_type_id, thread_color_id, issued_full, issued_partial, returned_full, returned_partial, thread_issues!inner(status)')
          .eq('po_id', poId).eq('style_id', styleId).eq('style_color_id', colorId)
          .in('thread_type_id', threadTypeIds)
          .eq('thread_issues.status', 'CONFIRMED')
          .limit(10000),
        supabase
          .from('thread_order_items')
          .select('quantity, thread_order_weeks!inner(status)')
          .eq('po_id', poId).eq('style_id', styleId).eq('style_color_id', colorId)
          .eq('thread_order_weeks.status', 'CONFIRMED').limit(10000),
      ])

      const issuedByKey = buildIssuedMap((issuedResult.data || []) as any[], ratio, true)
      const deptResult = computeQuotaPerItem(items, allocation.product_quantity, specs, types, styleId, issuedByKey)

      const globalTotalQty = (globalOrderResult.data || []).reduce((s: number, i: any) => s + (i.quantity || 0), 0)
      if (globalTotalQty <= 0) {
        const r = new Map<string, number | null>()
        for (const item of items) r.set(compositeKey(item.threadTypeId, item.threadColorId), null)
        return r
      }

      const globalIssuedByKey = buildIssuedMap((globalIssuedResult.data || []) as any[], ratio, true)
      const globalResult = computeQuotaPerItem(items, globalTotalQty, specs, types, styleId, globalIssuedByKey)

      const clamped = new Map<string, number | null>()
      for (const [key, deptQuota] of deptResult) {
        const globalQuota = globalResult.get(key)
        if (deptQuota === null || globalQuota === null || globalQuota === undefined) {
          clamped.set(key, null)
        } else {
          clamped.set(key, roundToTwoDecimals(Math.min(deptQuota, globalQuota)))
        }
      }
      return clamped
    }

    const [totalAllocated, orderResult, { specs, types }, issuedResult, globalIssuedResult] = await Promise.all([
      getTotalAllocatedQty(poId, styleId, colorId),
      supabase
        .from('thread_order_items')
        .select('quantity, thread_order_weeks!inner(status)')
        .eq('po_id', poId).eq('style_id', styleId).eq('style_color_id', colorId)
        .eq('thread_order_weeks.status', 'CONFIRMED').limit(10000),
      fetchSpecsAndTypes(threadTypeIds, colorId),
      supabase
        .from('thread_issue_lines')
        .select('thread_type_id, thread_color_id, issued_full, issued_partial, returned_full, returned_partial, thread_issues!inner(status, department)')
        .eq('po_id', poId).eq('style_id', styleId).eq('style_color_id', colorId)
        .in('thread_type_id', threadTypeIds)
        .eq('thread_issues.status', 'CONFIRMED').eq('thread_issues.department', department)
        .limit(10000),
      supabase
        .from('thread_issue_lines')
        .select('thread_type_id, thread_color_id, issued_full, issued_partial, returned_full, returned_partial, thread_issues!inner(status)')
        .eq('po_id', poId).eq('style_id', styleId).eq('style_color_id', colorId)
        .in('thread_type_id', threadTypeIds)
        .eq('thread_issues.status', 'CONFIRMED')
        .limit(10000),
    ])

    const globalTotal = (orderResult.data || []).reduce((s: number, i: any) => s + (i.quantity || 0), 0)
    const remaining = Math.max(0, globalTotal - totalAllocated)
    if (remaining <= 0) {
      const r = new Map<string, number | null>()
      for (const item of items) r.set(compositeKey(item.threadTypeId, item.threadColorId), null)
      return r
    }

    const issuedByKey = buildIssuedMap((issuedResult.data || []) as any[], ratio, true)
    const deptResult = computeQuotaPerItem(items, remaining, specs, types, styleId, issuedByKey)

    const globalIssuedByKey = buildIssuedMap((globalIssuedResult.data || []) as any[], ratio, true)
    const globalResult = computeQuotaPerItem(items, globalTotal, specs, types, styleId, globalIssuedByKey)

    const clamped = new Map<string, number | null>()
    for (const [key, deptQuota] of deptResult) {
      const globalQuota = globalResult.get(key)
      if (deptQuota === null || globalQuota === null || globalQuota === undefined) {
        clamped.set(key, null)
      } else {
        clamped.set(key, roundToTwoDecimals(Math.min(deptQuota, globalQuota)))
      }
    }
    return clamped
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
      .select('thread_type_id, thread_color_id, issued_full, issued_partial, returned_full, returned_partial, thread_issues!inner(status)')
      .eq('po_id', poId).eq('style_id', styleId).eq('style_color_id', colorId)
      .in('thread_type_id', threadTypeIds)
      .eq('thread_issues.status', 'CONFIRMED').limit(10000),
  ])

  const totalQty = (orderResult.data || []).reduce((s: number, i: any) => s + (i.quantity || 0), 0)
  if (totalQty <= 0) {
    const r = new Map<string, number | null>()
    for (const item of items) r.set(compositeKey(item.threadTypeId, item.threadColorId), null)
    return r
  }

  const issuedByKey = buildIssuedMap((issuedResult.data || []) as any[], ratio, true)
  return computeQuotaPerItem(items, totalQty, specs, types, styleId, issuedByKey)
}
