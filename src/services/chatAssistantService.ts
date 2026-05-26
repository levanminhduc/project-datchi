import { fetchApi } from './api'
import type { ChatAssistantResult } from '@/types/thread'

interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

const BASE = '/api/chat-assistant'

export const chatAssistantService = {
  async query(message: string): Promise<ChatAssistantResult> {
    const response = await fetchApi<ApiResponse<ChatAssistantResult>>(`${BASE}/query`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }, {
      timeout: 30_000,
    })

    if (response.error) throw new Error(response.error)
    if (!response.data) throw new Error('Không có dữ liệu trả về')
    return response.data
  },
}
