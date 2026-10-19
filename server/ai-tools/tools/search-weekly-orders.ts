import { z } from 'zod'
import { collectPages } from '../paging'
import { defineTool } from '../types'

const WEEK_STATUSES = ['DRAFT', 'CONFIRMED', 'CANCELLED'] as const

const weeksSchema = z.looseObject({
  data: z.array(z.looseObject({
    id: z.number(),
    week_name: z.string(),
    start_date: z.string().nullable(),
    end_date: z.string().nullable(),
    status: z.string(),
    created_by: z.string().nullable(),
    created_at: z.string(),
    item_count: z.coerce.number(),
  })),
  pagination: z.looseObject({ total: z.number() }),
})

function normalize(value: string): string {
  return value.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim()
}

export const searchWeeklyOrders = defineTool({
  name: 'search_weekly_orders',
  description: [
    'Tìm tuần đặt hàng theo tên tuần (ví dụ "Tuần 42") và/hoặc trạng thái, mới nhất trước, tối đa 500 tuần.',
    'Dùng week_id ở kết quả để gọi get_weekly_order (danh sách PO, mã hàng, màu hàng của tuần) hoặc get_weekly_order_threads (nhu cầu, giữ cuộn, giao hàng NCC theo loại chỉ).',
    'Trạng thái: DRAFT nháp, CONFIRMED đã xác nhận, CANCELLED đã huỷ.',
    'Chỉ tìm trong 500 tuần mới nhất. Tài khoản không phải admin chỉ thấy tuần do chính mình tạo; không thấy tuần thì nói là không có trong danh sách tuần của người hỏi, đừng khẳng định tuần đó không tồn tại.',
  ].join(' '),
  permissions: ['thread.allocations.view'],
  input: z.object({
    name: z.string().trim().min(1).max(50).optional().describe('Một phần tên tuần, ví dụ "42" hoặc "Tuần 42"'),
    status: z.enum(WEEK_STATUSES).optional().describe('Trạng thái tuần'),
  }),
  run: async (input, ctx) => {
    const { rows, total } = await collectPages(async (page, pageSize) => {
      const params = new URLSearchParams({ page: String(page), limit: String(pageSize) })
      if (input.status) params.set('status', input.status)
      const body = await ctx.get(`/api/weekly-orders?${params.toString()}`, weeksSchema)
      return { rows: body.data, total: body.pagination.total }
    })

    const needle = input.name ? normalize(input.name) : null
    const matched = needle ? rows.filter((week) => normalize(week.week_name).includes(needle)) : rows

    return {
      total: needle ? matched.length : total,
      result: matched.map((week) => ({
        week_id: week.id,
        week_name: week.week_name,
        status: week.status,
        start_date: week.start_date,
        end_date: week.end_date,
        item_count: week.item_count,
        created_by: week.created_by,
        created_at: week.created_at,
      })),
    }
  },
})
