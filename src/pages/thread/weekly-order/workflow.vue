<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">
      Quy Trình Đặt Chỉ Theo Tuần
    </div>

    <q-card
      flat
      bordered
      class="q-pa-md q-mb-md"
    >
      <div class="row q-col-gutter-md items-center">
        <div class="col-12 col-md-4">
          <AppSelect
            v-model="weekId"
            :options="weekOptions"
            label="Tuần đặt hàng"
            emit-value
            map-options
            clearable
            use-input
            fill-input
            hide-selected
            @update:model-value="onWeekChange"
          />
        </div>
        <div class="col-12 col-md-3">
          <PoSearchPopup @select-week="onPoSearchSelect" />
        </div>
        <div class="col-12 col-md-5 text-right">
          <AppButton
            icon="refresh"
            label="Tải lại"
            :loading="loading"
            :disable="!weekId"
            @click="loadTrace"
          />
        </div>
      </div>
    </q-card>

    <div
      v-if="!weekId"
      class="column items-center q-pa-xl text-grey"
    >
      <q-icon
        name="o_account_tree"
        size="64px"
        class="q-mb-md"
      />
      <span>Chọn một Tuần Hàng để xem workflow quy trình đặt chỉ</span>
    </div>

    <div
      v-else-if="loading && !trace"
      class="row justify-center q-py-xl"
    >
      <q-spinner-dots
        size="40px"
        color="primary"
      />
    </div>

    <template v-else-if="trace">
      <q-card
        flat
        bordered
        class="q-mb-md"
      >
        <q-card-section class="q-pb-none row items-center q-gutter-sm">
          <div class="text-subtitle1 text-weight-medium">
            {{ trace.week.week_name }}
          </div>
          <q-chip
            :color="weekStatusChip.color"
            text-color="white"
            dense
            size="sm"
          >
            {{ weekStatusChip.label }}
          </q-chip>
          <q-space />
          <span class="text-caption text-grey-7">
            Click vào một bước để lọc danh sách dòng chỉ bên dưới
          </span>
        </q-card-section>
        <q-card-section>
          <WorkflowMap
            :trace="trace"
            :selected-node="selectedNode"
            @select-node="onSelectNode"
          />
        </q-card-section>
      </q-card>

      <q-card
        v-if="trace.rows.length > 0"
        flat
        bordered
      >
        <q-card-section class="row items-center q-gutter-sm">
          <div class="text-subtitle1 text-weight-medium">
            Chi Tiết Dòng Chỉ
          </div>
          <q-chip
            v-if="selectedNode && activeNodeFilter"
            removable
            dense
            color="primary"
            text-color="white"
            @remove="onSelectNode(null)"
          >
            Lọc: {{ activeNodeFilter.label }}
          </q-chip>
          <q-space />
          <q-input
            v-model="search"
            dense
            outlined
            clearable
            placeholder="Tìm NCC, Tex, màu..."
            class="wf-search"
          >
            <template #prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </q-card-section>
        <q-table
          v-model:pagination="pagination"
          :rows="filteredRows"
          :columns="columns"
          row-key="row_key"
          flat
          bordered
          dense
          hide-pagination
          :rows-per-page-options="[0]"
          no-data-label="Không có dòng chỉ nào khớp bộ lọc"
        >
          <template #body="bodyProps">
            <q-tr :props="bodyProps">
              <q-td auto-width>
                <q-btn
                  flat
                  round
                  dense
                  size="sm"
                  :icon="bodyProps.expand ? 'expand_less' : 'expand_more'"
                  @click="bodyProps.expand = !bodyProps.expand"
                >
                  <AppTooltip>Xem chi tiết đợt giao, PO, vị trí kho</AppTooltip>
                </q-btn>
              </q-td>
              <q-td
                v-for="col in dataCols(bodyProps.cols)"
                :key="col.name"
                :props="bodyProps"
              >
                <span
                  v-if="col.name === 'assignment_gap_cones'"
                  :class="getGapClass(bodyProps.row.assignment_gap_cones)"
                >
                  {{ formatGapQty(bodyProps.row.assignment_gap_cones) }}
                </span>
                <template v-else>
                  {{ col.value }}
                </template>
              </q-td>
            </q-tr>
            <q-tr
              v-if="bodyProps.expand"
              :props="bodyProps"
              no-hover
            >
              <q-td
                colspan="100%"
                class="wf-detail-cell"
              >
                <WorkflowRowDetail :row="bodyProps.row" />
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </q-card>
      <div
        v-else
        class="text-center text-grey q-pa-md"
      >
        Chưa có dữ liệu truy xuất cho tuần này
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import type { QTableColumn } from 'quasar'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import PoSearchPopup from '@/components/thread/transfer-reserved/PoSearchPopup.vue'
import AppTooltip from '@/components/ui/dialogs/AppTooltip.vue'
import WorkflowMap from '@/components/thread/weekly-order/workflow/WorkflowMap.vue'
import WorkflowRowDetail from '@/components/thread/weekly-order/workflow/WorkflowRowDetail.vue'
import { formatQty, formatGapQty, getGapClass, getWeekStatusChip } from '@/components/thread/weekly-order/workflow/workflow-format'
import { weeklyOrderService } from '@/services/weeklyOrderService'
import { useSnackbar } from '@/composables/useSnackbar'
import type { WeeklyOrderProcessTraceResponse, WeeklyOrderProcessTraceRow } from '@/types/thread'

definePage({
  meta: {
    requiresAuth: true,
    permissions: ['thread.weekly-order.view'],
  },
})

const route = useRoute()
const snackbar = useSnackbar()

const weekId = ref<number | null>(null)
const weekOptions = ref<Array<{ label: string; value: number }>>([])
const trace = ref<WeeklyOrderProcessTraceResponse | null>(null)
const loading = ref(false)
const selectedNode = ref<string | null>(null)
const search = ref('')

const weekStatusChip = computed(() => getWeekStatusChip(trace.value?.week.status ?? ''))

function orderedFromNccOf(row: WeeklyOrderProcessTraceRow) {
  return row.delivery_lines.reduce((sum, line) =>
    line.status === 'CANCELLED' ? sum : sum + line.quantity_cones, 0)
}

function stockWithdrawOf(row: WeeklyOrderProcessTraceRow) {
  return Math.max(0, row.assignment_target_cones - orderedFromNccOf(row))
}

interface NodeFilter {
  label: string
  predicate: (row: WeeklyOrderProcessTraceRow) => boolean
  main: string
  metrics: string[]
}

const NODE_FILTERS: Record<string, NodeFilter> = {
  supplier: {
    label: 'Đặt NCC',
    predicate: row => orderedFromNccOf(row) > 0,
    main: 'ordered_from_ncc',
    metrics: ['required_cones', 'assignment_target_cones', 'ordered_from_ncc', 'pending_delivery_cones', 'received_cones'],
  },
  delivery: {
    label: 'Chờ NCC Giao',
    predicate: row => row.pending_delivery_cones > 0,
    main: 'pending_delivery_cones',
    metrics: ['ordered_from_ncc', 'pending_delivery_cones', 'pending_receive_cones', 'received_cones'],
  },
  receiving: {
    label: 'Đã Giao – Chờ Nhập',
    predicate: row => row.pending_receive_cones > 0,
    main: 'pending_receive_cones',
    metrics: ['ordered_from_ncc', 'pending_delivery_cones', 'pending_receive_cones', 'received_cones'],
  },
  received: {
    label: 'Đã Nhập Kho',
    predicate: row => row.received_cones > 0,
    main: 'received_cones',
    metrics: ['ordered_from_ncc', 'pending_receive_cones', 'received_cones', 'reserved_cones'],
  },
  reserve: {
    label: 'Rút Tồn Kho',
    predicate: row => stockWithdrawOf(row) > 0,
    main: 'stock_withdraw',
    metrics: ['required_cones', 'assignment_target_cones', 'ordered_from_ncc', 'stock_withdraw'],
  },
  warehouse: {
    label: 'Kho Tuần',
    predicate: row => row.reserved_cones > 0,
    main: 'reserved_cones',
    metrics: ['required_cones', 'reserved_cones', 'reserved_physical_cones', 'issued_from_reserved_cones'],
  },
  issue: {
    label: 'Xuất Kho',
    predicate: row => row.issued_gross_cones > 0,
    main: 'issued_gross_cones',
    metrics: ['reserved_cones', 'issued_gross_cones', 'issued_from_reserved_cones', 'issued_from_available_cones', 'returned_cones'],
  },
  return: {
    label: 'Trả Kho',
    predicate: row => row.returned_cones > 0,
    main: 'returned_cones',
    metrics: ['issued_gross_cones', 'issued_from_reserved_cones', 'returned_cones'],
  },
}

const activeNodeFilter = computed(() =>
  selectedNode.value ? NODE_FILTERS[selectedNode.value] ?? null : null)

const filteredRows = computed(() => {
  let rows = trace.value?.rows ?? []
  const nodeFilter = activeNodeFilter.value
  if (nodeFilter) rows = rows.filter(nodeFilter.predicate)
  const term = (search.value || '').trim().toLowerCase()
  if (term) {
    rows = rows.filter(row =>
      row.supplier_name.toLowerCase().includes(term)
      || row.tex_number.toLowerCase().includes(term)
      || row.color_name.toLowerCase().includes(term))
  }
  return rows
})

const ALL_COLUMNS: Record<string, QTableColumn> = {
  expand: { name: 'expand', label: '', field: () => '', align: 'left' },
  supplier_name: { name: 'supplier_name', label: 'NCC', field: 'supplier_name', align: 'left', sortable: true },
  tex_number: { name: 'tex_number', label: 'Tex', field: 'tex_number', align: 'center', sortable: true },
  color_name: { name: 'color_name', label: 'Màu chỉ', field: 'color_name', align: 'left', sortable: true },
  required_cones: { name: 'required_cones', label: 'Nhu cầu', field: 'required_cones', align: 'right', sortable: true, format: (value: number) => formatQty(value) },
  assignment_target_cones: { name: 'assignment_target_cones', label: 'Tổng cần', field: 'assignment_target_cones', align: 'right', sortable: true, format: (value: number) => formatQty(value) },
  ordered_from_ncc: { name: 'ordered_from_ncc', label: 'Đặt NCC', field: (row: WeeklyOrderProcessTraceRow) => orderedFromNccOf(row), align: 'right', sortable: true, format: (value: number) => formatQty(value) },
  stock_withdraw: { name: 'stock_withdraw', label: 'Rút tồn', field: (row: WeeklyOrderProcessTraceRow) => stockWithdrawOf(row), align: 'right', sortable: true, format: (value: number) => formatQty(value) },
  pending_delivery_cones: { name: 'pending_delivery_cones', label: 'Chờ giao', field: 'pending_delivery_cones', align: 'right', sortable: true, format: (value: number) => formatQty(value) },
  pending_receive_cones: { name: 'pending_receive_cones', label: 'Chờ nhập', field: 'pending_receive_cones', align: 'right', sortable: true, format: (value: number) => formatQty(value) },
  received_cones: { name: 'received_cones', label: 'Đã nhập', field: 'received_cones', align: 'right', sortable: true, format: (value: number) => formatQty(value) },
  reserved_cones: { name: 'reserved_cones', label: 'Đang ở kho', field: 'reserved_cones', align: 'right', sortable: true, format: (value: number) => formatQty(value) },
  reserved_physical_cones: { name: 'reserved_physical_cones', label: 'Cuộn vật lý', field: 'reserved_physical_cones', align: 'right', sortable: true, format: (value: number) => formatQty(value) },
  issued_gross_cones: { name: 'issued_gross_cones', label: 'Đã xuất', field: 'issued_gross_cones', align: 'right', sortable: true, format: (value: number) => formatQty(value) },
  issued_from_reserved_cones: { name: 'issued_from_reserved_cones', label: 'Từ kho tuần', field: 'issued_from_reserved_cones', align: 'right', sortable: true, format: (value: number) => formatQty(value) },
  issued_from_available_cones: { name: 'issued_from_available_cones', label: 'Từ khả dụng', field: 'issued_from_available_cones', align: 'right', sortable: true, format: (value: number) => formatQty(value) },
  returned_cones: { name: 'returned_cones', label: 'Đã trả', field: 'returned_cones', align: 'right', sortable: true, format: (value: number) => formatQty(value) },
  assignment_gap_cones: { name: 'assignment_gap_cones', label: 'Thiếu / dư', field: 'assignment_gap_cones', align: 'right', sortable: true },
}

const DEFAULT_COLUMN_NAMES = [
  'supplier_name', 'tex_number', 'color_name', 'required_cones', 'ordered_from_ncc',
  'pending_delivery_cones', 'pending_receive_cones', 'received_cones', 'reserved_cones',
  'issued_gross_cones', 'returned_cones', 'assignment_gap_cones',
]

const columns = computed<QTableColumn[]>(() => {
  const filter = activeNodeFilter.value
  const names = filter
    ? ['supplier_name', 'tex_number', 'color_name', ...filter.metrics]
    : DEFAULT_COLUMN_NAMES
  return ['expand', ...names].map(name => {
    const col = ALL_COLUMNS[name] as QTableColumn
    if (filter && name === filter.main) {
      return { ...col, classes: 'wf-col-main', headerClasses: 'wf-col-main' }
    }
    return col
  })
})

const pagination = ref<{ sortBy: string | null; descending: boolean; page: number; rowsPerPage: number }>({
  sortBy: null,
  descending: false,
  page: 1,
  rowsPerPage: 0,
})

function dataCols(cols: ReadonlyArray<QTableColumn & { value?: unknown }>) {
  return cols.filter(col => col.name !== 'expand')
}

async function loadWeeks() {
  try {
    const weeks = await weeklyOrderService.getAll()
    weekOptions.value = weeks.map(week => ({ label: week.week_name, value: week.id }))
  } catch (err: unknown) {
    snackbar.error(err instanceof Error ? err.message : 'Lỗi tải danh sách tuần')
  }
}

async function loadTrace() {
  if (!weekId.value) return
  loading.value = true
  try {
    trace.value = await weeklyOrderService.getProcessTrace(weekId.value)
  } catch (err: unknown) {
    trace.value = null
    snackbar.error(err instanceof Error ? err.message : 'Lỗi tải dữ liệu quy trình')
  } finally {
    loading.value = false
  }
}

function onWeekChange() {
  selectedNode.value = null
  search.value = ''
  trace.value = null
  if (weekId.value) void loadTrace()
}

function onPoSearchSelect(payload: { weekId: number; poNumber: string }) {
  weekId.value = payload.weekId
  onWeekChange()
}

function onSelectNode(key: string | null) {
  selectedNode.value = key
  const filter = key ? NODE_FILTERS[key] ?? null : null
  pagination.value = {
    ...pagination.value,
    sortBy: filter ? filter.main : null,
    descending: filter !== null,
  }
}

onMounted(async () => {
  await loadWeeks()
  const queryWeekId = Number(route.query.week_id)
  if (Number.isInteger(queryWeekId) && queryWeekId > 0) {
    weekId.value = queryWeekId
    void loadTrace()
  }
})
</script>

<style scoped lang="scss">
.wf-search {
  width: 260px;
  max-width: 100%;
}

:deep(.wf-col-main) {
  background: rgba(25, 118, 210, 0.08);
}

:deep(.wf-detail-cell) {
  background: #fafafa;
}
</style>
