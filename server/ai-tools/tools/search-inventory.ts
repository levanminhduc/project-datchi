import { z } from 'zod'
import { normalizeTex, texMatches } from '../tex'
import { defineTool } from '../types'

const coneRowSchema = z.looseObject({
  thread_type_id: z.number(),
  thread_code: z.string(),
  thread_name: z.string(),
  supplier_name: z.string().nullable(),
  color_id: z.number().nullable(),
  color_data: z.looseObject({ name: z.string() }).nullable(),
  tex_number: z.string().nullable(),
  tex_label: z.string().nullable(),
  full_cones: z.number(),
  partial_cones: z.number(),
  partial_meters: z.number(),
  total_full_cones: z.number(),
  total_partial_cones: z.number(),
})

const coneSummarySchema = z.looseObject({ data: z.array(coneRowSchema) })

export const searchInventory = defineTool({
  name: 'search_inventory',
  description: [
    'Tra tồn kho chỉ theo mã hoặc tên loại chỉ, hoặc mã/tên màu chỉ (ví dụ C9700). Có thể lọc thêm theo Tex.',
    'Mỗi dòng là một loại chỉ (NCC + Tex + màu), số liệu khớp màn Tồn kho.',
    'available_* là tồn khả dụng (cuộn chưa cấp phát, chưa giữ cho đơn); total_* là tổng tồn gồm cả cuộn đã cấp phát hoặc giữ cho đơn.',
    'Dùng thread_type_id và color_id để gọi get_inventory_by_warehouse khi cần chi tiết từng kho.',
  ].join(' '),
  permissions: ['thread.inventory.view'],
  input: z.object({
    search: z.string().trim().min(2).max(50).describe('Mã/tên loại chỉ hoặc mã/tên màu chỉ, ví dụ C9700'),
    tex: z.string().trim().min(1).max(10).optional().describe('Số Tex để lọc, ví dụ 40'),
  }),
  run: async (input, ctx) => {
    const tex = input.tex ? normalizeTex(input.tex) : null
    const params = new URLSearchParams({ search: input.search })
    const body = await ctx.get(`/api/inventory/summary/by-cone?${params.toString()}`, coneSummarySchema)
    const rows = tex ? body.data.filter((row) => texMatches(row.tex_number, tex)) : body.data
    return {
      total: rows.length,
      result: rows.map((row) => ({
        thread_type_id: row.thread_type_id,
        thread_code: row.thread_code,
        thread_name: row.thread_name,
        supplier: row.supplier_name,
        tex: row.tex_label ?? row.tex_number,
        color_id: row.color_id,
        color: row.color_data?.name ?? null,
        available_full_cones: row.full_cones,
        available_partial_cones: row.partial_cones,
        available_partial_meters: row.partial_meters,
        total_full_cones: row.total_full_cones,
        total_partial_cones: row.total_partial_cones,
      })),
    }
  },
})
