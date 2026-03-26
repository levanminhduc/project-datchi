import { z } from 'zod'

export type NotificationType =
  | 'STOCK_ALERT'
  | 'BATCH_RECEIVE'
  | 'BATCH_ISSUE'
  | 'ALLOCATION'
  | 'CONFLICT'
  | 'RECOVERY'
  | 'WEEKLY_ORDER'

export interface NotificationRow {
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

export const notificationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  type: z.enum([
    'STOCK_ALERT',
    'BATCH_RECEIVE',
    'BATCH_ISSUE',
    'ALLOCATION',
    'CONFLICT',
    'RECOVERY',
    'WEEKLY_ORDER',
  ]).optional(),
  is_read: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
})

export type NotificationQueryParams = z.infer<typeof notificationQuerySchema>
