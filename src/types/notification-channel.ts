export type ChannelType = 'TELEGRAM' | 'EMAIL'
export type ExternalEventType =
  | 'ORDER_CONFIRMED'
  | 'ORDER_CANCELLED'
  | 'ORDER_APPROVED'
  | 'ORDER_APPROVAL_REQUESTED'

export interface TelegramConfig {
  chat_id: string
  telegram_user_id?: string
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

export type TelegramIdentityStatus = 'unassigned' | 'assigned' | 'all'
export type TelegramIdentityAssignMode = 'REGULAR' | 'APPROVAL'

export interface TelegramIdentity {
  id: number
  telegram_user_id: string
  chat_id: string
  username: string | null
  first_name: string | null
  last_name: string | null
  last_seen_at: string
  last_command: string
  assigned_employee_id: number | null
  assigned_channel_id: number | null
  assigned_at: string | null
  created_at: string
  assigned_employee?: {
    id: number
    employee_id: string
    full_name: string
  } | null
  assigned_channel?: {
    id: number
    event_types: ExternalEventType[]
    is_active: boolean
  } | null
}

export const EVENT_TYPE_LABELS: Record<ExternalEventType, string> = {
  ORDER_CONFIRMED: 'Xác nhận đặt hàng',
  ORDER_CANCELLED: 'Hủy đặt hàng',
  ORDER_APPROVED: 'Đơn đã ký duyệt',
  ORDER_APPROVAL_REQUESTED: 'Yêu cầu lãnh đạo duyệt',
}
