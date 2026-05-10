import { z } from 'zod'

export const transferByCalculationQuerySchema = z.object({
  warehouse_id: z
    .string()
    .regex(/^\d+$/, 'warehouse_id phải là số')
    .transform(Number),
  to_warehouse_id: z
    .string()
    .regex(/^\d+$/, 'to_warehouse_id phải là số')
    .transform(Number)
    .optional(),
})

export const threadTransferHistoryQuerySchema = z.object({
  thread_type_id: z
    .string()
    .regex(/^\d+$/, 'thread_type_id phải là số')
    .transform(Number),
  thread_color_id: z
    .string()
    .regex(/^\d+$/, 'thread_color_id phải là số')
    .transform(Number),
})

export const poTransferHistoryQuerySchema = z.object({
  po_id: z.string().regex(/^\d+$/, 'po_id phải là số').transform(Number),
  to_warehouse_id: z.string().regex(/^\d+$/).transform(Number).optional(),
})

export type TransferByCalculationQuery = z.infer<typeof transferByCalculationQuerySchema>
export type ThreadTransferHistoryQuery = z.infer<typeof threadTransferHistoryQuerySchema>
export type PoTransferHistoryQuery = z.infer<typeof poTransferHistoryQuerySchema>
