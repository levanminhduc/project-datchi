<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { purchaseOrderService } from '@/services/purchaseOrderService'
import type { POItem, POItemHistory } from '@/types/thread'

interface Props {
  modelValue: boolean
  poId: number
  item: POItem | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const history = ref<POItemHistory[]>([])
const loading = ref(false)

const dialogValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const columns = [
  { name: 'created_at', label: 'Thời gian', field: 'created_at', align: 'left' as const },
  { name: 'employee_name', label: 'Người thay đổi', field: 'employee_name', align: 'left' as const },
  { name: 'change_type', label: 'Loại', field: 'change_type', align: 'center' as const },
  { name: 'previous_quantity', label: 'SL cũ', field: 'previous_quantity', align: 'center' as const },
  { name: 'new_quantity', label: 'SL mới', field: 'new_quantity', align: 'center' as const }
]

function getChangeTypeColor(type: string): string {
  const colors: Record<string, string> = {
    CREATE: 'positive',
    UPDATE: 'info',
    DELETE: 'negative'
  }
  return colors[type] || 'grey'
}

function getChangeTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    CREATE: 'Tạo mới',
    UPDATE: 'Cập nhật',
    DELETE: 'Xóa'
  }
  return labels[type] || type
}

function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('vi-VN')
}

function getEmployeeName(row: POItemHistory): string {
  if (row.employee_name) return row.employee_name
  const emp = (row as unknown as { employee?: { full_name?: string } }).employee
  return emp?.full_name || '-'
}

async function loadHistory() {
  if (!props.item) return
  loading.value = true
  try {
    history.value = await purchaseOrderService.getItemHistory(props.poId, props.item.id)
  } finally {
    loading.value = false
  }
}

watch(() => props.modelValue, (newVal) => {
  if (newVal && props.item) {
    loadHistory()
  }
})
</script>

<template>
  <q-dialog v-model="dialogValue">
    <q-card style="min-width: 600px; max-width: 90vw;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          Lịch sử thay đổi - {{ item?.style?.style_code }}
        </div>
        <q-space />
        <q-btn
          v-close-popup
          icon="close"
          flat
          round
          dense
        />
      </q-card-section>

      <q-card-section>
        <q-table
          flat
          bordered
          :rows="history"
          :columns="columns"
          :loading="loading"
          row-key="id"
          :pagination="{ rowsPerPage: 0 }"
          hide-pagination
        >
          <template #body-cell-created_at="props">
            <q-td :props="props">
              {{ formatDateTime(props.row.created_at) }}
            </q-td>
          </template>

          <template #body-cell-employee_name="props">
            <q-td :props="props">
              {{ getEmployeeName(props.row) }}
            </q-td>
          </template>

          <template #body-cell-change_type="props">
            <q-td :props="props">
              <q-badge
                :color="getChangeTypeColor(props.row.change_type)"
                :label="getChangeTypeLabel(props.row.change_type)"
              />
            </q-td>
          </template>

          <template #body-cell-previous_quantity="props">
            <q-td :props="props">
              {{ props.row.previous_quantity ?? '-' }}
            </q-td>
          </template>

          <template #body-cell-new_quantity="props">
            <q-td :props="props">
              {{ props.row.new_quantity ?? '-' }}
            </q-td>
          </template>

          <template #no-data>
            <div class="text-grey-6 q-pa-md text-center">
              Chưa có lịch sử thay đổi
            </div>
          </template>
        </q-table>
      </q-card-section>

      <q-card-actions
        align="right"
        class="q-pa-md"
      >
        <q-btn
          v-close-popup
          flat
          label="Đóng"
          color="grey"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
