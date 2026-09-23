import { Hono } from 'hono'
import { ZodError } from 'zod'
import { query, queryOne, querySingle, queryCount } from '../db/query'
import { requireRoot } from '../middleware/auth'
import { getErrorMessage } from '../utils/errorHelper'
import { CreateUnlockSchema } from '../validation/weeklyOrderUnlock'
import {
  getActiveUnlock,
  getUnlockHistory,
  logWeekAudit,
  getPerformer,
  type WeeklyOrderEditUnlock,
} from '../utils/weekly-order-unlock'
import type { AppEnv } from '../types/hono-env'

const weeklyOrderUnlock = new Hono<AppEnv>()

weeklyOrderUnlock.use('*', requireRoot)

const AUDIT_PAGE_SIZE_CAP = 100

interface AuditRow {
  id: number
  table_name: string
  record_id: number
  action: string
  performed_by: string | null
  changed_fields: string[] | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  created_at: string
}

function parseWeekId(raw: string | undefined): number | null {
  if (!raw) return null
  const parsed = parseInt(raw)
  return isNaN(parsed) || parsed <= 0 ? null : parsed
}

weeklyOrderUnlock.get('/audit', async (c) => {
  try {
    const weekId = parseWeekId(c.req.query('week_id'))
    if (weekId === null) {
      return c.json({ data: null, error: 'Thiếu hoặc sai week_id' }, 400)
    }

    const page = Math.max(1, parseInt(c.req.query('page') ?? '1') || 1)
    const limit = Math.min(
      AUDIT_PAGE_SIZE_CAP,
      Math.max(1, parseInt(c.req.query('limit') ?? '25') || 25),
    )
    const offset = (page - 1) * limit

    const total = await queryCount(
      'SELECT COUNT(*) AS count FROM thread_audit_log WHERE week_id = $1',
      [weekId],
    )

    const rows = await query<AuditRow>(
      `SELECT id, table_name, record_id, action, performed_by, changed_fields,
              old_values, new_values, created_at
         FROM thread_audit_log
        WHERE week_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3`,
      [weekId, limit, offset],
    )

    return c.json({ data: { rows, total, page, limit }, error: null })
  } catch (err) {
    console.error('[weekly-order-unlock] fetch audit failed:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

weeklyOrderUnlock.get('/', async (c) => {
  try {
    const weekId = parseWeekId(c.req.query('week_id'))
    if (weekId === null) {
      return c.json({ data: null, error: 'Thiếu hoặc sai week_id' }, 400)
    }

    const [active, history] = await Promise.all([
      getActiveUnlock(weekId),
      getUnlockHistory(weekId),
    ])

    return c.json({ data: { active, history }, error: null })
  } catch (err) {
    console.error('[weekly-order-unlock] fetch unlocks failed:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

weeklyOrderUnlock.post('/', async (c) => {
  try {
    let validated
    try {
      validated = CreateUnlockSchema.parse(await c.req.json())
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ data: null, error: err.issues.map((e) => e.message).join('; ') }, 400)
      }
      throw err
    }

    const week = await queryOne<{ id: number }>(
      'SELECT id FROM thread_order_weeks WHERE id = $1',
      [validated.week_id],
    )
    if (!week) {
      return c.json({ data: null, error: 'Không tìm thấy tuần đặt hàng' }, 404)
    }

    const performedBy = getPerformer(c)

    await query(
      `UPDATE weekly_order_edit_unlocks
          SET revoked_at = NOW(), revoked_by = $2
        WHERE week_id = $1 AND revoked_at IS NULL`,
      [validated.week_id, performedBy],
    )

    const created = await querySingle<WeeklyOrderEditUnlock>(
      `INSERT INTO weekly_order_edit_unlocks (week_id, granted_by, expires_at, reason)
       VALUES ($1, $2, NOW() + ($3 || ' minutes')::interval, $4)
       RETURNING id, week_id, granted_by, granted_at, expires_at, revoked_at, revoked_by, reason`,
      [validated.week_id, performedBy, String(validated.duration_minutes), validated.reason],
    )

    await logWeekAudit({
      weekId: validated.week_id,
      tableName: 'weekly_order_edit_unlocks',
      recordId: created.id,
      action: 'INSERT',
      newValues: {
        expires_at: created.expires_at,
        duration_minutes: validated.duration_minutes,
        reason: validated.reason,
      },
      performedBy,
    })

    return c.json({
      data: created,
      error: null,
      message: `Đã mở khóa chỉnh sửa trong ${validated.duration_minutes} phút`,
    })
  } catch (err) {
    console.error('[weekly-order-unlock] create unlock failed:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

weeklyOrderUnlock.post('/:id/revoke', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const performedBy = getPerformer(c)

    const revoked = await queryOne<WeeklyOrderEditUnlock>(
      `UPDATE weekly_order_edit_unlocks
          SET revoked_at = NOW(), revoked_by = $2
        WHERE id = $1 AND revoked_at IS NULL
       RETURNING id, week_id, granted_by, granted_at, expires_at, revoked_at, revoked_by, reason`,
      [id, performedBy],
    )

    if (!revoked) {
      return c.json({ data: null, error: 'Phiên mở khóa không tồn tại hoặc đã đóng' }, 404)
    }

    await logWeekAudit({
      weekId: revoked.week_id,
      tableName: 'weekly_order_edit_unlocks',
      recordId: revoked.id,
      action: 'UPDATE',
      oldValues: { revoked_at: null },
      newValues: { revoked_at: revoked.revoked_at },
      performedBy,
    })

    return c.json({ data: revoked, error: null, message: 'Đã khóa lại tuần đặt hàng' })
  } catch (err) {
    console.error('[weekly-order-unlock] revoke unlock failed:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

export default weeklyOrderUnlock
