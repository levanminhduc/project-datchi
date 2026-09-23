import { Hono } from 'hono'
import { query, queryOne, queryCount } from '../db/query'
import { requirePermission } from '../middleware/auth'
import { notificationQuerySchema, type NotificationRow } from '../types/notification'
import type { AppEnv } from '../types/hono-env'

const notifications = new Hono<AppEnv>()
notifications.use('*', requirePermission('dashboard.view'))

notifications.get('/', async (c) => {
  const auth = c.get('auth')

  const parsed = notificationQuerySchema.safeParse({
    limit: c.req.query('limit'),
    offset: c.req.query('offset'),
    type: c.req.query('type'),
    is_read: c.req.query('is_read'),
  })

  if (!parsed.success) {
    return c.json({
      data: null,
      error: parsed.error.issues.map((e: { message: string }) => e.message).join(', '),
    }, 400)
  }

  const { limit, offset, type, is_read } = parsed.data

  try {
    const conditions: string[] = ['employee_id = $1', 'deleted_at IS NULL']
    const params: unknown[] = [auth.employeeId]

    if (type) {
      params.push(type)
      conditions.push(`type = $${params.length}`)
    }
    if (is_read !== undefined) {
      params.push(is_read)
      conditions.push(`is_read = $${params.length}`)
    }

    params.push(limit)
    const limitPlaceholder = `$${params.length}`
    params.push(offset)
    const offsetPlaceholder = `$${params.length}`

    let data: NotificationRow[]
    try {
      data = await query<NotificationRow>(
        `SELECT * FROM notifications
         WHERE ${conditions.join(' AND ')}
         ORDER BY created_at DESC
         LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
        params
      )
    } catch (error) {
      console.error('List notifications error:', error)
      return c.json({ data: null, error: 'Lỗi khi tải thông báo' }, 500)
    }

    return c.json({ data: data as NotificationRow[], error: null })
  } catch (err) {
    console.error('List notifications error:', err)
    return c.json({ data: null, error: 'Lỗi hệ thống' }, 500)
  }
})

notifications.get('/unread-count', async (c) => {
  const auth = c.get('auth')

  try {
    let count: number
    try {
      count = await queryCount(
        `SELECT count(*)::int AS count FROM notifications
         WHERE employee_id = $1 AND is_read = false AND deleted_at IS NULL`,
        [auth.employeeId]
      )
    } catch (error) {
      console.error('Unread count error:', error)
      return c.json({ data: null, error: 'Lỗi khi đếm thông báo chưa đọc' }, 500)
    }

    return c.json({ data: { count: count ?? 0 }, error: null })
  } catch (err) {
    console.error('Unread count error:', err)
    return c.json({ data: null, error: 'Lỗi hệ thống' }, 500)
  }
})

notifications.patch('/read-all', async (c) => {
  const auth = c.get('auth')

  try {
    try {
      await query(
        `UPDATE notifications SET is_read = true
         WHERE employee_id = $1 AND is_read = false AND deleted_at IS NULL`,
        [auth.employeeId]
      )
    } catch (error) {
      console.error('Mark all read error:', error)
      return c.json({ data: null, error: 'Lỗi khi đánh dấu đã đọc' }, 500)
    }

    return c.json({ data: null, error: null, message: 'Đã đánh dấu tất cả đã đọc' })
  } catch (err) {
    console.error('Mark all read error:', err)
    return c.json({ data: null, error: 'Lỗi hệ thống' }, 500)
  }
})

notifications.patch('/:id/read', async (c) => {
  const auth = c.get('auth')
  const id = parseInt(c.req.param('id'))

  if (isNaN(id)) {
    return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
  }

  try {
    let data: NotificationRow | null
    try {
      data = await queryOne<NotificationRow>(
        `UPDATE notifications SET is_read = true
         WHERE id = $1 AND employee_id = $2 AND deleted_at IS NULL
         RETURNING *`,
        [id, auth.employeeId]
      )
    } catch (error) {
      console.error('Mark read error:', error)
      return c.json({ data: null, error: 'Lỗi khi đánh dấu đã đọc' }, 500)
    }

    if (!data) {
      return c.json({ data: null, error: 'Không tìm thấy thông báo' }, 404)
    }

    return c.json({ data: data as NotificationRow, error: null })
  } catch (err) {
    console.error('Mark read error:', err)
    return c.json({ data: null, error: 'Lỗi hệ thống' }, 500)
  }
})

notifications.delete('/:id', async (c) => {
  const auth = c.get('auth')
  const id = parseInt(c.req.param('id'))

  if (isNaN(id)) {
    return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
  }

  try {
    let deleted: { id: number } | null
    try {
      deleted = await queryOne<{ id: number }>(
        `UPDATE notifications SET deleted_at = $1
         WHERE id = $2 AND employee_id = $3 AND deleted_at IS NULL
         RETURNING id`,
        [new Date().toISOString(), id, auth.employeeId]
      )
    } catch (error) {
      console.error('Delete notification error:', error)
      return c.json({ data: null, error: 'Lỗi khi xóa thông báo' }, 500)
    }

    if (!deleted) {
      return c.json({ data: null, error: 'Không tìm thấy thông báo' }, 404)
    }

    return c.json({ data: { id }, error: null, message: 'Đã xóa thông báo' })
  } catch (err) {
    console.error('Delete notification error:', err)
    return c.json({ data: null, error: 'Lỗi hệ thống' }, 500)
  }
})

export default notifications
