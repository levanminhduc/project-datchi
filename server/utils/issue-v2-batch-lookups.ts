import { query } from '../db/query'

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

  let data: Array<{ thread_type_id: number; style_color_id: number; thread_color_id: number }> = []
  try {
    data = await query<{ thread_type_id: number; style_color_id: number; thread_color_id: number }>(
      `SELECT thread_type_id, style_color_id, thread_color_id
       FROM style_color_thread_specs
       WHERE thread_type_id = ANY($1) AND style_color_id = ANY($2)
         AND thread_color_id IS NOT NULL
       LIMIT 10000`,
      [uniqueThreadTypeIds, uniqueStyleColorIds]
    )
  } catch {
    return result
  }

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

  let data: Array<{ po_id: number; style_id: number; style_color_id: number; week_id: number }>
  try {
    data = await query<{ po_id: number; style_id: number; style_color_id: number; week_id: number }>(
      `SELECT toi.po_id, toi.style_id, toi.style_color_id, toi.week_id
       FROM thread_order_items toi
       INNER JOIN thread_order_weeks tow ON tow.id = toi.week_id
       WHERE toi.po_id = ANY($1) AND toi.style_id = ANY($2) AND toi.style_color_id = ANY($3)
         AND tow.status = 'CONFIRMED'
       LIMIT 10000`,
      [uniquePoIds, uniqueStyleIds, uniqueColorIds]
    )
  } catch {
    return result
  }

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

  const reservedPromise: Promise<InventoryRow[]> =
    allWeekIds.length > 0
      ? (() => {
          const params: unknown[] = [threadTypeIds, allWeekIds]
          let sql = `SELECT thread_type_id, color_id, warehouse_id, is_partial
            FROM thread_inventory
            WHERE thread_type_id = ANY($1) AND status = 'RESERVED_FOR_ORDER'
              AND reserved_week_id = ANY($2)`
          if (warehouseId) {
            params.push(warehouseId)
            sql += ` AND warehouse_id = $${params.length}`
          }
          sql += ' LIMIT 1000000'
          return query<InventoryRow>(sql, params).catch(() => [] as InventoryRow[])
        })()
      : Promise.resolve([] as InventoryRow[])

  const availablePromise: Promise<InventoryRow[]> = (() => {
    const params: unknown[] = [threadTypeIds]
    let sql = `SELECT thread_type_id, color_id, warehouse_id, is_partial
      FROM thread_inventory
      WHERE thread_type_id = ANY($1) AND status IN ('AVAILABLE', 'RECEIVED', 'INSPECTED')`
    if (warehouseId) {
      params.push(warehouseId)
      sql += ` AND warehouse_id = $${params.length}`
    }
    sql += ' LIMIT 1000000'
    return query<InventoryRow>(sql, params).catch(() => [] as InventoryRow[])
  })()

  const [reserved, available] = await Promise.all([reservedPromise, availablePromise])

  return {
    reserved: reserved as InventoryRow[],
    available: available as InventoryRow[],
  }
}
