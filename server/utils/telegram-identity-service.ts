import { supabaseAdmin } from '../db/supabase'

export interface TelegramIdentityInput {
  telegramUserId: string
  chatId: string
  username?: string | null
  firstName?: string | null
  lastName?: string | null
  lastCommand: string
}

export async function upsertTelegramIdentity(input: TelegramIdentityInput): Promise<void> {
  const { error } = await supabaseAdmin
    .from('telegram_identities')
    .upsert({
      telegram_user_id: input.telegramUserId,
      chat_id: input.chatId,
      username: input.username || null,
      first_name: input.firstName || null,
      last_name: input.lastName || null,
      last_command: input.lastCommand,
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'telegram_user_id',
    })

  if (error) {
    console.error('[telegram-identity] upsert error:', error)
  }
}
