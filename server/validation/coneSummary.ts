import { z } from 'zod'

export const byWarehouseWeekQuerySchema = z.object({
  thread_type_id: z.coerce.number().int().positive(),
  color_id: z.coerce.number().int().positive().nullable().optional(),
  warehouse_id: z.coerce.number().int().positive().optional(),
})

export type ByWarehouseWeekQueryDTO = z.infer<typeof byWarehouseWeekQuerySchema>
