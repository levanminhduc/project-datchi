import { z } from 'zod'

const OrderItemSchema = z.object({
  po_id: z.number().int().positive('po_id phải là số nguyên dương').nullable().optional(),
  style_id: z.number().int().positive('style_id phải là số nguyên dương'),
  color_id: z.number().int().positive('color_id phải là số nguyên dương'),
  quantity: z.number().positive('Số lượng phải lớn hơn 0'),
})

export const CreateWeeklyOrderSchema = z.object({
  week_name: z.string().min(1, 'Tên tuần (week_name) là bắt buộc').trim(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(OrderItemSchema).min(1, 'Cần ít nhất một sản phẩm'),
})

export const UpdateWeeklyOrderSchema = z.object({
  week_name: z.string().min(1, 'Tên tuần không được trống').trim().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(OrderItemSchema).optional(),
})

export const UpdateStatusSchema = z.object({
  status: z.enum(['draft', 'confirmed', 'cancelled'], {
    message: 'Trạng thái không hợp lệ. Chọn: draft, confirmed, cancelled',
  }),
})

export const SaveResultsSchema = z.object({
  calculation_data: z
    .any()
    .refine(
      (val) => val !== null && val !== undefined,
      'Dữ liệu tính toán (calculation_data) là bắt buộc',
    ),
  summary_data: z.any().optional(),
})
