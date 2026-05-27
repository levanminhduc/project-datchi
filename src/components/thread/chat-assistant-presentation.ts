import type { ChatAssistantResult, ChatAssistantStockRow } from '@/types/thread'

export interface StockTableRow {
  id: string
  supplierName: string
  texLabel: string
  colorName: string
  fullCones: number
  partialCones: number
  partialMeters: number
}

export function buildStockTableRows(result: ChatAssistantResult): StockTableRow[] {
  if (result.stock.length > 0) {
    return result.stock.map((row) => mapFallbackStockRow(row))
  }

  return extractContextRows(result.context)
    .filter(isInventoryContextRow)
    .map((row, index) => mapContextStockRow(row, result.term, index))
}

export function formatAssistantText(answer: string, stockRows: StockTableRow[]): string {
  if (stockRows.length === 0) return answer

  const lines = answer.split('\n')
  const formatted: string[] = []
  let skippingStockBullets = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('Tồn khả dụng của') || trimmed.startsWith('Chưa thấy tồn kho')) {
      formatted.push(line)
      skippingStockBullets = true
      continue
    }

    if (skippingStockBullets && trimmed.startsWith('- ')) {
      continue
    }

    if (skippingStockBullets && trimmed) {
      skippingStockBullets = false
    }
    formatted.push(line)
  }

  return formatted.join('\n').trim()
}

export function formatChatNumber(value: number): string {
  return value.toLocaleString('vi-VN', { maximumFractionDigits: 0 })
}

function mapFallbackStockRow(row: ChatAssistantStockRow): StockTableRow {
  return {
    id: `stock-${row.thread_type_id}-${row.color_name ?? 'none'}`,
    supplierName: row.supplier_name || 'Không rõ NCC',
    texLabel: formatTexLabel(row.tex_number),
    colorName: row.color_name || row.thread_name || row.thread_code,
    fullCones: row.available_full_cones,
    partialCones: row.available_partial_cones,
    partialMeters: row.partial_meters,
  }
}

function mapContextStockRow(
  row: Record<string, unknown>,
  fallbackTerm: string | null,
  index: number,
): StockTableRow {
  const colorName = readColorName(row) || readString(row, 'thread_name', 'thread_code') || fallbackTerm || '-'

  return {
    id: [
      'context',
      readString(row, 'thread_type_id', 'thread_code') || index,
      readString(row, 'supplier_name') || 'none',
      readString(row, 'color_id') || colorName,
      index,
    ].join('-'),
    supplierName: readString(row, 'supplier_name') || 'Không rõ NCC',
    texLabel: formatTexLabel(readString(row, 'tex_label', 'tex_number')),
    colorName,
    fullCones: readNumber(row, 'full_cones', 'available_full_cones'),
    partialCones: readNumber(row, 'partial_cones', 'available_partial_cones'),
    partialMeters: readNumber(row, 'partial_meters'),
  }
}

function extractContextRows(context: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(context)) return context.filter(isRecord)
  if (!isRecord(context)) return []

  for (const key of ['rows', 'data', 'items', 'stock']) {
    const value = context[key]
    if (Array.isArray(value)) return value.filter(isRecord)
  }

  return []
}

function isInventoryContextRow(row: Record<string, unknown>): boolean {
  return [
    'full_cones',
    'partial_cones',
    'available_full_cones',
    'available_partial_cones',
  ].some((key) => key in row)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readString(row: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = row[key]
    if ((typeof value === 'string' || typeof value === 'number') && String(value).trim()) {
      return String(value).trim()
    }
  }
  return null
}

function readNumber(row: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const value = row[key]
    const parsed = typeof value === 'number' ? value : Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

function readColorName(row: Record<string, unknown>): string | null {
  const colorData = row.color_data
  if (isRecord(colorData)) {
    const name = readString(colorData, 'name')
    if (name) return name
  }

  return readString(row, 'color_name')
}

function formatTexLabel(value: string | null): string {
  if (!value) return 'Tex ?'
  return value.toLocaleLowerCase('vi-VN').startsWith('tex') ? value : `Tex ${value}`
}
