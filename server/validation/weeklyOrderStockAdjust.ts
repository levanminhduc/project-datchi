import { z } from 'zod'

export const StockAdjustPreviewSchema = z.object({
  thread_type_id: z.number().int().positive('Thiếu loại chỉ'),
  thread_color_id: z.number().int().positive().nullable().optional(),
  actual_cones: z.number().int('Số cuộn phải là số nguyên').min(0, 'Số cuộn không được âm'),
})

export const StockAdjustSchema = StockAdjustPreviewSchema.extend({
  reason: z.string().trim().min(1, 'Vui lòng nhập lý do điều chỉnh'),
})

export const RevertReceiveSchema = z.object({
  reason: z.string().trim().min(1, 'Vui lòng nhập lý do hoàn tác'),
})

export type StockAdjustPreviewInput = z.infer<typeof StockAdjustPreviewSchema>
export type StockAdjustInput = z.infer<typeof StockAdjustSchema>
export type RevertReceiveInput = z.infer<typeof RevertReceiveSchema>
