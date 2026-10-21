import type { ChatAssistantResult } from '@/types/thread'

export type StreamStatus =
  | { phase: 'thinking' }
  | { phase: 'tool'; tools: string[] }
  | { phase: 'retry' }

export interface StreamHandlers {
  onStatus(status: StreamStatus): void
  onDelta(text: string): void
}

export interface SseEvent {
  event: string
  data: string
}

export class StreamUnavailableError extends Error {
  constructor() {
    super('stream_unavailable')
    this.name = 'StreamUnavailableError'
  }
}

export const STREAM_FALLBACK_ERROR = 'Không thể kết nối tới trợ lý. Vui lòng thử lại.'
const EMPTY_ANSWER = 'Trợ lý không trả về câu trả lời.'
const INVALID_DONE = 'Trợ lý trả về dữ liệu không hợp lệ'
const MAX_SUGGESTIONS = 3

function parseBlock(block: string): SseEvent | null {
  let event = 'message'
  const data: string[] = []
  for (const line of block.split('\n')) {
    if (line === '' || line.startsWith(':')) continue
    const colon = line.indexOf(':')
    const field = colon === -1 ? line : line.slice(0, colon)
    const raw = colon === -1 ? '' : line.slice(colon + 1)
    const value = raw.startsWith(' ') ? raw.slice(1) : raw
    if (field === 'event') event = value
    else if (field === 'data') data.push(value)
  }
  return data.length > 0 ? { event, data: data.join('\n') } : null
}

export function parseSseChunks(buffer: string): { events: SseEvent[]; rest: string } {
  const blocks = buffer.replace(/\r\n/g, '\n').split('\n\n')
  const rest = blocks.pop() ?? ''
  const events: SseEvent[] = []
  for (const block of blocks) {
    const parsed = parseBlock(block)
    if (parsed) events.push(parsed)
  }
  return { events, rest }
}

function readStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

export function normalizeDone(data: unknown): ChatAssistantResult {
  const record = (typeof data === 'object' && data !== null ? data : {}) as Record<string, unknown>
  const hasAnswer = typeof record.answer === 'string' && record.answer.trim() !== ''
  const answer = hasAnswer ? (record.answer as string) : EMPTY_ANSWER
  const serviceKind = typeof record.answer_kind === 'string' && record.answer_kind !== '' ? record.answer_kind : undefined
  const answerKind = hasAnswer ? serviceKind : 'empty'
  const suggestions = readStrings(record.suggestions)
    .map((item) => item.trim())
    .filter((item) => item !== '')
    .slice(0, MAX_SUGGESTIONS)

  return {
    answer,
    term: null,
    tex: null,
    intents: [],
    stock: [],
    usage: [],
    suggestions,
    context: { tools_used: readStrings(record.tools_used) },
    ...(answerKind ? { answer_kind: answerKind } : {}),
  }
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function readStatus(payload: unknown): StreamStatus | null {
  if (typeof payload !== 'object' || payload === null) return null
  const record = payload as Record<string, unknown>
  if (record.phase === 'thinking' || record.phase === 'retry') return { phase: record.phase }
  if (record.phase === 'tool') return { phase: 'tool', tools: readStrings(record.tools) }
  return null
}

function readString(payload: unknown, key: string): string | null {
  if (typeof payload !== 'object' || payload === null) return null
  const value = (payload as Record<string, unknown>)[key]
  return typeof value === 'string' && value !== '' ? value : null
}

export function handleStreamEvent(event: SseEvent, handlers: StreamHandlers): ChatAssistantResult | null {
  const payload = parseJson(event.data)
  if (event.event === 'status') {
    const status = readStatus(payload)
    if (status) handlers.onStatus(status)
  } else if (event.event === 'delta') {
    const text = readString(payload, 'text')
    if (text) handlers.onDelta(text)
  } else if (event.event === 'done') {
    if (typeof payload !== 'object' || payload === null) throw new Error(INVALID_DONE)
    return normalizeDone(payload)
  } else if (event.event === 'error') {
    throw new Error(readString(payload, 'message') ?? STREAM_FALLBACK_ERROR)
  }
  return null
}
