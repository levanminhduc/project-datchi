import { z } from 'zod'
import { MAX_TOOL_ROWS } from '../paging'
import { defineTool } from '../types'

const summarySchema = z.looseObject({
  data: z.looseObject({
    total_product_quantity: z.coerce.number(),
    total_allocated: z.coerce.number(),
    remaining: z.coerce.number(),
    allocated: z.array(z.looseObject({
      department: z.string(),
      product_quantity: z.coerce.number(),
    })),
  }),
})

const logsSchema = z.looseObject({
  data: z.array(z.looseObject({
    added_quantity: z.coerce.number(),
    total_after: z.coerce.number(),
    created_by: z.string().nullable(),
    created_at: z.string(),
    dept_product_allocations: z.looseObject({ department: z.string() }),
  })),
})

export const getDeptAllocation = defineTool({
  name: 'get_dept_allocation',
  description: [
    'Phân bổ số sản phẩm cho các bộ phận (màn Xuất kho V2) của một tổ hợp PO + mã hàng + màu hàng.',
    'Lấy po_id, style_id, style_color_id từ các dòng của get_weekly_order.',
    'total_product_quantity là tổng sản phẩm của tổ hợp trong các tuần đã xác nhận; departments là số sản phẩm đã phân cho từng bộ phận; remaining là số chưa phân bổ;',
    'logs là các lần phân bổ gần nhất, created_by là người phân bổ.',
  ].join(' '),
  permissions: ['thread.dept-allocation.manage', 'thread.allocations.view'],
  input: z.object({
    po_id: z.number().int().positive().describe('po_id lấy từ get_weekly_order'),
    style_id: z.number().int().positive().describe('style_id lấy từ get_weekly_order'),
    style_color_id: z.number().int().positive().describe('style_color_id lấy từ get_weekly_order'),
  }),
  run: async (input, ctx) => {
    const params = new URLSearchParams({
      po_id: String(input.po_id),
      style_id: String(input.style_id),
      style_color_id: String(input.style_color_id),
    }).toString()
    const [summary, logs] = await Promise.all([
      ctx.get(`/api/dept-allocations/summary?${params}`, summarySchema),
      ctx.get(`/api/dept-allocations/logs?${params}`, logsSchema),
    ])

    return {
      total: summary.data.allocated.length,
      result: {
        total_product_quantity: summary.data.total_product_quantity,
        total_allocated: summary.data.total_allocated,
        remaining: summary.data.remaining,
        departments: summary.data.allocated.map((row) => ({
          department: row.department,
          product_quantity: row.product_quantity,
        })),
        logs_total: logs.data.length,
        logs: logs.data.slice(0, MAX_TOOL_ROWS).map((log) => ({
          department: log.dept_product_allocations.department,
          added_quantity: log.added_quantity,
          total_after: log.total_after,
          created_by: log.created_by,
          created_at: log.created_at,
        })),
      },
    }
  },
})
