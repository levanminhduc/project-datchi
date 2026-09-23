import { Hono } from 'hono'
import { query, queryOne, querySingle, queryCount } from '../db/query'
import { requireRoot } from '../middleware/auth'
import { getErrorMessage } from '../utils/errorHelper'
import { sanitizeHtml } from '../utils/sanitize-html'
import {
  CreateAnnouncementSchema,
  UpdateAnnouncementSchema,
  AnnouncementListQuerySchema,
} from '../validation/announcement'
import type { AppEnv } from '../types/hono-env'

const announcements = new Hono<AppEnv>()

// --- User-facing (any authenticated user) ---

announcements.get('/pending', async (c) => {
  const { employeeId } = c.get('auth')

  try {
    const data = await query<{ id: number; title: string; content: string; priority: number; created_at: string }>(
      `SELECT id, title, content, priority, created_at
       FROM announcements
       WHERE is_active = true AND deleted_at IS NULL
       ORDER BY priority DESC, created_at DESC
       LIMIT 20`
    )

    if (!data || data.length === 0) {
      return c.json({ data: [], error: null })
    }

    const announcementIds = data.map((a) => a.id)

    const dismissals = await query<{ announcement_id: number }>(
      `SELECT announcement_id FROM announcement_dismissals
       WHERE employee_id = $1 AND announcement_id = ANY($2)`,
      [employeeId, announcementIds]
    )

    const dismissedSet = new Set((dismissals || []).map((d) => d.announcement_id))
    const pending = data.filter((a) => !dismissedSet.has(a.id))

    return c.json({ data: pending, error: null })
  } catch (err) {
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

announcements.post('/:id/dismiss', async (c) => {
  const { employeeId } = c.get('auth')
  const id = parseInt(c.req.param('id'), 10)

  if (isNaN(id)) {
    return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
  }

  try {
    await query(
      `INSERT INTO announcement_dismissals (announcement_id, employee_id)
       VALUES ($1, $2)
       ON CONFLICT (announcement_id, employee_id) DO NOTHING`,
      [id, employeeId]
    )

    return c.json({ data: null, error: null, message: 'Đã đánh dấu đã đọc' })
  } catch (err) {
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

// --- Admin (ROOT only) ---

announcements.use('/*', async (c, next) => {
  if (c.req.path.endsWith('/pending') || c.req.path.includes('/dismiss')) {
    return next()
  }
  return requireRoot(c, next)
})

announcements.get('/', async (c) => {
  try {
    const parsed = AnnouncementListQuerySchema.safeParse({
      page: c.req.query('page'),
      pageSize: c.req.query('pageSize'),
    })

    if (!parsed.success) {
      return c.json({ data: null, error: 'Tham số không hợp lệ' }, 400)
    }

    const { page, pageSize } = parsed.data

    const offset = (page - 1) * pageSize

    const data = await query<Record<string, unknown> & { id: number; employees: { full_name: string } | null }>(
      `SELECT a.*,
              CASE WHEN e.id IS NULL THEN NULL
                   ELSE json_build_object('full_name', e.full_name) END AS employees
       FROM announcements a
       LEFT JOIN employees e ON e.id = a.created_by
       WHERE a.deleted_at IS NULL
       ORDER BY a.created_at DESC
       LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    )

    const count = await queryCount(
      `SELECT count(*)::int AS count FROM announcements WHERE deleted_at IS NULL`
    )

    const totalEmployees = await queryCount(
      `SELECT count(*)::int AS count FROM employees WHERE is_active = true`
    )

    const announcementIds = (data || []).map((a) => a.id)
    const dismissalCounts: Record<number, number> = {}

    if (announcementIds.length > 0) {
      const dismissals = await query<{ announcement_id: number }>(
        `SELECT announcement_id FROM announcement_dismissals
         WHERE announcement_id = ANY($1)`,
        [announcementIds]
      )

      if (dismissals) {
        for (const d of dismissals) {
          dismissalCounts[d.announcement_id] = (dismissalCounts[d.announcement_id] || 0) + 1
        }
      }
    }

    const enriched = (data || []).map((a) => ({
      ...a,
      creator_name: a.employees?.full_name || null,
      dismissal_count: dismissalCounts[a.id] || 0,
      total_employees: totalEmployees || 0,
    }))

    return c.json({
      data: enriched,
      error: null,
      pagination: { page, pageSize, total: count || 0 },
    })
  } catch (err) {
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

announcements.post('/', async (c) => {
  const { employeeId } = c.get('auth')

  try {
    const body = await c.req.json()
    const parsed = CreateAnnouncementSchema.safeParse(body)

    if (!parsed.success) {
      return c.json({
        data: null,
        error: parsed.error.issues.map((e) => e.message).join(', '),
      }, 400)
    }

    const { title, content, priority } = parsed.data

    const data = await queryOne(
      `INSERT INTO announcements (title, content, priority, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, sanitizeHtml(content), priority, employeeId]
    )

    return c.json({ data, error: null, message: 'Đã tạo thông báo' }, 201)
  } catch (err) {
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

announcements.put('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) {
    return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
  }

  try {
    const body = await c.req.json()
    const parsed = UpdateAnnouncementSchema.safeParse(body)

    if (!parsed.success) {
      return c.json({
        data: null,
        error: parsed.error.issues.map((e) => e.message).join(', '),
      }, 400)
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (parsed.data.title !== undefined) updates.title = parsed.data.title
    if (parsed.data.content !== undefined) updates.content = sanitizeHtml(parsed.data.content)
    if (parsed.data.priority !== undefined) updates.priority = parsed.data.priority

    const sets: string[] = []
    const params: unknown[] = []
    for (const [key, value] of Object.entries(updates)) {
      params.push(value)
      sets.push(`${key} = $${params.length}`)
    }
    params.push(id)

    const data = await querySingle(
      `UPDATE announcements SET ${sets.join(', ')}
       WHERE id = $${params.length} AND deleted_at IS NULL
       RETURNING *`,
      params
    )

    return c.json({ data, error: null, message: 'Đã cập nhật thông báo' })
  } catch (err) {
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

announcements.patch('/:id/toggle', async (c) => {
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) {
    return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
  }

  try {
    const current = await querySingle<{ is_active: boolean }>(
      `SELECT is_active FROM announcements
       WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    )

    const data = await querySingle<{ is_active: boolean }>(
      `UPDATE announcements
       SET is_active = $1, updated_at = $2
       WHERE id = $3
       RETURNING *`,
      [!current.is_active, new Date().toISOString(), id]
    )

    return c.json({
      data,
      error: null,
      message: data.is_active ? 'Đã bật thông báo' : 'Đã tắt thông báo',
    })
  } catch (err) {
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

announcements.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) {
    return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
  }

  try {
    await query(
      `UPDATE announcements SET deleted_at = $1
       WHERE id = $2 AND deleted_at IS NULL`,
      [new Date().toISOString(), id]
    )

    return c.json({ data: null, error: null, message: 'Đã xoá thông báo' })
  } catch (err) {
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

export default announcements
