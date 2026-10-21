import { fetchApi, fetchApiRaw } from './api'
import { consumeStreamResponse, type StreamHandlers } from './chat-stream'
import type { ChatAssistantResult, ChatFeedbackRequest, ChatHistoryItem } from '@/types/thread'

interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

const BASE = '/api/chat-assistant'
const STREAM_CONNECT_TIMEOUT_MS = 30_000
const FEEDBACK_TIMEOUT_MS = 15_000

export const chatAssistantService = {
  async query(
    message: string,
    history: ChatHistoryItem[] = [],
    signal?: AbortSignal,
  ): Promise<ChatAssistantResult> {
    const response = await fetchApi<ApiResponse<ChatAssistantResult>>(`${BASE}/query`, {
      method: 'POST',
      body: JSON.stringify({ message, history }),
      signal,
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
    signal?: AbortSignal,
  ): Promise<ChatAssistantResult> {
    const response = await fetchApiRaw(`${BASE}/stream`, {
      method: 'POST',
      headers: { Accept: 'text/event-stream' },
      body: JSON.stringify({ message, history }),
      signal,
    }, {
      includeJsonContentType: true,
      timeout: STREAM_CONNECT_TIMEOUT_MS,
      retryOnServerBusy: false,
    })

    return consumeStreamResponse(response, handlers, signal)
  },

  async feedback(request: ChatFeedbackRequest): Promise<void> {
    const response = await fetchApi<ApiResponse<{ ok: boolean }>>(`${BASE}/feedback`, {
      method: 'POST',
      body: JSON.stringify(request),
    }, {
      timeout: FEEDBACK_TIMEOUT_MS,
      retryOnServerBusy: false,
    })

    if (response.error) throw new Error(response.error)
  },
}
