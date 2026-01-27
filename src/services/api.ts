/**
 * Base API client with error handling
 * 
 * Configurable via VITE_API_URL environment variable
 * Defaults to localhost:3000 for development
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Custom error class for API errors
 * Includes HTTP status code for error handling
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Generic fetch wrapper with JSON handling and error management
 * 
 * @param endpoint - API endpoint path (e.g., '/api/employees')
 * @param options - Standard fetch options
 * @returns Parsed JSON response
 * @throws ApiError on non-2xx responses or timeout (10 seconds)
 */
export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  // Add timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 seconds

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
      signal: controller.signal, // Add abort signal
    })

    clearTimeout(timeoutId) // Clear timeout on success

    const data = await response.json()

    if (!response.ok) {
      throw new ApiError(response.status, data.error || 'Đã xảy ra lỗi')
    }

    return data
  } catch (error) {
    clearTimeout(timeoutId) // Clear timeout on error

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(408, 'Yêu cầu quá thời gian. Vui lòng thử lại')
    }
    throw error
  }
}
