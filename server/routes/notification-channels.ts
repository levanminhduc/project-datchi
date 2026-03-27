import { Hono } from 'hono'
import { supabaseAdmin } from '../db/supabase'
import { requirePermission } from '../middleware/auth'
import { sendMessage, isTelegramEnabled } from '../utils/telegram-service'
import {
  CreateChannelSchema,
  CreateGroupChannelSchema,
  UpdateChannelSchema,
  TestMessageSchema,
} from '../validation/notification-channel'

const notificationChannels = new Hono()

notificationChannels.get('/', requirePermission('settings.manage'), async (c) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('notification_channels')
      .select('*, employees!inner(id, full_name, employee_id)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) throw error
    return c.json({ data, error: null })
  } catch (err) {
    console.error('List notification channels error:', err)
    return c.json({ data: null, error: 'Lỗi khi tải danh sách kênh thông báo' }, 500)
  }
})

notificationChannels.get('/groups', requirePermission('settings.manage'), async (c) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('notification_channel_groups')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return c.json({ data, error: null })
  } catch (err) {
    console.error('List notification channel groups error:', err)
    return c.json({ data: null, error: 'Lỗi khi tải danh sách nhóm' }, 500)
  }
})

notificationChannels.post('/', requirePermission('settings.manage'), async (c) => {
  try {
    const body = await c.req.json()
    const parsed = CreateChannelSchema.safeParse(body)
    if (!parsed.success) {
      return c.json({ data: null, error: parsed.error.errors.map(e => e.message).join(', ') }, 400)
    }

    const { data, error } = await supabaseAdmin
      .from('notification_channels')
      .insert({
        employee_id: parsed.data.employee_id,
        channel_type: parsed.data.channel_type,
        channel_config: parsed.data.channel_config,
        event_types: parsed.data.event_types,
      })
      .select()
      .single()

    if (error) throw error
    return c.json({ data, error: null, message: 'Đã thêm kênh thông báo' })
  } catch (err) {
    console.error('Create notification channel error:', err)
    return c.json({ data: null, error: 'Lỗi khi tạo kênh thông báo' }, 500)
  }
})

notificationChannels.post('/groups', requirePermission('settings.manage'), async (c) => {
  try {
    const body = await c.req.json()
    const parsed = CreateGroupChannelSchema.safeParse(body)
    if (!parsed.success) {
      return c.json({ data: null, error: parsed.error.errors.map(e => e.message).join(', ') }, 400)
    }

    const { data, error } = await supabaseAdmin
      .from('notification_channel_groups')
      .insert({
        channel_type: parsed.data.channel_type,
        channel_config: parsed.data.channel_config,
        event_types: parsed.data.event_types,
      })
      .select()
      .single()

    if (error) throw error
    return c.json({ data, error: null, message: 'Đã thêm nhóm thông báo' })
  } catch (err) {
    console.error('Create notification channel group error:', err)
    return c.json({ data: null, error: 'Lỗi khi tạo nhóm thông báo' }, 500)
  }
})

notificationChannels.patch('/:id/toggle', requirePermission('settings.manage'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) return c.json({ data: null, error: 'ID không hợp lệ' }, 400)

    const isGroup = c.req.query('group') === 'true'
    const table = isGroup ? 'notification_channel_groups' : 'notification_channels'

    const { data: current, error: fetchError } = await supabaseAdmin
      .from(table)
      .select('is_active')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !current) {
      return c.json({ data: null, error: 'Không tìm thấy' }, 404)
    }

    const { data, error } = await supabaseAdmin
      .from(table)
      .update({ is_active: !current.is_active, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return c.json({ data, error: null, message: data.is_active ? 'Đã bật' : 'Đã tắt' })
  } catch (err) {
    console.error('Toggle notification channel error:', err)
    return c.json({ data: null, error: 'Lỗi khi thay đổi trạng thái' }, 500)
  }
})

notificationChannels.patch('/:id', requirePermission('settings.manage'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) return c.json({ data: null, error: 'ID không hợp lệ' }, 400)

    const body = await c.req.json()
    const parsed = UpdateChannelSchema.safeParse(body)
    if (!parsed.success) {
      return c.json({ data: null, error: parsed.error.errors.map(e => e.message).join(', ') }, 400)
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (parsed.data.channel_config) updateData.channel_config = parsed.data.channel_config
    if (parsed.data.event_types) updateData.event_types = parsed.data.event_types

    const { data, error } = await supabaseAdmin
      .from('notification_channels')
      .update(updateData)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') return c.json({ data: null, error: 'Không tìm thấy' }, 404)
      throw error
    }
    return c.json({ data, error: null, message: 'Đã cập nhật' })
  } catch (err) {
    console.error('Update notification channel error:', err)
    return c.json({ data: null, error: 'Lỗi khi cập nhật' }, 500)
  }
})

notificationChannels.delete('/:id', requirePermission('settings.manage'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) return c.json({ data: null, error: 'ID không hợp lệ' }, 400)

    const isGroup = c.req.query('group') === 'true'
    const table = isGroup ? 'notification_channel_groups' : 'notification_channels'

    const { error } = await supabaseAdmin
      .from(table)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)

    if (error) throw error
    return c.json({ data: { id }, error: null, message: 'Đã xóa' })
  } catch (err) {
    console.error('Delete notification channel error:', err)
    return c.json({ data: null, error: 'Lỗi khi xóa' }, 500)
  }
})

notificationChannels.post('/test', requirePermission('settings.manage'), async (c) => {
  try {
    if (!isTelegramEnabled()) {
      return c.json({ data: null, error: 'TELEGRAM_BOT_TOKEN chưa được cấu hình trên server' }, 400)
    }

    const body = await c.req.json()
    const parsed = TestMessageSchema.safeParse(body)
    if (!parsed.success) {
      return c.json({ data: null, error: parsed.error.errors.map(e => e.message).join(', ') }, 400)
    }

    const testText = `✅ <b>Test thành công!</b>\nHệ thống Đạt Chí đã kết nối Telegram.\n🕐 ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`

    const success = await sendMessage(parsed.data.chat_id, testText)

    if (!success) {
      return c.json({ data: null, error: 'Gửi thất bại — kiểm tra Chat ID hoặc bot đã được thêm vào group' }, 400)
    }

    return c.json({ data: null, error: null, message: 'Đã gửi tin nhắn test thành công' })
  } catch (err) {
    console.error('Test notification error:', err)
    return c.json({ data: null, error: 'Lỗi khi gửi test' }, 500)
  }
})

export default notificationChannels
