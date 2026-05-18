<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useNotifications } from '@/composables/useNotifications'
import type { Notification } from '@/types/notification'

const props = defineProps<{
  modelValue: boolean
  orders: Notification[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'dismiss': []
}>()

const router = useRouter()
const { markAsRead, markAllAsReadByType } = useNotifications()

const dialogOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return iso
  }
}

function getMeta(notif: Notification, key: string): string {
  const meta = notif.metadata as Record<string, unknown> | null
  const v = meta?.[key]
  return typeof v === 'string' ? v : v != null ? String(v) : ''
}

async function viewDetail(notif: Notification) {
  await markAsRead(notif.id)
  if (notif.action_url) {
    router.push(notif.action_url)
  }
  dialogOpen.value = false
}

async function markAllRead() {
  await markAllAsReadByType('ORDER_APPROVED')
  dialogOpen.value = false
}

function dismissLater() {
  emit('dismiss')
  dialogOpen.value = false
}
</script>

<template>
  <q-dialog
    v-model="dialogOpen"
    persistent
  >
    <q-card style="min-width: 420px; max-width: 600px;">
      <q-card-section class="row items-center q-pb-sm">
        <q-icon
          name="check_circle"
          color="positive"
          size="md"
          class="q-mr-sm"
        />
        <div class="text-h6">
          Đơn hàng được ký duyệt
        </div>
        <q-badge
          color="primary"
          class="q-ml-sm"
          :label="orders.length"
        />
      </q-card-section>

      <q-separator />

      <q-card-section
        style="max-height: 400px; overflow-y: auto;"
        class="q-pa-none"
      >
        <q-list separator>
          <q-item
            v-for="notif in orders"
            :key="notif.id"
            class="q-py-md"
          >
            <q-item-section>
              <q-item-label class="text-subtitle1 text-weight-bold">
                {{ getMeta(notif, 'week_name') || notif.title }}
              </q-item-label>
              <q-item-label
                caption
                class="q-mt-xs"
              >
                Ký duyệt bởi: <strong>{{ getMeta(notif, 'leader_signed_by_name') || '—' }}</strong>
              </q-item-label>
              <q-item-label caption>
                Thời gian: {{ formatDateTime(getMeta(notif, 'leader_signed_at')) }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn
                flat
                color="primary"
                label="Xem chi tiết"
                @click="viewDetail(notif)"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-separator />

      <q-card-actions
        align="right"
        class="q-pa-md"
      >
        <q-btn
          flat
          label="Để sau"
          color="grey-7"
          @click="dismissLater"
        />
        <q-btn
          unelevated
          label="Đã xem tất cả"
          color="primary"
          @click="markAllRead"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
