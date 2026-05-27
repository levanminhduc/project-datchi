import { supabaseAdmin } from '../db/supabase'
import { createNotification, getLeaderEmployeeIds } from './notificationService'
import { dispatchExternalNotification } from './external-notification-dispatcher'
import {
  editMessageReplyMarkup,
  editMessageText,
  sendMessage,
  sendMessageWithResult,
  type TelegramInlineKeyboardButton,
} from './telegram-service'

export const ORDER_APPROVAL_REQUESTED_EVENT = 'ORDER_APPROVAL_REQUESTED'

const APPROVAL_CALLBACK_PREFIX = 'woa:approve:'
const APPROVAL_REQUEST_TTL_DAYS = 7
const DEFAULT_TELEGRAM_MESSAGE_LIMIT = 3600
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type ApprovalRequestStatus = 'PENDING' | 'APPROVED' | 'EXPIRED' | 'SUPERSEDED' | 'FAILED'

interface ThreadOrderWeekForApproval {
  id: number
  week_name: string | null
  start_date: string | null
  end_date?: string | null
  created_by: string | null
  leader_signed_at?: string | null
}

interface SignedWeeklyOrderRow extends ThreadOrderWeekForApproval {
  status: string
  created_by: string | null
  leader_signed_by: number | null
  leader_signed_at: string | null
  [key: string]: unknown
}

interface RolePermissionRow {
  roles?: {
    code?: string
    role_permissions?: Array<{
      permissions?: { code?: string }
    }>
  }
}

export interface WeeklyOrderApprovalSummaryRow {
  supplier_name?: string | null
  tex_number?: string | number | null
  thread_color?: string | null
  sl_can_dat?: number | null
  total_final?: number | null
}

interface DispatchOrderApprovalRequestsParams {
  week: ThreadOrderWeekForApproval
  summaries: WeeklyOrderApprovalSummaryRow[]
  itemCount?: number
  totalProductQuantity?: number
}

interface NotificationChannelRow {
  id: number
  employee_id: number
  channel_config: {
    chat_id?: string | number
    telegram_user_id?: string | number
    name?: string
  }
  employees?: {
    id: number
    employee_id: string
    full_name: string
    department: string | null
    chuc_vu: string | null
  }
}

interface TelegramApprovalRequestRow {
  id: string
  week_id: number
  employee_id: number
  telegram_chat_id: string
  telegram_message_id: number | null
  status: ApprovalRequestStatus
  expires_at: string
}

export class WeeklyOrderSignError extends Error {
  constructor(
    public code: 'not_found' | 'invalid_status' | 'already_signed' | 'update_failed' | 'unauthorized',
    message: string,
    public status = 400,
  ) {
    super(message)
    this.name = 'WeeklyOrderSignError'
  }
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatVietnameseDate(value?: string | null): string {
  if (!value) return '—'
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
  } catch {
    return value
  }
}

function formatVietnameseDateTime(value?: string | null): string {
  if (!value) return '—'
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
  } catch {
    return value
  }
}

function normalizePositiveInteger(value: unknown): string | null {
  const text = String(value ?? '').trim()
  return /^[1-9]\d*$/.test(text) ? text : null
}

function getAppUrl(): string {
  return process.env.VITE_APP_URL || process.env.FRONTEND_URL || 'https://datchi.ithoathodb.xyz'
}

function getConeQuantity(row: WeeklyOrderApprovalSummaryRow): number {
  const totalFinal = Number(row.total_final ?? 0)
  if (totalFinal > 0) return totalFinal
  return Number(row.sl_can_dat ?? 0)
}

export function buildApprovalCallbackData(requestId: string): string {
  return `${APPROVAL_CALLBACK_PREFIX}${requestId}`
}

export function parseApprovalCallbackData(data: string): string | null {
  if (!data.startsWith(APPROVAL_CALLBACK_PREFIX)) return null
  const requestId = data.slice(APPROVAL_CALLBACK_PREFIX.length)
  return UUID_PATTERN.test(requestId) ? requestId : null
}

function buildApprovalDetailLines(summaries: WeeklyOrderApprovalSummaryRow[]): string[] {
  const orderRows = summaries.filter((row) => getConeQuantity(row) > 0)
  if (orderRows.length === 0) {
    return ['- Chưa có dòng tổng hợp cần đặt.']
  }

  return orderRows.map((row, index) => {
    const supplier = escapeHtml(row.supplier_name || 'Không rõ NCC')
    const tex = escapeHtml(row.tex_number || '—')
    const color = escapeHtml(row.thread_color || 'Không rõ màu')
    const cones = getConeQuantity(row)
    return `${index + 1}. ${supplier} · Tex ${tex} · ${color}: <b>${cones}</b> cuộn`
  })
}

export function buildWeeklyOrderApprovalMessages(
  params: DispatchOrderApprovalRequestsParams,
  maxLength = DEFAULT_TELEGRAM_MESSAGE_LIMIT,
): string[] {
  const weekName = params.week.week_name || `#${params.week.id}`
  const totalNeededCones = params.summaries.reduce((sum, row) => sum + getConeQuantity(row), 0)
  const headerLines = [
    '🧾 <b>YÊU CẦU DUYỆT ĐƠN ĐẶT CHỈ</b>',
    `Đơn: <b>${escapeHtml(weekName)}</b>`,
    `Người tạo: ${escapeHtml(params.week.created_by || '—')}`,
    `Ngày giao: ${escapeHtml(formatVietnameseDate(params.week.start_date))}`,
    `Số dòng hàng: <b>${params.itemCount ?? 0}</b>`,
    `Tổng SL sản phẩm: <b>${params.totalProductQuantity ?? 0}</b>`,
    `Tổng cuộn cần đặt: <b>${totalNeededCones}</b>`,
    `Xem chi tiết: <a href="${getAppUrl()}/thread/weekly-order/${params.week.id}">mở trên web</a>`,
    '',
    '<b>Chi tiết chỉ cần đặt</b>',
  ]

  const detailLines = buildApprovalDetailLines(params.summaries)
  const chunks: string[] = []
  let current = headerLines.join('\n')

  for (const line of detailLines) {
    const next = `${current}\n${line}`
    if (next.length > maxLength && current.length > 0) {
      chunks.push(current)
      current = `<b>Chi tiết chỉ cần đặt (tiếp)</b>\n${line}`
      continue
    }
    current = next
  }

  if (current) chunks.push(current)
  return chunks
}

async function fetchOrderStats(weekId: number): Promise<{ itemCount: number; totalProductQuantity: number }> {
  const { data, error } = await supabaseAdmin
    .from('thread_order_items')
    .select('quantity')
    .eq('week_id', weekId)

  if (error) {
    console.error('[telegram-approval] fetchOrderStats error:', error)
    return { itemCount: 0, totalProductQuantity: 0 }
  }

  return {
    itemCount: data?.length || 0,
    totalProductQuantity: (data || []).reduce((sum, item: { quantity: number }) => sum + Number(item.quantity || 0), 0),
  }
}

export async function employeeHasLeaderSignPermission(employeeId: number): Promise<boolean> {
  const { data: roles, error: rolesError } = await supabaseAdmin
    .from('employee_roles')
    .select('roles!inner(code, role_permissions(permissions(code)))')
    .eq('employee_id', employeeId)

  if (rolesError) {
    console.error('[telegram-approval] employeeHasLeaderSignPermission roles error:', rolesError)
    return false
  }

  const roleRows = (roles || []) as unknown as RolePermissionRow[]
  const hasRootRole = roleRows.some((row) => row.roles?.code === 'root')
  if (hasRootRole) return true

  const roleHasPermission = roleRows.some((row) => {
    return (row.roles?.role_permissions || []).some(
      (rp) => rp.permissions?.code === 'thread.leader.sign',
    )
  })

  const { data: directPerms, error: directError } = await supabaseAdmin
    .from('employee_permissions')
    .select('granted, expires_at, permissions!inner(code)')
    .eq('employee_id', employeeId)
    .eq('permissions.code', 'thread.leader.sign')

  if (directError) {
    console.error('[telegram-approval] employeeHasLeaderSignPermission direct error:', directError)
    return roleHasPermission
  }

  const now = new Date().toISOString()
  for (const row of (directPerms || []) as Array<{ granted: boolean; expires_at: string | null }>) {
    if (row.expires_at && row.expires_at < now) continue
    if (!row.granted) return false
    return true
  }

  return roleHasPermission
}

export async function getLeaderCandidates(): Promise<Array<{
  id: number
  employee_id: string
  full_name: string
  department: string | null
  chuc_vu: string | null
}>> {
  const leaderIds = await getLeaderEmployeeIds()
  if (leaderIds.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from('employees')
    .select('id, employee_id, full_name, department, chuc_vu')
    .in('id', leaderIds)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('employee_id', { ascending: true })

  if (error) {
    console.error('[telegram-approval] getLeaderCandidates error:', error)
    return []
  }

  return data || []
}

async function fetchApprovalChannels(): Promise<NotificationChannelRow[]> {
  const { data, error } = await supabaseAdmin
    .from('notification_channels')
    .select(`
      id,
      employee_id,
      channel_config,
      employees!inner(id, employee_id, full_name, department, chuc_vu, is_active, deleted_at)
    `)
    .eq('channel_type', 'TELEGRAM')
    .eq('is_active', true)
    .is('deleted_at', null)
    .eq('employees.is_active', true)
    .is('employees.deleted_at', null)
    .contains('event_types', [ORDER_APPROVAL_REQUESTED_EVENT])
    .limit(50)

  if (error) {
    console.error('[telegram-approval] fetchApprovalChannels error:', error)
    return []
  }

  return (data || []) as unknown as NotificationChannelRow[]
}

async function createOrReuseApprovalRequest(
  weekId: number,
  employeeId: number,
  chatId: string,
): Promise<{ request: TelegramApprovalRequestRow | null; shouldSend: boolean }> {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('telegram_approval_requests')
    .select('id, week_id, employee_id, telegram_chat_id, telegram_message_id, status, expires_at')
    .eq('week_id', weekId)
    .eq('employee_id', employeeId)
    .eq('status', 'PENDING')
    .maybeSingle()

  if (existingError) {
    console.error('[telegram-approval] fetch pending request error:', existingError)
  }

  if (existing) {
    const expired = new Date(existing.expires_at).getTime() <= Date.now()
    if (!expired) {
      return {
        request: existing as TelegramApprovalRequestRow,
        shouldSend: !existing.telegram_message_id,
      }
    }

    await supabaseAdmin
      .from('telegram_approval_requests')
      .update({ status: 'EXPIRED', handled_at: new Date().toISOString() })
      .eq('id', existing.id)
  }

  const expiresAt = new Date(Date.now() + APPROVAL_REQUEST_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabaseAdmin
    .from('telegram_approval_requests')
    .insert({
      week_id: weekId,
      employee_id: employeeId,
      telegram_chat_id: chatId,
      status: 'PENDING',
      expires_at: expiresAt,
    })
    .select('id, week_id, employee_id, telegram_chat_id, telegram_message_id, status, expires_at')
    .single()

  if (error) {
    if (error.code === '23505') {
      const retry = await supabaseAdmin
        .from('telegram_approval_requests')
        .select('id, week_id, employee_id, telegram_chat_id, telegram_message_id, status, expires_at')
        .eq('week_id', weekId)
        .eq('employee_id', employeeId)
        .eq('status', 'PENDING')
        .maybeSingle()
      return { request: (retry.data as TelegramApprovalRequestRow | null) || null, shouldSend: false }
    }
    console.error('[telegram-approval] insert request error:', error)
    return { request: null, shouldSend: false }
  }

  return { request: data as TelegramApprovalRequestRow, shouldSend: true }
}

export async function dispatchOrderApprovalRequests(params: DispatchOrderApprovalRequestsParams): Promise<void> {
  if (params.week.leader_signed_at) return

  const channels = await fetchApprovalChannels()
  if (channels.length === 0) return

  const stats = params.itemCount === undefined || params.totalProductQuantity === undefined
    ? await fetchOrderStats(params.week.id)
    : { itemCount: params.itemCount, totalProductQuantity: params.totalProductQuantity }

  for (const channel of channels) {
    const chatId = normalizePositiveInteger(channel.channel_config?.chat_id)
    const telegramUserId = normalizePositiveInteger(channel.channel_config?.telegram_user_id)
    if (!chatId || !telegramUserId) {
      console.warn(`[telegram-approval] channel ${channel.id} missing valid chat_id/telegram_user_id`)
      continue
    }

    const canSign = await employeeHasLeaderSignPermission(channel.employee_id)
    if (!canSign) {
      console.warn(`[telegram-approval] employee ${channel.employee_id} no longer has thread.leader.sign`)
      continue
    }

    const { request, shouldSend } = await createOrReuseApprovalRequest(params.week.id, channel.employee_id, chatId)
    if (!request || !shouldSend) continue

    const messages = buildWeeklyOrderApprovalMessages({
      ...params,
      itemCount: stats.itemCount,
      totalProductQuantity: stats.totalProductQuantity,
    })

    const keyboard: TelegramInlineKeyboardButton[][] = [[
      { text: '✅ Duyệt đơn', callback_data: buildApprovalCallbackData(request.id) },
      { text: '🔗 Xem web', url: `${getAppUrl()}/thread/weekly-order/${params.week.id}` },
    ]]

    const firstResult = await sendMessageWithResult(chatId, messages[0], {
      reply_markup: { inline_keyboard: keyboard },
    })

    if (!firstResult.success) {
      console.error(`[telegram-approval] send approval failed request=${request.id}:`, firstResult.error)
      await supabaseAdmin
        .from('telegram_approval_requests')
        .update({ status: 'FAILED', handled_at: new Date().toISOString() })
        .eq('id', request.id)
      continue
    }

    await supabaseAdmin
      .from('telegram_approval_requests')
      .update({ telegram_message_id: firstResult.messageId || null })
      .eq('id', request.id)

    for (const extraMessage of messages.slice(1)) {
      sendMessage(chatId, extraMessage).catch((err) => {
        console.error(`[telegram-approval] send extra detail failed request=${request.id}:`, err)
      })
    }
  }
}

async function markApprovalRequestsAfterSign(
  weekId: number,
  signerEmployeeId: number,
  approvedRequestId?: string,
): Promise<void> {
  const now = new Date().toISOString()

  if (approvedRequestId) {
    await supabaseAdmin
      .from('telegram_approval_requests')
      .update({ status: 'APPROVED', handled_at: now, handled_by: signerEmployeeId })
      .eq('id', approvedRequestId)
  }

  let query = supabaseAdmin
    .from('telegram_approval_requests')
    .update({ status: 'SUPERSEDED', handled_at: now, handled_by: signerEmployeeId })
    .eq('week_id', weekId)
    .eq('status', 'PENDING')

  if (approvedRequestId) {
    query = query.neq('id', approvedRequestId)
  }

  await query
}

async function fetchLeaderName(employeeId: number): Promise<string> {
  const { data } = await supabaseAdmin
    .from('employees')
    .select('full_name')
    .eq('id', employeeId)
    .maybeSingle()

  return data?.full_name || `#${employeeId}`
}

export async function signWeeklyOrder(params: {
  weekId: number
  employeeId: number
  approvedRequestId?: string
}): Promise<{ week: SignedWeeklyOrderRow; leaderName: string; weekName: string }> {
  const canSign = await employeeHasLeaderSignPermission(params.employeeId)
  if (!canSign) {
    throw new WeeklyOrderSignError('unauthorized', 'Bạn không có quyền ký duyệt đơn đặt chỉ', 403)
  }

  const signedAt = new Date().toISOString()
  const { data: updated, error: updateError } = await supabaseAdmin
    .from('thread_order_weeks')
    .update({
      leader_signed_by: params.employeeId,
      leader_signed_at: signedAt,
    })
    .eq('id', params.weekId)
    .eq('status', 'CONFIRMED')
    .is('leader_signed_by', null)
    .select()
    .single()

  if (updateError) {
    if (updateError.code !== 'PGRST116') {
      throw updateError
    }

    const { data: current } = await supabaseAdmin
      .from('thread_order_weeks')
      .select('id, status, leader_signed_by')
      .eq('id', params.weekId)
      .maybeSingle()

    if (!current) {
      throw new WeeklyOrderSignError('not_found', 'Không tìm thấy tuần đặt hàng', 404)
    }
    if (current.status !== 'CONFIRMED') {
      throw new WeeklyOrderSignError('invalid_status', 'Chỉ có thể ký duyệt đơn đã xác nhận', 400)
    }
    if (current.leader_signed_by) {
      throw new WeeklyOrderSignError('already_signed', 'Đơn hàng đã được ký duyệt', 409)
    }
    throw new WeeklyOrderSignError('update_failed', 'Ký duyệt thất bại', 500)
  }

  const leaderName = await fetchLeaderName(params.employeeId)
  const weekName = updated.week_name || `#${params.weekId}`

  if (updated.created_by) {
    const { data: creator } = await supabaseAdmin
      .from('employees')
      .select('id, full_name')
      .eq('full_name', updated.created_by)
      .limit(1)
      .maybeSingle()

    if (creator?.id) {
      await createNotification({
        employeeId: creator.id,
        type: 'ORDER_APPROVED',
        title: `Đơn hàng "${weekName}" đã được ký duyệt`,
        body: `Lãnh đạo ${leaderName} đã ký duyệt đơn của bạn`,
        actionUrl: `/thread/weekly-order/${params.weekId}`,
        metadata: {
          week_id: params.weekId,
          week_name: weekName,
          leader_signed_by_id: params.employeeId,
          leader_signed_by_name: leaderName,
          leader_signed_at: updated.leader_signed_at,
        },
      })
    } else {
      console.warn(`[leader-sign] Cannot map creator "${updated.created_by}" to employee_id — in-app notification skipped`)
    }
  }

  try {
    dispatchExternalNotification('ORDER_APPROVED', {
      weekId: params.weekId,
      weekLabel: weekName,
      creatorName: updated.created_by || '',
      leaderName,
      signedAt: updated.leader_signed_at || signedAt,
    })
  } catch (err) {
    console.error('[leader-sign] external dispatch failed:', err)
  }

  await markApprovalRequestsAfterSign(params.weekId, params.employeeId, params.approvedRequestId)

  return { week: updated, leaderName, weekName }
}

async function getMatchingApprovalChannel(employeeId: number, telegramUserId: string): Promise<NotificationChannelRow | null> {
  const { data, error } = await supabaseAdmin
    .from('notification_channels')
    .select('id, employee_id, channel_config')
    .eq('employee_id', employeeId)
    .eq('channel_type', 'TELEGRAM')
    .eq('is_active', true)
    .is('deleted_at', null)
    .contains('event_types', [ORDER_APPROVAL_REQUESTED_EVENT])

  if (error) {
    console.error('[telegram-approval] getMatchingApprovalChannel error:', error)
    return null
  }

  return ((data || []) as NotificationChannelRow[]).find((channel) => (
    normalizePositiveInteger(channel.channel_config?.telegram_user_id) === telegramUserId
  )) || null
}

function buildTelegramApprovedText(weekName: string, leaderName: string, signedAt: string): string {
  return [
    '✅ <b>Đã duyệt đơn đặt chỉ</b>',
    `Đơn: <b>${escapeHtml(weekName)}</b>`,
    `Lãnh đạo: ${escapeHtml(leaderName)}`,
    `Thời gian: ${escapeHtml(formatVietnameseDateTime(signedAt))}`,
  ].join('\n')
}

export async function approveWeeklyOrderFromTelegram(params: {
  requestId: string
  telegramUserId: string
}): Promise<{
  ok: boolean
  userMessage: string
  alert?: boolean
  editText?: string
  chatId?: string
  messageId?: number
  clearButtons?: boolean
}> {
  const { data: request, error } = await supabaseAdmin
    .from('telegram_approval_requests')
    .select('id, week_id, employee_id, telegram_chat_id, telegram_message_id, status, expires_at')
    .eq('id', params.requestId)
    .maybeSingle()

  if (error) {
    console.error('[telegram-approval] approve fetch request error:', error)
    return { ok: false, userMessage: 'Không thể kiểm tra yêu cầu duyệt', alert: true }
  }

  if (!request) {
    return { ok: false, userMessage: 'Yêu cầu duyệt không tồn tại hoặc đã bị xóa', alert: true }
  }

  const row = request as TelegramApprovalRequestRow
  const messageTarget = {
    chatId: row.telegram_chat_id,
    messageId: row.telegram_message_id || undefined,
  }

  if (row.status !== 'PENDING') {
    return {
      ok: false,
      userMessage: row.status === 'APPROVED' ? 'Đơn đã được duyệt từ yêu cầu này' : 'Yêu cầu duyệt không còn hiệu lực',
      clearButtons: true,
      ...messageTarget,
    }
  }

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await supabaseAdmin
      .from('telegram_approval_requests')
      .update({ status: 'EXPIRED', handled_at: new Date().toISOString() })
      .eq('id', row.id)
    return { ok: false, userMessage: 'Yêu cầu duyệt đã hết hạn', alert: true, clearButtons: true, ...messageTarget }
  }

  const channel = await getMatchingApprovalChannel(row.employee_id, params.telegramUserId)
  if (!channel) {
    return { ok: false, userMessage: 'Telegram này không khớp với lãnh đạo được cấu hình', alert: true, ...messageTarget }
  }

  const { data: employee } = await supabaseAdmin
    .from('employees')
    .select('id, is_active, deleted_at')
    .eq('id', row.employee_id)
    .maybeSingle()

  if (!employee || !employee.is_active || employee.deleted_at) {
    return { ok: false, userMessage: 'Tài khoản lãnh đạo không còn hoạt động', alert: true, ...messageTarget }
  }

  const canSign = await employeeHasLeaderSignPermission(row.employee_id)
  if (!canSign) {
    return { ok: false, userMessage: 'Bạn không còn quyền ký duyệt đơn đặt chỉ', alert: true, ...messageTarget }
  }

  try {
    const result = await signWeeklyOrder({
      weekId: row.week_id,
      employeeId: row.employee_id,
      approvedRequestId: row.id,
    })

    return {
      ok: true,
      userMessage: 'Đã ký duyệt đơn đặt chỉ',
      clearButtons: true,
      editText: buildTelegramApprovedText(
        result.weekName,
        result.leaderName,
        result.week.leader_signed_at || new Date().toISOString(),
      ),
      ...messageTarget,
    }
  } catch (err) {
    if (err instanceof WeeklyOrderSignError) {
      if (err.code === 'already_signed') {
        await supabaseAdmin
          .from('telegram_approval_requests')
          .update({ status: 'SUPERSEDED', handled_at: new Date().toISOString() })
          .eq('id', row.id)
      }
      return {
        ok: false,
        userMessage: err.message,
        alert: err.code !== 'already_signed',
        clearButtons: err.code === 'already_signed',
        ...messageTarget,
      }
    }

    console.error('[telegram-approval] approve sign error:', err)
    return { ok: false, userMessage: 'Ký duyệt thất bại, vui lòng thử lại', alert: true, ...messageTarget }
  }
}

export async function clearTelegramApprovalButtons(chatId: string, messageId?: number, editText?: string): Promise<void> {
  if (!messageId) return

  if (editText) {
    await editMessageText(chatId, messageId, editText).catch(() => {})
    return
  }

  await editMessageReplyMarkup(chatId, messageId, null).catch(() => {})
}
