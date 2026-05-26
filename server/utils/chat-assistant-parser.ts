import { sanitizeFilterValue } from './sanitize'
import type { ChatAssistantIntent, ChatAssistantStockRow, ChatAssistantUsageRow } from '../types/chat-assistant'

export const CHAT_ASSISTANT_EXAMPLES = [
  'C9700 còn bao nhiêu cuộn?',
  'Chỉ C9700 dùng cho mã hàng nào?',
  'Tex 40 màu C9700 còn bao nhiêu cuộn?',
]

export function sanitizeSearchTerm(term: string): string {
  return sanitizeFilterValue(term).replace(/[%_]/g, '').trim()
}

export function extractChatTerm(message: string): string | null {
  const code = message.toUpperCase().match(/\b[A-Z]{1,6}\d{2,6}[A-Z0-9-]*\b/)
  if (code) return code[0]
  const color = message.match(/(?:màu|mau|chỉ|chi)\s+([A-Za-zÀ-ỹ0-9._-]{2,30})/i)
  return color?.[1] ?? null
}

export function extractChatTex(message: string): string | null {
  return message.match(/\btex\s*([A-Za-z0-9.]+)/i)?.[1] ?? null
}

export function detectChatIntents(message: string): ChatAssistantIntent[] {
  const lower = message.toLocaleLowerCase('vi-VN')
  const wantsUsage = /mã hàng|ma hang|sử dụng|su dung|dùng cho|dung cho|định mức|dinh muc|bom/.test(lower)
  const wantsStock = /tồn|ton|còn|con|bao nhiêu|bao nhieu|cuộn|cuon|mét|met|kho/.test(lower)
  if (wantsStock || wantsUsage) {
    return [wantsStock ? 'stock' : null, wantsUsage ? 'usage' : null].filter(Boolean) as ChatAssistantIntent[]
  }
  return ['stock']
}

export function matchesChatTex(
  row: { tex_number: string | number | null; thread_name?: string; thread_code?: string },
  tex: string | null,
): boolean {
  if (!tex) return true
  const needle = tex.toLowerCase()
  return [row.tex_number, row.thread_name, row.thread_code]
    .some(value => String(value ?? '').toLowerCase().includes(needle))
}

export function buildChatAnswer(
  term: string,
  tex: string | null,
  intents: ChatAssistantIntent[],
  stock: ChatAssistantStockRow[],
  usage: ChatAssistantUsageRow[],
): string {
  const target = [term, tex ? `Tex ${tex}` : null].filter(Boolean).join(' / ')
  const parts: string[] = []
  if (intents.includes('stock')) {
    const full = stock.reduce((sum, row) => sum + row.available_full_cones, 0)
    const partial = stock.reduce((sum, row) => sum + row.available_partial_cones, 0)
    parts.push(stock.length
      ? `Tồn khả dụng của ${target}: ${full.toLocaleString('vi-VN')} cuộn nguyên, ${partial.toLocaleString('vi-VN')} cuộn lẻ.`
      : `Chưa thấy tồn kho khả dụng khớp ${target}.`)
    parts.push(...stock.slice(0, 6).map(row =>
      `- ${row.supplier_name ?? 'Không rõ NCC'} / Tex ${row.tex_number ?? '?'} / ${row.color_name ?? term}: ${row.available_full_cones} cuộn nguyên, ${row.available_partial_cones} cuộn lẻ`
    ))
  }
  if (intents.includes('usage')) {
    parts.push(usage.length
      ? `${target} đang có trong định mức của ${usage.length.toLocaleString('vi-VN')} mã hàng:`
      : `Chưa thấy mã hàng nào đang khai báo định mức khớp ${target}.`)
    parts.push(...usage.slice(0, 8).map(row =>
      `- ${row.style_code}${row.style_name ? ` - ${row.style_name}` : ''}${row.style_color_name ? ` (${row.style_color_name})` : ''}: ${row.process_names.join(', ') || 'Định mức'} (${row.meters_per_unit.toLocaleString('vi-VN')} m/SP)`
    ))
  }
  return parts.join('\n')
}
