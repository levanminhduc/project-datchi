import { ref } from 'vue'
import { notificationChannelService } from '@/services/notification-channel-service'
import { useSnackbar } from '@/composables/useSnackbar'
import type {
  NotificationChannel,
  NotificationChannelGroup,
  ChannelType,
  ExternalEventType,
} from '@/types/notification-channel'

export function useNotificationChannels() {
  const snackbar = useSnackbar()
  const channels = ref<NotificationChannel[]>([])
  const groups = ref<NotificationChannelGroup[]>([])
  const isLoading = ref(false)
  const isTesting = ref(false)

  async function loadAll() {
    isLoading.value = true
    try {
      const [ch, gr] = await Promise.all([
        notificationChannelService.list(),
        notificationChannelService.listGroups(),
      ])
      channels.value = ch
      groups.value = gr
    } catch {
      snackbar.error('Lỗi khi tải cấu hình thông báo')
    } finally {
      isLoading.value = false
    }
  }

  async function createChannel(payload: {
    employee_id: number
    channel_type: ChannelType
    channel_config: { chat_id: string; name?: string }
    event_types: ExternalEventType[]
  }) {
    try {
      await notificationChannelService.create(payload)
      snackbar.success('Đã thêm kênh thông báo')
      await loadAll()
      return true
    } catch {
      snackbar.error('Lỗi khi thêm kênh thông báo')
      return false
    }
  }

  async function createGroup(payload: {
    channel_type: ChannelType
    channel_config: { chat_id: string; name?: string }
    event_types: ExternalEventType[]
  }) {
    try {
      await notificationChannelService.createGroup(payload)
      snackbar.success('Đã thêm nhóm thông báo')
      await loadAll()
      return true
    } catch {
      snackbar.error('Lỗi khi thêm nhóm thông báo')
      return false
    }
  }

  async function toggleChannel(id: number, isGroup = false) {
    try {
      await notificationChannelService.toggle(id, isGroup)
      await loadAll()
    } catch {
      snackbar.error('Lỗi khi thay đổi trạng thái')
    }
  }

  async function removeChannel(id: number, isGroup = false) {
    try {
      await notificationChannelService.remove(id, isGroup)
      snackbar.success('Đã xóa')
      await loadAll()
    } catch {
      snackbar.error('Lỗi khi xóa')
    }
  }

  async function testMessage(channelType: ChannelType, chatId: string) {
    isTesting.value = true
    try {
      const msg = await notificationChannelService.testMessage(channelType, chatId)
      snackbar.success(msg)
      return true
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gửi test thất bại'
      snackbar.error(message)
      return false
    } finally {
      isTesting.value = false
    }
  }

  return {
    channels,
    groups,
    isLoading,
    isTesting,
    loadAll,
    createChannel,
    createGroup,
    toggleChannel,
    removeChannel,
    testMessage,
  }
}
