import { z } from 'zod'

// ============================================================================
// Zod Schemas for Thread Stock Management
// ============================================================================

/**
 * Schema for query filters when listing stock
 */
export const StockFiltersSchema = z.object({
  thread_type_id: z.coerce.number().int().positive().optional(),
  warehouse_id: z.coerce.number().int().positive().optional(),
  lot_number: z.string().optional(),
})

export type StockFiltersDTO = z.infer<typeof StockFiltersSchema>

/**
 * Schema for summary filters
 */
export const StockSummaryFiltersSchema = z.object({
  warehouse_id: z.coerce.number().int().positive().optional(),
})

export type StockSummaryFiltersDTO = z.infer<typeof StockSummaryFiltersSchema>

/**
 * Schema for adding stock (receiving)
 */
export const AddStockSchema = z.object({
  thread_type_id: z.number().int().positive('thread_type_id phai la so nguyen duong'),

  warehouse_id: z.number().int().positive('warehouse_id phai la so nguyen duong'),

  lot_number: z.string().trim().optional().nullable(),

  qty_full_cones: z.number().int().min(0, 'qty_full_cones khong duoc am'),

  qty_partial_cones: z.number().int().min(0, 'qty_partial_cones khong duoc am').optional().default(0),

  received_date: z.string().min(1, 'received_date khong duoc de trong'),

  expiry_date: z.string().optional().nullable(),

  notes: z.string().optional().nullable(),
})

export type AddStockDTO = z.infer<typeof AddStockSchema>

/**
 * Schema for deducting stock (issuing with FEFO)
 */
export const DeductStockSchema = z.object({
  thread_type_id: z.number().int().positive('thread_type_id phai la so nguyen duong'),

  warehouse_id: z.number().int().positive().optional(),

  qty_full: z.number().int().min(0, 'qty_full khong duoc am'),

  qty_partial: z.number().int().min(0, 'qty_partial khong duoc am').optional().default(0),
}).refine(
  (data) => data.qty_full > 0 || (data.qty_partial && data.qty_partial > 0),
  { message: 'Phai co it nhat qty_full hoac qty_partial lon hon 0' }
)

export type DeductStockDTO = z.infer<typeof DeductStockSchema>

/**
 * Schema for returning stock
 */
export const ReturnStockSchema = z.object({
  thread_type_id: z.number().int().positive('thread_type_id phai la so nguyen duong'),

  warehouse_id: z.number().int().positive('warehouse_id phai la so nguyen duong'),

  lot_number: z.string().trim().optional().nullable(),

  qty_full: z.number().int().min(0, 'qty_full khong duoc am').default(0),

  qty_partial: z.number().int().min(0, 'qty_partial khong duoc am').default(0),
}).refine(
  (data) => data.qty_full > 0 || data.qty_partial > 0,
  { message: 'Phai co it nhat qty_full hoac qty_partial lon hon 0' }
)

export type ReturnStockDTO = z.infer<typeof ReturnStockSchema>
