import { z } from 'zod'

export const CreatePOItemSchema = z.object({
  style_id: z.number().int().positive({ message: 'style_id phải là số dương' }),
  quantity: z.number().int().positive({ message: 'Số lượng phải lớn hơn 0' }),
  finished_product_code: z.string().trim().max(100, 'Mã TP KT tối đa 100 ký tự').optional(),
  notes: z.string().optional(),
})

export const UpdatePOItemSchema = z.object({
  quantity: z.number().int().positive({ message: 'Số lượng phải lớn hơn 0' }),
  finished_product_code: z.string().trim().max(100, 'Mã TP KT tối đa 100 ký tự').optional(),
  notes: z.string().optional(),
})

export const POImportParseRequestSchema = z.object({
  rows: z.array(z.object({
    row_number: z.number(),
    customer_name: z.string().optional(),
    po_number: z.string(),
    style_code: z.string(),
    week: z.string().optional(),
    description: z.string().optional(),
    finished_product_code: z.string().optional(),
    quantity: z.number(),
  })).min(1, { message: 'Không có dữ liệu để import' }),
})

export const POImportExecuteRequestSchema = z.object({
  rows: z.array(z.object({
    row_number: z.number().optional(),
    customer_name: z.string().optional(),
    po_number: z.string(),
    style_code: z.string(),
    week: z.string().optional(),
    description: z.string().optional(),
    style_id: z.number().optional(),
    finished_product_code: z.string().optional(),
    quantity: z.number(),
    status: z.enum(['new', 'update', 'skip', 'new_style']),
  })).min(1, { message: 'Không có dữ liệu để import' }),
})

export type CreatePOItemInput = z.infer<typeof CreatePOItemSchema>
export type UpdatePOItemInput = z.infer<typeof UpdatePOItemSchema>
export type POImportParseRequest = z.infer<typeof POImportParseRequestSchema>
export type POImportExecuteRequest = z.infer<typeof POImportExecuteRequestSchema>
