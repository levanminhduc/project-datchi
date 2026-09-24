import type { WeeklyOrderProcessTraceRow } from '@/types/thread'

export function formatQty(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 2,
  }).format(value || 0)
}

export function formatGapQty(value: number): string {
  const rounded = Math.round((value || 0) * 100) / 100
  if (rounded > 0) return `Thiếu ${formatQty(rounded)}`
  if (rounded < 0) return `Dư ${formatQty(Math.abs(rounded))}`
  return 'Đủ'
}

export function getGapClass(value: number): string {
  if (value > 0) return 'text-warning'
  if (value < 0) return 'text-negative'
  return 'text-positive'
}

export const WEEK_STATUS_CHIP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Nháp', color: 'orange' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'positive' },
  COMPLETED: { label: 'Hoàn thành', color: 'primary' },
  CANCELLED: { label: 'Đã hủy', color: 'negative' },
}

export function getWeekStatusChip(status: string): { label: string; color: string } {
  return WEEK_STATUS_CHIP[status] ?? { label: status, color: 'grey' }
}

export const DELIVERY_LINE_STATUS_CHIP: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ giao', color: 'orange' },
  DELIVERED: { label: 'Đã giao', color: 'positive' },
  CANCELLED: { label: 'Đã hủy', color: 'negative' },
}

export function getDeliveryLineStatusChip(status: string): { label: string; color: string } {
  return DELIVERY_LINE_STATUS_CHIP[status] ?? { label: status, color: 'grey' }
}

export type WorkflowNodeKind = 'plan' | 'cumulative' | 'current'

export const WORKFLOW_NODE_KIND_LABEL: Record<WorkflowNodeKind, string> = {
  plan: 'Kế hoạch',
  cumulative: 'Lũy kế',
  current: 'Hiện tại',
}

export const WORKFLOW_NODE_META: Record<string, { kind: WorkflowNodeKind; hint: string }> = {
  order: {
    kind: 'plan',
    hint: 'Nhu cầu theo bảng tính tuần. Tổng cần = Nhu cầu + Đặt thêm.',
  },
  check: {
    kind: 'current',
    hint: 'Đặt NCC = tổng số cuộn các đợt giao chưa hủy. Giữ từ tồn = số cuộn đang giữ cho tuần lấy từ tồn kho (không đến từ NCC giao cho tuần, không mượn tuần khác).',
  },
  supplier: {
    kind: 'cumulative',
    hint: 'Tổng số cuộn đặt NCC của các đợt giao chưa hủy. Đợt giao đã hủy hiển thị riêng.',
  },
  delivery: {
    kind: 'current',
    hint: 'Số cuộn đặt NCC của các đợt giao chưa hủy mà NCC chưa giao.',
  },
  receiving: {
    kind: 'current',
    hint: 'Số cuộn NCC đã giao nhưng chưa nhập kho = Đã giao − Đã nhập.',
  },
  received: {
    kind: 'cumulative',
    hint: 'Tổng số cuộn đã nhập kho từ các đợt giao NCC của tuần.',
  },
  reserve: {
    kind: 'current',
    hint: 'Số cuộn đang giữ cho tuần có nguồn từ tồn kho (giữ lúc xác nhận tuần hoặc Rút tồn). Không tính cuộn đã xuất hoặc đã nhả.',
  },
  warehouse: {
    kind: 'current',
    hint: 'Số cuộn đang giữ cho tuần (quy đổi cuộn lẻ), tách theo nguồn: NCC nhập cho tuần, tồn kho, tuần khác. Đã nhả về tồn / Chuyển sang tuần khác là lũy kế số cuộn từng giữ cho tuần rồi bị nhả hoặc chuyển đi (theo nhật ký kho).',
  },
  issue: {
    kind: 'cumulative',
    hint: 'Tổng số cuộn đã xuất cho các PO/mã hàng/màu của tuần (phiếu xuất đã xác nhận). Từ kho tuần chỉ tính cuộn đang giữ cho chính tuần này. PO/mã hàng/màu dùng chung nhiều tuần thì Xuất kho lấy cuộn của mọi tuần theo hạn dùng/ngày nhập, phần lấy từ cuộn giữ cho tuần khác hiện riêng ở "Từ giữ tuần khác".',
  },
  return: {
    kind: 'cumulative',
    hint: 'Tổng số cuộn trả về từ các phiếu xuất của tuần. Cuộn trả về thành tồn khả dụng, không quay lại kho tuần.',
  },
}

export const UNPLANNED_ROW_HINT = 'Cuộn/đợt giao gắn với tuần nhưng mã màu không khớp định mức kế hoạch (thường do định mức còn trỏ mã màu cũ sau khi tách màu). Thiếu của dòng kế hoạch và Dư của dòng này bù trừ nhau, không phải thiếu/dư thật.'

export const GAP_HINT_LINES: string[] = [
  'Thiếu/Dư = Tổng cần − Nguồn đã gán. Dương là Thiếu, âm là Dư.',
  'Tổng cần = Nhu cầu + Đặt thêm.',
  'Nguồn đã gán = Chờ NCC giao + Giao chưa nhập + Đang giữ ở kho tuần + Đã xuất từ cuộn giữ cho chính tuần.',
  'Tổng tuần hiện Thiếu và Dư riêng (không bù trừ giữa các dòng); ròng = Thiếu − Dư.',
  'Đặt NCC nhỏ hơn Tổng cần là bình thường: phần tồn kho lúc tính được giữ từ kho thay vì đặt NCC.',
  'Thiếu thường do: tồn kho không giữ được như lúc tính, xuất từ tồn khả dụng, trả kho, nhả cuộn hoặc cho tuần khác mượn, NCC giao thiếu/hủy.',
  'Dư thường do: giữ thêm từ tồn, NCC giao dư, nhận cuộn tuần khác, còn giữ cuộn sau khi đã xuất đủ.',
  'PO/mã hàng/màu dùng chung nhiều tuần: Xuất kho gộp định mức và lấy cuộn của mọi tuần theo hạn dùng/ngày nhập, nên Thiếu/Dư của các tuần đó nên xem chung.',
  'Dòng ⚠ lệch màu bù trừ với dòng kế hoạch cùng loại chỉ.',
]

export const SHORTAGE_HINT = 'Tổng phần Thiếu của các dòng còn thiếu (Tổng cần lớn hơn Nguồn đã gán). Không bù trừ với dòng dư.'

export const SURPLUS_HINT = 'Tổng phần Dư của các dòng đang dư (Nguồn đã gán lớn hơn Tổng cần). Không bù trừ với dòng thiếu.'

export const NET_GAP_HINT = 'Ròng = Thiếu − Dư, là con số tổng trước đây. Có thể gần 0 dù bên trong vẫn có dòng thiếu và dòng dư.'

export function formatTraceRowLabel(row: WeeklyOrderProcessTraceRow): string {
  return [row.supplier_name, row.tex_number, row.color_name].filter(Boolean).join(' · ')
}

export function buildGapBreakdownLines(row: WeeklyOrderProcessTraceRow): string[] {
  const lines = [
    `Tổng cần ${formatQty(row.assignment_target_cones)} = Nhu cầu ${formatQty(row.required_cones)} + Đặt thêm ${formatQty(row.additional_order_cones)}`,
    `Đã gán ${formatQty(row.assigned_week_cones)} = Chờ NCC ${formatQty(row.pending_delivery_cones)} + Giao chưa nhập ${formatQty(row.pending_receive_cones)} + Đang giữ ${formatQty(row.reserved_cones)} + Xuất từ giữ ${formatQty(row.issued_from_reserved_cones)}`,
    `${formatGapQty(row.assignment_gap_cones)} = Tổng cần − Đã gán`,
  ]
  if (row.issued_from_available_cones > 0) lines.push(`Xuất từ tồn khả dụng (không tính vào Đã gán): ${formatQty(row.issued_from_available_cones)}`)
  if (row.issued_from_other_week_reserved_cones > 0) lines.push(`Xuất từ cuộn giữ cho tuần khác (không tính vào Đã gán): ${formatQty(row.issued_from_other_week_reserved_cones)}`)
  if (row.released_cones > 0) lines.push(`Đã nhả về tồn (lũy kế): ${formatQty(row.released_cones)}`)
  if (row.transferred_out_cones > 0) lines.push(`Chuyển sang tuần khác (lũy kế): ${formatQty(row.transferred_out_cones)}`)
  if (row.unplanned) lines.push(UNPLANNED_ROW_HINT)
  return lines
}
