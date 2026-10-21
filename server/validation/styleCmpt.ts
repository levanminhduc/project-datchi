import { z } from 'zod'

export const CMPT_PRICE_MESSAGE = 'Giá CMPT phải là số không âm, tối đa 4 chữ số thập phân'

const CMPT_PRICE_PATTERN = /^\d{1,8}(\.\d{1,4})?$/

export function normalizeCmptPrice(value: unknown): string | null | undefined {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return undefined
    value = String(value)
  }
  if (typeof value !== 'string') return undefined
  const text = value.trim().replace(',', '.')
  if (text === '') return null
  return CMPT_PRICE_PATTERN.test(text) ? text : undefined
}

export const CMPT_PRICE_FIELDS = ['cm_price', 'p_price', 't_price'] as const
export type CmptPriceField = (typeof CMPT_PRICE_FIELDS)[number]

export function pickCmptPrices(
  body: Record<string, unknown>,
): { prices: Partial<Record<CmptPriceField, string | null>>; error?: string } {
  const prices: Partial<Record<CmptPriceField, string | null>> = {}
  for (const field of CMPT_PRICE_FIELDS) {
    if (body[field] === undefined) continue
    const price = normalizeCmptPrice(body[field])
    if (price === undefined) return { prices, error: CMPT_PRICE_MESSAGE }
    prices[field] = price
  }
  return { prices }
}

const ImportCellSchema = z.union([z.string(), z.number(), z.null()]).optional()

export const StyleCmptImportRowSchema = z.object({
  row_number: z.number().int().positive(),
  style_code: z.string(),
  cm_price: ImportCellSchema,
  p_price: ImportCellSchema,
  t_price: ImportCellSchema,
})

export const StyleCmptImportRequestSchema = z.object({
  rows: z
    .array(StyleCmptImportRowSchema)
    .min(1, { message: 'Không có dữ liệu để import' })
    .max(5000, { message: 'Tối đa 5000 dòng mỗi lần import' }),
})

export type StyleCmptImportRow = z.infer<typeof StyleCmptImportRowSchema>
