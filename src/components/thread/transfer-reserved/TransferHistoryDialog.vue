<template>
  <AppDialog
    v-model="show"
    full-width
    :card-style="{ maxWidth: '1100px' }"
  >
    <template #header>
      Lịch sử chuyển kho
      <span
        v-if="weekLabel"
        class="text-subtitle2 text-grey-7 q-ml-sm"
      >
        — {{ weekLabel }}
      </span>
    </template>

    <template #default>
      <div class="row q-col-gutter-md q-mb-md items-stretch">
        <div class="col-12 col-sm-6 col-md-3">
          <AppCard
            flat
            bordered
            class="full-height"
          >
            <q-card-section class="row items-center no-wrap">
              <q-icon
                name="swap_horiz"
                color="info"
                size="32px"
                class="q-mr-md"
              />
              <div>
                <div class="text-caption text-grey">
                  Tổng lần chuyển
                </div>
                <div class="text-h6 text-weight-bold">
                  {{ summary.total_transfers }}
                </div>
              </div>
            </q-card-section>
          </AppCard>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <AppCard
            flat
            bordered
            class="full-height"
          >
            <q-card-section class="row items-center no-wrap">
              <q-icon
                name="inventory_2"
                color="primary"
                size="32px"
                class="q-mr-md"
              />
              <div>
                <div class="text-caption text-grey">
                  Tổng cuộn đã chuyển
                </div>
                <div class="text-h6 text-weight-bold">
                  {{ summary.total_cones }}
                </div>
              </div>
            </q-card-section>
          </AppCard>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <AppCard
            flat
            bordered
            class="full-height"
          >
            <q-card-section class="row items-center no-wrap">
              <q-icon
                name="output"
                color="warning"
                size="32px"
                class="q-mr-md"
              />
              <div>
                <div class="text-caption text-grey">
                  Kho xuất nhiều nhất
                </div>
                <div class="text-body1 text-weight-bold">
                  {{ summary.top_source?.name || '-' }}
                </div>
                <div
                  v-if="summary.top_source"
                  class="text-caption text-grey"
                >
                  {{ summary.top_source.count }} lần
                </div>
              </div>
            </q-card-section>
          </AppCard>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <AppCard
            flat
            bordered
            class="full-height"
          >
            <q-card-section class="row items-center no-wrap">
              <q-icon
                name="input"
                color="positive"
                size="32px"
                class="q-mr-md"
              />
              <div>
                <div class="text-caption text-grey">
                  Kho nhận nhiều nhất
                </div>
                <div class="text-body1 text-weight-bold">
                  {{ summary.top_destination?.name || '-' }}
                </div>
                <div
                  v-if="summary.top_destination"
                  class="text-caption text-grey"
                >
                  {{ summary.top_destination.count }} lần
                </div>
              </div>
            </q-card-section>
          </AppCard>
        </div>
      </div>

      <DataTable
        :rows="items"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :pagination="pagination"
        @request="handleTableRequest"
      >
        <template #body-cell-warehouses="props">
          <q-td :props="props">
            <span>{{ props.row.from_warehouse?.name || '-' }}</span>
            <q-icon
              name="arrow_forward"
              size="xs"
              class="q-mx-xs text-grey"
            />
            <span>{{ props.row.to_warehouse?.name || '-' }}</span>
          </q-td>
        </template>

        <template #body-cell-cone_count="props">
          <q-td :props="props">
            <span class="text-weight-bold">{{ props.row.cone_count }}</span>
            <span class="text-grey-6 q-ml-xs">cuộn</span>
          </q-td>
        </template>

        <template #body-cell-performed_at="props">
          <q-td :props="props">
            {{ formatDateTime(props.row.performed_at) }}
          </q-td>
        </template>

        <template #body-cell-performed_by="props">
          <q-td :props="props">
            {{ employeeName(props.row.performed_by) }}
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <IconButton
              icon="visibility"
              color="primary"
              @click="viewDetail(props.row)"
            >
              <AppTooltip text="Chi tiết" />
            </IconButton>
          </q-td>
        </template>
      </DataTable>
    </template>

    <template #actions>
      <AppButton
        variant="flat"
        label="Đóng"
        color="primary"
        @click="show = false"
      />
    </template>
  </AppDialog>

  <AppDialog v-model="showDetail">
    <template #header>
      Chi tiết chuyển kho #{{ selected?.id }}
    </template>

    <template
      v-if="selected"
      #default
    >
      <div class="row q-col-gutter-md">
        <div class="col-6">
          <div class="text-caption text-grey">
            Kho xuất
          </div>
          <div class="text-body1">
            {{ selected.from_warehouse?.name || '-' }}
          </div>
        </div>
        <div class="col-6">
          <div class="text-caption text-grey">
            Kho nhận
          </div>
          <div class="text-body1">
            {{ selected.to_warehouse?.name || '-' }}
          </div>
        </div>
        <div class="col-6">
          <div class="text-caption text-grey">
            Số cuộn
          </div>
          <div class="text-body1 text-weight-bold">
            {{ selected.cone_count }}
          </div>
        </div>
        <div
          v-if="selected.performed_by"
          class="col-6"
        >
          <div class="text-caption text-grey">
            Người thực hiện
          </div>
          <div class="text-body1">
            {{ employeeName(selected.performed_by) }}
          </div>
        </div>
        <div class="col-6">
          <div class="text-caption text-grey">
            Thời gian
          </div>
          <div class="text-body1">
            {{ formatDateTime(selected.performed_at) }}
          </div>
        </div>
        <div
          v-if="selected.notes"
          class="col-12"
        >
          <div class="text-caption text-grey">
            Ghi chú
          </div>
          <div class="text-body1">
            {{ selected.notes }}
          </div>
        </div>
      </div>

      <q-separator class="q-my-md" />
      <div class="text-subtitle2 q-mb-sm">
        Loại chỉ ({{ coneSummary.length }} loại — {{ selected.cone_count }} cuộn)
      </div>
      <DataTable
        :rows="coneSummary"
        :columns="coneSummaryColumns"
        :loading="coneSummaryLoading"
        row-key="thread_type_id"
        dense
        hide-bottom
        flat
      >
        <template #body-cell-stt="props">
          <q-td :props="props">
            {{ props.rowIndex + 1 }}
          </q-td>
        </template>
      </DataTable>
    </template>

    <template #actions>
      <AppButton
        variant="flat"
        label="Đóng"
        color="primary"
        @click="showDetail = false"
      />
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import AppDialog from '@/components/ui/dialogs/AppDialog.vue'
import AppTooltip from '@/components/ui/dialogs/AppTooltip.vue'
import AppCard from '@/components/ui/cards/AppCard.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import IconButton from '@/components/ui/buttons/IconButton.vue'
import DataTable from '@/components/ui/tables/DataTable.vue'
import { useTransferHistory } from '@/composables/useTransferHistory'
import { useSnackbar } from '@/composables/useSnackbar'
import { batchService } from '@/services/batchService'
import { employeeService } from '@/services/employeeService'
import type { TransferHistoryItem, ConeSummaryItem } from '@/types/thread/batch'
import type { QTableColumn } from 'quasar'

interface Props {
  modelValue: boolean
  weekId: number | null
  weekLabel?: string
}
const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const show = ref(props.modelValue)
watch(
  () => props.modelValue,
  (v) => {
    show.value = v
    if (v) loadByWeek()
  }
)
watch(show, (v) => emit('update:modelValue', v))

const snackbar = useSnackbar()
const {
  items,
  summary,
  loading,
  filters,
  pagination,
  fetchHistory,
  fetchSummary,
  handleTableRequest,
} = useTransferHistory()

const showDetail = ref(false)
const selected = ref<TransferHistoryItem | null>(null)
const coneSummary = ref<ConeSummaryItem[]>([])
const coneSummaryLoading = ref(false)

const employeeMap = ref<Map<string, string>>(new Map())

async function loadEmployees() {
  if (employeeMap.value.size > 0) return
  try {
    const list = await employeeService.getAll()
    const m = new Map<string, string>()
    for (const e of list) {
      m.set(e.employee_id, e.full_name)
    }
    employeeMap.value = m
  } catch {
    // bỏ qua, fallback hiển thị mã NV
  }
}

function employeeName(code: string | null): string {
  if (!code) return '-'
  return employeeMap.value.get(code) || code
}

const columns: QTableColumn[] = [
  { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
  { name: 'warehouses', label: 'Kho nguồn → Kho đích', field: 'warehouses', align: 'left' },
  { name: 'cone_count', label: 'Số cuộn', field: 'cone_count', align: 'left', sortable: true },
  { name: 'performed_by', label: 'Người thực hiện', field: 'performed_by', align: 'left' },
  { name: 'performed_at', label: 'Thời gian', field: 'performed_at', align: 'left', sortable: true },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
]

const coneSummaryColumns: QTableColumn[] = [
  { name: 'stt', label: '#', field: 'thread_type_id', align: 'center', style: 'width: 50px' },
  { name: 'supplier_name', label: 'NCC', field: 'supplier_name', align: 'left' },
  { name: 'tex_number', label: 'Tex', field: 'tex_number', align: 'center' },
  { name: 'color_name', label: 'Màu', field: 'color_name', align: 'left' },
  { name: 'cone_count', label: 'Số cuộn', field: 'cone_count', align: 'center' },
]

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('vi-VN')
}

async function loadByWeek() {
  if (!props.weekId) {
    snackbar.error('Vui lòng chọn tuần đặt hàng trước')
    show.value = false
    return
  }
  filters.value = { search: `#${props.weekId}` }
  pagination.value.page = 1
  await Promise.all([fetchHistory(), fetchSummary(), loadEmployees()])
}

async function viewDetail(row: TransferHistoryItem) {
  selected.value = row
  coneSummary.value = []
  showDetail.value = true
  coneSummaryLoading.value = true
  try {
    coneSummary.value = await batchService.getTransferConeSummary(row.id)
  } catch {
    coneSummary.value = []
    snackbar.error('Không tải được tổng hợp cuộn chỉ')
  } finally {
    coneSummaryLoading.value = false
  }
}

async function refresh() {
  if (!show.value || !props.weekId) return
  await Promise.all([fetchHistory(), fetchSummary()])
}

defineExpose({ refresh })
</script>
