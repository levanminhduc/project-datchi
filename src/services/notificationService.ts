import { authService } from './authService'
import type { Notification, NotificationListParams } from '@/types/notification'

const API_URL = import.meta.env.VITE_API_URL || ''

export const notificationService = {
  async getNotifications(params?: NotificationListParams): Promise<Notification[]> {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set('limit', String(params.limit))
    if (params?.offset) searchParams.set('offset', String(params.offset))
    if (params?.type) searchParams.set('type', params.type)
    if (params?.is_read !== undefined) searchParams.set('is_read', String(params.is_read))

    const query = searchParams.toString()
    const url = `${API_URL}/api/notifications${query ? `?${query}` : ''}`
    const response = await authService.authenticatedFetch(url)

    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.error || 'Lỗi khi tải thông báo')
    }

    const result = await response.json()
    return result.data || []
  },

  async getUnreadCount(): Promise<number> {
    const response = await authService.authenticatedFetch(
      `${API_URL}/api/notifications/unread-count`
    )

    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.error || 'Lỗi khi tải số thông báo chưa đọc')
    }

    const result = await response.json()
    return result.data?.count ?? 0
  },

  async markAsRead(id: number): Promise<void> {
    const response = await authService.authenticatedFetch(
      `${API_URL}/api/notifications/${id}/read`,
      { method: 'PATCH' }
    )

    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.error || 'Lỗi khi đánh dấu đã đọc')
    }
  },

  async markAllAsRead(): Promise<void> {
    const response = await authService.authenticatedFetch(
      `${API_URL}/api/notifications/read-all`,
      { method: 'PATCH' }
    )

    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.error || 'Lỗi khi đánh dấu tất cả đã đọc')
    }
  },

  async deleteNotification(id: number): Promise<void> {
    const response = await authService.authenticatedFetch(
      `${API_URL}/api/notifications/${id}`,
      { method: 'DELETE' }
    )

    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.error || 'Lỗi khi xóa thông báo')
    }
  },
}
