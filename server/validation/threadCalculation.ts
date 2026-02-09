import { z } from 'zod'

export const ColorBreakdownSchema = z.object({
  color_id: z.number().int().positive('color_id phải là số nguyên dương'),
  quantity: z.number().positive('Số lượng phải lớn hơn 0'),
})

export const CalculationInputSchema = z.object({
  style_id: z.number().int().positive('Mã hàng (style_id) là bắt buộc'),
  quantity: z.number().positive('Số lượng phải lớn hơn 0'),
  color_breakdown: z.array(ColorBreakdownSchema).optional(),
})

export const BatchCalculationInputSchema = z.object({
  items: z
    .array(CalculationInputSchema)
    .min(1, 'Cần ít nhất một mã hàng')
    .max(100, 'Tối đa 100 mã hàng mỗi lần tính'),
})

export const CalculateByPOInputSchema = z.object({
  po_id: z.number().int().positive('Mã đơn hàng (po_id) là bắt buộc'),
})
