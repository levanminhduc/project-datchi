<template>
  <FormDialog
    v-model="visible"
    title="Xung đột đồng bộ"
    :loading="isLoading"
    submit-text="Giải quyết"
    @submit="handleResolve"
    @cancel="visible = false"
  >
    <q-banner class="bg-warning text-white q-mb-md" rounded>
      <template #avatar>
        <q-icon name="warning" />
      </template>
      Có {{ conflicts.length }} xung đột cần giải quyết
    </q-banner>

    <q-list separator>
      <q-item v-for="conflict in conflicts" :key="conflict.id" class="q-pa-md">
        <q-item-section avatar>
          <q-icon :name="getOperationIcon(conflict.type)" :color="getOperationColor(conflict.type)" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ getOperationLabel(conflict.type) }}</q-item-label>
          <q-item-label caption>{{ formatDate(conflict.createdAt) }}</q-item-label>
          <q-item-label v-if="conflict.error" caption class="text-negative">
            {{ conflict.error }}
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <div class="row q-gutter-sm">
            <q-btn flat dense icon="refresh" color="primary" @click="handleRetry(conflict.id)">
              <q-tooltip>Thử lại</q-tooltip>
            </q-btn>
            <q-btn flat dense icon="delete" color="negative" @click="handleDiscard(conflict.id)">
              <q-tooltip>Bỏ qua</q-tooltip>
            </q-btn>
          </div>
        </q-item-section>
      </q-item>
    </q-list>

    <template v-if="conflicts.length === 0">
      <q-banner class="bg-positive text-white" rounded>
        <template #avatar>
          <q-icon name="check_circle" />
        </template>
        Không có xung đột nào
      </q-banner>
    </template>
  </FormDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import FormDialog from '@/components/ui/dialogs/FormDialog.vue'
import { useOfflineQueueStore } from '@/stores/thread/offlineQueue'
import { useSnackbar, useLoading } from '@/composables'

const visible = defineModel<boolean>({ default: false })

const store = useOfflineQueueStore()
const snackbar = useSnackbar()
const { isLoading, withLoading } = useLoading()

const conflicts = computed(() => store.getConflicts())

function getOperationIcon(type: string): string {
  const icons: Record<string, string> = {
    stock_receipt: 'inventory_2',
    issue: 'send',
    recovery: 'recycling',
    allocation: 'assignment'
  }
  return icons[type] || 'sync'
}

function getOperationColor(type: string): string {
  const colors: Record<string, string> = {
    stock_receipt: 'primary',
    issue: 'secondary',
    recovery: 'accent',
    allocation: 'info'
  }
  return colors[type] || 'grey'
}

function getOperationLabel(type: string): string {
  const labels: Record<string, string> = {
    stock_receipt: 'Nhập kho',
    issue: 'Xuất kho',
    recovery: 'Thu hồi',
    allocation: 'Phân bổ'
  }
  return labels[type] || type
}

function formatDate(dateString: string): string {
  return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: vi })
}

async function handleRetry(id: string) {
  await withLoading(async () => {
    await store.resolveConflict(id, 'retry')
    snackbar.success('Đã thử lại thao tác')
  })
}

async function handleDiscard(id: string) {
  await withLoading(async () => {
    await store.resolveConflict(id, 'discard')
    snackbar.info('Đã bỏ qua thao tác')
  })
}

async function handleResolve() {
  // Resolve all by retrying
  await withLoading(async () => {
    for (const conflict of conflicts.value) {
      await store.resolveConflict(conflict.id, 'retry')
    }
    snackbar.success('Đã giải quyết tất cả xung đột')
    visible.value = false
  })
}
</script>
