import { z } from 'zod'

export const transferReservedItemSchema = z.object({
  thread_type_id: z.number().int().positive(),
  color_id: z.number().int().positive(),
  quantity: z.number().int().positive(),
})

export const transferReservedBodySchema = z
  .object({
    from_warehouse_id: z.number().int().positive(),
    to_warehouse_id: z.number().int().positive(),
    items: z.array(transferReservedItemSchema).min(1).max(200),
    notes: z.string().max(500).optional(),
  })
  .refine((d) => d.from_warehouse_id !== d.to_warehouse_id, {
    message: 'Kho nguồn và kho đích không được trùng nhau',
    path: ['to_warehouse_id'],
  })

export type TransferReservedBody = z.infer<typeof transferReservedBodySchema>
export type TransferReservedItem = z.infer<typeof transferReservedItemSchema>
