import { z } from 'zod'
import { defineTool } from '../types'

const breakdownSchema = z.looseObject({
  data: z.array(z.looseObject({
    warehouse_code: z.string(),
    warehouse_name: z.string(),
    location: z.string().nullable(),
    full_cones: z.coerce.number(),
    partial_cones: z.coerce.number(),
    partial_meters: z.coerce.number(),
  })),
})

export const getInventoryByWarehouse = defineTool({
  name: 'get_inventory_by_warehouse',
  description: [
    'Tồn kho theo từng kho của một loại chỉ. Lấy thread_type_id và color_id từ kết quả search_inventory.',
    'Luôn truyền color_id khi đã biết màu chỉ: một loại chỉ = NCC + Tex + màu; bỏ color_id thì số là tổng mọi màu của thread_type_id đó, không phải tồn của một loại chỉ.',
    'Số ở đây là tổng tồn vật lý trong kho, gồm cả cuộn đã cấp phát hoặc giữ cho đơn, không phải tồn khả dụng.',
  ].join(' '),
  permissions: ['thread.inventory.view'],
  input: z.object({
    thread_type_id: z.number().int().positive().describe('thread_type_id lấy từ search_inventory'),
    color_id: z.number().int().positive().optional().describe('color_id lấy từ search_inventory; luôn truyền khi dòng search_inventory có color_id'),
  }),
  run: async (input, ctx) => {
    const query = input.color_id ? `?${new URLSearchParams({ color_id: String(input.color_id) }).toString()}` : ''
    const body = await ctx.get(`/api/inventory/summary/by-cone/${input.thread_type_id}/warehouses${query}`, breakdownSchema)
    return {
      total: body.data.length,
      result: body.data.map((row) => ({
        warehouse_code: row.warehouse_code,
        warehouse: row.warehouse_name,
        location: row.location,
        full_cones: row.full_cones,
        partial_cones: row.partial_cones,
        partial_meters: row.partial_meters,
      })),
    }
  },
})
