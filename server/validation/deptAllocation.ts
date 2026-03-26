import { z } from 'zod'

export const DeptAllocationSummaryQuerySchema = z.object({
  po_id: z.coerce.number().int().positive('po_id phai la so nguyen duong'),
  style_id: z.coerce.number().int().positive('style_id phai la so nguyen duong'),
  style_color_id: z.coerce.number().int().positive('style_color_id phai la so nguyen duong'),
})

export const DeptAllocateSchema = z.object({
  po_id: z.number().int().positive('po_id phai la so nguyen duong'),
  style_id: z.number().int().positive('style_id phai la so nguyen duong'),
  style_color_id: z.number().int().positive('style_color_id phai la so nguyen duong'),
  department: z.string().trim().min(1, 'Bo phan khong duoc de trong'),
  add_quantity: z.number().int().positive('So luong phai lon hon 0'),
  created_by: z.string().trim().min(1, 'Nguoi tao khong duoc de trong'),
})

export const DeptQuotaQuerySchema = z.object({
  po_id: z.coerce.number().int().positive('po_id phai la so nguyen duong'),
  style_id: z.coerce.number().int().positive('style_id phai la so nguyen duong'),
  style_color_id: z.coerce.number().int().positive('style_color_id phai la so nguyen duong'),
  department: z.string().trim().min(1, 'Bo phan khong duoc de trong'),
  thread_type_id: z.coerce.number().int().positive('thread_type_id phai la so nguyen duong'),
})

export const DeptLogsQuerySchema = z.object({
  po_id: z.coerce.number().int().positive('po_id phai la so nguyen duong'),
  style_id: z.coerce.number().int().positive('style_id phai la so nguyen duong'),
  style_color_id: z.coerce.number().int().positive('style_color_id phai la so nguyen duong'),
  department: z.string().trim().min(1, 'Bo phan khong duoc de trong').optional(),
})

export type DeptAllocationSummaryQueryDTO = z.infer<typeof DeptAllocationSummaryQuerySchema>
export type DeptAllocateDTO = z.infer<typeof DeptAllocateSchema>
export type DeptQuotaQueryDTO = z.infer<typeof DeptQuotaQuerySchema>
export type DeptLogsQueryDTO = z.infer<typeof DeptLogsQuerySchema>
