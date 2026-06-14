import { query } from '../db/query'
import type { InventoryData } from './issue-v2-batch-lookups'
import { compositeKey, type ThreadColorItem } from './issue-v2-batch-quota'

const roundToTwoDecimals = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100

const calculateIssuedEquivalent = (full: number, partial: number, ratio: number): number =>
  full + partial * ratio

export function detectWarehouseFromData(
  threadTypeId: number,
  weekIds: number[],
  colorId: number | undefined,
  inventory: InventoryData
): number | undefined {
  if (weekIds.length > 0) {
    const match = inventory.reserved.find(
      (r) =>
        r.thread_type_id === threadTypeId &&
        (!colorId || r.color_id === colorId)
    )
    if (match) return match.warehouse_id
  }

  const freeCones = inventory.available.filter(
    (r) => r.thread_type_id === threadTypeId && (!colorId || r.color_id === colorId)
  )
  if (freeCones.length === 0) return undefined

  const counts = new Map<number, number>()
  for (const cone of freeCones) {
    counts.set(cone.warehouse_id, (counts.get(cone.warehouse_id) || 0) + 1)
  }

  let bestWarehouseId: number | undefined
  let maxCount = 0
  for (const [whId, count] of counts) {
    if (count > maxCount) {
      maxCount = count
      bestWarehouseId = whId
    }
  }
  return bestWarehouseId
}

export function computeStockFromData(
  threadTypeId: number,
  warehouseId: number | undefined,
  weekIds: number[],
  colorId: number | undefined,
  inventory: InventoryData
): { full_cones: number; partial_cones: number } {
  let fullCount = 0
  let partialCount = 0

  const matchRow = (r: { thread_type_id: number; color_id: number | null; warehouse_id: number; is_partial: boolean }) =>
    r.thread_type_id === threadTypeId &&
    (!warehouseId || r.warehouse_id === warehouseId) &&
    (!colorId || r.color_id === colorId)

  if (weekIds.length > 0) {
    for (const r of inventory.reserved) {
      if (matchRow(r)) {
        if (r.is_partial) partialCount++
        else fullCount++
      }
    }
  }

  for (const r of inventory.available) {
    if (matchRow(r)) {
      if (r.is_partial) partialCount++
      else fullCount++
    }
  }

  return { full_cones: fullCount, partial_cones: partialCount }
}

export async function batchGetStockBreakdownByWarehouse(
  items: { threadTypeId: number; colorId?: number }[],
  weekIds: number[]
): Promise<Map<string, { warehouse_id: number; warehouse_name: string; full_cones: number; partial_cones: number }[]>> {
  type BreakdownEntry = { warehouse_id: number; warehouse_name: string; full_cones: number; partial_cones: number }
  const result = new Map<string, BreakdownEntry[]>()
  if (items.length === 0) return result

  const uniqueIds = [...new Set(items.map((i) => i.threadTypeId))]

  type ConeRow = { thread_type_id: number; color_id: number | null; warehouse_id: number; is_partial: boolean; warehouses: { name: string } | null }

  const reservedPromise: Promise<ConeRow[]> =
    weekIds.length > 0
      ? query<ConeRow>(
          `SELECT ti.thread_type_id, ti.color_id, ti.warehouse_id, ti.is_partial,
             json_build_object('name', w.name) AS warehouses
           FROM thread_inventory ti
           INNER JOIN warehouses w ON w.id = ti.warehouse_id
           WHERE ti.thread_type_id = ANY($1) AND ti.status = 'RESERVED_FOR_ORDER'
             AND ti.reserved_week_id = ANY($2)
           LIMIT 1000000`,
          [uniqueIds, weekIds]
        ).catch(() => [] as ConeRow[])
      : Promise.resolve([] as ConeRow[])

  const freePromise: Promise<ConeRow[]> = query<ConeRow>(
    `SELECT ti.thread_type_id, ti.color_id, ti.warehouse_id, ti.is_partial,
       json_build_object('name', w.name) AS warehouses
     FROM thread_inventory ti
     INNER JOIN warehouses w ON w.id = ti.warehouse_id
     WHERE ti.thread_type_id = ANY($1) AND ti.status IN ('AVAILABLE', 'RECEIVED', 'INSPECTED')
     LIMIT 1000000`,
    [uniqueIds]
  ).catch(() => [] as ConeRow[])

  const [reservedData, freeData] = await Promise.all([reservedPromise, freePromise])

  const allCones = [...reservedData, ...freeData]

  for (const item of items) {
    const key = `${item.threadTypeId}-${item.colorId ?? 'null'}`
    const matching = allCones.filter(
      (c: any) => c.thread_type_id === item.threadTypeId && (!item.colorId || c.color_id === item.colorId)
    )

    const whMap = new Map<number, { warehouse_name: string; full_cones: number; partial_cones: number }>()
    for (const cone of matching) {
      const whId = cone.warehouse_id
      const whName = (cone.warehouses as any)?.name || ''
      if (!whMap.has(whId)) {
        whMap.set(whId, { warehouse_name: whName, full_cones: 0, partial_cones: 0 })
      }
      const entry = whMap.get(whId)!
      if (cone.is_partial) entry.partial_cones++
      else entry.full_cones++
    }

    result.set(key, Array.from(whMap.entries()).map(([warehouse_id, data]) => ({ warehouse_id, ...data })))
  }

  return result
}

export async function batchGetConfirmedIssuedGross(
  items: ThreadColorItem[],
  poId: number,
  styleId: number,
  colorId: number,
  ratio: number,
  department?: string
): Promise<Map<string, number>> {
  const result = new Map<string, number>()
  if (items.length === 0) return result

  const threadTypeIds = [...new Set(items.map((i) => i.threadTypeId))]

  const params: unknown[] = [poId, styleId, colorId, threadTypeIds]
  let sql = `SELECT til.thread_type_id, til.thread_color_id, til.issued_full, til.issued_partial
    FROM thread_issue_lines til
    INNER JOIN thread_issues ti ON ti.id = til.issue_id
    WHERE til.po_id = $1 AND til.style_id = $2 AND til.style_color_id = $3
      AND til.thread_type_id = ANY($4) AND ti.status = 'CONFIRMED'`

  if (department) {
    params.push(department)
    sql += ` AND ti.department = $${params.length}`
  }

  sql += ' LIMIT 10000'

  let data: Array<{ thread_type_id: number; thread_color_id: number | null; issued_full: number; issued_partial: number }>
  try {
    data = await query<{ thread_type_id: number; thread_color_id: number | null; issued_full: number; issued_partial: number }>(sql, params)
  } catch {
    return result
  }

  const rawSums = new Map<string, number>()
  for (const line of data) {
    const key = compositeKey(line.thread_type_id, (line as any).thread_color_id ?? null)
    const prev = rawSums.get(key) || 0
    rawSums.set(
      key,
      prev + calculateIssuedEquivalent(line.issued_full || 0, line.issued_partial || 0, ratio)
    )
  }
  for (const [key, sum] of rawSums) {
    result.set(key, roundToTwoDecimals(sum))
  }
  return result
}
