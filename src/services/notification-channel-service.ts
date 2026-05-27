import { fetchApi } from './api'
import type {
  NotificationChannel,
  NotificationChannelGroup,
  ChannelType,
  ExternalEventType,
  TelegramIdentity,
  TelegramIdentityAssignMode,
  TelegramIdentityStatus,
} from '@/types/notification-channel'

interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

const BASE = '/api/notification-channels'

export const notificationChannelService = {
  async list(): Promise<NotificationChannel[]> {
    const res = await fetchApi<ApiResponse<NotificationChannel[]>>(BASE)
    return res.data || []
  },

  async listGroups(): Promise<NotificationChannelGroup[]> {
    const res = await fetchApi<ApiResponse<NotificationChannelGroup[]>>(`${BASE}/groups`)
    return res.data || []
  },

  async create(payload: {
    employee_id: number
    channel_type: ChannelType
    channel_config: { chat_id: string; telegram_user_id?: string; name?: string }
    event_types: ExternalEventType[]
  }): Promise<NotificationChannel> {
    const res = await fetchApi<ApiResponse<NotificationChannel>>(BASE, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return res.data!
  },

  async createGroup(payload: {
    channel_type: ChannelType
    channel_config: { chat_id: string; telegram_user_id?: string; name?: string }
    event_types: ExternalEventType[]
  }): Promise<NotificationChannelGroup> {
    const res = await fetchApi<ApiResponse<NotificationChannelGroup>>(`${BASE}/groups`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return res.data!
  },

  async update(id: number, payload: {
    channel_config?: { chat_id: string; telegram_user_id?: string; name?: string }
    event_types?: ExternalEventType[]
  }): Promise<NotificationChannel> {
    const res = await fetchApi<ApiResponse<NotificationChannel>>(`${BASE}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    return res.data!
  },

  async toggle(id: number, isGroup = false): Promise<void> {
    await fetchApi<ApiResponse<null>>(`${BASE}/${id}/toggle${isGroup ? '?group=true' : ''}`, {
      method: 'PATCH',
    })
  },

  async remove(id: number, isGroup = false): Promise<void> {
    await fetchApi<ApiResponse<null>>(`${BASE}/${id}${isGroup ? '?group=true' : ''}`, {
      method: 'DELETE',
    })
  },

  async testMessage(channelType: ChannelType, chatId: string): Promise<string> {
    const res = await fetchApi<ApiResponse<null>>(`${BASE}/test`, {
      method: 'POST',
      body: JSON.stringify({ channel_type: channelType, chat_id: chatId }),
    })
    return res.message || 'OK'
  },

  async listLeaderCandidates(): Promise<Array<{
    id: number
    employee_id: string
    full_name: string
    department: string | null
    chuc_vu: string | null
  }>> {
    const res = await fetchApi<ApiResponse<Array<{
      id: number
      employee_id: string
      full_name: string
      department: string | null
      chuc_vu: string | null
    }>>>(`${BASE}/leader-candidates`)
    return res.data || []
  },

  async listTelegramIdentities(status: TelegramIdentityStatus = 'unassigned'): Promise<TelegramIdentity[]> {
    const res = await fetchApi<ApiResponse<TelegramIdentity[]>>(`${BASE}/telegram-identities?status=${status}`)
    return res.data || []
  },

  async assignTelegramIdentity(id: number, payload: {
    employee_id: number
    mode: TelegramIdentityAssignMode
    event_types?: ExternalEventType[]
  }): Promise<NotificationChannel> {
    const res = await fetchApi<ApiResponse<NotificationChannel>>(`${BASE}/telegram-identities/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return res.data!
  },
}
