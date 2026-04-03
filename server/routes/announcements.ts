import { Hono } from 'hono'
import { supabaseAdmin } from '../db/supabase'
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
    const { data, error } = await supabaseAdmin
      .from('announcements')
      .select('id, title, content, priority, created_at')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error

    if (!data || data.length === 0) {
      return c.json({ data: [], error: null })
    }

    const announcementIds = data.map((a) => a.id)

    const { data: dismissals, error: dError } = await supabaseAdmin
      .from('announcement_dismissals')
      .select('announcement_id')
      .eq('employee_id', employeeId)
      .in('announcement_id', announcementIds)

    if (dError) throw dError

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
    const { error } = await supabaseAdmin
      .from('announcement_dismissals')
      .upsert(
        { announcement_id: id, employee_id: employeeId },
        { onConflict: 'announcement_id,employee_id' }
      )

    if (error) throw error

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

    const { data, error, count } = await supabaseAdmin
      .from('announcements')
      .select('*, employees!announcements_created_by_fkey(full_name)', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) throw error

    const { count: totalEmployees } = await supabaseAdmin
      .from('employees')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)

    const announcementIds = (data || []).map((a) => a.id)
    let dismissalCounts: Record<number, number> = {}

    if (announcementIds.length > 0) {
      const { data: dismissals } = await supabaseAdmin
        .from('announcement_dismissals')
        .select('announcement_id')
        .in('announcement_id', announcementIds)

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

    const { data, error } = await supabaseAdmin
      .from('announcements')
      .insert({
        title,
        content: sanitizeHtml(content),
        priority,
        created_by: employeeId,
      })
      .select()
      .single()

    if (error) throw error

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

    const { data, error } = await supabaseAdmin
      .from('announcements')
      .update(updates)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) throw error

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
    const { data: current, error: fetchError } = await supabaseAdmin
      .from('announcements')
      .select('is_active')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError) throw fetchError

    const { data, error } = await supabaseAdmin
      .from('announcements')
      .update({ is_active: !current.is_active, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

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
    const { error } = await supabaseAdmin
      .from('announcements')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)

    if (error) throw error

    return c.json({ data: null, error: null, message: 'Đã xoá thông báo' })
  } catch (err) {
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

export default announcements
