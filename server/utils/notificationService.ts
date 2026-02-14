import { supabaseAdmin } from '../db/supabase'
import type { NotificationType } from '../types/notification'

interface CreateNotificationParams {
  employeeId: number
  type: NotificationType
  title: string
  body?: string
  actionUrl?: string
  metadata?: Record<string, unknown>
}

interface BroadcastNotificationParams {
  employeeIds: number[]
  type: NotificationType
  title: string
  body?: string
  actionUrl?: string
  metadata?: Record<string, unknown>
}

export async function createNotification(params: CreateNotificationParams): Promise<void> {
  const { error } = await supabaseAdmin
    .from('notifications')
    .insert({
      employee_id: params.employeeId,
      type: params.type,
      title: params.title,
      body: params.body || null,
      action_url: params.actionUrl || null,
      metadata: params.metadata || null,
    })

  if (error) {
    console.error('createNotification error:', error)
  }
}

export async function broadcastNotification(params: BroadcastNotificationParams): Promise<void> {
  if (params.employeeIds.length === 0) return

  const rows = params.employeeIds.map(employeeId => ({
    employee_id: employeeId,
    type: params.type,
    title: params.title,
    body: params.body || null,
    action_url: params.actionUrl || null,
    metadata: params.metadata || null,
  }))

  const { error } = await supabaseAdmin
    .from('notifications')
    .insert(rows)

  if (error) {
    console.error('broadcastNotification error:', error)
  }
}

export async function getWarehouseEmployeeIds(): Promise<number[]> {
  const { data, error } = await supabaseAdmin
    .from('employee_roles')
    .select('employee_id, roles!inner(code, level)')

  if (error || !data) {
    console.error('getWarehouseEmployeeIds error:', error)
    return []
  }

  const employeeIds = new Set<number>()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data.forEach((row: any) => {
    const role = row.roles
    if (role && (role.level <= 2 || ['root', 'admin', 'warehouse_manager'].includes(role.code))) {
      employeeIds.add(row.employee_id)
    }
  })

  return Array.from(employeeIds)
}
