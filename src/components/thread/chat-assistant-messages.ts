import type { ChatAssistantResult } from '@/types/thread'
import {
  buildStockTableRows,
  formatAssistantText,
  type StockTableRow,
} from './chat-assistant-presentation'
import {
  isNumericCell,
  isTableRow,
  isTableSeparator,
  splitTableCells,
} from './chat-answer-table'

export interface ChatMessage {
  id: number
  role: 'assistant' | 'user'
  text: string
  status: 'thinking' | 'done' | 'error'
  stockRows?: StockTableRow[]
  sources?: string[]
  suggestions?: string[]
  answerKind?: string
  createdAt: number
  question?: string
}

export interface AssistantMessageContent {
  text: string
  stockRows: StockTableRow[]
  sources: string[]
  suggestions: string[]
  answerKind?: string
}

export interface AnswerSegment {
  text: string
  bold: boolean
}

export type AnswerBlock =
  | { type: 'paragraph' | 'list'; lines: AnswerSegment[][] }
  | { type: 'table'; headers: AnswerSegment[][]; rows: AnswerSegment[][][]; numeric: boolean[] }

export const STARTER_QUESTIONS: string[] = [
  'Tex 40 màu C9700 còn bao nhiêu cuộn?',
  'Mã hàng AB123 dùng bao nhiêu mét chỉ?',
  'Đơn hàng PO-2024-01 cần những loại chỉ nào?',
]

const MAX_SUGGESTIONS = 3

const SOURCE_LABELS: Record<string, string> = {
  search_stock: 'Tồn kho',
  search_usage: 'Định mức',
  search_styles: 'Mã hàng',
  search_purchase_orders: 'Đơn hàng',
  search_thread_orders: 'Đơn hàng',
}

const LIST_ITEM_PATTERN = /^\s*(?:[-*•]|\d+[.)])\s+(.*)$/
const BOLD_PATTERN = /\*\*([^*]+)\*\*/g

export function toAssistantMessage(result: ChatAssistantResult): AssistantMessageContent {
  const stockRows = buildStockTableRows(result)

  return {
    text: formatAssistantText(result.answer, stockRows),
    stockRows,
    sources: extractSources(result.context),
    suggestions: (result.suggestions ?? []).slice(0, MAX_SUGGESTIONS),
    ...(result.answer_kind ? { answerKind: result.answer_kind } : {}),
  }
}

function buildTableBlock(lines: string[]): AnswerBlock {
  const headers = splitTableCells(lines[0] ?? '')
  const rows = lines.slice(2).map((line) => {
    const cells = splitTableCells(line).slice(0, headers.length)
    while (cells.length < headers.length) cells.push('')
    return cells
  })
  const numeric = headers.map((_, column) => {
    const values = rows.map((row) => (row[column] ?? '').replace(BOLD_PATTERN, '$1')).filter((cell) => cell !== '')
    return values.length > 0 && values.every(isNumericCell)
  })

  return {
    type: 'table',
    headers: headers.map(parseInlineSegments),
    rows: rows.map((row) => row.map(parseInlineSegments)),
    numeric,
  }
}

export function parseAnswerBlocks(text: string): AnswerBlock[] {
  const blocks: AnswerBlock[] = []
  let current: Extract<AnswerBlock, { lines: AnswerSegment[][] }> | null = null
  const lines = text.split('\n')

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index] ?? ''
    if (isTableRow(rawLine) && isTableSeparator(lines[index + 1] ?? '')) {
      let end = index + 2
      while (end < lines.length && isTableRow(lines[end] ?? '')) end += 1
      blocks.push(buildTableBlock(lines.slice(index, end)))
      current = null
      index = end - 1
      continue
    }

    if (!rawLine.trim()) {
      current = null
      continue
    }

    const listMatch = LIST_ITEM_PATTERN.exec(rawLine)
    const type: 'paragraph' | 'list' = listMatch ? 'list' : 'paragraph'
    const content = (listMatch?.[1] ?? rawLine).trim()
    const segments = parseInlineSegments(content)
    if (segments.length === 0) continue

    if (!current || current.type !== type) {
      current = { type, lines: [] }
      blocks.push(current)
    }
    current.lines.push(segments)
  }

  return blocks
}

function parseInlineSegments(content: string): AnswerSegment[] {
  const segments: AnswerSegment[] = []
  let cursor = 0

  for (const match of content.matchAll(BOLD_PATTERN)) {
    const start = match.index ?? 0
    if (start > cursor) segments.push({ text: content.slice(cursor, start), bold: false })
    if (match[1]) segments.push({ text: match[1], bold: true })
    cursor = start + match[0].length
  }

  if (cursor < content.length) segments.push({ text: content.slice(cursor), bold: false })
  return segments
}

function extractSources(context: unknown): string[] {
  if (typeof context !== 'object' || context === null) return []

  const toolsUsed = (context as Record<string, unknown>).tools_used
  if (!Array.isArray(toolsUsed)) return []

  const labels: string[] = []
  for (const tool of toolsUsed) {
    const label = typeof tool === 'string' ? SOURCE_LABELS[tool] : undefined
    if (label && !labels.includes(label)) labels.push(label)
  }
  return labels
}
