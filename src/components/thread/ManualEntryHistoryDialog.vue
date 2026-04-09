<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { stockService } from '@/services/stockService'
import { useSnackbar } from '@/composables/useSnackbar'
import type { ManualEntryHistoryRow } from '@/types/thread/stock'
import AppDialog from '@/components/ui/dialogs/AppDialog.vue'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const snackbar = useSnackbar()

const dialogValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const rows = ref<ManualEntryHistoryRow[]>([])
const loading = ref(false)
const pagination = ref({
  page: 1,
  rowsPerPage: 25,
  rowsNumber: 0,
  sortBy: 'created_at',
  descending: true,
})

const columns = [
  { name: 'created_at', label: 'Ngày nhập', field: 'created_at', align: 'left' as const, sortable: false },
  { name: 'thread_type', label: 'Loại chỉ', field: 'thread_type', align: 'left' as const, sortable: false },
  { name: 'warehouse', label: 'Kho', field: 'warehouse', align: 'left' as const, sortable: false },
  { name: 'full_cones', label: 'Cuộn nguyên', field: 'full_cones', align: 'center' as const, sortable: false },
  { name: 'partial_cones', label: 'Cuộn lẻ', field: 'partial_cones', align: 'center' as const, sortable: false },
  { name: 'total_cones', label: 'Tổng cuộn', field: 'total_cones', align: 'center' as const, sortable: false },
  { name: 'lot_number', label: 'Mã lô', field: 'lot_number', align: 'left' as const, sortable: false },
  { name: 'supplier', label: 'NCC', field: 'supplier', align: 'left' as const, sortable: false },
  { name: 'created_by', label: 'Người nhập', field: 'created_by', align: 'left' as const, sortable: false },
]

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}

async function onRequest(tableProps: { pagination: { page: number; rowsPerPage: number; rowsNumber?: number; sortBy: string; descending: boolean } }) {
  const { page, rowsPerPage } = tableProps.pagination
  loading.value = true

  try {
    const result = await stockService.getManualEntryHistory({ page, pageSize: rowsPerPage })
    rows.value = result.data
    pagination.value.rowsNumber = result.count
    pagination.value.page = page
    pagination.value.rowsPerPage = rowsPerPage
  } catch {
    snackbar.error('Lỗi khi tải lịch sử nhập thủ công')
  } finally {
    loading.value = false
  }
}

watch(dialogValue, (isOpen) => {
  if (isOpen) {
    pagination.value.page = 1
    onRequest({ pagination: pagination.value })
  }
})
</script>

<template>
  <AppDialog v-model="dialogValue">
    <template #header>
      Lịch Sử Nhập Thủ Công
    </template>

    <q-table
      v-model:pagination="pagination"
      flat
      bordered
      :rows="rows"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :rows-per-page-options="[10, 25, 50]"
      no-data-label="Chưa có dữ liệu nhập thủ công"
      @request="onRequest"
    >
      <template #body-cell-created_at="scope">
        <q-td :props="scope">
          {{ formatDate(scope.row.created_at) }}
        </q-td>
      </template>

      <template #body-cell-thread_type="scope">
        <q-td :props="scope">
          <div
            v-if="scope.row.thread_type"
            class="row items-center q-gutter-x-xs no-wrap"
          >
            <div
              v-if="scope.row.thread_type.color?.hex_code"
              class="color-dot"
              :style="{ backgroundColor: scope.row.thread_type.color.hex_code }"
            />
            <span>{{ scope.row.thread_type.name }}</span>
          </div>
          <span
            v-else
            class="text-grey-5"
          >-</span>
        </q-td>
      </template>

      <template #body-cell-warehouse="scope">
        <q-td :props="scope">
          {{ scope.row.warehouse?.name || '-' }}
        </q-td>
      </template>

      <template #body-cell-supplier="scope">
        <q-td :props="scope">
          {{ scope.row.supplier?.name || '-' }}
        </q-td>
      </template>

      <template #body-cell-created_by="scope">
        <q-td :props="scope">
          {{ scope.row.created_by?.full_name || '-' }}
        </q-td>
      </template>
    </q-table>
  </AppDialog>
</template>

<style scoped>
.color-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
</style>
