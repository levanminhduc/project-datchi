import { query } from '../db/query'

export interface TelegramIdentityInput {
  telegramUserId: string
  chatId: string
  username?: string | null
  firstName?: string | null
  lastName?: string | null
  lastCommand: string
}

export async function upsertTelegramIdentity(input: TelegramIdentityInput): Promise<void> {
  try {
    const now = new Date().toISOString()
    await query(
      `INSERT INTO telegram_identities (
         telegram_user_id, chat_id, username, first_name, last_name, last_command, last_seen_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (telegram_user_id) DO UPDATE SET
         chat_id = EXCLUDED.chat_id,
         username = EXCLUDED.username,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         last_command = EXCLUDED.last_command,
         last_seen_at = EXCLUDED.last_seen_at,
         updated_at = EXCLUDED.updated_at`,
      [
        input.telegramUserId,
        input.chatId,
        input.username || null,
        input.firstName || null,
        input.lastName || null,
        input.lastCommand,
        now,
        now,
      ]
    )
  } catch (error) {
    console.error('[telegram-identity] upsert error:', error)
  }
}
