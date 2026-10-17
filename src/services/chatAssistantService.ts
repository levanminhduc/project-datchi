import { fetchApi } from './api'
import type { ChatAssistantResult, ChatHistoryItem } from '@/types/thread'

interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

const BASE = '/api/chat-assistant'

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
}
