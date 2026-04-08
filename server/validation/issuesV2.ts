/**
 * Issue V2 Validation Schemas
 * Zod schemas for Thread Issue V2 API endpoints
 */

import { z } from 'zod'

// ============================================================================
// Enums
// ============================================================================

export const IssueV2StatusEnum = z.enum(['DRAFT', 'CONFIRMED', 'RETURNED'])
export type IssueV2Status = z.infer<typeof IssueV2StatusEnum>

// ============================================================================
// Create Issue
// ============================================================================

export const CreateIssueV2Schema = z.object({
  department: z.string().min(1, 'Bo phan nhan chi khong duoc de trong').trim(),
  created_by: z.string().min(1, 'Nguoi tao khong duoc de trong').trim(),
  notes: z.string().optional(),
})

export type CreateIssueV2DTO = z.infer<typeof CreateIssueV2Schema>

// ============================================================================
// Create Issue With Line (defer creation)
// ============================================================================

export const CreateIssueWithLineSchema = z.object({
  department: z.string().min(1, 'Bo phan nhan chi khong duoc de trong').trim(),
  created_by: z.string().min(1, 'Nguoi tao khong duoc de trong').trim(),
  notes: z.string().optional(),
  po_id: z.number().int().positive().optional().nullable(),
  style_id: z.number().int().positive().optional().nullable(),
  style_color_id: z.number().int().positive().optional().nullable(),
  color_id: z.number().int().positive().optional().nullable(),
  sub_art_id: z.number().int().positive().optional().nullable(),
  thread_type_id: z.number().int().positive('thread_type_id phai la so nguyen duong'),
  issued_full: z.number().int().min(0, 'So cuon nguyen phai >= 0').default(0),
  issued_partial: z.number().int().min(0, 'So cuon le phai >= 0').default(0),
  over_quota_notes: z.string().optional().nullable(),
})

export type CreateIssueWithLineDTO = z.infer<typeof CreateIssueWithLineSchema>

// ============================================================================
// Add Issue Line
// ============================================================================

export const AddIssueLineV2Schema = z.object({
  po_id: z.number().int().positive().optional().nullable(),
  style_id: z.number().int().positive().optional().nullable(),
  style_color_id: z.number().int().positive().optional().nullable(),
  color_id: z.number().int().positive().optional().nullable(),
  sub_art_id: z.number().int().positive().optional().nullable(),
  thread_type_id: z.number().int().positive('thread_type_id phai la so nguyen duong'),
  issued_full: z.number().int().min(0, 'So cuon nguyen phai >= 0').default(0),
  issued_partial: z.number().int().min(0, 'So cuon le phai >= 0').default(0),
  over_quota_notes: z.string().optional().nullable(),
})

export type AddIssueLineV2DTO = z.infer<typeof AddIssueLineV2Schema>

export const BatchAddLinesSchema = z.object({
  lines: z.array(AddIssueLineV2Schema).min(1, 'Phai co it nhat 1 dong'),
})

export type BatchAddLinesDTO = z.infer<typeof BatchAddLinesSchema>

// ============================================================================
// Validate Issue Line
// ============================================================================

export const ValidateIssueLineV2Schema = z.object({
  thread_type_id: z.number().int().positive('thread_type_id phai la so nguyen duong'),
  issued_full: z.number().int().min(0, 'So cuon nguyen phai >= 0').default(0),
  issued_partial: z.number().int().min(0, 'So cuon le phai >= 0').default(0),
  po_id: z.number().int().positive().optional().nullable(),
  style_id: z.number().int().positive().optional().nullable(),
  style_color_id: z.number().int().positive().optional().nullable(),
  color_id: z.number().int().positive().optional().nullable(),
  sub_art_id: z.number().int().positive().optional().nullable(),
  department: z.string().optional(),
})

export type ValidateIssueLineV2DTO = z.infer<typeof ValidateIssueLineV2Schema>

// ============================================================================
// Issue List Filters
// ============================================================================

export const IssueV2FiltersSchema = z.object({
  department: z.string().optional(),
  status: IssueV2StatusEnum.optional(),
  from: z.string().optional(), // YYYY-MM-DD
  to: z.string().optional(), // YYYY-MM-DD
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})

export type IssueV2FiltersDTO = z.infer<typeof IssueV2FiltersSchema>

// ============================================================================
// Form Data Query
// ============================================================================

export const FormDataQuerySchema = z.object({
  po_id: z.coerce.number().int().positive().optional(),
  style_id: z.coerce.number().int().positive().optional(),
  style_color_id: z.coerce.number().int().positive().optional(),
  color_id: z.coerce.number().int().positive().optional(),
  department: z.string().trim().optional(),
  warehouse_id: z.coerce.number().int().positive().optional(),
})

export type FormDataQueryDTO = z.infer<typeof FormDataQuerySchema>

// ============================================================================
// Return Issue
// ============================================================================

export const ReturnLineSchema = z.object({
  line_id: z.number().int().positive('line_id phai la so nguyen duong'),
  returned_full: z.number().int().min(0, 'So cuon nguyen tra phai >= 0').default(0),
  returned_partial: z.number().int().min(0, 'So cuon le tra phai >= 0').default(0),
})

export const ReturnIssueV2Schema = z
  .object({
    lines: z.array(ReturnLineSchema).min(1, 'Phai co it nhat 1 dong tra'),
    idempotency_key: z.string().uuid('idempotency_key phai la UUID'),
  })
  .refine(
    (data) => {
      const lineIds = data.lines.map((l) => l.line_id)
      return new Set(lineIds).size === lineIds.length
    },
    { message: 'Khong duoc co line_id trung lap trong request', path: ['lines'] }
  )

export type ReturnLineDTO = z.infer<typeof ReturnLineSchema>
export type ReturnIssueV2DTO = z.infer<typeof ReturnIssueV2Schema>

export const ReturnGroupedLineSchema = z.object({
  thread_type_id: z.number().int().positive('thread_type_id phai la so nguyen duong'),
  returned_full: z.number().int().min(0, 'So cuon nguyen tra phai >= 0').default(0),
  returned_partial: z.number().int().min(0, 'So cuon le tra phai >= 0').default(0),
})

export const ReturnGroupedSchema = z
  .object({
    po_id: z.number().int().positive('po_id phai la so nguyen duong'),
    style_id: z.number().int().positive('style_id phai la so nguyen duong'),
    style_color_id: z.number().int().positive().nullable().optional(),
    color_id: z.number().int().positive().nullable().optional(),
    idempotency_key: z.string().uuid('idempotency_key phai la UUID'),
    lines: z.array(ReturnGroupedLineSchema).min(1, 'Phai co it nhat 1 dong tra'),
  })
  .refine(
    (data) => data.style_color_id || data.color_id,
    { message: 'Phai co style_color_id hoac color_id', path: ['color_id'] }
  )
  .refine(
    (data) => {
      const ids = data.lines.map((l) => l.thread_type_id)
      return new Set(ids).size === ids.length
    },
    { message: 'Khong duoc co thread_type_id trung lap', path: ['lines'] }
  )

export type ReturnGroupedDTO = z.infer<typeof ReturnGroupedSchema>

export const ReturnGroupLogsQuerySchema = z.object({
  po_id: z.coerce.number().int().positive(),
  style_id: z.coerce.number().int().positive(),
  style_color_id: z.coerce.number().int().positive().optional(),
  color_id: z.coerce.number().int().positive().optional(),
})

// ============================================================================
// Confirm Issue
// ============================================================================

export const ConfirmIssueV2Schema = z.object({
  confirmed_by: z.string().optional(),
  idempotency_key: z.string().uuid('idempotency_key phai la UUID'),
  warehouse_id: z.number().int().positive().optional(),
  allow_transfer: z.boolean().optional().default(false),
})

export type ConfirmIssueV2DTO = z.infer<typeof ConfirmIssueV2Schema>

// ============================================================================
// Order Options Query
// ============================================================================

export const OrderOptionsQuerySchema = z.object({
  po_id: z.coerce.number().int().positive().optional(),
  style_id: z.coerce.number().int().positive().optional(),
})

export type OrderOptionsQueryDTO = z.infer<typeof OrderOptionsQuerySchema>

// ============================================================================
// Stock Refresh
// ============================================================================

export const StockRefreshItemSchema = z.object({
  thread_type_id: z.number().int().positive(),
  thread_color_id: z.number().int().positive().nullable().optional(),
  warehouse_id: z.number().int().positive().nullable().optional(),
  color_id: z.number().int().positive(),
})

export const StockRefreshSchema = z.object({
  po_id: z.number().int().positive(),
  style_id: z.number().int().positive(),
  items: z.array(StockRefreshItemSchema).min(1, 'Phai co it nhat 1 item'),
})

export type StockRefreshDTO = z.infer<typeof StockRefreshSchema>
