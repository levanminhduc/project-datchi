import { z } from 'zod'

export const CreatePOItemSchema = z.object({
  style_id: z.number().int().positive({ message: 'style_id phải là số dương' }),
  quantity: z.number().int().positive({ message: 'Số lượng phải lớn hơn 0' }),
  notes: z.string().optional(),
})

export const UpdatePOItemSchema = z.object({
  quantity: z.number().int().positive({ message: 'Số lượng phải lớn hơn 0' }),
  notes: z.string().optional(),
})

export const POImportParseRequestSchema = z.object({
  rows: z.array(z.object({
    row_number: z.number(),
    po_number: z.string(),
    style_code: z.string(),
    quantity: z.number(),
    customer_name: z.string().optional(),
    order_date: z.string().optional(),
    notes: z.string().optional(),
  })).min(1, { message: 'Không có dữ liệu để import' }),
})

export const POImportExecuteRequestSchema = z.object({
  rows: z.array(z.object({
    po_number: z.string(),
    style_code: z.string(),
    style_id: z.number(),
    quantity: z.number(),
    customer_name: z.string().optional(),
    order_date: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(['new', 'update', 'skip']),
  })).min(1, { message: 'Không có dữ liệu để import' }),
})

export type CreatePOItemInput = z.infer<typeof CreatePOItemSchema>
export type UpdatePOItemInput = z.infer<typeof UpdatePOItemSchema>
export type POImportParseRequest = z.infer<typeof POImportParseRequestSchema>
export type POImportExecuteRequest = z.infer<typeof POImportExecuteRequestSchema>
