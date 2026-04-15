import { z } from 'zod'

const OrderItemSchema = z.object({
  po_id: z.number().int().positive('po_id phải là số nguyên dương').nullable().optional(),
  style_id: z.number().int().positive('style_id phải là số nguyên dương'),
  style_color_id: z.number().int().positive('style_color_id phải là số nguyên dương'),
  color_id: z.number().int().positive('color_id phải là số nguyên dương').nullable().optional(),
  quantity: z.number().positive('Số lượng phải lớn hơn 0'),
  sub_art_id: z.number().int().positive('sub_art_id phải là số nguyên dương').nullable().optional(),
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
  status: z.enum(['DRAFT', 'CONFIRMED', 'CANCELLED', 'COMPLETED'], {
    message: 'Trạng thái không hợp lệ. Chọn: DRAFT, CONFIRMED, CANCELLED, COMPLETED',
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
          thread_type_id: z.number({ error:'thread_type_id là bắt buộc' }),
          total_cones: z.number({ error:'total_cones là bắt buộc' }),
        })
        .passthrough(),
    )
    .min(1, 'Cần ít nhất một dòng tổng hợp'),
  current_week_id: z.number().int().positive().optional(),
  warehouse_ids: z.array(z.number().int().positive()).optional(),
})

export const ReceiveDeliverySchema = z.object({
  warehouse_id: z.number({ error:'Vui lòng chọn kho nhập' }).int().positive('warehouse_id phải là số nguyên dương'),
  quantity: z.number({ error:'Số lượng là bắt buộc' }).int().positive('Số lượng phải lớn hơn 0'),
  received_by: z.string({ error:'Người nhập là bắt buộc' }).min(1, 'Người nhập không được để trống'),
  expiry_date: z.string().optional(),
})

export const UpdateQuotaConesSchema = z.object({
  thread_type_id: z.number({ error:'thread_type_id là bắt buộc' }).int().positive('thread_type_id phải là số nguyên dương'),
  quota_cones: z.number({ error:'quota_cones là bắt buộc' }).int().nonnegative('quota_cones phải >= 0'),
})

export const OrderedQuantitiesQuerySchema = z.object({
  po_style_pairs: z.string().min(1, 'po_style_pairs là bắt buộc'),
  exclude_week_id: z.string().optional(),
})

export const HistoryByWeekQuerySchema = z.object({
  po_id: z.string().optional(),
  style_id: z.string().optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  status: z.string().optional(),
  created_by: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
})

// ============ RECEIVE LOGS SCHEMA ============

export const ReceiveLogsQuerySchema = z.object({
  delivery_id: z.string().optional(),
  week_id: z.string().optional(),
  limit: z.string().optional(),
})

// ============ LOAN SCHEMAS ============

export const CreateLoanSchema = z.object({
  from_week_id: z
    .number({ error:'from_week_id là bắt buộc' })
    .int()
    .positive('from_week_id phải là số nguyên dương'),
  thread_type_id: z
    .number({ error:'thread_type_id là bắt buộc' })
    .int()
    .positive('thread_type_id phải là số nguyên dương'),
  quantity_cones: z
    .number({ error:'Số lượng cuộn là bắt buộc' })
    .int()
    .positive('Số lượng cuộn phải lớn hơn 0'),
  reason: z.string().max(500, 'Lý do tối đa 500 ký tự').optional(),
})

export const BatchLoanItemSchema = z.object({
  thread_type_id: z
    .number({ error:'thread_type_id là bắt buộc' })
    .int()
    .positive('thread_type_id phải là số nguyên dương'),
  quantity_cones: z
    .number({ error:'Số lượng cuộn là bắt buộc' })
    .int()
    .positive('Số lượng cuộn phải lớn hơn 0'),
})

export const CreateBatchLoanSchema = z.object({
  from_week_id: z
    .number({ error:'from_week_id là bắt buộc' })
    .int()
    .positive('from_week_id phải là số nguyên dương'),
  items: z
    .array(BatchLoanItemSchema)
    .min(1, 'Cần ít nhất một loại chỉ'),
  reason: z.string().max(500, 'Lý do tối đa 500 ký tự').optional(),
})

// ============ RESERVE FROM STOCK SCHEMA ============

export const ReserveFromStockSchema = z.object({
  thread_type_id: z
    .number({ error:'thread_type_id là bắt buộc' })
    .int()
    .positive('thread_type_id phải là số nguyên dương'),
  quantity: z
    .number({ error:'Số lượng là bắt buộc' })
    .int()
    .positive('Số lượng phải lớn hơn 0'),
  reason: z.string().max(500, 'Lý do tối đa 500 ký tự').optional(),
})

// ============ MANUAL RETURN SCHEMA ============

export const RemovePOFromWeekSchema = z.object({
  po_id: z.number().int().positive('po_id phải là số nguyên dương'),
})

export const ManualReturnSchema = z.object({
  quantity: z
    .number({ error:'Số cuộn là bắt buộc' })
    .int()
    .positive('Số cuộn phải lớn hơn 0'),
  notes: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
})
