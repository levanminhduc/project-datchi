import { z } from 'zod'

// ============================================================================
// Zod Schemas for Thread Issue Management (Xuat Kho San Xuat)
// ============================================================================

/**
 * Schema for creating a new issue request
 */
export const CreateIssueRequestSchema = z.object({
  po_id: z.number().int().positive('po_id phai la so nguyen duong'),

  style_id: z.number().int().positive('style_id phai la so nguyen duong'),

  color_id: z.number().int().positive('color_id phai la so nguyen duong'),

  thread_type_id: z.number().int().positive('thread_type_id phai la so nguyen duong'),

  department: z.string().min(1, 'Bo phan nhan chi khong duoc de trong').trim(),

  requested_meters: z.number().positive('So met yeu cau phai lon hon 0'),

  notes: z.string().optional(),
  created_by: z.string().optional(),
})

export type CreateIssueRequestDTO = z.infer<typeof CreateIssueRequestSchema>

/**
 * Schema for updating an issue request (notes or cancel)
 */
export const UpdateIssueRequestSchema = z.object({
  notes: z.string().optional(),
  status: z.enum(['CANCELLED'], {
    message: 'Chi co the huy phieu xuat (CANCELLED)',
  }).optional(),
})

export type UpdateIssueRequestDTO = z.infer<typeof UpdateIssueRequestSchema>

/**
 * Schema for query parameters when listing issue requests
 */
export const IssueRequestFiltersSchema = z.object({
  po_id: z.coerce.number().int().positive().optional(),
  style_id: z.coerce.number().int().positive().optional(),
  color_id: z.coerce.number().int().positive().optional(),
  department: z.string().optional(),
  status: z.enum(['PENDING', 'PARTIAL', 'COMPLETED', 'CANCELLED']).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})

export type IssueRequestFiltersDTO = z.infer<typeof IssueRequestFiltersSchema>

/**
 * Schema for adding an issue item (cone) to a request
 */
export const AddIssueItemSchema = z.object({
  cone_id: z.number().int().positive('cone_id phai la so nguyen duong'),

  allocation_id: z.number().int().positive().optional(),

  over_limit_notes: z.string().optional(),

  issued_by: z.string().optional(),
})

export type AddIssueItemDTO = z.infer<typeof AddIssueItemSchema>

/**
 * Schema for creating an issue return (partial cone return)
 */
export const CreateReturnSchema = z.object({
  issue_item_id: z.number().int().positive('issue_item_id phai la so nguyen duong'),

  cone_id: z.number().int().positive('cone_id phai la so nguyen duong'),

  remaining_percentage: z
    .number()
    .min(1, 'Ty le phai tu 1% tro len')
    .max(100, 'Ty le khong duoc qua 100%'),

  notes: z.string().optional(),
  returned_by: z.string().optional(),
})

export type CreateReturnDTO = z.infer<typeof CreateReturnSchema>

/**
 * Schema for return query filters
 */
export const ReturnFiltersSchema = z.object({
  issue_request_id: z.coerce.number().int().positive().optional(),
  cone_id: z.coerce.number().int().positive().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})

export type ReturnFiltersDTO = z.infer<typeof ReturnFiltersSchema>
