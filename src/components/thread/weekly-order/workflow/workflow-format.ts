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
