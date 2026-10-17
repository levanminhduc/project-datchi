import type { ChatAssistantResult } from '@/types/thread'
import {
  buildStockTableRows,
  formatAssistantText,
  type StockTableRow,
} from './chat-assistant-presentation'

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

export interface AnswerBlock {
  type: 'paragraph' | 'list'
  lines: AnswerSegment[][]
}

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

export function parseAnswerBlocks(text: string): AnswerBlock[] {
  const blocks: AnswerBlock[] = []
  let current: AnswerBlock | null = null

  for (const rawLine of text.split('\n')) {
    if (!rawLine.trim()) {
      current = null
      continue
    }

    const listMatch = LIST_ITEM_PATTERN.exec(rawLine)
    const type: AnswerBlock['type'] = listMatch ? 'list' : 'paragraph'
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
