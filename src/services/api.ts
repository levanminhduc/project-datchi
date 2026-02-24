import { supabase } from '@/lib/supabase'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const data = await response.json()

    if (!response.ok) {
      throw new ApiError(response.status, data.error || 'Đã xảy ra lỗi')
    }

    return data
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(408, 'Yêu cầu quá thời gian. Vui lòng thử lại')
    }
    throw error
  }
}
