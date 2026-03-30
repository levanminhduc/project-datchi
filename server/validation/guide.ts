import { z } from 'zod'

export const CreateGuideSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống').max(200, 'Tiêu đề tối đa 200 ký tự'),
  content: z.record(z.any()).default({}),
  content_html: z.string().default(''),
  cover_image_url: z.string().url('URL ảnh bìa không hợp lệ').optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
})

export const UpdateGuideSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống').max(200, 'Tiêu đề tối đa 200 ký tự').optional(),
  content: z.record(z.any()).optional(),
  content_html: z.string().optional(),
  cover_image_url: z.string().url('URL ảnh bìa không hợp lệ').optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  sort_order: z.number().int().optional(),
})

export const ReorderGuideSchema = z.object({
  sort_order: z.number().int().min(0, 'Thứ tự phải >= 0'),
})
