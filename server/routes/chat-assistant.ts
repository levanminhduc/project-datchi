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

const chatAssistant = new Hono()

chatAssistant.post('/query', requireAllPermissions('thread.inventory.view', 'thread.styles.view'), async (c) => {
  try {
    const body = await c.req.json().catch(() => null) as { message?: unknown } | null
    const message = typeof body?.message === 'string' ? body.message.trim().replace(/\s+/g, ' ') : ''
    if (!message) return c.json({ data: null, error: 'Vui lòng nhập câu hỏi' }, 400)

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
