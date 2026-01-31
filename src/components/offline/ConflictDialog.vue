<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card style="min-width: 350px; max-width: 500px">
      <q-card-section class="row items-center q-pb-none">
        <q-icon name="error" color="negative" size="24px" class="q-mr-sm" />
        <div class="text-h6">Xung Đột Dữ Liệu</div>
        <q-space />
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>

      <q-card-section class="text-body2 text-grey-7">
        Các thao tác sau không thể đồng bộ do dữ liệu đã thay đổi trên server.
        Vui lòng chọn cách xử lý cho từng thao tác.
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pa-none" style="max-height: 400px; overflow-y: auto">
        <q-list separator>
          <q-item v-for="op in conflicts" :key="op.id" class="q-py-md">
            <q-item-section>
              <q-item-label class="text-weight-medium">
                {{ getOperationLabel(op.type) }}
              </q-item-label>
              <q-item-label caption>
                {{ formatDate(op.createdAt) }}
              </q-item-label>
              <q-item-label caption class="text-negative">
                {{ op.error }}
              </q-item-label>
              
              <!-- Operation Details -->
              <div class="q-mt-sm">
                <q-chip
                  v-for="(value, key) in getDisplayPayload(op.payload)"
                  :key="key"
                  dense
                  size="sm"
                  color="grey-3"
                  text-color="grey-8"
                >
                  {{ key }}: {{ value }}
                </q-chip>
              </div>
            </q-item-section>

            <q-item-section side>
              <div class="column q-gutter-xs">
                <q-btn
                  flat
                  dense
                  color="primary"
                  icon="refresh"
                  label="Thử lại"
                  @click="handleResolve(op.id, 'retry')"
                />
                <q-btn
                  flat
                  dense
                  color="grey"
                  icon="check"
                  label="Đã xử lý"
                  @click="handleResolve(op.id, 'manual')"
                />
                <q-btn
                  flat
                  dense
                  color="negative"
                  icon="delete"
                  label="Bỏ qua"
                  @click="handleResolve(op.id, 'discard')"
                />
              </div>
            </q-item-section>
          </q-item>

          <q-item v-if="conflicts.length === 0">
            <q-item-section class="text-center text-grey-6 q-pa-lg">
              <q-icon name="check_circle" size="48px" color="positive" class="q-mb-sm" />
              <div>Không có xung đột nào</div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-separator v-if="conflicts.length > 1" />

      <q-card-actions v-if="conflicts.length > 1" align="right">
        <q-btn
          flat
          color="negative"
          label="Bỏ qua tất cả"
          icon="delete_sweep"
          @click="handleResolveAll('discard')"
        />
        <q-btn
          flat
          color="primary"
          label="Thử lại tất cả"
          icon="refresh"
          @click="handleResolveAll('retry')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useOfflineQueueStore, type QueuedOperation } from '@/stores/thread/offlineQueue'
import { storeToRefs } from 'pinia'
import { useSnackbar } from '@/composables'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const store = useOfflineQueueStore()
const snackbar = useSnackbar()
const { conflictOperations: conflicts } = storeToRefs(store)

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const OPERATION_LABELS: Record<QueuedOperation['type'], string> = {
  stock_receipt: 'Nhập kho',
  issue: 'Xuất xưởng',
  recovery: 'Hoàn trả',
  allocation: 'Phân bổ',
}

const getOperationLabel = (type: QueuedOperation['type']): string => {
  return OPERATION_LABELS[type] || type
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getDisplayPayload = (payload: Record<string, unknown>): Record<string, string> => {
  const displayFields: Record<string, string> = {}
  const fieldLabels: Record<string, string> = {
    thread_type_id: 'Loại chỉ',
    warehouse_id: 'Kho',
    quantity_cones: 'Số cuộn',
    cone_id: 'Mã cuộn',
    weight_grams: 'Trọng lượng',
    allocation_id: 'Mã phân bổ',
  }

  for (const [key, value] of Object.entries(payload)) {
    if (fieldLabels[key] && value !== null && value !== undefined) {
      displayFields[fieldLabels[key]] = String(value)
    }
  }

  return displayFields
}

const handleResolve = async (id: string, resolution: 'retry' | 'discard' | 'manual') => {
  try {
    await store.resolveConflict(id, resolution)
    
    const messages: Record<'retry' | 'discard' | 'manual', string> = {
      retry: 'Đã thêm vào hàng đợi đồng bộ',
      discard: 'Đã bỏ qua thao tác',
      manual: 'Đã đánh dấu là đã xử lý',
    }
    snackbar.success(messages[resolution])
    
    if (conflicts.value.length === 0) {
      isOpen.value = false
    }
  } catch (err) {
    snackbar.error('Không thể xử lý xung đột')
  }
}

const handleResolveAll = async (resolution: 'retry' | 'discard') => {
  const ops = [...conflicts.value]
  for (const op of ops) {
    await store.resolveConflict(op.id, resolution)
  }
  
  const message = resolution === 'retry' 
    ? 'Đã thêm tất cả vào hàng đợi đồng bộ'
    : 'Đã bỏ qua tất cả thao tác'
  snackbar.success(message)
  isOpen.value = false
}
</script>
