import { supabaseAdmin as supabase } from '../db/supabase'
import type { InventoryData } from './issue-v2-batch-lookups'

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

  const [reservedResult, freeResult] = await Promise.all([
    weekIds.length > 0
      ? supabase
          .from('thread_inventory')
          .select('thread_type_id, color_id, warehouse_id, is_partial, warehouses!inner(name)')
          .in('thread_type_id', uniqueIds)
          .eq('status', 'RESERVED_FOR_ORDER')
          .in('reserved_week_id', weekIds)
          .limit(10000)
      : Promise.resolve({ data: [] as any[] }),
    supabase
      .from('thread_inventory')
      .select('thread_type_id, color_id, warehouse_id, is_partial, warehouses!inner(name)')
      .in('thread_type_id', uniqueIds)
      .in('status', ['AVAILABLE', 'RECEIVED', 'INSPECTED'])
      .limit(10000),
  ])

  const allCones = [...(reservedResult.data || []), ...(freeResult.data || [])]

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
  threadTypeIds: number[],
  poId: number,
  styleId: number,
  colorId: number,
  ratio: number
): Promise<Map<number, number>> {
  const result = new Map<number, number>()
  if (threadTypeIds.length === 0) return result

  const { data, error } = await supabase
    .from('thread_issue_lines')
    .select('thread_type_id, issued_full, issued_partial, thread_issues!inner(status)')
    .eq('po_id', poId)
    .eq('style_id', styleId)
    .eq('style_color_id', colorId)
    .in('thread_type_id', threadTypeIds)
    .eq('thread_issues.status', 'CONFIRMED')
    .limit(10000)

  if (error || !data) return result

  const rawSums = new Map<number, number>()
  for (const line of data) {
    const prev = rawSums.get(line.thread_type_id) || 0
    rawSums.set(
      line.thread_type_id,
      prev + calculateIssuedEquivalent(line.issued_full || 0, line.issued_partial || 0, ratio)
    )
  }
  for (const [ttId, sum] of rawSums) {
    result.set(ttId, roundToTwoDecimals(sum))
  }
  return result
}
