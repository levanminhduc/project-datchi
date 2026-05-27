import { supabaseAdmin } from '../db/supabase'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''

if (!BOT_TOKEN) {
  console.warn('[telegram-service] TELEGRAM_BOT_TOKEN not set — Telegram notifications disabled')
}

export function isTelegramEnabled(): boolean {
  return BOT_TOKEN.length > 0
}

export interface TelegramInlineKeyboardButton {
  text: string
  callback_data?: string
  url?: string
}

interface SendMessageOptions {
  reply_markup?: {
    inline_keyboard: TelegramInlineKeyboardButton[][]
  }
}

interface TelegramApiResponse<T> {
  ok: boolean
  result?: T
  description?: string
}

export interface TelegramSendResult {
  success: boolean
  messageId?: number
  error?: string
}

async function postTelegram<T>(
  method: string,
  payload: Record<string, unknown>,
): Promise<TelegramApiResponse<T> | null> {
  if (!isTelegramEnabled()) return null

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const body = await res.text()
    let parsed: TelegramApiResponse<T> | null = null
    if (body) {
      try {
        parsed = JSON.parse(body) as TelegramApiResponse<T>
      } catch {
        parsed = { ok: false, description: body }
      }
    }

    if (!res.ok) {
      console.error(`[telegram-service] ${method} failed:`, body)
      return parsed || { ok: false, description: body }
    }

    return parsed || { ok: true }
  } catch (err) {
    console.error(`[telegram-service] ${method} error:`, err)
    return null
  }
}

export async function sendMessageWithResult(
  chatId: string,
  text: string,
  options: SendMessageOptions = {},
): Promise<TelegramSendResult> {
  if (!isTelegramEnabled()) return { success: false, error: 'telegram_disabled' }

  const res = await postTelegram<{ message_id: number }>('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...options,
  })

  if (!res?.ok) {
    return { success: false, error: res?.description || 'telegram_request_failed' }
  }

  return { success: true, messageId: res.result?.message_id }
}

export async function sendMessage(chatId: string, text: string): Promise<boolean> {
  const result = await sendMessageWithResult(chatId, text)
  return result.success
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text: string,
  showAlert = false,
): Promise<boolean> {
  if (!isTelegramEnabled()) return false

  const res = await postTelegram<true>('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text,
    show_alert: showAlert,
  })

  return res?.ok === true
}

export async function editMessageText(
  chatId: string,
  messageId: number,
  text: string,
  options: SendMessageOptions = {},
): Promise<boolean> {
  if (!isTelegramEnabled()) return false

  const res = await postTelegram<unknown>('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...options,
  })

  return res?.ok === true
}

export async function editMessageReplyMarkup(
  chatId: string,
  messageId: number,
  replyMarkup: SendMessageOptions['reply_markup'] | null = null,
): Promise<boolean> {
  if (!isTelegramEnabled()) return false

  const res = await postTelegram<unknown>('editMessageReplyMarkup', {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: replyMarkup,
  })

  return res?.ok === true
}

export async function sendToGroups(eventType: string, text: string): Promise<void> {
  if (!isTelegramEnabled()) return

  const { data: groups, error } = await supabaseAdmin
    .from('notification_channel_groups')
    .select('channel_config')
    .eq('channel_type', 'TELEGRAM')
    .eq('is_active', true)
    .is('deleted_at', null)
    .contains('event_types', [eventType])
    .limit(50)

  if (error) {
    console.error('[telegram-service] sendToGroups query error:', error)
    return
  }

  for (const group of groups || []) {
    const config = group.channel_config as { chat_id: string }
    sendMessage(config.chat_id, text).catch(() => {})
  }
}

export async function sendToSubscribers(eventType: string, text: string): Promise<void> {
  if (!isTelegramEnabled()) return

  const { data: channels, error } = await supabaseAdmin
    .from('notification_channels')
    .select('channel_config')
    .eq('channel_type', 'TELEGRAM')
    .eq('is_active', true)
    .is('deleted_at', null)
    .contains('event_types', [eventType])
    .limit(100)

  if (error) {
    console.error('[telegram-service] sendToSubscribers query error:', error)
    return
  }

  for (const channel of channels || []) {
    const config = channel.channel_config as { chat_id: string }
    sendMessage(config.chat_id, text).catch(() => {})
  }
}
