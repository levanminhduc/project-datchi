import { Hono } from 'hono'
import { requireAllPermissions } from '../middleware/auth'
import type { ChatAssistantResult } from '../types/chat-assistant'
import {
  buildChatAnswer,
  CHAT_ASSISTANT_EXAMPLES,
  detectChatIntents,
  extractChatTerm,
  extractChatTex,
} from '../utils/chat-assistant-parser'
import { getChatStock, getChatUsage, resolveChatThreadRefs } from '../utils/chat-assistant-data'
import { chatWithGemini, GeminiChatError, getGeminiChatConfig } from '../utils/chat-assistant-gemini'
import { chatWithOpenAI, OpenAIChatError, getOpenAIChatConfig } from '../utils/chat-assistant-openai'

const chatAssistant = new Hono()

interface ChatbotServiceData {
  answer?: unknown
  term?: unknown
  source_endpoints?: unknown
  context?: unknown
}

interface ChatbotServiceEnvelope {
  data?: ChatbotServiceData | null
  error?: unknown
  message?: unknown
  detail?: unknown
}

interface ChatbotProxyConfig {
  baseUrl: string
  internalToken: string
  timeoutMs: number
}

type ChatbotProxyStatus = 400 | 408 | 502

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
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 15_000,
  }
}

function getPayloadMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const record = payload as Record<string, unknown>

  for (const key of ['error', 'message', 'detail']) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value
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

function mapChatbotData(data: ChatbotServiceData): ChatAssistantResult {
  const answer = typeof data.answer === 'string' && data.answer.trim()
    ? data.answer
    : 'Chatbot không trả về câu trả lời.'
  const sourceEndpoints = Array.isArray(data.source_endpoints)
    ? data.source_endpoints.filter((value): value is string => typeof value === 'string')
    : []

  return {
    answer,
    term: typeof data.term === 'string' && data.term.trim() ? data.term : null,
    tex: null,
    intents: [],
    stock: [],
    usage: [],
    suggestions: CHAT_ASSISTANT_EXAMPLES,
    source_endpoints: sourceEndpoints,
    context: data.context ?? null,
  }
}

async function queryChatbotService(
  config: ChatbotProxyConfig,
  message: string,
  authorization: string,
): Promise<ChatAssistantResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs)

  let response: Response
  try {
    response = await fetch(`${config.baseUrl}/v1/chat/query`, {
      method: 'POST',
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json',
        'X-Internal-Token': config.internalToken,
      },
      body: JSON.stringify({ message }),
      signal: controller.signal,
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ChatbotProxyError('Chatbot service phản hồi quá thời gian', 408)
    }
    throw new ChatbotProxyError('Không thể kết nối chatbot service')
  } finally {
    clearTimeout(timeout)
  }

  const payload = await readJsonPayload(response)
  if (!response.ok) {
    const errorMessage = getPayloadMessage(payload) ?? 'Chatbot service trả về lỗi'
    const statusCode = response.status === 400 || response.status === 422
      ? 400
      : response.status === 408
        ? 408
        : 502
    throw new ChatbotProxyError(errorMessage, statusCode)
  }

  if (!payload || typeof payload !== 'object') {
    throw new ChatbotProxyError('Chatbot service trả về payload không hợp lệ')
  }

  const envelope = payload as ChatbotServiceEnvelope
  const serviceError = getPayloadMessage({ error: envelope.error })
  if (serviceError) {
    throw new ChatbotProxyError(serviceError)
  }
  if (!envelope.data || typeof envelope.data !== 'object') {
    throw new ChatbotProxyError('Chatbot service không trả về dữ liệu')
  }

  return mapChatbotData(envelope.data)
}

chatAssistant.post('/query', requireAllPermissions('thread.inventory.view', 'thread.styles.view'), async (c) => {
  try {
    const body = await c.req.json().catch(() => null) as { message?: unknown } | null
    const message = typeof body?.message === 'string' ? body.message.trim().replace(/\s+/g, ' ') : ''
    if (!message) return c.json({ data: null, error: 'Vui lòng nhập câu hỏi' }, 400)

    const chatbotConfig = getChatbotProxyConfig()
    if (chatbotConfig) {
      const authorization = c.req.header('Authorization')
      if (!authorization) return c.json({ data: null, error: 'Chưa xác thực' }, 401)

      try {
        const data = await queryChatbotService(chatbotConfig, message, authorization)
        return c.json({ data, error: null })
      } catch (err) {
        if (err instanceof ChatbotProxyError) {
          return c.json({ data: null, error: err.message }, err.statusCode)
        }
        throw err
      }
    }

    const openaiConfig = getOpenAIChatConfig()
    if (openaiConfig) {
      try {
        const result = await chatWithOpenAI(openaiConfig, message)
        const data: ChatAssistantResult = {
          answer: result.answer,
          term: null,
          tex: null,
          intents: [],
          stock: [],
          usage: [],
          suggestions: CHAT_ASSISTANT_EXAMPLES,
          source_endpoints: result.source_endpoints,
          context: { tools_used: result.tools_used },
        }
        return c.json({ data, error: null })
      } catch (err) {
        if (err instanceof OpenAIChatError) {
          return c.json({ data: null, error: err.message }, err.statusCode)
        }
        throw err
      }
    }

    const geminiConfig = getGeminiChatConfig()
    if (geminiConfig) {
      try {
        const result = await chatWithGemini(geminiConfig, message)
        const data: ChatAssistantResult = {
          answer: result.answer,
          term: null,
          tex: null,
          intents: [],
          stock: [],
          usage: [],
          suggestions: CHAT_ASSISTANT_EXAMPLES,
          source_endpoints: result.source_endpoints,
          context: { tools_used: result.tools_used },
        }
        return c.json({ data, error: null })
      } catch (err) {
        if (err instanceof GeminiChatError) {
          return c.json({ data: null, error: err.message }, err.statusCode)
        }
        throw err
      }
    }

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
