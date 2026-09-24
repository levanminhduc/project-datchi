import { query } from '../../db/query'

interface ReceiveStatsRow {
  id: number
  delivery_id: number
  quantity: number
  created_at: string
  receive_date: string
  received_by: string
  week_id: number
  week_name: string
  thread_type_id: number
  supplier_name: string
  tex_number: string
  tex_label: string | null
  color_name: string
  color_hex: string
  warehouse_name: string
  actual_delivery_date: string | null
  quantity_cones: number
  received_quantity: number
  unit_price: string | null
}

export interface ReceiveStatsDetail {
  id: number
  created_at: string
  receive_date: string
  actual_delivery_date: string | null
  week_name: string
  supplier_name: string
  tex_number: string
  tex_label: string | null
  color_name: string
  warehouse_name: string
  quantity: number
  unit_price: number | null
  amount: number | null
  received_by: string
}

export interface ReceiveStatsGroup {
  key: string
  label: string
  receive_count: number
  received_cones: number
  unpriced_cones: number
  amount: number
}

export interface ReceiveStatsThreadGroup extends ReceiveStatsGroup {
  supplier_name: string
  tex_number: string
  tex_label: string | null
  color_name: string
  color_hex: string
  unit_price: number | null
  ordered_cones: number
  total_received: number
  remaining_cones: number
}

function emptyGroup(key: string, label: string): ReceiveStatsGroup {
  return { key, label, receive_count: 0, received_cones: 0, unpriced_cones: 0, amount: 0 }
}

function addToGroup(group: ReceiveStatsGroup, detail: ReceiveStatsDetail) {
  group.receive_count += 1
  group.received_cones += detail.quantity
  if (detail.amount === null) group.unpriced_cones += detail.quantity
  else group.amount += detail.amount
}

function groupBy(
  details: ReceiveStatsDetail[],
  keyOf: (d: ReceiveStatsDetail) => string,
  labelOf: (d: ReceiveStatsDetail) => string,
): ReceiveStatsGroup[] {
  const map = new Map<string, ReceiveStatsGroup>()
  for (const d of details) {
    const key = keyOf(d)
    if (!map.has(key)) map.set(key, emptyGroup(key, labelOf(d)))
    addToGroup(map.get(key)!, d)
  }
  return [...map.values()]
}

export async function getReceiveStats(dateFrom: string, dateTo: string, includeDetails: boolean) {
  const rows = await query<ReceiveStatsRow>(
    `SELECT
       l.id,
       l.delivery_id,
       l.quantity,
       l.created_at,
       to_char(l.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD') AS receive_date,
       l.received_by,
       d.week_id,
       COALESCE(w.week_name, '') AS week_name,
       d.thread_type_id,
       COALESCE(sup.name, '') AS supplier_name,
       COALESCE(tt.tex_number::text, '') AS tex_number,
       tt.tex_label,
       COALESCE(d.thread_color, '') AS color_name,
       COALESCE(d.thread_color_code, '') AS color_hex,
       COALESCE(wh.name, '') AS warehouse_name,
       to_char(d.actual_delivery_date, 'YYYY-MM-DD') AS actual_delivery_date,
       COALESCE(d.quantity_cones, 0) AS quantity_cones,
       COALESCE(d.received_quantity, 0) AS received_quantity,
       NULLIF(ts.unit_price, 0) AS unit_price
     FROM delivery_receive_logs l
     JOIN thread_order_deliveries d ON d.id = l.delivery_id
     LEFT JOIN thread_types tt ON tt.id = d.thread_type_id
     LEFT JOIN suppliers sup ON sup.id = d.supplier_id
     LEFT JOIN thread_order_weeks w ON w.id = d.week_id
     LEFT JOIN warehouses wh ON wh.id = l.warehouse_id
     LEFT JOIN thread_type_supplier ts ON ts.thread_type_id = d.thread_type_id AND ts.supplier_id = d.supplier_id
     WHERE l.reverted_at IS NULL
       AND l.created_at >= ($1::date)::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh'
       AND l.created_at < ($2::date + 1)::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh'
     ORDER BY l.created_at, l.id`,
    [dateFrom, dateTo],
  )

  const details: ReceiveStatsDetail[] = rows.map((r) => {
    const unitPrice = r.unit_price === null ? null : Number(r.unit_price)
    return {
      id: r.id,
      created_at: r.created_at,
      receive_date: r.receive_date,
      actual_delivery_date: r.actual_delivery_date,
      week_name: r.week_name,
      supplier_name: r.supplier_name,
      tex_number: r.tex_number,
      tex_label: r.tex_label,
      color_name: r.color_name,
      warehouse_name: r.warehouse_name,
      quantity: Number(r.quantity),
      unit_price: unitPrice,
      amount: unitPrice === null ? null : Math.round(unitPrice * Number(r.quantity)),
      received_by: r.received_by,
    }
  })

  const threadMap = new Map<string, ReceiveStatsThreadGroup>()
  const countedDeliveries = new Set<number>()
  rows.forEach((r, i) => {
    const detail = details[i]!
    const key = `${r.thread_type_id}_${r.color_name}`
    let group = threadMap.get(key)
    if (!group) {
      group = {
        ...emptyGroup(key, `${r.supplier_name} - ${r.tex_number} - ${r.color_name}`),
        supplier_name: r.supplier_name,
        tex_number: r.tex_number,
        tex_label: r.tex_label,
        color_name: r.color_name,
        color_hex: r.color_hex,
        unit_price: detail.unit_price,
        ordered_cones: 0,
        total_received: 0,
        remaining_cones: 0,
      }
      threadMap.set(key, group)
    }
    addToGroup(group, detail)
    if (!countedDeliveries.has(r.delivery_id)) {
      countedDeliveries.add(r.delivery_id)
      group.ordered_cones += Number(r.quantity_cones)
      group.total_received += Number(r.received_quantity)
      group.remaining_cones = group.ordered_cones - group.total_received
    }
  })

  const byThread = [...threadMap.values()].sort((a, b) =>
    a.supplier_name.localeCompare(b.supplier_name, 'vi')
    || a.tex_number.localeCompare(b.tex_number, 'vi', { numeric: true })
    || a.color_name.localeCompare(b.color_name, 'vi'),
  )
  const byName = (a: ReceiveStatsGroup, b: ReceiveStatsGroup) => a.label.localeCompare(b.label, 'vi')
  const byKey = (a: ReceiveStatsGroup, b: ReceiveStatsGroup) => a.key.localeCompare(b.key)

  const totalCones = details.reduce((s, d) => s + d.quantity, 0)
  const unpricedCones = details.reduce((s, d) => s + (d.amount === null ? d.quantity : 0), 0)

  return {
    summary: {
      receive_count: details.length,
      delivery_count: countedDeliveries.size,
      total_cones: totalCones,
      priced_cones: totalCones - unpricedCones,
      unpriced_cones: unpricedCones,
      total_amount: details.reduce((s, d) => s + (d.amount ?? 0), 0),
    },
    by_thread: byThread,
    by_supplier: groupBy(details, d => d.supplier_name, d => d.supplier_name || 'Không rõ NCC').sort(byName),
    by_warehouse: groupBy(details, d => d.warehouse_name, d => d.warehouse_name || 'Không rõ kho').sort(byName),
    by_date: groupBy(details, d => d.receive_date, d => d.receive_date).sort(byKey),
    by_week: groupBy(details, d => d.week_name, d => d.week_name || 'Không rõ tuần').sort(byName),
    ...(includeDetails ? { details } : {}),
  }
}
