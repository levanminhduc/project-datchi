import { ref, onUnmounted } from 'vue'
import { notificationService } from '@/services/notificationService'
import type { Notification, NotificationListParams } from '@/types/notification'

const notifications = ref<Notification[]>([])
const unreadCount = ref(0)
const isLoading = ref(false)
let pollingInterval: ReturnType<typeof setInterval> | null = null
let subscriberCount = 0

export function useNotifications() {
  async function fetchNotifications(params?: NotificationListParams) {
    isLoading.value = true
    try {
      notifications.value = await notificationService.getNotifications(params)
    } catch {
    } finally {
      isLoading.value = false
    }
  }

  async function fetchUnreadCount() {
    try {
      unreadCount.value = await notificationService.getUnreadCount()
    } catch {
    }
  }

  async function markAsRead(id: number) {
    try {
      await notificationService.markAsRead(id)
      const notification = notifications.value.find(n => n.id === id)
      if (notification && !notification.is_read) {
        notification.is_read = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    } catch {
    }
  }

  async function markAllAsRead() {
    try {
      await notificationService.markAllAsRead()
      notifications.value.forEach(n => { n.is_read = true })
      unreadCount.value = 0
    } catch {
    }
  }

  async function deleteNotification(id: number) {
    try {
      await notificationService.deleteNotification(id)
      const notification = notifications.value.find(n => n.id === id)
      if (notification && !notification.is_read) {
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
      notifications.value = notifications.value.filter(n => n.id !== id)
    } catch {
    }
  }

  function startPolling(intervalMs = 30000) {
    subscriberCount++
    if (pollingInterval) return

    fetchUnreadCount()

    pollingInterval = setInterval(() => {
      fetchUnreadCount()
    }, intervalMs)
  }

  function stopPolling() {
    subscriberCount--
    if (subscriberCount <= 0 && pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
      subscriberCount = 0
    }
  }

  onUnmounted(() => {
    stopPolling()
  })

  return {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    startPolling,
    stopPolling,
  }
}
