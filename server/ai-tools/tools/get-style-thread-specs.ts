import { z } from 'zod'
import { defineTool } from '../types'

const specsSchema = z.looseObject({
  data: z.array(z.looseObject({
    process_name: z.string(),
    meters_per_unit: z.coerce.number(),
    display_order: z.number(),
    suppliers: z.looseObject({ name: z.string() }).nullable(),
    thread_types: z.looseObject({
      name: z.string(),
      tex_number: z.string().nullable(),
      tex_label: z.string().nullable(),
    }).nullable(),
  })),
})

export const getStyleThreadSpecs = defineTool({
  name: 'get_style_thread_specs',
  description: [
    'Định mức chỉ của một mã hàng theo công đoạn (mét chỉ cho một sản phẩm), kèm NCC, loại chỉ và Tex.',
    'Không có màu chỉ theo từng màu hàng; muốn tra theo màu chỉ thì dùng find_thread_usage.',
  ].join(' '),
  permissions: ['thread.styles.view'],
  input: z.object({
    style_id: z.number().int().positive().describe('style_id lấy từ search_styles'),
  }),
  run: async (input, ctx) => {
    const body = await ctx.get(`/api/styles/${input.style_id}/thread-specs`, specsSchema)
    const rows = [...body.data].sort((a, b) => a.display_order - b.display_order)
    return {
      total: rows.length,
      result: rows.map((row) => ({
        process: row.process_name,
        meters_per_unit: row.meters_per_unit,
        supplier: row.suppliers?.name ?? null,
        thread_type: row.thread_types?.name ?? null,
        tex: row.thread_types?.tex_label ?? row.thread_types?.tex_number ?? null,
      })),
    }
  },
})
