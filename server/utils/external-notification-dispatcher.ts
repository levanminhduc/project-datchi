import { isTelegramEnabled, sendToGroups, sendToSubscribers } from './telegram-service'

interface OrderConfirmedPayload {
  weekId: number
  weekLabel: string
  createdBy: string
  itemCount: number
  totalQuantity: number
}

type EventPayload = {
  ORDER_CONFIRMED: OrderConfirmedPayload
}

type ExternalEventType = keyof EventPayload

function buildMessage<T extends ExternalEventType>(eventType: T, payload: EventPayload[T]): string {
  switch (eventType) {
    case 'ORDER_CONFIRMED': {
      const p = payload as OrderConfirmedPayload
      const appUrl = process.env.VITE_APP_URL || process.env.FRONTEND_URL || 'https://datchi.ithoathodb.xyz'
      return [
        `📦 <b>ĐẶT HÀNG MỚI</b> — ${p.weekLabel}`,
        `👤 Người đặt: ${p.createdBy}`,
        `📋 Số loại chỉ: ${p.itemCount}`,
        `🔢 Tổng số lượng: ${p.totalQuantity} cuộn`,
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
