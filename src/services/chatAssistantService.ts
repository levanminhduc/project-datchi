import { fetchApi, fetchApiRaw } from './api'
import {
  handleStreamEvent,
  parseSseChunks,
  StreamUnavailableError,
  STREAM_FALLBACK_ERROR,
  type StreamHandlers,
} from './chat-stream'
import type { ChatAssistantResult, ChatHistoryItem } from '@/types/thread'

interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

const BASE = '/api/chat-assistant'
const STREAM_CONNECT_TIMEOUT_MS = 30_000
const STREAM_INTERRUPTED = 'Mất kết nối khi trợ lý đang trả lời. Vui lòng thử lại.'

function isEventStream(response: Response): boolean {
  return (response.headers.get('content-type') ?? '').includes('text/event-stream')
}

async function failFromJson(response: Response): Promise<never> {
  const payload = (await response.json().catch(() => null)) as ApiResponse<unknown> | null
  if (response.status === 404 && payload?.error === 'stream_unavailable') throw new StreamUnavailableError()
  throw new Error(payload?.error || STREAM_FALLBACK_ERROR)
}

async function readStream(response: Response, handlers: StreamHandlers): Promise<ChatAssistantResult> {
  if (!response.body) throw new Error(STREAM_INTERRUPTED)
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      const parsed = parseSseChunks(buffer + decoder.decode(value, { stream: true }))
      buffer = parsed.rest
      for (const event of parsed.events) {
        const result = handleStreamEvent(event, handlers)
        if (result) return result
      }
    }
  } finally {
    await reader.cancel().catch(() => {})
  }
  throw new Error(STREAM_INTERRUPTED)
}

export const chatAssistantService = {
  async query(message: string, history: ChatHistoryItem[] = []): Promise<ChatAssistantResult> {
    const response = await fetchApi<ApiResponse<ChatAssistantResult>>(`${BASE}/query`, {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }, {
      timeout: 30_000,
      retryOnServerBusy: false,
    })

    if (response.error) throw new Error(response.error)
    if (!response.data) throw new Error('Không có dữ liệu trả về')
    return response.data
  },

  async stream(
    message: string,
    history: ChatHistoryItem[],
    handlers: StreamHandlers,
  ): Promise<ChatAssistantResult> {
    const response = await fetchApiRaw(`${BASE}/stream`, {
      method: 'POST',
      headers: { Accept: 'text/event-stream' },
      body: JSON.stringify({ message, history }),
    }, {
      includeJsonContentType: true,
      timeout: STREAM_CONNECT_TIMEOUT_MS,
      retryOnServerBusy: false,
    })

    if (!response.ok || !isEventStream(response)) return failFromJson(response)
    return readStream(response, handlers)
  },
}
