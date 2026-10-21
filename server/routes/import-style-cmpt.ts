import { Hono } from 'hono'
import type { PoolClient } from 'pg'
import { runOn, tx } from '../db/query'
import { requirePermission } from '../middleware/auth'
import type { ImportApiResponse } from '../types/import'
import type { AppEnv } from '../types/hono-env'
import {
  CMPT_PRICE_FIELDS,
  CMPT_PRICE_MESSAGE,
  StyleCmptImportRequestSchema,
  normalizeCmptPrice,
  type CmptPriceField,
  type StyleCmptImportRow,
} from '../validation/styleCmpt'

export const STYLE_CMPT_COLUMNS = [
  { field: 'style_code', column: 'A', header: 'Mã hàng', example: 'MH6940' },
  { field: 'cm_price', column: 'B', header: 'CM', example: 1.25 },
  { field: 'p_price', column: 'C', header: 'P', example: 0.15 },
  { field: 't_price', column: 'D', header: 'T', example: 0.08 },
] as const

type CmptPrices = Record<CmptPriceField, string | null>

export type StyleCmptRowStatus = 'UPDATE' | 'UNCHANGED' | 'STYLE_NOT_FOUND' | 'ERROR'

export interface StyleCmptPreviewRow {
  row_number: number
  style_code: string
  style_id: number | null
  style_name: string | null
  status: StyleCmptRowStatus
  error_message: string | null
  old_prices: CmptPrices | null
  new_prices: CmptPrices
}

export interface StyleCmptPreview {
  rows: StyleCmptPreviewRow[]
  summary: { total: number; update: number; unchanged: number; errors: number }
}

export interface StyleCmptImportResult {
  updated: number
  unchanged: number
}

interface StyleRow {
  id: number
  style_code: string
  style_name: string
  cm_price: string | null
  p_price: string | null
  t_price: string | null
}

const EMPTY_PRICES: CmptPrices = { cm_price: null, p_price: null, t_price: null }

function samePrice(a: string | null, b: string | null): boolean {
  if (a === null || b === null) return a === b
  const canon = (s: string) => (s.includes('.') ? s.replace(/\.?0+$/, '') : s)
  return canon(a) === canon(b)
}

const styleKey = (code: string) => code.trim().toLowerCase()

async function buildPreview(rows: StyleCmptImportRow[], client?: PoolClient): Promise<StyleCmptPreview> {
  const keys = [...new Set(rows.map(r => styleKey(r.style_code)).filter(Boolean))]
  const styles = keys.length
    ? await runOn<StyleRow>(
        client,
        `SELECT id, style_code, style_name, cm_price::text, p_price::text, t_price::text
         FROM styles
         WHERE deleted_at IS NULL AND lower(trim(style_code)) = ANY($1::text[])
         ${client ? 'FOR UPDATE' : ''}`,
        [keys]
      )
    : []

  const stylesByKey = new Map<string, StyleRow[]>()
  for (const style of styles) {
    const key = styleKey(style.style_code)
    stylesByKey.set(key, [...(stylesByKey.get(key) ?? []), style])
  }

  const countByKey = new Map<string, number>()
  for (const row of rows) {
    const key = styleKey(row.style_code)
    if (key) countByKey.set(key, (countByKey.get(key) ?? 0) + 1)
  }

  const result: StyleCmptPreviewRow[] = rows.map(row => {
    const styleCode = row.style_code.trim()
    const key = styleKey(styleCode)
    const errors: string[] = []

    const newPrices: CmptPrices = { ...EMPTY_PRICES }
    let badPrice = false
    for (const field of CMPT_PRICE_FIELDS) {
      const price = normalizeCmptPrice(row[field])
      if (price === undefined) badPrice = true
      else newPrices[field] = price
    }

    if (!styleCode) errors.push('Thiếu mã hàng')
    if (badPrice) errors.push(CMPT_PRICE_MESSAGE)
    if (key && (countByKey.get(key) ?? 0) > 1) errors.push('Trùng mã hàng trong cùng file')

    const matches = key ? stylesByKey.get(key) ?? [] : []
    if (matches.length > 1) errors.push('Mã hàng khớp nhiều mã trong hệ thống')
    const style = matches.length === 1 ? matches[0]! : null
    const oldPrices: CmptPrices | null = style
      ? { cm_price: style.cm_price, p_price: style.p_price, t_price: style.t_price }
      : null

    let status: StyleCmptRowStatus
    if (errors.length > 0) {
      status = 'ERROR'
    } else if (!style) {
      status = 'STYLE_NOT_FOUND'
      errors.push('Mã hàng chưa có trong hệ thống')
    } else {
      const changed = CMPT_PRICE_FIELDS.some(
        f => newPrices[f] !== null && !samePrice(newPrices[f], oldPrices![f])
      )
      status = changed ? 'UPDATE' : 'UNCHANGED'
    }

    return {
      row_number: row.row_number,
      style_code: styleCode,
      style_id: style?.id ?? null,
      style_name: style?.style_name ?? null,
      status,
      error_message: errors.length ? errors.join('; ') : null,
      old_prices: oldPrices,
      new_prices: newPrices,
    }
  })

  return {
    rows: result,
    summary: {
      total: result.length,
      update: result.filter(r => r.status === 'UPDATE').length,
      unchanged: result.filter(r => r.status === 'UNCHANGED').length,
      errors: result.filter(r => r.status === 'ERROR' || r.status === 'STYLE_NOT_FOUND').length,
    },
  }
}

class ImportRowsError extends Error {}

const styleCmptImport = new Hono<AppEnv>()

styleCmptImport.post('/style-cmpt/parse', requirePermission('thread.styles.edit'), async (c) => {
  try {
    const parsed = StyleCmptImportRequestSchema.safeParse(await c.req.json())
    if (!parsed.success) {
      return c.json<ImportApiResponse<null>>({
        data: null,
        error: parsed.error.issues.map(i => i.message).join(', '),
      }, 400)
    }
    const preview = await buildPreview(parsed.data.rows)
    return c.json<ImportApiResponse<StyleCmptPreview>>({ data: preview, error: null })
  } catch (err) {
    console.error('Parse style-cmpt error:', err)
    return c.json<ImportApiResponse<null>>({ data: null, error: 'Lỗi khi kiểm tra file giá CMPT' }, 500)
  }
})

styleCmptImport.post('/style-cmpt/execute', requirePermission('thread.styles.edit'), async (c) => {
  try {
    const parsed = StyleCmptImportRequestSchema.safeParse(await c.req.json())
    if (!parsed.success) {
      return c.json<ImportApiResponse<null>>({
        data: null,
        error: parsed.error.issues.map(i => i.message).join(', '),
      }, 400)
    }

    const result = await tx(async (client) => {
      const preview = await buildPreview(parsed.data.rows, client)
      if (preview.summary.errors > 0) {
        throw new ImportRowsError(`File còn ${preview.summary.errors} dòng lỗi, sửa file rồi import lại`)
      }

      let updated = 0
      for (const row of preview.rows) {
        if (row.status !== 'UPDATE') continue
        await client.query(
          `UPDATE styles
           SET cm_price = COALESCE($2::numeric, cm_price),
               p_price = COALESCE($3::numeric, p_price),
               t_price = COALESCE($4::numeric, t_price),
               updated_at = now()
           WHERE id = $1 AND deleted_at IS NULL`,
          [row.style_id, row.new_prices.cm_price, row.new_prices.p_price, row.new_prices.t_price]
        )
        updated++
      }
      return { updated, unchanged: preview.summary.unchanged }
    })

    return c.json<ImportApiResponse<StyleCmptImportResult>>({ data: result, error: null })
  } catch (err) {
    if (err instanceof ImportRowsError) {
      return c.json<ImportApiResponse<null>>({ data: null, error: err.message }, 400)
    }
    console.error('Execute style-cmpt error:', err)
    return c.json<ImportApiResponse<null>>({ data: null, error: 'Lỗi khi cập nhật giá CMPT' }, 500)
  }
})

styleCmptImport.get('/template/style-cmpt', requirePermission('thread.styles.edit'), async (c) => {
  try {
    const ExcelJSModule = await import('exceljs')
    const ExcelJS = ExcelJSModule.default || ExcelJSModule
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Gia CMPT')

    for (const col of STYLE_CMPT_COLUMNS) {
      const headerCell = sheet.getCell(`${col.column}1`)
      headerCell.value = col.header
      headerCell.font = { bold: true }
      headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }
      sheet.getCell(`${col.column}2`).value = col.example
      sheet.getColumn(col.column).width = 18
    }

    const buffer = await workbook.xlsx.writeBuffer()
    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    c.header('Content-Disposition', 'attachment; filename="template-import-gia-cmpt.xlsx"')
    return c.body(buffer as ArrayBuffer)
  } catch (err) {
    console.error('Template style-cmpt error:', err)
    return c.json<ImportApiResponse<null>>({ data: null, error: 'Lỗi khi tạo file mẫu' }, 500)
  }
})

export default styleCmptImport
