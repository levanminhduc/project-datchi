import { z } from 'zod'

export const CreateAnnouncementSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống').max(255, 'Tiêu đề tối đa 255 ký tự'),
  content: z.string().min(1, 'Nội dung không được để trống'),
  priority: z.coerce.number().int().min(0).default(0),
})

export const UpdateAnnouncementSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống').max(255, 'Tiêu đề tối đa 255 ký tự').optional(),
  content: z.string().min(1, 'Nội dung không được để trống').optional(),
  priority: z.coerce.number().int().min(0).optional(),
})

export const AnnouncementListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
})

export type CreateAnnouncementDTO = z.infer<typeof CreateAnnouncementSchema>
export type UpdateAnnouncementDTO = z.infer<typeof UpdateAnnouncementSchema>
