<template>
  <q-btn
    flat
    round
    dense
    icon="notifications"
  >
    <q-badge
      v-if="unreadCount > 0"
      color="red"
      floating
      rounded
    >
      {{ unreadCount > 99 ? '99+' : unreadCount }}
    </q-badge>
    <q-tooltip>Thông báo</q-tooltip>
    <q-menu
      anchor="bottom right"
      self="top right"
      :offset="[0, 8]"
      style="width: 360px; max-height: 480px"
      @before-show="onMenuOpen"
    >
      <q-list>
        <q-item>
          <q-item-section>
            <q-item-label class="text-weight-bold text-subtitle1">
              Thông báo
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn
              v-if="unreadCount > 0"
              flat
              dense
              no-caps
              color="primary"
              label="Đánh dấu tất cả đã đọc"
              size="sm"
              @click.stop="handleMarkAllAsRead"
            />
          </q-item-section>
        </q-item>

        <q-separator />

        <q-item
          v-if="isLoading && notifications.length === 0"
          class="justify-center"
        >
          <q-spinner
            color="primary"
            size="2em"
          />
        </q-item>

        <template v-else-if="notifications.length > 0">
          <q-item
            v-for="notification in notifications"
            :key="notification.id"
            v-close-popup
            clickable
            :class="{ 'bg-blue-1': !notification.is_read }"
            @click="handleClick(notification)"
          >
            <q-item-section avatar>
              <q-icon
                :name="getTypeIcon(notification.type)"
                :color="getTypeColor(notification.type)"
                size="sm"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label :class="{ 'text-weight-bold': !notification.is_read }">
                {{ notification.title }}
              </q-item-label>
              <q-item-label
                v-if="notification.body"
                caption
                lines="2"
              >
                {{ notification.body }}
              </q-item-label>
              <q-item-label
                caption
                class="text-grey-6"
              >
                {{ timeAgo(notification.created_at) }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn
                flat
                round
                dense
                icon="close"
                size="xs"
                color="grey"
                @click.stop="handleDelete(notification.id)"
              />
            </q-item-section>
          </q-item>
        </template>

        <q-item v-else>
          <q-item-section class="text-center text-grey-6 q-py-lg">
            Không có thông báo mới
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { useNotifications } from '@/composables/useNotifications'
import type { Notification, NotificationType } from '@/types/notification'

const router = useRouter()
const {
  notifications,
  unreadCount,
  isLoading,
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = useNotifications()

const typeConfig: Record<NotificationType, { icon: string; color: string }> = {
  STOCK_ALERT: { icon: 'warning', color: 'amber' },
  BATCH_RECEIVE: { icon: 'move_to_inbox', color: 'green' },
  BATCH_ISSUE: { icon: 'outbox', color: 'blue' },
  ALLOCATION: { icon: 'assignment', color: 'purple' },
  CONFLICT: { icon: 'error', color: 'red' },
  RECOVERY: { icon: 'restore', color: 'teal' },
  WEEKLY_ORDER: { icon: 'calendar_today', color: 'indigo' },
}

function getTypeIcon(type: NotificationType): string {
  return typeConfig[type]?.icon ?? 'notifications'
}

function getTypeColor(type: NotificationType): string {
  return typeConfig[type]?.color ?? 'grey'
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'Vừa xong'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Hôm qua'
  if (days < 30) return `${days} ngày trước`
  return `${Math.floor(days / 30)} tháng trước`
}

function onMenuOpen() {
  fetchNotifications({ limit: 20 })
}

async function handleClick(notification: Notification) {
  if (!notification.is_read) {
    await markAsRead(notification.id)
  }
  if (notification.action_url) {
    router.push(notification.action_url)
  }
}

async function handleMarkAllAsRead() {
  await markAllAsRead()
}

async function handleDelete(id: number) {
  await deleteNotification(id)
}
</script>
