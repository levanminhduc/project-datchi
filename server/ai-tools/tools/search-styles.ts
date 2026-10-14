import { z } from 'zod'
import { defineTool } from '../types'

const stylesSchema = z.looseObject({
  data: z.array(z.looseObject({
    id: z.number(),
    style_code: z.string(),
    style_name: z.string(),
    fabric_type: z.string().nullable(),
  })),
})

export const searchStyles = defineTool({
  name: 'search_styles',
  description: 'Tìm mã hàng (style) theo mã hoặc tên, tối đa 20 kết quả. Dùng style_id để gọi get_style_thread_specs.',
  permissions: ['thread.styles.view'],
  input: z.object({
    search: z.string().trim().min(1).max(50).describe('Mã hàng hoặc tên mã hàng, ví dụ ST-001'),
  }),
  run: async (input, ctx) => {
    const params = new URLSearchParams({ search: input.search, limit: '20' })
    const body = await ctx.get(`/api/styles?${params.toString()}`, stylesSchema)
    return {
      total: body.data.length,
      result: body.data.map((row) => ({
        style_id: row.id,
        style_code: row.style_code,
        style_name: row.style_name,
        fabric_type: row.fabric_type,
      })),
    }
  },
})
