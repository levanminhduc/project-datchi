import { Hono } from 'hono'
import { supabaseAdmin } from '../db/supabase'
import { requirePermission } from '../middleware/auth'
import { sendMessage, isTelegramEnabled } from '../utils/telegram-service'
import {
  employeeHasLeaderSignPermission,
  getLeaderCandidates,
  ORDER_APPROVAL_REQUESTED_EVENT,
} from '../utils/weekly-order-approval-service'
import {
  AssignTelegramIdentitySchema,
  CreateChannelSchema,
  CreateGroupChannelSchema,
  UpdateChannelSchema,
  TestMessageSchema,
} from '../validation/notification-channel'

const notificationChannels = new Hono()

const DEFAULT_REGULAR_EVENTS = ['ORDER_CONFIRMED'] as const

interface TelegramIdentityRow {
  id: number
  telegram_user_id: string
  chat_id: string
  username: string | null
  first_name: string | null
  last_name: string | null
  last_seen_at: string
  last_command: string
  assigned_employee_id: number | null
  assigned_channel_id: number | null
  assigned_at: string | null
  created_at: string
}

async function validateActiveEmployee(employeeId: number): Promise<string | null> {
  const { data: employee, error } = await supabaseAdmin
    .from('employees')
    .select('id, is_active, deleted_at')
    .eq('id', employeeId)
    .maybeSingle()

  if (error || !employee || employee.deleted_at || !employee.is_active) {
    return 'Nhân viên không tồn tại hoặc đã bị vô hiệu hóa'
  }

  return null
}

async function validateApprovalChannelEmployee(employeeId: number): Promise<string | null> {
  const { data: employee, error } = await supabaseAdmin
    .from('employees')
    .select('id, is_active, deleted_at')
    .eq('id', employeeId)
    .maybeSingle()

  if (error || !employee || employee.deleted_at || !employee.is_active) {
    return 'Nhân viên lãnh đạo không tồn tại hoặc đã bị vô hiệu hóa'
  }

  const canSign = await employeeHasLeaderSignPermission(employeeId)
  if (!canSign) {
    return 'Nhân viên được chọn chưa có quyền Lãnh Đạo Ký Duyệt'
  }

  return null
}

async function findExistingTelegramChannel(employeeId: number, isApproval: boolean) {
  const { data, error } = await supabaseAdmin
    .from('notification_channels')
    .select('id, event_types')
    .eq('employee_id', employeeId)
    .eq('channel_type', 'TELEGRAM')
    .is('deleted_at', null)

  if (error) throw error

  return (data || []).find((channel: { id: number; event_types: string[] }) => {
    const hasApproval = channel.event_types.includes(ORDER_APPROVAL_REQUESTED_EVENT)
    return isApproval ? hasApproval : !hasApproval
  }) || null
}

async function listTelegramIdentities(status: string) {
  let query = supabaseAdmin
    .from('telegram_identities')
    .select('*')
    .order('last_seen_at', { ascending: false })
    .limit(100)

  if (status === 'assigned') {
    query = query.not('assigned_channel_id', 'is', null)
  } else if (status !== 'all') {
    query = query.is('assigned_channel_id', null)
  }

  const { data, error } = await query
  if (error) throw error

  const identities = (data || []) as TelegramIdentityRow[]
  const employeeIds = [...new Set(identities.map(row => row.assigned_employee_id).filter((id): id is number => id !== null))]
  const channelIds = [...new Set(identities.map(row => row.assigned_channel_id).filter((id): id is number => id !== null))]

  const [employeesResult, channelsResult] = await Promise.all([
    employeeIds.length > 0
      ? supabaseAdmin
        .from('employees')
        .select('id, employee_id, full_name')
        .in('id', employeeIds)
      : Promise.resolve({ data: [], error: null }),
    channelIds.length > 0
      ? supabaseAdmin
        .from('notification_channels')
        .select('id, event_types, is_active')
        .in('id', channelIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (employeesResult.error) throw employeesResult.error
  if (channelsResult.error) throw channelsResult.error

  const employees = new Map((employeesResult.data || []).map(employee => [employee.id, employee]))
  const channels = new Map((channelsResult.data || []).map(channel => [channel.id, channel]))

  return identities.map(row => ({
    ...row,
    assigned_employee: row.assigned_employee_id ? employees.get(row.assigned_employee_id) || null : null,
    assigned_channel: row.assigned_channel_id ? channels.get(row.assigned_channel_id) || null : null,
  }))
}

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

notificationChannels.get('/leader-candidates', requirePermission('settings.manage'), async (c) => {
  try {
    const data = await getLeaderCandidates()
    return c.json({ data, error: null })
  } catch (err) {
    console.error('List leader candidates error:', err)
    return c.json({ data: null, error: 'Lỗi khi tải danh sách lãnh đạo' }, 500)
  }
})

notificationChannels.get('/telegram-identities', requirePermission('settings.manage'), async (c) => {
  try {
    const status = c.req.query('status') || 'unassigned'
    if (!['unassigned', 'assigned', 'all'].includes(status)) {
      return c.json({ data: null, error: 'Trạng thái không hợp lệ' }, 400)
    }

    const data = await listTelegramIdentities(status)
    return c.json({ data, error: null })
  } catch (err) {
    console.error('List telegram identities error:', err)
    return c.json({ data: null, error: 'Lỗi khi tải danh sách Telegram ID' }, 500)
  }
})

notificationChannels.post('/telegram-identities/:id/assign', requirePermission('settings.manage'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) return c.json({ data: null, error: 'ID không hợp lệ' }, 400)

    const body = await c.req.json()
    const parsed = AssignTelegramIdentitySchema.safeParse(body)
    if (!parsed.success) {
      return c.json({ data: null, error: parsed.error.issues.map((e: { message: string }) => e.message).join(', ') }, 400)
    }

    const { data: identity, error: identityError } = await supabaseAdmin
      .from('telegram_identities')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (identityError) throw identityError
    if (!identity) return c.json({ data: null, error: 'Không tìm thấy Telegram ID' }, 404)

    const isApproval = parsed.data.mode === 'APPROVAL'
    const validationError = isApproval
      ? await validateApprovalChannelEmployee(parsed.data.employee_id)
      : await validateActiveEmployee(parsed.data.employee_id)

    if (validationError) {
      return c.json({ data: null, error: validationError }, 400)
    }

    const eventTypes = isApproval
      ? [ORDER_APPROVAL_REQUESTED_EVENT]
      : parsed.data.event_types && parsed.data.event_types.length > 0
        ? parsed.data.event_types.filter(event => event !== ORDER_APPROVAL_REQUESTED_EVENT)
        : [...DEFAULT_REGULAR_EVENTS]

    if (eventTypes.length === 0) {
      return c.json({ data: null, error: 'Phải chọn ít nhất 1 loại sự kiện' }, 400)
    }

    const channelConfig = {
      chat_id: identity.chat_id,
      telegram_user_id: identity.telegram_user_id,
      name: identity.username || identity.first_name || undefined,
    }

    const existingChannel = await findExistingTelegramChannel(parsed.data.employee_id, isApproval)
    let channel
    if (existingChannel) {
      const { data, error } = await supabaseAdmin
        .from('notification_channels')
        .update({
          channel_config: channelConfig,
          event_types: eventTypes,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingChannel.id)
        .select()
        .single()

      if (error) throw error
      channel = data
    } else {
      const { data, error } = await supabaseAdmin
        .from('notification_channels')
        .insert({
          employee_id: parsed.data.employee_id,
          channel_type: 'TELEGRAM',
          channel_config: channelConfig,
          event_types: eventTypes,
        })
        .select()
        .single()

      if (error) throw error
      channel = data
    }

    const { error: updateIdentityError } = await supabaseAdmin
      .from('telegram_identities')
      .update({
        assigned_employee_id: parsed.data.employee_id,
        assigned_channel_id: channel.id,
        assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateIdentityError) throw updateIdentityError

    return c.json({ data: channel, error: null, message: 'Đã gán Telegram ID' })
  } catch (err) {
    console.error('Assign telegram identity error:', err)
    return c.json({ data: null, error: 'Lỗi khi gán Telegram ID' }, 500)
  }
})

notificationChannels.post('/', requirePermission('settings.manage'), async (c) => {
  try {
    const body = await c.req.json()
    const parsed = CreateChannelSchema.safeParse(body)
    if (!parsed.success) {
      return c.json({ data: null, error: parsed.error.issues.map((e: { message: string }) => e.message).join(', ') }, 400)
    }

    if (parsed.data.event_types.includes(ORDER_APPROVAL_REQUESTED_EVENT)) {
      const validationError = await validateApprovalChannelEmployee(parsed.data.employee_id)
      if (validationError) {
        return c.json({ data: null, error: validationError }, 400)
      }
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
      return c.json({ data: null, error: parsed.error.issues.map((e: { message: string }) => e.message).join(', ') }, 400)
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
      return c.json({ data: null, error: parsed.error.issues.map((e: { message: string }) => e.message).join(', ') }, 400)
    }

    const { data: current, error: currentError } = await supabaseAdmin
      .from('notification_channels')
      .select('employee_id, channel_config')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle()

    if (currentError) throw currentError
    if (!current) return c.json({ data: null, error: 'Không tìm thấy' }, 404)

    if (parsed.data.event_types?.includes(ORDER_APPROVAL_REQUESTED_EVENT)) {
      const mergedConfig = (parsed.data.channel_config || current.channel_config) as { chat_id?: string; telegram_user_id?: string }
      if (!mergedConfig.chat_id || !/^[1-9]\d*$/.test(mergedConfig.chat_id)) {
        return c.json({ data: null, error: 'Telegram Chat ID của lãnh đạo phải là số dương' }, 400)
      }
      if (!mergedConfig.telegram_user_id) {
        return c.json({ data: null, error: 'Cần nhập Telegram User ID cho lãnh đạo duyệt đơn' }, 400)
      }
      if (!/^[1-9]\d*$/.test(mergedConfig.telegram_user_id)) {
        return c.json({ data: null, error: 'Telegram User ID phải là số dương' }, 400)
      }
      const validationError = await validateApprovalChannelEmployee(current.employee_id)
      if (validationError) {
        return c.json({ data: null, error: validationError }, 400)
      }
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
      return c.json({ data: null, error: parsed.error.issues.map((e: { message: string }) => e.message).join(', ') }, 400)
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
