import { getChatStock, getChatStyles, getChatPurchaseOrders, getChatUsage, resolveChatThreadRefs } from './chat-assistant-data'

const DEFAULT_GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-lite'
const DEFAULT_GEMINI_TIMEOUT_MS = 30_000
const DEFAULT_GEMINI_MAX_OUTPUT_TOKENS = 2048
const MAX_TOOL_ROUNDS = 5

export interface GeminiChatConfig {
  apiKey: string
  model: string
  baseUrl: string
  timeoutMs: number
  maxOutputTokens: number
}

export class GeminiChatError extends Error {
  constructor(
    message: string,
    public statusCode: number = 502,
  ) {
    super(message)
    this.name = 'GeminiChatError'
  }
}

export function getGeminiChatConfig(): GeminiChatConfig | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) return null

  const timeoutMs = Number.parseInt(process.env.GEMINI_REQUEST_TIMEOUT_MS ?? '', 10)
  const maxOutputTokens = Number.parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS ?? '', 10)
  const baseUrl = process.env.GEMINI_API_BASE_URL?.trim().replace(/\/+$/, '')

  return {
    apiKey,
    model: process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
    baseUrl: baseUrl || DEFAULT_GEMINI_BASE_URL,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_GEMINI_TIMEOUT_MS,
    maxOutputTokens: Number.isFinite(maxOutputTokens) && maxOutputTokens > 0
      ? maxOutputTokens
      : DEFAULT_GEMINI_MAX_OUTPUT_TOKENS,
  }
}

const SYSTEM_INSTRUCTION = [
  'Bạn là Chỉ AI — trợ lý tra cứu cho hệ thống quản lý chỉ may cone-level.',
  'Quy tắc:',
  '- Trả lời bằng tiếng Việt, ngắn gọn, dựa trên dữ liệu tra cứu.',
  '- Không gộp tồn kho khác NCC, Tex, hoặc Màu. Mỗi NCC + Tex + Màu là 1 loại chỉ riêng biệt.',
  '- Không tự ý tạo phiếu, giữ hàng, xuất hàng, chuyển kho, hoặc ghi nhận thay đổi tồn kho.',
  '- Nếu dữ liệu không đủ hoặc không tìm thấy, nói rõ.',
  '- Dùng tool tra cứu khi cần thông tin cụ thể. Nếu câu hỏi chào hỏi đơn giản thì trả lời trực tiếp.',
  '- Khi trả tồn kho, liệt kê rõ theo từng NCC/Tex/Màu.',
].join('\n')

const TOOL_DECLARATIONS = [{
  functionDeclarations: [
    {
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
    {
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
    {
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
    {
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
  ],
}]

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

interface GeminiContent {
  role: string
  parts: Array<Record<string, unknown>>
}

interface GeminiFunctionCall {
  name: string
  args: Record<string, unknown>
}

interface GeminiResponsePayload {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string; functionCall?: GeminiFunctionCall }> }
    finishReason?: string
  }>
  error?: { message?: unknown }
}

async function callGeminiApi(
  config: GeminiChatConfig,
  contents: GeminiContent[],
): Promise<GeminiResponsePayload> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs)

  let response: Response
  try {
    response = await fetch(
      `${config.baseUrl}/models/${encodeURIComponent(config.model)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': config.apiKey,
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents,
          tools: TOOL_DECLARATIONS,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: config.maxOutputTokens,
          },
        }),
        signal: controller.signal,
      },
    )
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new GeminiChatError('Gemini phản hồi quá thời gian', 408)
    }
    throw new GeminiChatError('Không thể kết nối Gemini')
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    if (response.status === 429) throw new GeminiChatError('Gemini đã hết quota tạm thời', 429)
    const payload = await safeJson(response)
    const msg = typeof payload?.error?.message === 'string' ? payload.error.message : 'Gemini trả về lỗi'
    throw new GeminiChatError(msg, response.status)
  }

  return await safeJson(response) ?? {}
}

export async function queryGeminiWithTools(
  config: GeminiChatConfig,
  message: string,
): Promise<{ answer: string; toolsUsed: string[] }> {
  const contents: GeminiContent[] = [
    { role: 'user', parts: [{ text: message }] },
  ]
  const toolsUsed: string[] = []

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const payload = await callGeminiApi(config, contents)
    const parts = payload.candidates?.[0]?.content?.parts ?? []

    const functionCalls = parts.filter(
      (p): p is { functionCall: GeminiFunctionCall } => !!p.functionCall,
    )

    if (functionCalls.length === 0) {
      const text = parts
        .map(p => (typeof p.text === 'string' ? p.text : ''))
        .join('')
        .trim()
      if (!text) throw new GeminiChatError('Gemini không trả về câu trả lời')
      return { answer: text, toolsUsed }
    }

    contents.push({
      role: 'model',
      parts: parts as Array<Record<string, unknown>>,
    })

    const functionResponses: Array<Record<string, unknown>> = []
    for (const part of functionCalls) {
      const { name, args } = part.functionCall
      toolsUsed.push(name)
      const result = await executeToolCall(name, args)
      functionResponses.push({
        functionResponse: {
          name,
          response: { result },
        },
      })
    }

    contents.push({ role: 'user', parts: functionResponses })
  }

  throw new GeminiChatError('Gemini vượt quá số vòng tool cho phép')
}

export interface GeminiChatResult {
  answer: string
  source_endpoints: string[]
  tools_used: string[]
}

export async function chatWithGemini(
  config: GeminiChatConfig,
  message: string,
): Promise<GeminiChatResult> {
  try {
    const { answer, toolsUsed } = await queryGeminiWithTools(config, message)
    return {
      answer,
      source_endpoints: [`gemini:${config.model}`],
      tools_used: toolsUsed,
    }
  } catch (err) {
    if (err instanceof GeminiChatError) throw err
    throw new GeminiChatError('Lỗi không xác định khi gọi Gemini')
  }
}

async function safeJson(response: Response): Promise<GeminiResponsePayload> {
  try {
    const data = await response.json()
    return data && typeof data === 'object' ? data : {}
  } catch {
    return {}
  }
}
