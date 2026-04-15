import { supabaseAdmin as supabase } from '../db/supabase'

type InventoryRow = {
  thread_type_id: number
  color_id: number | null
  warehouse_id: number
  is_partial: boolean
}

export type InventoryData = {
  reserved: InventoryRow[]
  available: InventoryRow[]
}

export async function batchLookupThreadColorIds(
  items: { thread_type_id: number; style_color_id: number | null | undefined }[]
): Promise<Map<string, number[]>> {
  const result = new Map<string, number[]>()
  const valid = items.filter((i) => i.style_color_id != null)
  if (valid.length === 0) return result

  const uniqueThreadTypeIds = [...new Set(valid.map((i) => i.thread_type_id))]
  const uniqueStyleColorIds = [...new Set(valid.map((i) => i.style_color_id!))]

  const { data } = await supabase
    .from('style_color_thread_specs')
    .select('thread_type_id, style_color_id, thread_color_id')
    .in('thread_type_id', uniqueThreadTypeIds)
    .in('style_color_id', uniqueStyleColorIds)
    .not('thread_color_id', 'is', null)
    .limit(10000)

  if (data) {
    for (const row of data) {
      const key = `${row.thread_type_id}-${row.style_color_id}`
      if (!result.has(key)) {
        result.set(key, [])
      }
      const arr = result.get(key)!
      if (!arr.includes(row.thread_color_id)) {
        arr.push(row.thread_color_id)
      }
    }
  }

  return result
}

export async function batchFindConfirmedWeekIds(
  items: { po_id: number | null | undefined; style_id: number | null | undefined; style_color_id: number | null | undefined }[]
): Promise<Map<string, number[]>> {
  const result = new Map<string, number[]>()
  const valid = items.filter((i) => i.po_id && i.style_id && i.style_color_id)
  if (valid.length === 0) return result

  const uniquePoIds = [...new Set(valid.map((i) => i.po_id!))]
  const uniqueStyleIds = [...new Set(valid.map((i) => i.style_id!))]
  const uniqueColorIds = [...new Set(valid.map((i) => i.style_color_id!))]

  const { data, error } = await supabase
    .from('thread_order_items')
    .select('po_id, style_id, style_color_id, week_id, thread_order_weeks!inner(status)')
    .in('po_id', uniquePoIds)
    .in('style_id', uniqueStyleIds)
    .in('style_color_id', uniqueColorIds)
    .eq('thread_order_weeks.status', 'CONFIRMED')
    .limit(10000)

  if (error || !data) return result

  for (const row of data) {
    const key = `${row.po_id}-${row.style_id}-${row.style_color_id}`
    if (!result.has(key)) result.set(key, [])
    const arr = result.get(key)!
    if (!arr.includes(row.week_id)) arr.push(row.week_id)
  }

  return result
}

export async function batchLoadInventoryData(
  threadTypeIds: number[],
  allWeekIds: number[],
  warehouseId?: number
): Promise<InventoryData> {
  if (threadTypeIds.length === 0) return { reserved: [], available: [] }

  const [reservedResult, availableResult] = await Promise.all([
    allWeekIds.length > 0
      ? (() => {
          let q = supabase
            .from('thread_inventory')
            .select('thread_type_id, color_id, warehouse_id, is_partial')
            .in('thread_type_id', threadTypeIds)
            .eq('status', 'RESERVED_FOR_ORDER')
            .in('reserved_week_id', allWeekIds)
          if (warehouseId) q = q.eq('warehouse_id', warehouseId)
          return q.limit(1000000)
        })()
      : Promise.resolve({ data: [] as InventoryRow[] }),
    (() => {
      let q = supabase
        .from('thread_inventory')
        .select('thread_type_id, color_id, warehouse_id, is_partial')
        .in('thread_type_id', threadTypeIds)
        .in('status', ['AVAILABLE', 'RECEIVED', 'INSPECTED'])
      if (warehouseId) q = q.eq('warehouse_id', warehouseId)
      return q.limit(1000000)
    })(),
  ])

  return {
    reserved: (reservedResult.data ?? []) as InventoryRow[],
    available: (availableResult.data ?? []) as InventoryRow[],
  }
}
