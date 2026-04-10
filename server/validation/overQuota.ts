import { z } from 'zod'

export function parseQueryArray(val: string | string[] | undefined): string[] {
  if (Array.isArray(val)) return val
  if (val) return [val]
  return []
}

export const overQuotaQuerySchema = z.object({
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  po_ids: z.union([z.string(), z.array(z.string())]).optional(),
  style_ids: z.union([z.string(), z.array(z.string())]).optional(),
  departments: z.union([z.string(), z.array(z.string())]).optional(),
  reason: z.enum(['all', 'ky_thuat', 'rai_dau_may']).default('all'),
  only_over_quota: z.enum(['true', 'false']).default('true'),
})

export const overQuotaTrendQuerySchema = overQuotaQuerySchema.extend({
  granularity: z.enum(['week', 'month']).default('week'),
})

export const overQuotaDetailQuerySchema = overQuotaQuerySchema.extend({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(25),
  sort_by: z.string().optional(),
  descending: z.enum(['true', 'false']).default('true'),
  style_id: z.coerce.number().int().optional(),
})

export type OverQuotaQuery = z.infer<typeof overQuotaQuerySchema>
export type OverQuotaTrendQuery = z.infer<typeof overQuotaTrendQuerySchema>
export type OverQuotaDetailQuery = z.infer<typeof overQuotaDetailQuerySchema>
