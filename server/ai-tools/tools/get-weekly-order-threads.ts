import { z } from 'zod'
import { getDeliveryTraceKey } from '../../routes/weekly-order/delivery-summary-helper'
import { AiToolError, defineTool, type AiToolContext } from '../types'

const reservationSchema = z.looseObject({
  data: z.array(z.looseObject({
    thread_type_id: z.number(),
    color_name: z.string(),
    thread_type_name: z.string(),
    needed: z.coerce.number(),
    reserved: z.coerce.number(),
    reserved_physical_cones: z.coerce.number(),
    shortage: z.coerce.number(),
  })),
})

const deliverySchema = z.looseObject({
  data: z.looseObject({
    total_ordered: z.coerce.number(),
    total_delivered: z.coerce.number(),
    total_received: z.coerce.number(),
    percent_received: z.coerce.number(),
    by_supplier: z.array(z.looseObject({
      thread_type_id: z.number(),
      supplier_name: z.string(),
      tex_number: z.string(),
      color_name: z.string(),
      ordered: z.coerce.number(),
      cancelled: z.coerce.number(),
      delivered: z.coerce.number(),
      received: z.coerce.number(),
      pending_delivery: z.coerce.number(),
      pending_receive: z.coerce.number(),
    })),
  }),
})

const resultsSchema = z.looseObject({
  data: z.looseObject({
    summary_data: z.array(z.looseObject({
      thread_type_id: z.number(),
      thread_type_name: z.string().nullish(),
      supplier_name: z.string().nullish(),
      tex_number: z.string().nullish(),
    })).nullish(),
  }),
})

interface ThreadNames {
  thread_name: string | null
  supplier: string | null
  tex: string | null
}

interface ThreadRow extends ThreadNames {
  color: string | null
  needed_cones: number
  reserved_cones: number
  reserved_physical_cones: number
  shortage_cones: number
  ordered_from_supplier: number
  delivered_by_supplier: number
  received_into_stock: number
  pending_delivery: number
  pending_receive: number
  cancelled: number
}

async function loadNames(ctx: AiToolContext, weekId: number): Promise<Map<number, ThreadNames>> {
  const names = new Map<number, ThreadNames>()
  try {
    const body = await ctx.get(`/api/weekly-orders/${weekId}/results`, resultsSchema)
    for (const row of body.data.summary_data ?? []) {
      if (names.has(row.thread_type_id)) continue
      names.set(row.thread_type_id, {
        thread_name: row.thread_type_name ?? null,
        supplier: row.supplier_name ?? null,
        tex: row.tex_number ?? null,
      })
    }
  } catch (err) {
    if (!(err instanceof AiToolError) || err.code !== 'upstream_error') throw err
  }
  return names
}

function emptyRow(names: ThreadNames | undefined, color: string): ThreadRow {
  return {
    thread_name: names?.thread_name ?? null,
    supplier: names?.supplier ?? null,
    tex: names?.tex ?? null,
    color: color || null,
    needed_cones: 0,
    reserved_cones: 0,
    reserved_physical_cones: 0,
    shortage_cones: 0,
    ordered_from_supplier: 0,
    delivered_by_supplier: 0,
    received_into_stock: 0,
    pending_delivery: 0,
    pending_receive: 0,
    cancelled: 0,
  }
}

function isOpen(row: ThreadRow): boolean {
  return row.shortage_cones > 0 || row.pending_delivery > 0 || row.pending_receive > 0
}

function matches(row: ThreadRow, needle: string): boolean {
  return [row.thread_name, row.supplier, row.tex, row.color]
    .some((value) => value !== null && value.toLowerCase().includes(needle))
}

const round2 = (value: number) => Math.round(value * 100) / 100

export const getWeeklyOrderThreads = defineTool({
  name: 'get_weekly_order_threads',
  description: [
    'Tình trạng chỉ của một tuần đặt hàng, mỗi dòng là một loại chỉ (NCC + Tex + màu), số khớp màn chi tiết tuần.',
    'Nhu cầu và giữ cuộn: needed_cones là số cuộn tuần cần; reserved_cones là số cuộn đã giữ cho tuần (cuộn lẻ quy đổi), reserved_physical_cones là số cuộn thực tế; shortage_cones = còn thiếu so với nhu cầu (chưa giữ đủ).',
    'Đặt hàng NCC: ordered_from_supplier là số cuộn đặt NCC; delivered_by_supplier là số NCC đã giao (một đợt giao chỉ tính khi đã giao xong cả đợt); received_into_stock là số đã nhập kho;',
    'pending_delivery là NCC chưa giao; pending_receive là đã giao nhưng chưa nhập kho; cancelled là phần đặt đã huỷ.',
    'Hỏi "còn thiếu" chung chung thì nói cả hai: thiếu so với nhu cầu (shortage_cones) và còn chờ NCC (pending_delivery, pending_receive).',
    'only_open = true để chỉ liệt kê loại chỉ còn thiếu hoặc còn chờ NCC (nên dùng khi hỏi còn thiếu, vì tuần lớn có thể tới vài trăm loại chỉ); search để lọc theo tên chỉ, NCC, Tex hoặc màu.',
  ].join(' '),
  permissions: ['thread.allocations.view'],
  input: z.object({
    week_id: z.number().int().positive().describe('week_id lấy từ search_weekly_orders'),
    only_open: z.boolean().optional().describe('true: chỉ trả loại chỉ còn thiếu so với nhu cầu hoặc còn chờ NCC giao/nhập kho'),
    search: z.string().trim().min(1).max(50).optional().describe('Lọc theo tên loại chỉ, NCC, Tex hoặc màu chỉ, ví dụ C9700'),
  }),
  run: async (input, ctx) => {
    const [reservations, deliveries, names] = await Promise.all([
      ctx.get(`/api/weekly-orders/${input.week_id}/reservation-summary`, reservationSchema),
      ctx.get(`/api/weekly-orders/${input.week_id}/delivery-summary`, deliverySchema),
      loadNames(ctx, input.week_id),
    ])

    const rows = new Map<string, ThreadRow>()
    const rowFor = (threadTypeId: number, color: string) => {
      const key = getDeliveryTraceKey(threadTypeId, color)
      let row = rows.get(key)
      if (!row) {
        row = emptyRow(names.get(threadTypeId), color)
        rows.set(key, row)
      }
      return row
    }

    for (const item of reservations.data) {
      const row = rowFor(item.thread_type_id, item.color_name)
      row.thread_name ??= item.thread_type_name || null
      row.needed_cones += item.needed
      row.reserved_cones = round2(row.reserved_cones + item.reserved)
      row.reserved_physical_cones += item.reserved_physical_cones
      row.shortage_cones = round2(row.shortage_cones + item.shortage)
    }

    for (const item of deliveries.data.by_supplier) {
      const row = rowFor(item.thread_type_id, item.color_name)
      row.supplier = item.supplier_name || row.supplier
      row.tex = item.tex_number || row.tex
      row.ordered_from_supplier += item.ordered
      row.delivered_by_supplier += item.delivered
      row.received_into_stock += item.received
      row.pending_delivery += item.pending_delivery
      row.pending_receive += item.pending_receive
      row.cancelled += item.cancelled
    }

    const allRows = [...rows.values()]
    const needle = input.search?.toLowerCase() ?? null
    const listed = allRows
      .filter((row) => !input.only_open || isOpen(row))
      .filter((row) => !needle || matches(row, needle))
      .sort((a, b) => b.shortage_cones - a.shortage_cones || b.pending_delivery - a.pending_delivery)

    return {
      total: listed.length,
      result: {
        thread_type_count: allRows.length,
        open_thread_type_count: allRows.filter(isOpen).length,
        totals: {
          needed_cones: allRows.reduce((sum, row) => sum + row.needed_cones, 0),
          reserved_cones: round2(allRows.reduce((sum, row) => sum + row.reserved_cones, 0)),
          shortage_cones: round2(allRows.reduce((sum, row) => sum + row.shortage_cones, 0)),
          ordered_from_supplier: deliveries.data.total_ordered,
          delivered_by_supplier: deliveries.data.total_delivered,
          received_into_stock: deliveries.data.total_received,
          percent_received: deliveries.data.percent_received,
        },
        threads: listed,
      },
    }
  },
})
