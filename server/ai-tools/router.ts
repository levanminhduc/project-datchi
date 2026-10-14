import { timingSafeEqual } from 'node:crypto'
import { Hono } from 'hono'
import type { AppEnv } from '../types/hono-env'
import { buildAiInstructions } from './instructions'
import { createInternalGet, type AppFetch } from './internal-fetch'
import { limitResult } from './limit-result'
import { AI_TOOLS, canUseTool } from './registry'
import { AiToolError, type AiTool, type AiToolErrorCode, type AiToolOutput } from './types'

export const AI_CONTRACT_VERSION = 1
const DEFAULT_TOOL_TIMEOUT_MS = 10_000

const STATUS_BY_CODE = {
  invalid_input: 400,
  unauthorized: 401,
  forbidden: 403,
  unknown_tool: 404,
  upstream_error: 500,
  contract_mismatch: 502,
} as const satisfies Record<AiToolErrorCode, number>

interface AiToolsRouterOptions {
  tools?: AiTool[]
  timeoutMs?: number
}

function tokenMatches(expected: string, received: string | undefined): boolean {
  if (!received) return false
  const expectedBytes = Buffer.from(expected)
  const receivedBytes = Buffer.from(received)
  return expectedBytes.length === receivedBytes.length && timingSafeEqual(expectedBytes, receivedBytes)
}

function withTimeout(task: Promise<AiToolOutput>, timeoutMs: number): Promise<AiToolOutput> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new AiToolError('upstream_error', 'Tra cứu quá thời gian cho phép')), timeoutMs)
  })
  return Promise.race([task, timeout]).finally(() => clearTimeout(timer))
}

export function createAiToolsRouter(appFetch: AppFetch, options: AiToolsRouterOptions = {}) {
  const tools = options.tools ?? AI_TOOLS
  const timeoutMs = options.timeoutMs ?? DEFAULT_TOOL_TIMEOUT_MS
  const router = new Hono<AppEnv>()

  router.use('*', async (c, next) => {
    const expected = process.env.CHATBOT_INTERNAL_TOKEN?.trim()
    if (!expected) {
      return c.json({ data: null, error: { code: 'upstream_error', message: 'Trợ lý AI chưa được cấu hình' } }, 503)
    }
    if (!tokenMatches(expected, c.req.header('X-Internal-Token'))) {
      return c.json({ data: null, error: { code: 'forbidden', message: 'Không được phép gọi trực tiếp' } }, 403)
    }
    await next()
  })

  router.get('/tools', (c) => {
    const auth = c.get('auth')
    return c.json({
      data: {
        contract_version: AI_CONTRACT_VERSION,
        instructions: buildAiInstructions(new Date()),
        tools: tools
          .filter((tool) => canUseTool(auth, tool))
          .map((tool) => ({ name: tool.name, description: tool.description, input_schema: tool.inputSchema })),
      },
      error: null,
    })
  })

  router.post('/tools/:name', async (c) => {
    const auth = c.get('auth')
    const name = c.req.param('name')
    const started = Date.now()
    const requestId = c.req.header('X-Request-Id') ?? '-'
    try {
      const tool = tools.find((item) => item.name === name)
      if (!tool) throw new AiToolError('unknown_tool', 'Không có công cụ tra cứu này')
      if (!canUseTool(auth, tool)) throw new AiToolError('forbidden', 'Bạn chưa được cấp quyền tra cứu mục này')

      const body = (await c.req.json().catch(() => null)) as { input?: unknown } | null
      const get = createInternalGet(appFetch, c.req.header('Authorization') ?? '')
      const output = await withTimeout(tool.execute(body?.input ?? {}, { auth, get }), timeoutMs)
      const limited = limitResult(output.result)

      console.log(`[ai-tools] tool=${name} employee=${auth.employeeId} ms=${Date.now() - started} total=${output.total} truncated=${limited.truncated} request_id=${requestId}`)
      return c.json({ data: { result: limited.result, total: output.total, truncated: limited.truncated }, error: null })
    } catch (err) {
      if (err instanceof AiToolError) {
        console.warn(`[ai-tools] tool=${name} employee=${auth.employeeId} code=${err.code} ms=${Date.now() - started} request_id=${requestId}`)
        return c.json({ data: null, error: { code: err.code, message: err.message } }, STATUS_BY_CODE[err.code])
      }
      console.error(`[ai-tools] tool=${name} request_id=${requestId} failed:`, err)
      return c.json({ data: null, error: { code: 'upstream_error', message: 'Lỗi khi tra cứu' } }, 500)
    }
  })

  return router
}
