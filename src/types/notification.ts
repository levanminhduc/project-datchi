export type NotificationType = 'STOCK_ALERT' | 'BATCH_RECEIVE' | 'BATCH_ISSUE' | 'ALLOCATION' | 'CONFLICT' | 'RECOVERY' | 'WEEKLY_ORDER'

export interface Notification {
  id: number
  employee_id: number
  type: NotificationType
  title: string
  body: string | null
  is_read: boolean
  action_url: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  deleted_at: string | null
}

export interface NotificationListParams {
  limit?: number
  offset?: number
  type?: NotificationType
  is_read?: boolean
}
