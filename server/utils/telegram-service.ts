import { supabaseAdmin } from '../db/supabase'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''

if (!BOT_TOKEN) {
  console.warn('[telegram-service] TELEGRAM_BOT_TOKEN not set — Telegram notifications disabled')
}

export function isTelegramEnabled(): boolean {
  return BOT_TOKEN.length > 0
}

export async function sendMessage(chatId: string, text: string): Promise<boolean> {
  if (!isTelegramEnabled()) return false

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(`[telegram-service] sendMessage failed for chat_id=${chatId}:`, body)
      return false
    }
    return true
  } catch (err) {
    console.error(`[telegram-service] sendMessage error for chat_id=${chatId}:`, err)
    return false
  }
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
