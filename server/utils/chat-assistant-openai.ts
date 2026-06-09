import { getChatStock, getChatStyles, getChatPurchaseOrders, getChatUsage, resolveChatThreadRefs } from './chat-assistant-data'
import { request } from 'undici'

const DEFAULT_OPENAI_BASE_URL = 'https://agent-shop.clawd.io.vn/v1'
const DEFAULT_OPENAI_MODEL = 'gpt-5.4-mini'
const DEFAULT_OPENAI_TIMEOUT_MS = 30_000
const DEFAULT_OPENAI_MAX_OUTPUT_TOKENS = 2048
const MAX_TOOL_ROUNDS = 5

export interface OpenAIChatConfig {
  apiKey: string
  model: string
  baseUrl: string
  timeoutMs: number
  maxOutputTokens: number
}

export class OpenAIChatError extends Error {
  constructor(
    message: string,
    public statusCode: number = 502,
  ) {
    super(message)
    this.name = 'OpenAIChatError'
  }
}

export function getOpenAIChatConfig(): OpenAIChatConfig | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return null

  const timeoutMs = Number.parseInt(process.env.OPENAI_REQUEST_TIMEOUT_MS ?? '', 10)
  const maxOutputTokens = Number.parseInt(process.env.OPENAI_MAX_OUTPUT_TOKENS ?? '', 10)
  const baseUrl = process.env.OPENAI_API_BASE_URL?.trim().replace(/\/+$/, '')

  return {
    apiKey,
    model: process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL,
    baseUrl: baseUrl || DEFAULT_OPENAI_BASE_URL,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_OPENAI_TIMEOUT_MS,
    maxOutputTokens: Number.isFinite(maxOutputTokens) && maxOutputTokens > 0
      ? maxOutputTokens
      : DEFAULT_OPENAI_MAX_OUTPUT_TOKENS,
  }
}

const SYSTEM_MESSAGE = [
  'Bạn là Chỉ AI — trợ lý tra cứu cho hệ thống quản lý chỉ may cone-level.',
  'Quy tắc:',
  '- Trả lời bằng tiếng Việt, ngắn gọn, dựa trên dữ liệu tra cứu.',
  '- Không gộp tồn kho khác NCC, Tex, hoặc Màu. Mỗi NCC + Tex + Màu là 1 loại chỉ riêng biệt.',
  '- Không tự ý tạo phiếu, giữ hàng, xuất hàng, chuyển kho, hoặc ghi nhận thay đổi tồn kho.',
  '- Nếu dữ liệu không đủ hoặc không tìm thấy, nói rõ.',
  '- Dùng tool tra cứu khi cần thông tin cụ thể. Nếu câu hỏi chào hỏi đơn giản thì trả lời trực tiếp.',
  '- Khi trả tồn kho, liệt kê rõ theo từng NCC/Tex/Màu.',
].join('\n')

const TOOLS: OpenAITool[] = [
  {
    type: 'function',
    function: {
      name: 'search_stock',
      description: 'Tra cứu tồn kho chỉ may khả dụng theo mã màu, số tex, hoặc nhà cung cấp. Trả về số cuộn nguyên, cuộn lẻ, mét lẻ, gram lẻ.',
      parameters: {
        type: 'object',
        properties: {
          color_or_code: { type: 'string', description: 'Mã màu hoặc tên màu chỉ (VD: C9700, đen, trắng, 1241)' },
          tex: { type: 'string', description: 'Số tex nếu có (VD: 40, 60, 27)' },
        },
        required: ['color_or_code'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_usage',
      description: 'Tra cứu loại chỉ được dùng cho mã hàng (style) nào, với định mức bao nhiêu mét/sản phẩm.',
      parameters: {
        type: 'object',
        properties: {
          color_or_code: { type: 'string', description: 'Mã màu hoặc tên chỉ (VD: C9700, đen)' },
          tex: { type: 'string', description: 'Số tex nếu có' },
        },
        required: ['color_or_code'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_styles',
      description: 'Tìm mã hàng (style) theo mã hoặc tên. Trả về style_code, style_name, fabric_type.',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Từ khóa tìm kiếm mã hàng (VD: ABC, polo, jacket)' },
        },
        required: ['search'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_purchase_orders',
      description: 'Tìm đơn hàng (PO) theo số PO, tên khách hàng, hoặc trạng thái. Trả về po_number, customer, status, ngày giao.',
      parameters: {
        type: 'object',
        properties: {
          po_number: { type: 'string', description: 'Số PO cần tìm (VD: PO-2024-001)' },
          customer_name: { type: 'string', description: 'Tên khách hàng (VD: Nike, Adidas)' },
          status: { type: 'string', description: 'Trạng thái PO: PENDING, IN_PROGRESS, COMPLETED, CANCELLED' },
        },
      },
    },
  },
]

interface OpenAITool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_calls?: OpenAIToolCall[]
  tool_call_id?: string
}

interface OpenAIToolCall {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

interface OpenAIResponsePayload {
  choices?: Array<{
    message?: {
      content?: string | null
      tool_calls?: OpenAIToolCall[]
    }
    finish_reason?: string
  }>
  error?: { message?: string }
}

async function executeToolCall(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'search_stock': {
      const term = String(args.color_or_code ?? '')
      const tex = args.tex ? String(args.tex) : null
      return await getChatStock(term, tex)
    }
    case 'search_usage': {
      const term = String(args.color_or_code ?? '')
      const tex = args.tex ? String(args.tex) : null
      const refs = await resolveChatThreadRefs(term, tex)
      return await getChatUsage(refs.threadTypes.map(t => t.id), refs.colorIds)
    }
    case 'search_styles': {
      return await getChatStyles(String(args.search ?? ''))
    }
    case 'search_purchase_orders': {
      return await getChatPurchaseOrders({
        po_number: args.po_number ? String(args.po_number) : undefined,
        customer_name: args.customer_name ? String(args.customer_name) : undefined,
        status: args.status ? String(args.status) : undefined,
      })
    }
    default:
      return { error: `Unknown tool: ${name}` }
  }
}

async function callOpenAIApi(
  config: OpenAIChatConfig,
  messages: OpenAIMessage[],
): Promise<OpenAIResponsePayload> {
  let statusCode: number
  let payload: OpenAIResponsePayload

  try {
    const { statusCode: sc, body } = await request(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        tools: TOOLS,
        temperature: 0.2,
        max_tokens: config.maxOutputTokens,
      }),
      headersTimeout: config.timeoutMs,
      bodyTimeout: config.timeoutMs,
    })
    statusCode = sc
    payload = await body.json() as OpenAIResponsePayload
  } catch (err) {
    if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('timeout'))) {
      throw new OpenAIChatError('OpenAI phản hồi quá thời gian', 408)
    }
    throw new OpenAIChatError('Không thể kết nối OpenAI')
  }

  if (statusCode !== 200) {
    if (statusCode === 429) throw new OpenAIChatError('OpenAI đã hết quota tạm thời', 429)
    const msg = payload?.error?.message ?? 'OpenAI trả về lỗi'
    throw new OpenAIChatError(msg, statusCode)
  }

  return payload ?? {}
}

export async function queryOpenAIWithTools(
  config: OpenAIChatConfig,
  message: string,
): Promise<{ answer: string; toolsUsed: string[] }> {
  const messages: OpenAIMessage[] = [
    { role: 'system', content: SYSTEM_MESSAGE },
    { role: 'user', content: message },
  ]
  const toolsUsed: string[] = []

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const payload = await callOpenAIApi(config, messages)
    const choice = payload.choices?.[0]
    const assistantMessage = choice?.message

    if (!assistantMessage) throw new OpenAIChatError('OpenAI không trả về câu trả lời')

    const toolCalls = assistantMessage.tool_calls
    if (!toolCalls || toolCalls.length === 0) {
      const text = (assistantMessage.content ?? '').trim()
      if (!text) throw new OpenAIChatError('OpenAI không trả về câu trả lời')
      return { answer: text, toolsUsed }
    }

    messages.push({
      role: 'assistant',
      content: assistantMessage.content ?? null,
      tool_calls: toolCalls,
    })

    for (const toolCall of toolCalls) {
      const { name, arguments: argsStr } = toolCall.function
      toolsUsed.push(name)
      let args: Record<string, unknown> = {}
      try { args = JSON.parse(argsStr) } catch { /* empty */ }
      const result = await executeToolCall(name, args)
      messages.push({
        role: 'tool',
        content: JSON.stringify(result),
        tool_call_id: toolCall.id,
      })
    }
  }

  throw new OpenAIChatError('OpenAI vượt quá số vòng tool cho phép')
}

export interface OpenAIChatResult {
  answer: string
  source_endpoints: string[]
  tools_used: string[]
}

export async function chatWithOpenAI(
  config: OpenAIChatConfig,
  message: string,
): Promise<OpenAIChatResult> {
  try {
    const { answer, toolsUsed } = await queryOpenAIWithTools(config, message)
    return {
      answer,
      source_endpoints: [`openai:${config.model}`],
      tools_used: toolsUsed,
    }
  } catch (err) {
    if (err instanceof OpenAIChatError) throw err
    throw new OpenAIChatError('Lỗi không xác định khi gọi OpenAI')
  }
}
