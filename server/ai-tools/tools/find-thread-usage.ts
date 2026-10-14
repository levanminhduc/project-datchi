import { z } from 'zod'
import { sanitizeSearchTerm } from '../../utils/chat-assistant-parser'
import { normalizeTex } from '../tex'
import { findIssuedLines, findOpenPurchaseOrders, findStyleUsage, findWeeklyOrders } from '../queries/thread-usage'
import { AiToolError, defineTool, type AiAuth } from '../types'

function allowed(auth: AiAuth, permission: string): boolean {
  return auth.isRoot || auth.permissions.includes(permission)
}

export const findThreadUsage = defineTool({
  name: 'find_thread_usage',
  description: [
    'Tra ngược một loại chỉ (theo mã/tên loại chỉ hoặc mã/tên màu chỉ, có thể kèm Tex) đang được dùng ở đâu:',
    'mã hàng và màu hàng có định mức dùng chỉ này (styles, meters_per_unit là mét cho một sản phẩm),',
    'PO đang mở có các mã hàng đó (open_purchase_orders), tuần đặt hàng đã xác nhận (weekly_orders) và lịch sử xuất kho (issued).',
    'Phần nào người hỏi không có quyền xem sẽ nằm trong not_permitted.',
  ].join(' '),
  permissions: ['thread.styles.view'],
  input: z.object({
    search: z.string().trim().min(2).max(50).describe('Mã/tên loại chỉ hoặc mã/tên màu chỉ, ví dụ C9700'),
    tex: z.string().trim().min(1).max(10).optional().describe('Số Tex để lọc, chỉ gồm số, ví dụ 40 hoặc 40/2'),
  }),
  run: async (input, ctx) => {
    const term = sanitizeSearchTerm(input.search)
    if (term.length < 2) throw new AiToolError('invalid_input', 'Từ khoá tra cứu cần ít nhất 2 ký tự chữ hoặc số')
    const filter = { term, tex: input.tex === undefined ? null : normalizeTex(input.tex) }
    const canSeeOrders = allowed(ctx.auth, 'thread.purchase-orders.view')
    const canSeeAllocations = allowed(ctx.auth, 'thread.allocations.view')

    const [styles, purchaseOrders, weeklyOrders, issued] = await Promise.all([
      findStyleUsage(filter),
      canSeeOrders ? findOpenPurchaseOrders(filter) : null,
      canSeeAllocations ? findWeeklyOrders(filter) : null,
      canSeeAllocations ? findIssuedLines(filter) : null,
    ])

    const result: Record<string, unknown> = { styles_total: styles.total, styles: styles.rows }
    const notPermitted: string[] = []
    if (purchaseOrders) {
      result.open_purchase_orders_total = purchaseOrders.total
      result.open_purchase_orders = purchaseOrders.rows
    } else {
      notPermitted.push('PO đang mở')
    }
    if (weeklyOrders) {
      result.weekly_orders_total = weeklyOrders.total
      result.weekly_orders = weeklyOrders.rows
    } else {
      notPermitted.push('tuần đặt hàng')
    }
    if (issued) {
      result.issued_total = issued.total
      result.issued = issued.rows
    } else {
      notPermitted.push('lịch sử xuất kho')
    }
    if (notPermitted.length > 0) result.not_permitted = notPermitted

    return { result, total: styles.total }
  },
})
