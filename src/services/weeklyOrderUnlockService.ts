import { fetchApi } from './api'

const BASE = '/api/weekly-order-unlocks'

export interface WeeklyOrderEditUnlock {
  id: number
  week_id: number
  granted_by: string
  granted_at: string
  expires_at: string
  revoked_at: string | null
  revoked_by: string | null
  reason: string | null
}

export interface WeeklyOrderAuditEntry {
  id: number
  table_name: string
  record_id: number
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  performed_by: string | null
  changed_fields: string[] | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  created_at: string
}

export interface WeeklyOrderAuditPage {
  rows: WeeklyOrderAuditEntry[]
  total: number
  page: number
  limit: number
}

interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

export const weeklyOrderUnlockService = {
  async getByWeek(weekId: number): Promise<{
    active: WeeklyOrderEditUnlock | null
    history: WeeklyOrderEditUnlock[]
  }> {
    const response = await fetchApi<
      ApiResponse<{ active: WeeklyOrderEditUnlock | null; history: WeeklyOrderEditUnlock[] }>
    >(`${BASE}?week_id=${weekId}`)

    if (response.error) {
      throw new Error(response.error)
    }

    return response.data ?? { active: null, history: [] }
  },

  async getAudit(weekId: number, page = 1, limit = 25): Promise<WeeklyOrderAuditPage> {
    const response = await fetchApi<ApiResponse<WeeklyOrderAuditPage>>(
      `${BASE}/audit?week_id=${weekId}&page=${page}&limit=${limit}`,
    )

    if (response.error) {
      throw new Error(response.error)
    }

    return response.data ?? { rows: [], total: 0, page, limit }
  },

  async grant(
    weekId: number,
    durationMinutes: number,
    reason: string,
  ): Promise<WeeklyOrderEditUnlock> {
    const response = await fetchApi<ApiResponse<WeeklyOrderEditUnlock>>(BASE, {
      method: 'POST',
      body: JSON.stringify({
        week_id: weekId,
        duration_minutes: durationMinutes,
        reason,
      }),
    })

    if (response.error || !response.data) {
      throw new Error(response.error || 'Không thể mở khóa tuần đặt hàng')
    }

    return response.data
  },

  async revoke(unlockId: number): Promise<void> {
    const response = await fetchApi<ApiResponse<WeeklyOrderEditUnlock>>(
      `${BASE}/${unlockId}/revoke`,
      { method: 'POST' },
    )

    if (response.error) {
      throw new Error(response.error)
    }
  },
}
