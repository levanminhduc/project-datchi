import { z } from 'zod'
import { collectPages, MAX_TOOL_ROWS } from '../paging'
import { defineTool } from '../types'

const PO_STATUSES = ['PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'COMPLETED', 'CANCELLED'] as const

const purchaseOrdersSchema = z.looseObject({
  data: z.array(z.looseObject({
    po_number: z.string(),
    customer_name: z.string().nullable(),
    status: z.string().nullable(),
    priority: z.string(),
    order_date: z.string().nullable(),
    delivery_date: z.string().nullable(),
    week: z.string().nullable(),
    items: z.array(z.looseObject({
      quantity: z.coerce.number(),
      style: z.looseObject({ style_code: z.string(), style_name: z.string() }).nullable(),
    })),
  })),
  count: z.number(),
})

export const searchPurchaseOrders = defineTool({
  name: 'search_purchase_orders',
  description: [
    'Tìm đơn hàng (PO) theo số PO và/hoặc trạng thái, mới nhất trước, tối đa 500 PO; mỗi PO kèm tối đa 500 dòng mã hàng và số lượng.',
    'Chỉ trả PO có ít nhất một dòng mã hàng.',
    'Trạng thái: PENDING chờ xử lý, CONFIRMED đã xác nhận, IN_PRODUCTION đang sản xuất, COMPLETED hoàn thành, CANCELLED đã huỷ.',
  ].join(' '),
  permissions: ['thread.purchase-orders.view'],
  input: z.object({
    po_number: z.string().trim().min(1).max(50).optional().describe('Một phần số PO, ví dụ PO-2026'),
    status: z.enum(PO_STATUSES).optional().describe('Trạng thái PO'),
  }),
  run: async (input, ctx) => {
    const { rows, total } = await collectPages(async (page, pageSize) => {
      const params = new URLSearchParams({ include: 'items', page: String(page), pageSize: String(pageSize) })
      if (input.po_number) params.set('po_number', input.po_number)
      if (input.status) params.set('status', input.status)
      const body = await ctx.get(`/api/purchase-orders?${params.toString()}`, purchaseOrdersSchema)
      return { rows: body.data, total: body.count }
    })
    return {
      total,
      result: rows.map((po) => ({
        po_number: po.po_number,
        customer: po.customer_name,
        status: po.status,
        priority: po.priority,
        order_date: po.order_date,
        delivery_date: po.delivery_date,
        week: po.week,
        item_count: po.items.length,
        items: po.items.slice(0, MAX_TOOL_ROWS).map((item) => ({
          style_code: item.style?.style_code ?? null,
          style_name: item.style?.style_name ?? null,
          quantity: item.quantity,
        })),
      })),
    }
  },
})
