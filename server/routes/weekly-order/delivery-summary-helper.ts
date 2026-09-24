import { query } from '../../db/query'

export interface DeliveryTraceLine {
  id: number
  thread_type_id: number
  supplier_id: number
  status: string
  quantity_cones: number
  delivered_cones: number
  received_quantity: number
  pending_delivery: number
  pending_receive: number
  color_name: string
}

export interface DeliverySummaryBreakdown {
  thread_type_id: number
  supplier_id: number
  supplier_name: string
  tex_number: string
  color_name: string
  color_hex: string
  ordered: number
  cancelled: number
  delivered: number
  received: number
  pending_delivery: number
  pending_receive: number
  deliveries: DeliveryTraceLine[]
}

export interface WeeklyOrderDeliverySummary {
  total_ordered: number
  total_delivered: number
  total_received: number
  percent_received: number
  by_supplier: DeliverySummaryBreakdown[]
}

type DeliverySummaryDbRow = {
  id: number
  thread_type_id: number
  supplier_id: number | null
  quantity_cones: number | null
  received_quantity: number | null
  status: string
  thread_color: string | null
  thread_color_code: string | null
  supplier: { id: number; name: string } | { id: number; name: string }[] | null
  thread_type: {
    id: number
    name: string
    tex_number: string | null
    color_data: { name: string; hex_code: string | null } | { name: string; hex_code: string | null }[] | null
  } | null
}

function normalizeColorName(value: string): string {
  return value.trim().toLowerCase()
}

export function getDeliveryTraceKey(threadTypeId: number, colorName: string): string {
  return `${threadTypeId}_${normalizeColorName(colorName)}`
}

export async function getWeeklyOrderDeliverySummary(weekId: number): Promise<WeeklyOrderDeliverySummary> {
  const rows = await query<DeliverySummaryDbRow>(
    `SELECT d.id, d.thread_type_id, d.supplier_id, d.quantity_cones, d.received_quantity,
       d.status, d.thread_color, d.thread_color_code,
       CASE WHEN sup.id IS NULL THEN NULL
            ELSE json_build_object('id', sup.id, 'name', sup.name) END AS supplier,
       CASE WHEN tt.id IS NULL THEN NULL
            ELSE json_build_object(
              'id', tt.id, 'name', tt.name, 'tex_number', tt.tex_number,
              'color_data', CASE WHEN col.id IS NULL THEN NULL
                                 ELSE json_build_object('name', col.name, 'hex_code', col.hex_code) END
            ) END AS thread_type
     FROM thread_order_deliveries d
     LEFT JOIN suppliers sup ON sup.id = d.supplier_id
     LEFT JOIN thread_types tt ON tt.id = d.thread_type_id
     LEFT JOIN colors col ON col.id = tt.color_id
     WHERE d.week_id = $1`,
    [weekId],
  )

  let total_ordered = 0
  let total_delivered = 0
  let total_received = 0
  const breakdownMap = new Map<string, DeliverySummaryBreakdown>()

  for (const row of (rows || []) as unknown as DeliverySummaryDbRow[]) {
    const quantityCones = Number(row.quantity_cones || 0)
    const isCancelled = row.status === 'CANCELLED'
    const ordered = isCancelled ? 0 : quantityCones
    const cancelled = isCancelled ? quantityCones : 0
    const received = Number(row.received_quantity || 0)
    const delivered = row.status === 'DELIVERED' ? ordered : 0
    const supplierId = row.supplier_id ?? 0
    const supplier = Array.isArray(row.supplier) ? row.supplier[0] : row.supplier
    const colorData = Array.isArray(row.thread_type?.color_data)
      ? row.thread_type.color_data[0]
      : row.thread_type?.color_data
    const supplierName = supplier?.name || ''
    const texNumber = row.thread_type?.tex_number || ''
    const colorName = row.thread_color || colorData?.name || ''
    const colorHex = row.thread_color_code || colorData?.hex_code || ''
    const key = `${supplierId}_${row.thread_type_id}_${colorName}`

    total_ordered += ordered
    total_delivered += delivered
    total_received += received

    const line: DeliveryTraceLine = {
      id: row.id,
      thread_type_id: row.thread_type_id,
      supplier_id: supplierId,
      status: row.status,
      quantity_cones: quantityCones,
      delivered_cones: delivered,
      received_quantity: received,
      pending_delivery: Math.max(0, ordered - delivered),
      pending_receive: Math.max(0, delivered - received),
      color_name: colorName,
    }

    const existing = breakdownMap.get(key)
    if (existing) {
      existing.ordered += ordered
      existing.cancelled += cancelled
      existing.delivered += delivered
      existing.received += received
      existing.deliveries.push(line)
    } else {
      breakdownMap.set(key, {
        thread_type_id: row.thread_type_id,
        supplier_id: supplierId,
        supplier_name: supplierName,
        tex_number: texNumber,
        color_name: colorName,
        color_hex: colorHex,
        ordered,
        cancelled,
        delivered,
        received,
        pending_delivery: 0,
        pending_receive: 0,
        deliveries: [line],
      })
    }
  }

  const by_supplier = Array.from(breakdownMap.values()).map((row) => ({
    ...row,
    pending_delivery: Math.max(0, row.ordered - row.delivered),
    pending_receive: Math.max(0, row.delivered - row.received),
  }))

  return {
    total_ordered,
    total_delivered,
    total_received,
    percent_received: total_ordered > 0 ? Math.round((total_received / total_ordered) * 100) : 0,
    by_supplier,
  }
}
