import { z } from 'zod'
import { defineTool } from '../types'

const weekSchema = z.looseObject({
  data: z.looseObject({
    id: z.number(),
    week_name: z.string(),
    start_date: z.string().nullable(),
    end_date: z.string().nullable(),
    status: z.string(),
    notes: z.string().nullable(),
    created_by: z.string().nullable(),
    leader_signed_by_name: z.string().nullable(),
    leader_signed_at: z.string().nullable().optional(),
    items: z.array(z.looseObject({
      po_id: z.number().nullable(),
      style_id: z.number(),
      style_color_id: z.number().nullable(),
      quantity: z.coerce.number(),
      po: z.looseObject({ po_number: z.string() }).nullable(),
      style: z.looseObject({ style_code: z.string(), style_name: z.string() }).nullable(),
      style_color: z.looseObject({ color_name: z.string() }).nullable(),
      sub_art: z.looseObject({ sub_art_code: z.string() }).nullable(),
    })),
  }),
})

export const getWeeklyOrder = defineTool({
  name: 'get_weekly_order',
  description: [
    'Thông tin chung của một tuần đặt hàng: trạng thái, người tạo, lãnh đạo ký, và danh sách dòng hàng (PO, mã hàng, màu hàng, số sản phẩm).',
    'Mỗi dòng kèm po_id, style_id, style_color_id để gọi get_dept_allocation.',
    'Không có số chỉ; nhu cầu chỉ, giữ cuộn và giao hàng NCC thì dùng get_weekly_order_threads.',
  ].join(' '),
  permissions: ['thread.allocations.view'],
  input: z.object({
    week_id: z.number().int().positive().describe('week_id lấy từ search_weekly_orders'),
  }),
  run: async (input, ctx) => {
    const { data: week } = await ctx.get(`/api/weekly-orders/${input.week_id}`, weekSchema)
    const totalProducts = week.items.reduce((sum, item) => sum + item.quantity, 0)

    return {
      total: week.items.length,
      result: {
        week_id: week.id,
        week_name: week.week_name,
        status: week.status,
        start_date: week.start_date,
        end_date: week.end_date,
        notes: week.notes,
        created_by: week.created_by,
        leader_signed_by: week.leader_signed_by_name,
        leader_signed_at: week.leader_signed_at ?? null,
        total_products: totalProducts,
        items: week.items.map((item) => ({
          po_number: item.po?.po_number ?? null,
          style_code: item.style?.style_code ?? null,
          style_name: item.style?.style_name ?? null,
          style_color: item.style_color?.color_name ?? null,
          sub_art: item.sub_art?.sub_art_code ?? null,
          quantity: item.quantity,
          po_id: item.po_id,
          style_id: item.style_id,
          style_color_id: item.style_color_id,
        })),
      },
    }
  },
})
