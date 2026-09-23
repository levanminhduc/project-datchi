import { query, queryOne } from '../db/query'

type SpecRow = {
  thread_type_id: number
  thread_color_id: number | null
  style_thread_specs: { style_id: number; meters_per_unit: number } | null
}
type TypeRow = { id: number; meters_per_cone: number | null }
type OrderItemRow = { quantity: number }
type IssueLineRow = {
  thread_type_id: number
  thread_color_id: number | null
  issued_full: number
  issued_partial: number
  returned_full: number
  returned_partial: number
}

const SPEC_SELECT = `SELECT scts.thread_type_id, scts.thread_color_id,
    CASE WHEN sts.id IS NULL THEN NULL
      ELSE json_build_object('style_id', sts.style_id, 'meters_per_unit', sts.meters_per_unit)
    END AS style_thread_specs
  FROM style_color_thread_specs scts
  LEFT JOIN style_thread_specs sts ON sts.id = scts.style_thread_spec_id
  WHERE scts.style_color_id = $1 AND scts.thread_type_id = ANY($2)
  LIMIT 10000`

async function fetchConfirmedOrderItems(
  poId: number,
  styleId: number,
  colorId: number
): Promise<OrderItemRow[]> {
  return query<OrderItemRow>(
    `SELECT toi.quantity
     FROM thread_order_items toi
     INNER JOIN thread_order_weeks tow ON tow.id = toi.week_id
     WHERE toi.po_id = $1 AND toi.style_id = $2 AND toi.style_color_id = $3
       AND tow.status = 'CONFIRMED'
     LIMIT 10000`,
    [poId, styleId, colorId]
  ).catch(() => [] as OrderItemRow[])
}

async function fetchConfirmedIssueLines(
  poId: number,
  styleId: number,
  colorId: number,
  threadTypeIds: number[],
  department?: string
): Promise<IssueLineRow[]> {
  const params: unknown[] = [poId, styleId, colorId, threadTypeIds]
  let sql = `SELECT til.thread_type_id, til.thread_color_id, til.issued_full, til.issued_partial,
      til.returned_full, til.returned_partial
    FROM thread_issue_lines til
    INNER JOIN thread_issues ti ON ti.id = til.issue_id
    WHERE til.po_id = $1 AND til.style_id = $2 AND til.style_color_id = $3
      AND til.thread_type_id = ANY($4) AND ti.status = 'CONFIRMED'`
  if (department) {
    params.push(department)
    sql += ` AND ti.department = $${params.length}`
  }
  sql += ' LIMIT 10000'
  return query<IssueLineRow>(sql, params).catch(() => [] as IssueLineRow[])
}

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
  const [specs, types] = await Promise.all([
    query<SpecRow>(SPEC_SELECT, [colorId, threadTypeIds]).catch(() => [] as SpecRow[]),
    query<TypeRow>(
      `SELECT id, meters_per_cone FROM thread_types WHERE id = ANY($1) LIMIT 1000`,
      [threadTypeIds]
    ).catch(() => [] as TypeRow[]),
  ])
  return { specs: specs || [], types: types || [] }
}

async function getTotalAllocatedQty(
  poId: number, styleId: number, colorId: number
): Promise<number> {
  const data = await query<{ product_quantity: number | null }>(
    `SELECT product_quantity FROM dept_product_allocations
     WHERE po_id = $1 AND style_id = $2 AND style_color_id = $3 AND deleted_at IS NULL
     LIMIT 1000`,
    [poId, styleId, colorId]
  ).catch(() => [] as Array<{ product_quantity: number | null }>)
  return (data || []).reduce((sum: number, a) => sum + (a.product_quantity || 0), 0)
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
    const allocation = await queryOne<{ id: number; product_quantity: number }>(
      `SELECT id, product_quantity FROM dept_product_allocations
       WHERE po_id = $1 AND style_id = $2 AND style_color_id = $3
         AND department = $4 AND deleted_at IS NULL`,
      [poId, styleId, colorId, department]
    ).catch(() => null)

    if (allocation) {
      const { specs, types } = await fetchSpecsAndTypes(threadTypeIds, colorId)
      return computeQuotaPerItem(items, allocation.product_quantity, specs, types, styleId, new Map())
    }

    const [totalAllocated, orderRows, { specs, types }] = await Promise.all([
      getTotalAllocatedQty(poId, styleId, colorId),
      fetchConfirmedOrderItems(poId, styleId, colorId),
      fetchSpecsAndTypes(threadTypeIds, colorId),
    ])

    const globalTotal = orderRows.reduce((s: number, i) => s + (i.quantity || 0), 0)
    const remaining = Math.max(0, globalTotal - totalAllocated)
    if (remaining <= 0) {
      const r = new Map<string, number | null>()
      for (const item of items) r.set(compositeKey(item.threadTypeId, item.threadColorId), null)
      return r
    }
    return computeQuotaPerItem(items, remaining, specs, types, styleId, new Map())
  }

  const [orderRows, { specs, types }] = await Promise.all([
    fetchConfirmedOrderItems(poId, styleId, colorId),
    fetchSpecsAndTypes(threadTypeIds, colorId),
  ])

  const totalQty = orderRows.reduce((s: number, i) => s + (i.quantity || 0), 0)
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
    const allocation = await queryOne<{ id: number; product_quantity: number }>(
      `SELECT id, product_quantity FROM dept_product_allocations
       WHERE po_id = $1 AND style_id = $2 AND style_color_id = $3
         AND department = $4 AND deleted_at IS NULL`,
      [poId, styleId, colorId, department]
    ).catch(() => null)

    if (allocation) {
      const [{ specs, types }, issuedLines, globalIssuedLines, globalOrderRows] = await Promise.all([
        fetchSpecsAndTypes(threadTypeIds, colorId),
        fetchConfirmedIssueLines(poId, styleId, colorId, threadTypeIds, department),
        fetchConfirmedIssueLines(poId, styleId, colorId, threadTypeIds),
        fetchConfirmedOrderItems(poId, styleId, colorId),
      ])

      const issuedByKey = buildIssuedMap(issuedLines, ratio, true)
      const deptResult = computeQuotaPerItem(items, allocation.product_quantity, specs, types, styleId, issuedByKey)

      const globalTotalQty = globalOrderRows.reduce((s: number, i) => s + (i.quantity || 0), 0)
      if (globalTotalQty <= 0) {
        const r = new Map<string, number | null>()
        for (const item of items) r.set(compositeKey(item.threadTypeId, item.threadColorId), null)
        return r
      }

      const globalIssuedByKey = buildIssuedMap(globalIssuedLines, ratio, true)
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

    const [totalAllocated, orderRows, { specs, types }, issuedLines, globalIssuedLines] = await Promise.all([
      getTotalAllocatedQty(poId, styleId, colorId),
      fetchConfirmedOrderItems(poId, styleId, colorId),
      fetchSpecsAndTypes(threadTypeIds, colorId),
      fetchConfirmedIssueLines(poId, styleId, colorId, threadTypeIds, department),
      fetchConfirmedIssueLines(poId, styleId, colorId, threadTypeIds),
    ])

    const globalTotal = orderRows.reduce((s: number, i) => s + (i.quantity || 0), 0)
    const remaining = Math.max(0, globalTotal - totalAllocated)
    if (remaining <= 0) {
      const r = new Map<string, number | null>()
      for (const item of items) r.set(compositeKey(item.threadTypeId, item.threadColorId), null)
      return r
    }

    const issuedByKey = buildIssuedMap(issuedLines, ratio, true)
    const deptResult = computeQuotaPerItem(items, remaining, specs, types, styleId, issuedByKey)

    const globalIssuedByKey = buildIssuedMap(globalIssuedLines, ratio, true)
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

  const [orderRows, { specs, types }, issuedLines] = await Promise.all([
    fetchConfirmedOrderItems(poId, styleId, colorId),
    fetchSpecsAndTypes(threadTypeIds, colorId),
    fetchConfirmedIssueLines(poId, styleId, colorId, threadTypeIds),
  ])

  const totalQty = orderRows.reduce((s: number, i) => s + (i.quantity || 0), 0)
  if (totalQty <= 0) {
    const r = new Map<string, number | null>()
    for (const item of items) r.set(compositeKey(item.threadTypeId, item.threadColorId), null)
    return r
  }

  const issuedByKey = buildIssuedMap(issuedLines, ratio, true)
  return computeQuotaPerItem(items, totalQty, specs, types, styleId, issuedByKey)
}
