import { query } from '../db/query'
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
  try {
    await query(
      `INSERT INTO notifications (employee_id, type, title, body, action_url, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        params.employeeId,
        params.type,
        params.title,
        params.body || null,
        params.actionUrl || null,
        params.metadata ? JSON.stringify(params.metadata) : null,
      ]
    )
  } catch (error) {
    console.error('createNotification error:', error)
  }
}

export async function broadcastNotification(params: BroadcastNotificationParams): Promise<void> {
  if (params.employeeIds.length === 0) return

  const values: string[] = []
  const sqlParams: unknown[] = []
  for (const employeeId of params.employeeIds) {
    const base = sqlParams.length
    values.push(
      `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`
    )
    sqlParams.push(
      employeeId,
      params.type,
      params.title,
      params.body || null,
      params.actionUrl || null,
      params.metadata ? JSON.stringify(params.metadata) : null
    )
  }

  try {
    await query(
      `INSERT INTO notifications (employee_id, type, title, body, action_url, metadata)
       VALUES ${values.join(', ')}`,
      sqlParams
    )
  } catch (error) {
    console.error('broadcastNotification error:', error)
  }
}

export async function getWarehouseEmployeeIds(): Promise<number[]> {
  let data: Array<{ employee_id: number; role_code: string; role_level: number }>
  try {
    data = await query<{ employee_id: number; role_code: string; role_level: number }>(
      `SELECT er.employee_id, r.code AS role_code, r.level AS role_level
       FROM employee_roles er
       INNER JOIN roles r ON r.id = er.role_id`
    )
  } catch (error) {
    console.error('getWarehouseEmployeeIds error:', error)
    return []
  }

  const employeeIds = new Set<number>()

  for (const row of data) {
    if (row.role_level <= 2 || ['root', 'admin', 'warehouse_manager'].includes(row.role_code)) {
      employeeIds.add(row.employee_id)
    }
  }

  return Array.from(employeeIds)
}

export async function getLeaderEmployeeIds(): Promise<number[]> {
  let directPerms: Array<{ employee_id: number }> = []
  try {
    directPerms = await query<{ employee_id: number }>(
      `SELECT ep.employee_id
       FROM employee_permissions ep
       INNER JOIN permissions p ON p.id = ep.permission_id
       WHERE p.code = $1 AND ep.granted = true`,
      ['thread.leader.sign']
    )
  } catch (error) {
    console.error('getLeaderEmployeeIds direct error:', error)
  }

  let rolePerms: Array<{ employee_id: number }> = []
  try {
    rolePerms = await query<{ employee_id: number }>(
      `SELECT er.employee_id
       FROM employee_roles er
       INNER JOIN role_permissions rp ON rp.role_id = er.role_id
       INNER JOIN permissions p ON p.id = rp.permission_id
       WHERE p.code = $1`,
      ['thread.leader.sign']
    )
  } catch (error) {
    console.error('getLeaderEmployeeIds role error:', error)
  }

  const employeeIds = new Set<number>()

  for (const row of directPerms) {
    employeeIds.add(row.employee_id)
  }
  for (const row of rolePerms) {
    employeeIds.add(row.employee_id)
  }

  return Array.from(employeeIds)
}
