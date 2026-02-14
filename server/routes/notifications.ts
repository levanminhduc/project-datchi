import { Hono } from 'hono'
import { supabaseAdmin } from '../db/supabase'
import { authMiddleware, type AuthContext } from '../middleware/auth'
import { notificationQuerySchema, type NotificationRow } from '../types/notification'

const notifications = new Hono()

notifications.use('*', authMiddleware)

notifications.get('/', async (c) => {
  const auth = c.get('auth') as AuthContext

  const parsed = notificationQuerySchema.safeParse({
    limit: c.req.query('limit'),
    offset: c.req.query('offset'),
    type: c.req.query('type'),
    is_read: c.req.query('is_read'),
  })

  if (!parsed.success) {
    return c.json({
      data: null,
      error: parsed.error.errors.map(e => e.message).join(', '),
    }, 400)
  }

  const { limit, offset, type, is_read } = parsed.data

  try {
    let query = supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('employee_id', auth.employeeId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (type) {
      query = query.eq('type', type)
    }
    if (is_read !== undefined) {
      query = query.eq('is_read', is_read)
    }

    const { data, error } = await query

    if (error) {
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
  const auth = c.get('auth') as AuthContext

  try {
    const { count, error } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('employee_id', auth.employeeId)
      .eq('is_read', false)
      .is('deleted_at', null)

    if (error) {
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
  const auth = c.get('auth') as AuthContext

  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('employee_id', auth.employeeId)
      .eq('is_read', false)
      .is('deleted_at', null)

    if (error) {
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
  const auth = c.get('auth') as AuthContext
  const id = parseInt(c.req.param('id'))

  if (isNaN(id)) {
    return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('employee_id', auth.employeeId)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ data: null, error: 'Không tìm thấy thông báo' }, 404)
      }
      console.error('Mark read error:', error)
      return c.json({ data: null, error: 'Lỗi khi đánh dấu đã đọc' }, 500)
    }

    return c.json({ data: data as NotificationRow, error: null })
  } catch (err) {
    console.error('Mark read error:', err)
    return c.json({ data: null, error: 'Lỗi hệ thống' }, 500)
  }
})

notifications.delete('/:id', async (c) => {
  const auth = c.get('auth') as AuthContext
  const id = parseInt(c.req.param('id'))

  if (isNaN(id)) {
    return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('employee_id', auth.employeeId)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ data: null, error: 'Không tìm thấy thông báo' }, 404)
      }
      console.error('Delete notification error:', error)
      return c.json({ data: null, error: 'Lỗi khi xóa thông báo' }, 500)
    }

    return c.json({ data: { id }, error: null, message: 'Đã xóa thông báo' })
  } catch (err) {
    console.error('Delete notification error:', err)
    return c.json({ data: null, error: 'Lỗi hệ thống' }, 500)
  }
})

export default notifications
