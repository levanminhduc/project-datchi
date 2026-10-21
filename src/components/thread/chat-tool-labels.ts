import type { StreamStatus } from '@/services/chat-stream'

export interface ToolLabel {
  source: string
  status: string
}

export const TOOL_LABELS: Record<string, ToolLabel> = {
  search_inventory: { source: 'Tồn kho', status: 'Đang tra tồn kho' },
  get_inventory_by_warehouse: { source: 'Tồn kho', status: 'Đang xem tồn theo kho' },
  find_thread_usage: { source: 'Sử dụng chỉ', status: 'Đang tra nơi dùng chỉ' },
  get_style_thread_specs: { source: 'Định mức', status: 'Đang xem định mức mã hàng' },
  search_styles: { source: 'Mã hàng', status: 'Đang tìm mã hàng' },
  search_purchase_orders: { source: 'Đơn hàng', status: 'Đang tìm đơn hàng' },
  search_weekly_orders: { source: 'Tuần hàng', status: 'Đang tìm tuần hàng' },
  get_weekly_order: { source: 'Tuần hàng', status: 'Đang xem chi tiết tuần hàng' },
  get_weekly_order_threads: { source: 'Tuần hàng', status: 'Đang tổng hợp chỉ của tuần hàng' },
  get_dept_allocation: { source: 'Phân bổ bộ phận', status: 'Đang xem phân bổ chỉ theo bộ phận' },
  search_issues: { source: 'Phiếu xuất', status: 'Đang tìm phiếu xuất chỉ' },
  get_issue_detail: { source: 'Phiếu xuất', status: 'Đang xem chi tiết phiếu xuất' },
}

const THINKING_TEXT = 'Đang đọc câu hỏi…'
const RETRY_TEXT = 'Đang thử lại…'
const UNKNOWN_TOOL_TEXT = 'Đang tra cứu dữ liệu…'
const MORE_SOURCES_SUFFIX = ' và vài nguồn khác'

export function toolLabel(name: string): ToolLabel | undefined {
  return Object.prototype.hasOwnProperty.call(TOOL_LABELS, name) ? TOOL_LABELS[name] : undefined
}

function toolStatusText(tools: string[]): string {
  const labels = tools.map(toolLabel).filter((label): label is ToolLabel => label !== undefined)
  const [first] = labels
  if (!first) return UNKNOWN_TOOL_TEXT
  const hasOtherSource = labels.some((label) => label.source !== first.source)
  return `${first.status}${hasOtherSource ? MORE_SOURCES_SUFFIX : ''}…`
}

export function statusText(status: StreamStatus): string {
  if (status.phase === 'thinking') return THINKING_TEXT
  if (status.phase === 'retry') return RETRY_TEXT
  return toolStatusText(status.tools)
}
