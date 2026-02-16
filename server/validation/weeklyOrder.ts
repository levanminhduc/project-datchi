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
  status: z.enum(['DRAFT', 'CONFIRMED', 'CANCELLED'], {
    message: 'Trạng thái không hợp lệ. Chọn: DRAFT, CONFIRMED, CANCELLED',
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

export const UpdateDeliverySchema = z.object({
  delivery_date: z.string().optional(),
  actual_delivery_date: z.string().nullable().optional(),
  status: z.enum(['PENDING', 'DELIVERED']).optional(),
  notes: z.string().nullable().optional(),
})

export const EnrichInventorySchema = z.object({
  summary_rows: z
    .array(
      z
        .object({
          thread_type_id: z.number({ required_error: 'thread_type_id là bắt buộc' }),
          total_cones: z.number({ required_error: 'total_cones là bắt buộc' }),
        })
        .passthrough(),
    )
    .min(1, 'Cần ít nhất một dòng tổng hợp'),
})

export const ReceiveDeliverySchema = z.object({
  warehouse_id: z.number({ required_error: 'Vui lòng chọn kho nhập' }).int().positive('warehouse_id phải là số nguyên dương'),
  quantity: z.number({ required_error: 'Số lượng là bắt buộc' }).int().positive('Số lượng phải lớn hơn 0'),
  received_by: z.string({ required_error: 'Người nhập là bắt buộc' }).min(1, 'Người nhập không được để trống'),
})

export const UpdateQuotaConesSchema = z.object({
  thread_type_id: z.number({ required_error: 'thread_type_id là bắt buộc' }).int().positive('thread_type_id phải là số nguyên dương'),
  quota_cones: z.number({ required_error: 'quota_cones là bắt buộc' }).int().nonnegative('quota_cones phải >= 0'),
})
