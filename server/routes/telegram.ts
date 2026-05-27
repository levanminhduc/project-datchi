import { Hono, type Context } from 'hono'
import {
  answerCallbackQuery,
  sendMessage,
} from '../utils/telegram-service'
import {
  approveWeeklyOrderFromTelegram,
  clearTelegramApprovalButtons,
  parseApprovalCallbackData,
} from '../utils/weekly-order-approval-service'
import { upsertTelegramIdentity } from '../utils/telegram-identity-service'

const telegram = new Hono()

interface TelegramMessage {
  message_id: number
  text?: string
  chat: { id: number | string; type?: string }
  from?: { id: number; first_name?: string; last_name?: string; username?: string }
}

interface TelegramCallbackQuery {
  id: string
  data?: string
  from: { id: number; first_name?: string; username?: string }
  message?: {
    message_id: number
    chat: { id: number | string }
  }
}

interface TelegramUpdate {
  message?: TelegramMessage
  callback_query?: TelegramCallbackQuery
}

function getWebhookSecretHeader(c: Context): string {
  return c.req.header('X-Telegram-Bot-Api-Secret-Token') || ''
}

function isIdentityCommand(text?: string): boolean {
  const command = (text || '').trim().split(/\s+/)[0]
  return command === '/start' || command === '/id'
}

async function handleIdentityMessage(message: TelegramMessage): Promise<void> {
  if (!isIdentityCommand(message.text)) return

  const command = (message.text || '').trim().split(/\s+/)[0]
  const chatId = String(message.chat.id)
  const userId = message.from?.id ? String(message.from.id) : 'Không xác định'
  const username = message.from?.username ? `@${message.from.username}` : 'Không có'

  if (message.chat.type === 'private' && message.from?.id) {
    await upsertTelegramIdentity({
      telegramUserId: String(message.from.id),
      chatId,
      username: message.from.username || null,
      firstName: message.from.first_name || null,
      lastName: message.from.last_name || null,
      lastCommand: command,
    })
  }

  const text = [
    '✅ <b>Đạt Chí Telegram Bot</b>',
    `Chat ID: <code>${chatId}</code>`,
    `Telegram User ID: <code>${userId}</code>`,
    `Username: ${username}`,
    '',
    'Dùng Chat ID và Telegram User ID này để cấu hình lãnh đạo duyệt đơn.',
  ].join('\n')

  await sendMessage(chatId, text)
}

async function handleApprovalCallback(callbackQuery: TelegramCallbackQuery): Promise<void> {
  const requestId = callbackQuery.data ? parseApprovalCallbackData(callbackQuery.data) : null
  if (!requestId) {
    await answerCallbackQuery(callbackQuery.id, 'Nút Telegram không hợp lệ', true)
    return
  }

  const result = await approveWeeklyOrderFromTelegram({
    requestId,
    telegramUserId: String(callbackQuery.from.id),
  })

  await answerCallbackQuery(callbackQuery.id, result.userMessage, result.alert === true)

  if (result.clearButtons && result.chatId && result.messageId) {
    await clearTelegramApprovalButtons(result.chatId, result.messageId, result.editText)
  }
}

telegram.post('/webhook', async (c) => {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET || ''
  if (!expectedSecret) {
    console.error('[telegram-webhook] TELEGRAM_WEBHOOK_SECRET is not configured')
    return c.json({ ok: false, error: 'webhook_not_configured' }, 503)
  }

  if (getWebhookSecretHeader(c) !== expectedSecret) {
    return c.json({ ok: false, error: 'unauthorized' }, 401)
  }

  let update: TelegramUpdate
  try {
    update = await c.req.json()
  } catch {
    return c.json({ ok: false, error: 'invalid_json' }, 400)
  }

  try {
    if (update.message) {
      await handleIdentityMessage(update.message)
    }

    if (update.callback_query) {
      await handleApprovalCallback(update.callback_query)
    }

    return c.json({ ok: true })
  } catch (err) {
    console.error('[telegram-webhook] handling error:', err)
    return c.json({ ok: true })
  }
})

export default telegram
