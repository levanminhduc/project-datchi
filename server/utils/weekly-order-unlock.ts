import type { Context } from 'hono'
import { query, queryOne } from '../db/query'
import type { AuthContext } from '../types/auth'

export interface WeeklyOrderEditUnlock {
  id: number
  week_id: number
  granted_by: string
  granted_at: string
  expires_at: string
  revoked_at: string | null
  revoked_by: string | null
  reason: string | null
}

export interface WeekAuditEntry {
  weekId: number
  tableName: string
  recordId: number
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  oldValues?: Record<string, unknown> | null
  newValues?: Record<string, unknown> | null
  performedBy: string
}

const UNLOCK_COLUMNS =
  'id, week_id, granted_by, granted_at, expires_at, revoked_at, revoked_by, reason'

export function isUnlockActive(
  unlock: WeeklyOrderEditUnlock | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!unlock) return false
  if (unlock.revoked_at) return false
  return new Date(unlock.expires_at).getTime() > now.getTime()
}

export async function getActiveUnlock(weekId: number): Promise<WeeklyOrderEditUnlock | null> {
  const row = await queryOne<WeeklyOrderEditUnlock>(
    `SELECT ${UNLOCK_COLUMNS}
       FROM weekly_order_edit_unlocks
      WHERE week_id = $1 AND revoked_at IS NULL
      ORDER BY expires_at DESC
      LIMIT 1`,
    [weekId],
  )
  return isUnlockActive(row) ? row : null
}

export async function getUnlockHistory(weekId: number, limit = 20): Promise<WeeklyOrderEditUnlock[]> {
  return query<WeeklyOrderEditUnlock>(
    `SELECT ${UNLOCK_COLUMNS}
       FROM weekly_order_edit_unlocks
      WHERE week_id = $1
      ORDER BY granted_at DESC
      LIMIT $2`,
    [weekId, limit],
  )
}

export async function isRootUnlocked(c: Context, weekId: number): Promise<boolean> {
  const auth = c.get('auth') as AuthContext | undefined
  if (!auth?.isRoot) return false
  return (await getActiveUnlock(weekId)) !== null
}

export async function logWeekAudit(entry: WeekAuditEntry): Promise<void> {
  const oldValues = entry.oldValues ?? null
  const newValues = entry.newValues ?? null

  let changedFields: string[] | null = null
  if (entry.action === 'UPDATE' && oldValues && newValues) {
    const keys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)])
    changedFields = [...keys].filter(
      (key) => JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key]),
    )
  }

  try {
    await query(
      `INSERT INTO thread_audit_log
         (table_name, record_id, action, old_values, new_values, changed_fields, performed_by, week_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        entry.tableName,
        entry.recordId,
        entry.action,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        changedFields,
        entry.performedBy,
        entry.weekId,
      ],
    )
  } catch (error) {
    console.error('[weekly-order-unlock] audit log insert failed:', error)
  }
}

export function getPerformer(c: Context): string {
  const auth = c.get('auth') as AuthContext | undefined
  return auth?.employeeCode ?? 'system'
}
