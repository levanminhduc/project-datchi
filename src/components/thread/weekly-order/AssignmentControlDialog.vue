<template>
  <AppDialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #header>
      Kiểm Soát Chỉ Đã Gán Theo Tuần
    </template>

    <div style="min-width: min(720px, 80vw)">
      <div class="row items-center q-gutter-sm q-mb-md">
        <div class="col-12 col-sm-4">
          <AppSelect
            v-model="selectedStatus"
            :options="statusOptions"
            label="Lọc theo trạng thái tuần"
            emit-value
            map-options
            clearable
            dense
            hide-bottom-space
            @update:model-value="handleStatusChange"
          />
        </div>
        <div class="col-12 col-sm-4">
          <AppSelect
            v-model="selectedWeekId"
            :options="weekOptions"
            label="Chọn tuần"
            emit-value
            map-options
            clearable
            dense
            hide-bottom-space
          />
        </div>
        <div class="col-auto">
          <AppButton
            flat
            icon="refresh"
            label="Làm mới"
            :loading="loading"
            @click="fetchData"
          />
        </div>
      </div>

      <div
        :aria-busy="loading"
        aria-live="polite"
      >
        <q-table
          :rows="rowsWithKey"
          :columns="columns"
          row-key="row_key"
          flat
          bordered
          dense
          :loading="loading"
          :rows-per-page-options="[0]"
          hide-pagination
          title="Thống kê chỉ đã gán"
        >
          <template #loading>
            <q-inner-loading showing>
              <q-spinner-dots
                size="40px"
                color="primary"
              />
            </q-inner-loading>
          </template>

          <template #no-data>
            <div class="full-width text-center text-grey q-pa-md">
              {{ emptyMessage }}
            </div>
          </template>

          <template #body-cell-gap="cellProps">
            <q-td
              :props="cellProps"
              :class="cellProps.row.gap < 0 ? 'text-negative' : ''"
            >
              {{ cellProps.row.gap }}
            </q-td>
          </template>
        </q-table>
      </div>

      <div
        v-if="filteredRows.length > 0"
        class="text-caption text-grey q-mt-sm"
      >
        Tổng: {{ filteredRows.length }} dòng
      </div>
    </div>

    <template #actions>
      <AppButton
        v-close-popup
        flat
        label="Đóng"
      />
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { QTableColumn } from 'quasar'
import { weeklyOrderService } from '@/services/weeklyOrderService'
import { useSnackbar } from '@/composables/useSnackbar'
import type { AssignmentSummaryRow } from '@/types/thread'
import AppDialog from '@/components/ui/dialogs/AppDialog.vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'

const props = defineProps<{
  modelValue: boolean
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const snackbar = useSnackbar()

const loading = ref(false)
const rows = ref<AssignmentSummaryRow[]>([])
const selectedStatus = ref<string | null>('CONFIRMED')
const selectedWeekId = ref<number | null>(null)

const statusOptions = [
  { label: 'Nháp', value: 'DRAFT' },
  { label: 'Đã xác nhận', value: 'CONFIRMED' },
  { label: 'Hoàn thành', value: 'COMPLETED' },
  { label: 'Đã hủy', value: 'CANCELLED' },
]

const statusLabelMap: Record<string, string> = {
  DRAFT: 'nháp',
  CONFIRMED: 'đã xác nhận',
  COMPLETED: 'hoàn thành',
  CANCELLED: 'đã hủy',
}

const weekOptions = computed(() => {
  const seen = new Map<number, string>()
  for (const r of rows.value) {
    if (!seen.has(r.week_id)) seen.set(r.week_id, r.week_name)
  }
  return Array.from(seen, ([value, label]) => ({ label, value }))
})

const filteredRows = computed(() => {
  if (!selectedWeekId.value) return rows.value
  return rows.value.filter((r) => r.week_id === selectedWeekId.value)
})

const emptyMessage = computed(() => {
  if (selectedWeekId.value) {
    const weekName = weekOptions.value.find((o) => o.value === selectedWeekId.value)?.label
    return `Tuần "${weekName}" chưa có loại chỉ nào được gán`
  }
  if (selectedStatus.value) {
    return `Chưa có tuần đặt hàng nào ở trạng thái ${statusLabelMap[selectedStatus.value] ?? selectedStatus.value}`
  }
  return 'Chưa có tuần đặt hàng nào được xác nhận'
})

const columns = computed<QTableColumn[]>(() => {
  const cols: QTableColumn[] = []
  if (!selectedWeekId.value) {
    cols.push({ name: 'week_name', label: 'Tuần', field: 'week_name', align: 'left', sortable: true })
  }
  cols.push(
    { name: 'thread_type_code', label: 'Loại chỉ', field: (row: any) => row.thread_type_name || row.thread_type_code, align: 'left', sortable: true },
    { name: 'planned_cones', label: 'Kế hoạch', field: 'planned_cones', align: 'right', sortable: true },
    { name: 'reserved_cones', label: 'Đã giữ', field: 'reserved_cones', align: 'right', sortable: true },
    { name: 'allocated_cones', label: 'Đã cấp', field: 'allocated_cones', align: 'right', sortable: true },
    { name: 'gap', label: 'Chênh lệch', field: 'gap', align: 'right', sortable: true },
  )
  return cols
})

const rowsWithKey = computed(() =>
  filteredRows.value.map((r) => ({ ...r, row_key: `${r.week_id}_${r.thread_type_id}` }))
)

function handleStatusChange() {
  selectedWeekId.value = null
  fetchData()
}

async function fetchData() {
  loading.value = true
  try {
    rows.value = await weeklyOrderService.getAssignmentSummary(selectedStatus.value ?? undefined)
  } catch (err: any) {
    snackbar.error(err?.message || 'Không thể tải dữ liệu kiểm soát chỉ')
  } finally {
    loading.value = false
  }
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) fetchData()
  },
)
</script>
