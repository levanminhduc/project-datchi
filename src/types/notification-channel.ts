export type ChannelType = 'TELEGRAM' | 'EMAIL'
export type ExternalEventType = 'ORDER_CONFIRMED' | 'ORDER_CANCELLED'

export interface TelegramConfig {
  chat_id: string
  name?: string
}

export interface NotificationChannel {
  id: number
  employee_id: number
  channel_type: ChannelType
  channel_config: TelegramConfig
  event_types: ExternalEventType[]
  is_active: boolean
  created_at: string
  employees?: {
    id: number
    full_name: string
    employee_id: string
  }
}

export interface NotificationChannelGroup {
  id: number
  channel_type: ChannelType
  channel_config: TelegramConfig
  event_types: ExternalEventType[]
  is_active: boolean
  created_at: string
}

export const EVENT_TYPE_LABELS: Record<ExternalEventType, string> = {
  ORDER_CONFIRMED: 'Xác nhận đặt hàng',
  ORDER_CANCELLED: 'Hủy đặt hàng',
}
