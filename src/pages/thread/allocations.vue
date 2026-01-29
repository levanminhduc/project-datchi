<template>
  <q-page padding>
    <!-- Page Header -->
    <div class="row q-col-gutter-md q-mb-lg items-center">
      <div class="col-12 col-md-3">
        <h1 class="text-h5 q-my-none text-weight-bold text-primary">
          Quản Lý Phân Bổ Chỉ
        </h1>
      </div>

      <div class="col-12 col-md-9">
        <div class="row q-col-gutter-sm justify-end">
          <!-- Search Input -->
          <div class="col-12 col-sm-4 col-md-3">
            <q-input
              v-model="searchQuery"
              placeholder="Tìm mã đơn hàng..."
              outlined
              dense
              clearable
              debounce="300"
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <!-- Filter: Thread Type -->
          <div class="col-12 col-sm-4 col-md-2">
            <AppSelect
              v-model="filters.thread_type_id"
              :options="threadTypeOptions"
              label="Loại chỉ"
              dense
              outlined
              clearable
              emit-value
              map-options
              @update:modelValue="handleFilterChange"
            />
          </div>

          <!-- Filter: Status -->
          <div class="col-12 col-sm-4 col-md-2">
            <AppSelect
              v-model="filters.status"
              :options="statusOptions"
              label="Trạng thái"
              dense
              outlined
              clearable
              emit-value
              map-options
              @update:modelValue="handleFilterChange"
            />
          </div>

          <!-- Filter: Priority -->
          <div class="col-12 col-sm-4 col-md-2">
            <AppSelect
              v-model="filters.priority"
              :options="priorityOptions"
              label="Ưu tiên"
              dense
              outlined
              clearable
              emit-value
              map-options
              @update:modelValue="handleFilterChange"
            />
          </div>

          <!-- Add Button -->
          <div class="col-12 col-sm-auto">
            <q-btn
              color="primary"
              icon="add"
              label="Tạo Phân Bổ"
              unelevated
              class="full-width-xs"
              @click="openCreateDialog"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-6 col-md-2.4" v-for="stat in summaryStats" :key="stat.label">
        <q-card flat bordered class="stat-card">
          <q-card-section class="q-pa-sm">
            <div class="text-caption text-grey-7">{{ stat.label }}</div>
            <div class="text-h6 text-weight-bold" :class="stat.colorClass">
              {{ stat.value }}
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Data Table -->
    <q-table
      v-model:pagination="pagination"
      flat
      bordered
      :rows="allocations"
      :columns="columns"
      row-key="id"
      :loading="isLoading"
      :rows-per-page-options="[10, 25, 50, 100]"
      class="allocation-table shadow-1"
    >
      <!-- Loading Skeleton -->
      <template #loading>
        <q-inner-loading showing>
          <q-spinner-dots size="50px" color="primary" />
        </q-inner-loading>
      </template>

      <!-- Thread Type Column -->
      <template #body-cell-thread_type="props">
        <q-td :props="props">
          <div class="row items-center q-gutter-x-xs">
            <div
              v-if="props.row.thread_type?.color_code"
              class="color-dot shadow-1"
              :style="{ backgroundColor: props.row.thread_type.color_code }"
            />
            <span class="text-weight-medium text-primary">{{ props.row.thread_type?.name || '---' }}</span>
          </div>
        </q-td>
      </template>

      <!-- Requested Meters Column -->
      <template #body-cell-requested_meters="props">
        <q-td :props="props" align="right">
          <span class="font-mono">{{ props.value.toLocaleString() }} m</span>
        </q-td>
      </template>

      <!-- Allocated Meters Column -->
      <template #body-cell-allocated_meters="props">
        <q-td :props="props" align="right">
          <div class="column items-end">
            <div class="text-weight-bold" :class="getAllocationRatioClass(props.row)">
              {{ props.value.toLocaleString() }} m
            </div>
            <div class="text-caption text-grey-6">
              ({{ Math.round((props.row.allocated_meters / (props.row.requested_meters || 1)) * 100) }}%)
            </div>
          </div>
        </q-td>
      </template>

      <!-- Status Column -->
      <template #body-cell-status="props">
        <q-td :props="props" align="center">
          <q-badge :color="statusColors[props.row.status as AllocationStatus]" class="q-py-xs q-px-sm">
            {{ statusLabels[props.row.status as AllocationStatus] }}
          </q-badge>
        </q-td>
      </template>

      <!-- Priority Column -->
      <template #body-cell-priority="props">
        <q-td :props="props" align="center">
          <q-badge :color="priorityColors[props.row.priority as AllocationPriority]" outline class="q-py-xs q-px-sm">
            {{ priorityLabels[props.row.priority as AllocationPriority] }}
          </q-badge>
        </q-td>
      </template>

      <!-- Due Date Column -->
      <template #body-cell-due_date="props">
        <q-td :props="props">
          <div :class="{ 'text-negative text-weight-bold': isOverdue(props.row.due_date) }">
            {{ formatDate(props.row.due_date) }}
          </div>
        </q-td>
      </template>

      <!-- Actions Column -->
      <template #body-cell-actions="props">
        <q-td :props="props" align="center" class="q-gutter-x-xs">
          <q-btn
            flat
            round
            color="primary"
            icon="visibility"
            size="sm"
            @click="openDetailDialog(props.row)"
          >
            <q-tooltip>Xem chi tiết</q-tooltip>
          </q-btn>
          
          <q-btn
            v-if="props.row.status === AllocationStatus.PENDING"
            flat
            round
            color="positive"
            icon="play_arrow"
            size="sm"
            @click="handleExecute(props.row)"
          >
            <q-tooltip>Thực hiện phân bổ</q-tooltip>
          </q-btn>

          <q-btn
            v-if="props.row.status === AllocationStatus.SOFT"
            flat
            round
            color="accent"
            icon="local_shipping"
            size="sm"
            @click="handleIssue(props.row)"
          >
            <q-tooltip>Xuất cho sản xuất</q-tooltip>
          </q-btn>

          <q-btn
            v-if="[AllocationStatus.PENDING, AllocationStatus.SOFT].includes(props.row.status)"
            flat
            round
            color="negative"
            icon="cancel"
            size="sm"
            @click="handleCancel(props.row)"
          >
            <q-tooltip>Hủy yêu cầu</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Create Allocation Dialog -->
    <FormDialog
      v-model="createDialog.isOpen"
      title="Tạo Yêu Cầu Phân Bổ Mới"
      :loading="isLoading"
      max-width="600px"
      @submit="handleCreateSubmit"
      @cancel="closeCreateDialog"
    >
      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6">
          <AppInput
            v-model="createData.order_id"
            label="Mã Đơn Hàng"
            required
            placeholder="VD: ORD-2024-001"
          />
        </div>
        <div class="col-12 col-sm-6">
          <AppInput
            v-model="createData.order_reference"
            label="Tham Chiếu"
            placeholder="Tùy chọn"
          />
        </div>
        
        <div class="col-12">
          <AppSelect
            v-model="createData.thread_type_id"
            label="Loại Chỉ"
            :options="threadTypeOptions"
            required
            emit-value
            map-options
            popup-content-class="z-max"
          />
        </div>

        <div class="col-12 col-sm-6">
          <AppInput
            v-model.number="createData.requested_meters"
            label="Số Mét Yêu Cầu"
            type="number"
            required
            min="1"
          />
        </div>
        <div class="col-12 col-sm-6">
          <AppSelect
            v-model="createData.priority"
            label="Mức Ưu Tiên"
            :options="priorityOptions"
            required
            emit-value
            map-options
            popup-content-class="z-max"
          />
        </div>

        <div class="col-12 col-sm-6">
          <q-input
            v-model="createData.due_date"
            label="Hạn Giao"
            outlined
            dense
            mask="date"
            placeholder="YYYY/MM/DD"
          >
            <template #append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="createData.due_date">
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Đóng" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>

        <div class="col-12">
          <AppInput
            v-model="createData.notes"
            label="Ghi Chú"
            type="textarea"
            rows="3"
            placeholder="Nhập ghi chú nếu có..."
          />
        </div>
      </div>
    </FormDialog>

    <!-- Detail Dialog -->
    <q-dialog v-model="detailDialog.isOpen">
      <q-card v-if="detailDialog.allocation" style="width: 800px; max-width: 95vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Chi Tiết Phân Bổ #{{ detailDialog.allocation.id }}</div>
          <q-space />
          <q-btn v-close-popup icon="close" flat round dense />
        </q-card-section>

        <q-card-section class="q-pa-md">
          <div class="row q-col-gutter-md">
            <!-- Basic Info -->
            <div class="col-12 col-md-6">
              <div class="text-subtitle2 text-grey-7 q-mb-xs">Thông Tin Đơn Hàng</div>
              <div class="q-pa-sm rounded-borders" style="background: rgba(128, 128, 128, 0.08)">
                <div class="row q-mb-xs">
                  <div class="col-5 text-grey-7">Mã đơn hàng:</div>
                  <div class="col-7 text-weight-bold">{{ detailDialog.allocation.order_id }}</div>
                </div>
                <div class="row q-mb-xs">
                  <div class="col-5 text-grey-7">Tham chiếu:</div>
                  <div class="col-7">{{ detailDialog.allocation.order_reference || '---' }}</div>
                </div>
                <div class="row q-mb-xs">
                  <div class="col-5 text-grey-7">Mức ưu tiên:</div>
                  <div class="col-7">
                    <q-badge :color="priorityColors[detailDialog.allocation.priority]" outline>
                      {{ priorityLabels[detailDialog.allocation.priority] }}
                    </q-badge>
                  </div>
                </div>
                <div class="row">
                  <div class="col-5 text-grey-7">Hạn giao:</div>
                  <div class="col-7" :class="{ 'text-negative text-weight-bold': isOverdue(detailDialog.allocation.due_date) }">
                    {{ formatDate(detailDialog.allocation.due_date) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Thread Info -->
            <div class="col-12 col-md-6">
              <div class="text-subtitle2 text-grey-7 q-mb-xs">Yêu Cầu Vật Tư</div>
              <div class="q-pa-sm rounded-borders" style="background: rgba(128, 128, 128, 0.08)">
                <div class="row q-mb-xs">
                  <div class="col-5 text-grey-7">Loại chỉ:</div>
                  <div class="col-7 text-weight-medium text-primary">
                    {{ detailDialog.allocation.thread_type?.name }}
                  </div>
                </div>
                <div class="row q-mb-xs">
                  <div class="col-5 text-grey-7">Số mét yêu cầu:</div>
                  <div class="col-7 text-weight-bold">{{ detailDialog.allocation.requested_meters.toLocaleString() }} m</div>
                </div>
                <div class="row q-mb-xs">
                  <div class="col-5 text-grey-7">Đã phân bổ:</div>
                  <div class="col-7 text-weight-bold" :class="getAllocationRatioClass(detailDialog.allocation)">
                    {{ detailDialog.allocation.allocated_meters.toLocaleString() }} m
                  </div>
                </div>
                <div class="row">
                  <div class="col-5 text-grey-7">Trạng thái:</div>
                  <div class="col-7">
                    <q-badge :color="statusColors[detailDialog.allocation.status]">
                      {{ statusLabels[detailDialog.allocation.status] }}
                    </q-badge>
                  </div>
                </div>
              </div>
            </div>

            <!-- Allocated Cones Table -->
            <div class="col-12">
              <div class="text-subtitle2 text-grey-7 q-mb-xs">Danh Sách Cuộn Đã Gán (Cones)</div>
              <q-table
                flat
                bordered
                dense
                :rows="detailDialog.allocation.allocated_cones || []"
                :columns="coneColumns"
                row-key="id"
                class=""
                no-data-label="Chưa có cuộn chỉ nào được gán"
              >
                <template #body-cell-cone_id="props">
                  <q-td :props="props">
                    <div class="text-weight-medium text-primary">{{ props.row.cone?.cone_id }}</div>
                  </q-td>
                </template>
                <template #body-cell-allocated_meters="props">
                  <q-td :props="props" align="right">
                    <span class="font-mono">{{ props.value.toLocaleString() }} m</span>
                  </q-td>
                </template>
              </q-table>
            </div>

            <!-- Notes -->
            <div class="col-12" v-if="detailDialog.allocation.notes">
              <div class="text-subtitle2 text-grey-7 q-mb-xs">Ghi Chú</div>
              <div class="q-pa-sm rounded-borders text-italic" style="background: rgba(128, 128, 128, 0.08)">
                {{ detailDialog.allocation.notes }}
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-px-md q-pb-md q-gutter-x-sm">
          <q-btn
            v-if="detailDialog.allocation.status === AllocationStatus.PENDING"
            unelevated
            label="Thực Hiện Phân Bổ"
            color="positive"
            @click="handleExecute(detailDialog.allocation!)"
          />
          <q-btn
            v-if="detailDialog.allocation.status === AllocationStatus.SOFT"
            unelevated
            label="Xuất Cho Sản Xuất"
            color="accent"
            @click="handleIssue(detailDialog.allocation!)"
          />
          <q-btn v-close-popup flat label="Đóng" color="grey" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { type QTableColumn } from 'quasar'
import { useAllocations, useThreadTypes, useSnackbar, useConfirm } from '@/composables'
import { AllocationStatus, AllocationPriority } from '@/types/thread/enums'
import type { Allocation, CreateAllocationDTO, AllocationCone } from '@/types/thread/allocation'

// Composables
const snackbar = useSnackbar()
const confirm = useConfirm()
const {
  allocations,
  conflicts,
  isLoading,
  fetchAllocations,
  fetchConflicts,
  createAllocation,
  executeAllocation,
  issueAllocation,
  cancelAllocation,
  fetchAllocationById,
} = useAllocations()

const {
  activeThreadTypes,
  fetchThreadTypes,
} = useThreadTypes()

// Local State
const searchQuery = ref('')
const filters = reactive({
  thread_type_id: undefined as number | undefined,
  status: undefined as AllocationStatus | undefined,
  priority: undefined as AllocationPriority | undefined,
})

const pagination = ref({
  page: 1,
  rowsPerPage: 25,
  sortBy: 'due_date',
  descending: false,
})

// Labels and Colors
const statusColors: Record<AllocationStatus, string> = {
  [AllocationStatus.PENDING]: 'grey',
  [AllocationStatus.SOFT]: 'blue',
  [AllocationStatus.HARD]: 'purple',
  [AllocationStatus.ISSUED]: 'positive',
  [AllocationStatus.CANCELLED]: 'negative',
  [AllocationStatus.WAITLISTED]: 'orange',
}

const statusLabels: Record<AllocationStatus, string> = {
  [AllocationStatus.PENDING]: 'Chờ xử lý',
  [AllocationStatus.SOFT]: 'Đã đặt mềm',
  [AllocationStatus.HARD]: 'Đã đặt cứng',
  [AllocationStatus.ISSUED]: 'Đã xuất',
  [AllocationStatus.CANCELLED]: 'Đã hủy',
  [AllocationStatus.WAITLISTED]: 'Chờ hàng',
}

const priorityColors: Record<AllocationPriority, string> = {
  [AllocationPriority.LOW]: 'grey-7',
  [AllocationPriority.NORMAL]: 'primary',
  [AllocationPriority.HIGH]: 'warning',
  [AllocationPriority.URGENT]: 'negative',
}

const priorityLabels: Record<AllocationPriority, string> = {
  [AllocationPriority.LOW]: 'Thấp',
  [AllocationPriority.NORMAL]: 'Bình thường',
  [AllocationPriority.HIGH]: 'Cao',
  [AllocationPriority.URGENT]: 'Khẩn cấp',
}

// Options
const statusOptions = Object.entries(statusLabels).map(([value, label]) => ({
  label,
  value: value as AllocationStatus,
}))

const priorityOptions = Object.entries(priorityLabels).map(([value, label]) => ({
  label,
  value: value as AllocationPriority,
}))

const threadTypeOptions = computed(() =>
  activeThreadTypes.value.map(t => ({
    label: `${t.code} - ${t.name}`,
    value: t.id
  }))
)

// Summary Stats
const summaryStats = computed(() => [
  {
    label: 'Tổng yêu cầu',
    value: allocations.value.length,
    colorClass: 'text-primary'
  },
  {
    label: 'Chờ xử lý',
    value: allocations.value.filter(a => a.status === AllocationStatus.PENDING).length,
    colorClass: 'text-grey-7'
  },
  {
    label: 'Đã phân bổ',
    value: allocations.value.filter(a => a.status === AllocationStatus.SOFT).length,
    colorClass: 'text-blue'
  },
  {
    label: 'Đã xuất',
    value: allocations.value.filter(a => a.status === AllocationStatus.ISSUED).length,
    colorClass: 'text-positive'
  },
  {
    label: 'Xung đột',
    value: conflicts.value.length,
    colorClass: 'text-negative'
  }
])

// Table Columns
const columns: QTableColumn[] = [
  {
    name: 'order_id',
    label: 'Mã Đơn Hàng',
    field: 'order_id',
    align: 'left',
    sortable: true,
  },
  {
    name: 'thread_type',
    label: 'Loại Chỉ',
    field: (row: Allocation) => row.thread_type?.name,
    align: 'left',
    sortable: true,
  },
  {
    name: 'requested_meters',
    label: 'Yêu Cầu (m)',
    field: 'requested_meters',
    align: 'right',
    sortable: true,
  },
  {
    name: 'allocated_meters',
    label: 'Đã Phân Bổ (m)',
    field: 'allocated_meters',
    align: 'right',
    sortable: true,
  },
  {
    name: 'status',
    label: 'Trạng Thái',
    field: 'status',
    align: 'center',
    sortable: true,
  },
  {
    name: 'priority',
    label: 'Ưu Tiên',
    field: 'priority',
    align: 'center',
    sortable: true,
  },
  {
    name: 'due_date',
    label: 'Hạn Giao',
    field: 'due_date',
    align: 'left',
    sortable: true,
  },
  {
    name: 'actions',
    label: 'Thao Tác',
    field: 'actions',
    align: 'center',
  },
]

const coneColumns: QTableColumn[] = [
  {
    name: 'cone_id',
    label: 'Mã Cuộn',
    field: (row: AllocationCone) => row.cone?.cone_id,
    align: 'left',
  },
  {
    name: 'lot_number',
    label: 'Số Lô',
    field: (row: AllocationCone) => row.cone?.lot_number,
    align: 'left',
  },
  {
    name: 'warehouse',
    label: 'Kho',
    field: (row: AllocationCone) => row.cone?.warehouse_code,
    align: 'left',
  },
  {
    name: 'allocated_meters',
    label: 'Số Mét Gán',
    field: 'allocated_meters',
    align: 'right',
  },
]

// Dialogs State
const createDialog = reactive({
  isOpen: false,
})

const detailDialog = reactive({
  isOpen: false,
  allocation: null as Allocation | null,
})

// Form Data
const createData = reactive<CreateAllocationDTO>({
  order_id: '',
  order_reference: '',
  thread_type_id: 0,
  requested_meters: 0,
  priority: AllocationPriority.NORMAL,
  due_date: '',
  notes: '',
})

// Handlers
const handleFilterChange = () => {
  fetchAllocations({
    order_id: searchQuery.value || undefined,
    ...filters
  })
}

watch(searchQuery, (newVal) => {
  pagination.value.page = 1
  fetchAllocations({
    order_id: newVal || undefined,
    ...filters
  })
})

const openCreateDialog = () => {
  Object.assign(createData, {
    order_id: '',
    order_reference: '',
    thread_type_id: activeThreadTypes.value[0]?.id || 0,
    requested_meters: 0,
    priority: AllocationPriority.NORMAL,
    due_date: new Date().toISOString().split('T')[0].replace(/-/g, '/'),
    notes: '',
  })
  createDialog.isOpen = true
}

const closeCreateDialog = () => {
  createDialog.isOpen = false
}

const handleCreateSubmit = async () => {
  if (!createData.order_id || !createData.thread_type_id || createData.requested_meters <= 0) {
    snackbar.warning('Vui lòng điền đầy đủ thông tin bắt buộc')
    return
  }

  const result = await createAllocation({ ...createData })
  if (result) {
    closeCreateDialog()
  }
}

const openDetailDialog = async (allocation: Allocation) => {
  const detailed = await fetchAllocationById(allocation.id)
  if (detailed) {
    detailDialog.allocation = detailed
    detailDialog.isOpen = true
  }
}

const handleExecute = async (allocation: Allocation) => {
  const confirmed = await confirm({
    title: 'Xác nhận phân bổ',
    message: `Thực hiện phân bổ mềm cho đơn hàng ${allocation.order_id}? Hệ thống sẽ tự động gán các cuộn chỉ khả dụng.`,
    color: 'positive',
    ok: 'Thực hiện',
  })

  if (confirmed) {
    await executeAllocation(allocation.id)
    if (detailDialog.isOpen && detailDialog.allocation?.id === allocation.id) {
      await openDetailDialog(allocation)
    }
  }
}

const handleIssue = async (allocation: Allocation) => {
  const confirmed = await confirm({
    title: 'Xác nhận xuất chỉ',
    message: `Xuất ${allocation.allocated_meters}m chỉ cho đơn hàng ${allocation.order_id}? Trạng thái các cuộn chỉ sẽ chuyển sang "Đang sản xuất".`,
    color: 'accent',
    ok: 'Xác nhận xuất',
  })

  if (confirmed) {
    await issueAllocation(allocation.id)
    if (detailDialog.isOpen && detailDialog.allocation?.id === allocation.id) {
      await openDetailDialog(allocation)
    }
  }
}

const handleCancel = async (allocation: Allocation) => {
  const confirmed = await confirm({
    title: 'Xác nhận hủy',
    message: `Hủy yêu cầu phân bổ cho đơn hàng ${allocation.order_id}? Các cuộn chỉ đã gán (nếu có) sẽ được giải phóng.`,
    color: 'negative',
    ok: 'Hủy yêu cầu',
  })

  if (confirmed) {
    await cancelAllocation(allocation.id)
    if (detailDialog.isOpen && detailDialog.allocation?.id === allocation.id) {
      detailDialog.isOpen = false
    }
  }
}

// Utils
const formatDate = (dateString: string | null): string => {
  if (!dateString) return '---'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

const isOverdue = (dueDate: string | null): boolean => {
  if (!dueDate) return false
  return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString()
}

const getAllocationRatioClass = (allocation: Allocation): string => {
  const ratio = allocation.allocated_meters / (allocation.requested_meters || 1)
  if (ratio >= 1) return 'text-positive'
  if (ratio > 0) return 'text-warning'
  return 'text-grey-7'
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    fetchAllocations(),
    fetchConflicts(),
    fetchThreadTypes(),
  ])
})
</script>

<style scoped lang="scss">
.allocation-table {
  :deep(.q-table__top) {
    padding: 0;
  }
}

.stat-card {
  transition: transform 0.2s;
  &:hover {
    transform: translateY(-2px);
  }
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.font-mono {
  font-family: monospace;
}

.rounded-borders {
  border-radius: 4px;
}

.full-width-xs {
  @media (max-width: 599px) {
    width: 100%;
  }
}
</style>
