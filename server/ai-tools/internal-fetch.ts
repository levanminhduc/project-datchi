import { z } from 'zod'
import { AiToolError, type InternalGet } from './types'

export type AppFetch = (request: Request) => Response | Promise<Response>

const ALLOWED_PATHS = [
  /^\/api\/inventory\/summary\/by-cone$/,
  /^\/api\/inventory\/summary\/by-cone\/\d+\/warehouses$/,
  /^\/api\/styles$/,
  /^\/api\/styles\/\d+\/thread-specs$/,
  /^\/api\/purchase-orders$/,
  /^\/api\/weekly-orders$/,
  /^\/api\/weekly-orders\/\d+$/,
  /^\/api\/weekly-orders\/\d+\/(results|reservation-summary|delivery-summary)$/,
  /^\/api\/issues\/v2$/,
  /^\/api\/issues\/v2\/\d+$/,
  /^\/api\/employees\/issue-departments$/,
  /^\/api\/dept-allocations\/(summary|logs)$/,
]

function readMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const record = body as Record<string, unknown>
  for (const key of ['error', 'message']) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return null
}

function failureOf(body: unknown): string | null {
  if (!body || typeof body !== 'object') return 'Phản hồi không phải JSON'
  const record = body as Record<string, unknown>
  if (record.success === false || record.error === true) return readMessage(body) ?? 'Tra cứu thất bại'
  if (typeof record.error === 'string' && record.error.trim()) return record.error
  return null
}

export function createInternalGet(appFetch: AppFetch, authorization: string): InternalGet {
  return async function get<S extends z.ZodType>(path: string, schema: S): Promise<z.output<S>> {
    const url = new URL(path, 'http://internal')
    if (!ALLOWED_PATHS.some((pattern) => pattern.test(url.pathname))) {
      throw new AiToolError('upstream_error', 'Đường dẫn tra cứu không được phép')
    }

    const response = await appFetch(new Request(url, { method: 'GET', headers: { Authorization: authorization } }))
    const body: unknown = await response.json().catch(() => null)

    if (response.status === 401) throw new AiToolError('unauthorized', readMessage(body) ?? 'Phiên đăng nhập đã hết hạn')
    if (response.status === 403) throw new AiToolError('forbidden', readMessage(body) ?? 'Bạn chưa được cấp quyền tra cứu mục này')
    if (response.status === 400) throw new AiToolError('invalid_input', readMessage(body) ?? 'Đầu vào không hợp lệ')

    const failure = failureOf(body)
    if (!response.ok || failure) throw new AiToolError('upstream_error', failure ?? `Tra cứu lỗi ${response.status}`)

    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      console.error(`[ai-tools] contract-mismatch path=${url.pathname}`, z.prettifyError(parsed.error))
      throw new AiToolError('contract_mismatch', 'Dữ liệu trả về không đúng định dạng mong đợi')
    }
    return parsed.data
  }
}
