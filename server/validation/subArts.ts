import { z } from 'zod'

export const SubArtQuerySchema = z.object({
  style_id: z.coerce.number().int().positive('style_id phải là số nguyên dương'),
})

export const ImportSubArtRowSchema = z.object({
  style_code: z.string().min(1, 'Thiếu mã hàng'),
  sub_art_code: z.string().min(1, 'Thiếu mã sub-art'),
})

export const ImportSubArtSchema = z.object({
  rows: z.array(ImportSubArtRowSchema).min(1, 'Không có dữ liệu để import'),
})

export type SubArtQueryDTO = z.infer<typeof SubArtQuerySchema>
export type ImportSubArtDTO = z.infer<typeof ImportSubArtSchema>
