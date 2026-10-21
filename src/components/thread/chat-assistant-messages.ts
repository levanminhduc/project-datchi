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
import { toolLabel } from './chat-tool-labels'

export interface ChatMessage {
  id: number
  role: 'assistant' | 'user'
  text: string
  status: 'thinking' | 'streaming' | 'done' | 'error'
  statusText?: string
  stockRows?: StockTableRow[]
  sources?: string[]
  suggestions?: string[]
  answerKind?: string
  requestId?: string
  createdAt: number
  question?: string
}

export interface AssistantMessageContent {
  text: string
  stockRows: StockTableRow[]
  sources: string[]
  suggestions: string[]
  answerKind?: string
  requestId?: string
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

const LIST_ITEM_PATTERN = /^\s*(?:[-*•]|\d+[.)])\s+(.*)$/
const BOLD_PATTERN = /\*\*([^*]+)\*\*/g
const PARTIAL_SEPARATOR_PATTERN = /^[\s|:-]*$/

export interface ParseAnswerOptions {
  streaming?: boolean
}

export function toAssistantMessage(result: ChatAssistantResult): AssistantMessageContent {
  const stockRows = buildStockTableRows(result)

  return {
    text: formatAssistantText(result.answer, stockRows),
    stockRows,
    sources: extractSources(result.context),
    suggestions: (result.suggestions ?? []).slice(0, MAX_SUGGESTIONS),
    ...(result.answer_kind ? { answerKind: result.answer_kind } : {}),
    ...(result.request_id ? { requestId: result.request_id } : {}),
  }
}

function buildTableBlock(lines: string[], streaming: boolean): AnswerBlock {
  const parseCell = (cell: string) => parseInlineSegments(cell, streaming)
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
    headers: headers.map(parseCell),
    rows: rows.map((row) => row.map(parseCell)),
    numeric,
  }
}

function isPartialSeparator(line: string): boolean {
  return isTableRow(line) && PARTIAL_SEPARATOR_PATTERN.test(line) && !isTableSeparator(line)
}

export function parseAnswerBlocks(text: string, options: ParseAnswerOptions = {}): AnswerBlock[] {
  const streaming = options.streaming === true
  const blocks: AnswerBlock[] = []
  let current: Extract<AnswerBlock, { lines: AnswerSegment[][] }> | null = null
  const lines = text.split('\n')

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index] ?? ''
    if (isTableRow(rawLine) && isTableSeparator(lines[index + 1] ?? '')) {
      let end = index + 2
      while (end < lines.length && isTableRow(lines[end] ?? '')) end += 1
      if (streaming && end === lines.length && end > index + 2 && !(lines[end - 1] ?? '').trim().endsWith('|')) end -= 1
      blocks.push(buildTableBlock(lines.slice(index, end), streaming))
      current = null
      index = end - 1
      continue
    }

    if (streaming && isTableRow(rawLine)) {
      const next = lines[index + 1]
      const atEnd = (offset: number) => index + offset === lines.length || (index + offset + 1 === lines.length && lines[index + offset] === '')
      if (next === undefined || (next === '' && atEnd(2))) continue
      if (atEnd(2) && isPartialSeparator(next)) break
    }

    if (!rawLine.trim()) {
      current = null
      continue
    }

    const listMatch = LIST_ITEM_PATTERN.exec(rawLine)
    const type: 'paragraph' | 'list' = listMatch ? 'list' : 'paragraph'
    const content = (listMatch?.[1] ?? rawLine).trim()
    const segments = parseInlineSegments(content, streaming)
    if (segments.length === 0) continue

    if (!current || current.type !== type) {
      current = { type, lines: [] }
      blocks.push(current)
    }
    current.lines.push(segments)
  }

  return blocks
}

function plainSegment(text: string, streaming: boolean, atEnd: boolean): AnswerSegment[] {
  if (!streaming) return text ? [{ text, bold: false }] : []
  const stripped = text.replace(/\*\*/g, '')
  const cleaned = atEnd ? stripped.replace(/\*$/, '') : stripped
  return cleaned ? [{ text: cleaned, bold: false }] : []
}

function parseInlineSegments(content: string, streaming = false): AnswerSegment[] {
  const segments: AnswerSegment[] = []
  let cursor = 0

  for (const match of content.matchAll(BOLD_PATTERN)) {
    const start = match.index ?? 0
    if (start > cursor) segments.push(...plainSegment(content.slice(cursor, start), streaming, false))
    if (match[1]) segments.push({ text: match[1], bold: true })
    cursor = start + match[0].length
  }

  if (cursor < content.length) segments.push(...plainSegment(content.slice(cursor), streaming, true))
  return segments
}

function extractSources(context: unknown): string[] {
  if (typeof context !== 'object' || context === null) return []

  const toolsUsed = (context as Record<string, unknown>).tools_used
  if (!Array.isArray(toolsUsed)) return []

  const labels: string[] = []
  for (const tool of toolsUsed) {
    const label = typeof tool === 'string' ? toolLabel(tool)?.source : undefined
    if (label && !labels.includes(label)) labels.push(label)
  }
  return labels
}
