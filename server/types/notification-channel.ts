export type ChannelType = 'TELEGRAM' | 'EMAIL'

export type ExternalEventType = 'ORDER_CONFIRMED' | 'ORDER_CANCELLED'

export interface TelegramConfig {
  chat_id: string
  name?: string
}

export interface NotificationChannelRow {
  id: number
  employee_id: number
  channel_type: ChannelType
  channel_config: TelegramConfig
  event_types: ExternalEventType[]
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface NotificationChannelGroupRow {
  id: number
  channel_type: ChannelType
  channel_config: TelegramConfig
  event_types: ExternalEventType[]
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}
