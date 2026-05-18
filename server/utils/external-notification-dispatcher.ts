import { isTelegramEnabled, sendToGroups, sendToSubscribers } from './telegram-service'

interface OrderConfirmedPayload {
  weekId: number
  weekLabel: string
  createdBy: string
  itemCount: number
  totalQuantity: number
}

interface OrderApprovedPayload {
  weekId: number
  weekLabel: string
  creatorName: string
  leaderName: string
  signedAt: string
}

type EventPayload = {
  ORDER_CONFIRMED: OrderConfirmedPayload
  ORDER_APPROVED: OrderApprovedPayload
}

type ExternalEventType = keyof EventPayload

function formatVietnameseDateTime(iso: string): string {
  try {
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return iso
  }
}

function buildMessage<T extends ExternalEventType>(eventType: T, payload: EventPayload[T]): string {
  const appUrl = process.env.VITE_APP_URL || process.env.FRONTEND_URL || 'https://datchi.ithoathodb.xyz'

  switch (eventType) {
    case 'ORDER_CONFIRMED': {
      const p = payload as OrderConfirmedPayload
      return [
        `📦 <b>ĐẶT HÀNG MỚI</b> — ${p.weekLabel}`,
        `👤 Người đặt: ${p.createdBy}`,
        `📋 Số loại chỉ: ${p.itemCount}`,
        `🔢 Tổng số lượng: ${p.totalQuantity} cuộn`,
        `🔗 <a href="${appUrl}/thread/weekly-order/${p.weekId}">Xem chi tiết</a>`,
      ].join('\n')
    }
    case 'ORDER_APPROVED': {
      const p = payload as OrderApprovedPayload
      return [
        `✅ <b>ĐƠN HÀNG ĐÃ ĐƯỢC KÝ DUYỆT</b> — ${p.weekLabel}`,
        `👤 Người tạo: ${p.creatorName}`,
        `👔 Lãnh đạo ký: ${p.leaderName}`,
        `🕒 Thời gian: ${formatVietnameseDateTime(p.signedAt)}`,
        `🔗 <a href="${appUrl}/thread/weekly-order/${p.weekId}">Xem chi tiết</a>`,
      ].join('\n')
    }
    default:
      return `[${eventType}] ${JSON.stringify(payload)}`
  }
}

export function dispatchExternalNotification<T extends ExternalEventType>(
  eventType: T,
  payload: EventPayload[T],
): void {
  if (!isTelegramEnabled()) return

  const message = buildMessage(eventType, payload)

  Promise.allSettled([
    sendToGroups(eventType, message),
    sendToSubscribers(eventType, message),
  ]).then((results) => {
    for (const result of results) {
      if (result.status === 'rejected') {
        console.error('[external-notification] channel failed:', result.reason)
      }
    }
  })
}
