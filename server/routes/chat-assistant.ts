import { randomUUID } from 'node:crypto'
import { Hono } from 'hono'
import { requirePermission } from '../middleware/auth'
import type { AppEnv } from '../types/hono-env'
import type { ChatAssistantResult, ChatHistoryItem } from '../types/chat-assistant'
import {
  buildChatAnswer,
  CHAT_ASSISTANT_EXAMPLES,
  detectChatIntents,
  extractChatTerm,
  extractChatTex,
} from '../utils/chat-assistant-parser'
import { getChatStock, getChatUsage, resolveChatThreadRefs } from '../utils/chat-assistant-data'

const chatAssistant = new Hono<AppEnv>()

const FALLBACK_PERMISSIONS = ['thread.inventory.view', 'thread.styles.view']

const HISTORY_MAX_ITEMS = 20
const HISTORY_CONTENT_MAX = 2000
const RAW_TEXT_MAX = 8000

interface ChatbotServiceData {
  answer?: unknown
  tools_used?: unknown
  answer_kind?: unknown
  suggestions?: unknown
}

interface ChatbotServiceEnvelope {
  data?: ChatbotServiceData | null
  error?: unknown
}

interface ChatbotProxyConfig {
  baseUrl: string
  internalToken: string
  timeoutMs: number
}

type ChatbotProxyStatus = 400 | 401 | 403 | 408 | 502

class ChatbotProxyError extends Error {
  constructor(
    message: string,
    public statusCode: ChatbotProxyStatus = 502
  ) {
    super(message)
    this.name = 'ChatbotProxyError'
  }
}

function getChatbotProxyConfig(): ChatbotProxyConfig | null {
  const baseUrl = process.env.CHATBOT_SERVICE_URL?.trim().replace(/\/+$/, '')
  const internalToken = process.env.CHATBOT_INTERNAL_TOKEN?.trim()

  if (!baseUrl || !internalToken) return null

  const timeoutMs = Number.parseInt(process.env.CHATBOT_REQUEST_TIMEOUT_MS ?? '', 10)
  return {
    baseUrl,
    internalToken,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 28_000,
  }
}

function getPayloadMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const record = payload as Record<string, unknown>

  for (const key of ['error', 'message', 'detail']) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value
    if (value && typeof value === 'object') {
      const nested = (value as Record<string, unknown>).message
      if (typeof nested === 'string' && nested.trim()) return nested
    }
  }

  return null
}

async function readJsonPayload(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function toProxyStatus(status: number): ChatbotProxyStatus {
  if (status === 400 || status === 422) return 400
  if (status === 401 || status === 403 || status === 408) return status
  if (status === 504) return 408
  return 502
}

function readSuggestions(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item !== '')
    .slice(0, 3)
}

function mapChatbotData(data: ChatbotServiceData): ChatAssistantResult {
  const hasAnswer = typeof data.answer === 'string' && data.answer.trim() !== ''
  const answer = typeof data.answer === 'string' && hasAnswer ? data.answer : 'Trợ lý không trả về câu trả lời.'
  const serviceKind = typeof data.answer_kind === 'string' && data.answer_kind !== '' ? data.answer_kind : undefined
  const answerKind = hasAnswer ? serviceKind : 'empty'
  const toolsUsed = Array.isArray(data.tools_used)
    ? data.tools_used.filter((value): value is string => typeof value === 'string')
    : []

  return {
    answer,
    term: null,
    tex: null,
    intents: [],
    stock: [],
    usage: [],
    suggestions: readSuggestions(data.suggestions),
    context: { tools_used: toolsUsed },
    ...(answerKind ? { answer_kind: answerKind } : {}),
  }
}

function cutByCodePoint(text: string, limit: number): string {
  return Array.from(text).slice(0, limit).join('')
}

function isDroppedCodePoint(code: number): boolean {
  if (code === 0x09 || code === 0x0a || code === 0x0d) return false
  return code <= 0x1f
    || (code >= 0x7f && code <= 0x9f)
    || code === 0xfeff
    || (code >= 0xd800 && code <= 0xdfff)
}

function sanitizeChatText(text: string): string {
  return Array.from(text).filter((char) => !isDroppedCodePoint(char.codePointAt(0) ?? 0)).join('')
}

function parseHistoryContent(item: unknown, role: ChatHistoryItem['role']): string | null {
  if (!item || typeof item !== 'object') return null
  const record = item as Record<string, unknown>
  if (record.role !== role || typeof record.content !== 'string') return null
  const cleaned = sanitizeChatText(record.content.slice(0, RAW_TEXT_MAX))
  const normalized = role === 'user' ? cleaned.replace(/\s+/g, ' ') : cleaned
  return cutByCodePoint(normalized.trim(), HISTORY_CONTENT_MAX)
}

function parseHistory(value: unknown): ChatHistoryItem[] | null {
  if (value === undefined) return []
  if (!Array.isArray(value) || value.length > HISTORY_MAX_ITEMS || value.length % 2 !== 0) return null

  const history: ChatHistoryItem[] = []
  for (let index = 0; index < value.length; index += 2) {
    const question = parseHistoryContent(value[index], 'user')
    const answer = parseHistoryContent(value[index + 1], 'assistant')
    if (question === null || answer === null) return null
    if (!question || !answer) continue
    history.push({ role: 'user', content: question }, { role: 'assistant', content: answer })
  }
  return history
}

async function queryChatbotService(
  config: ChatbotProxyConfig,
  question: string,
  history: ChatHistoryItem[],
  authorization: string,
  requestId: string,
): Promise<ChatAssistantResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs)

  let response: Response
  try {
    response = await fetch(`${config.baseUrl}/v1/chat`, {
      method: 'POST',
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json',
        'X-Internal-Token': config.internalToken,
        'X-Request-Id': requestId,
      },
      body: JSON.stringify({ app: 'datchi', question, history }),
      signal: controller.signal,
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ChatbotProxyError('Trợ lý AI phản hồi quá thời gian', 408)
    }
    throw new ChatbotProxyError('Không thể kết nối trợ lý AI')
  } finally {
    clearTimeout(timeout)
  }

  const payload = await readJsonPayload(response)
  if (!response.ok) {
    throw new ChatbotProxyError(getPayloadMessage({ error: (payload as ChatbotServiceEnvelope | null)?.error }) ?? 'Trợ lý AI trả về lỗi', toProxyStatus(response.status))
  }

  if (!payload || typeof payload !== 'object') {
    throw new ChatbotProxyError('Trợ lý AI trả về dữ liệu không hợp lệ')
  }

  const envelope = payload as ChatbotServiceEnvelope
  const serviceError = getPayloadMessage({ error: envelope.error })
  if (serviceError) {
    throw new ChatbotProxyError(serviceError)
  }
  if (!envelope.data || typeof envelope.data !== 'object') {
    throw new ChatbotProxyError('Trợ lý AI không trả về dữ liệu')
  }

  return mapChatbotData(envelope.data)
}

chatAssistant.post('/query', requirePermission('chat.assistant.use'), async (c) => {
  try {
    const body = await c.req.json().catch(() => null) as { message?: unknown; history?: unknown } | null
    if (typeof body?.message === 'string' && body.message.length > RAW_TEXT_MAX) {
      return c.json({ data: null, error: 'Câu hỏi tối đa 2000 ký tự' }, 400)
    }
    const message = typeof body?.message === 'string' ? sanitizeChatText(body.message).trim().replace(/\s+/g, ' ') : ''
    if (!message) return c.json({ data: null, error: 'Vui lòng nhập câu hỏi' }, 400)
    if (message.length > 2000) return c.json({ data: null, error: 'Câu hỏi tối đa 2000 ký tự' }, 400)

    const auth = c.get('auth')
    const chatbotConfig = getChatbotProxyConfig()
    if (chatbotConfig) {
      const authorization = c.req.header('Authorization')
      if (!authorization) return c.json({ data: null, error: 'Chưa xác thực' }, 401)

      const history = parseHistory(body?.history)
      if (!history) return c.json({ data: null, error: 'Lịch sử hội thoại không hợp lệ' }, 400)

      const requestId = randomUUID()
      console.log(`[chat-assistant] employee=${auth.employeeId} request_id=${requestId}`)
      try {
        const data = await queryChatbotService(chatbotConfig, message, history, authorization, requestId)
        return c.json({ data, error: null })
      } catch (err) {
        if (err instanceof ChatbotProxyError) {
          return c.json({ data: null, error: err.message }, err.statusCode)
        }
        throw err
      }
    }

    const canUseFallback = auth.isRoot || FALLBACK_PERMISSIONS.every((permission) => auth.permissions.includes(permission))
    if (!canUseFallback) return c.json({ data: null, error: 'Trợ lý AI chưa được bật' }, 403)

    const term = extractChatTerm(message)
    const tex = extractChatTex(message)
    if (!term) {
      const data: ChatAssistantResult = {
        answer: `Mình chưa nhận ra mã màu hoặc loại chỉ. Bạn thử hỏi: ${CHAT_ASSISTANT_EXAMPLES[0]}`,
        term: null,
        tex,
        intents: [],
        stock: [],
        usage: [],
        suggestions: CHAT_ASSISTANT_EXAMPLES,
      }
      return c.json({ data, error: null })
    }

    const intents = detectChatIntents(message)
    const refs = await resolveChatThreadRefs(term, tex)
    const stock = intents.includes('stock') ? await getChatStock(term, tex) : []
    const usage = intents.includes('usage') ? await getChatUsage(refs.threadTypes.map(t => t.id), refs.colorIds) : []
    const data: ChatAssistantResult = {
      answer: buildChatAnswer(term, tex, intents, stock, usage),
      term,
      tex,
      intents,
      stock,
      usage,
      suggestions: CHAT_ASSISTANT_EXAMPLES,
    }

    return c.json({ data, error: null })
  } catch (err) {
    console.error('chat-assistant error:', err)
    return c.json({ data: null, error: 'Lỗi khi tra cứu trợ lý chỉ' }, 500)
  }
})

export default chatAssistant
