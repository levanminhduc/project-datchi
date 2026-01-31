<template>
  <q-page padding>
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
      <h5 class="q-ma-none text-weight-bold text-primary">
        Báo Cáo Phân Bổ
      </h5>
    </div>

    <!-- Filters Row -->
    <q-card
      flat
      bordered
      class="q-mb-md"
    >
      <q-card-section>
        <div class="row q-col-gutter-md">
          <!-- From Date -->
          <div class="col-12 col-sm-6 col-md-2">
            <AppInput
              v-model="filters.from_date"
              label="Từ ngày"
              placeholder="DD/MM/YYYY"
              dense
              clearable
            >
              <template #append>
                <q-icon
                  name="event"
                  class="cursor-pointer"
                >
                  <q-popup-proxy
                    cover
                    transition-show="scale"
                    transition-hide="scale"
                  >
                    <DatePicker v-model="filters.from_date" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </AppInput>
          </div>

          <!-- To Date -->
          <div class="col-12 col-sm-6 col-md-2">
            <AppInput
              v-model="filters.to_date"
              label="Đến ngày"
              placeholder="DD/MM/YYYY"
              dense
              clearable
            >
              <template #append>
                <q-icon
                  name="event"
                  class="cursor-pointer"
                >
                  <q-popup-proxy
                    cover
                    transition-show="scale"
                    transition-hide="scale"
                  >
                    <DatePicker v-model="filters.to_date" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </AppInput>
          </div>

          <!-- Thread Type Filter -->
          <div class="col-12 col-sm-6 col-md-2">
            <AppSelect
              v-model="filters.thread_type_id"
              :options="threadTypeOptions"
              label="Loại chỉ"
              emit-value
              map-options
              clearable
              dense
              outlined
            />
          </div>

          <!-- Status Filter -->
          <div class="col-12 col-sm-6 col-md-2">
            <AppSelect
              v-model="filters.status"
              :options="statusOptions"
              label="Trạng thái"
              emit-value
              map-options
              clearable
              dense
              outlined
            />
          </div>

          <!-- Generate Button -->
          <div class="col-12 col-sm-auto">
            <q-btn
              label="Tạo Báo Cáo"
              color="primary"
              icon="assessment"
              :loading="isLoading"
              class="full-width-xs"
              unelevated
              @click="handleGenerateReport"
            />
          </div>

          <!-- Clear Button -->
          <div class="col-12 col-sm-auto">
            <q-btn
              label="Xóa Bộ Lọc"
              color="grey"
              icon="clear"
              flat
              class="full-width-xs"
              @click="handleClearFilters"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Summary Cards (only show when has data) -->
    <div
      v-if="hasData"
      class="row q-col-gutter-md q-mb-md"
    >
      <div class="col-6 col-md-3">
        <q-card
          flat
          bordered
        >
          <q-card-section class="text-center">
            <div class="text-h4 text-primary">
              {{ summary?.totalAllocations || 0 }}
            </div>
            <div class="text-caption text-grey">
              Tổng Phân Bổ
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-6 col-md-3">
        <q-card
          flat
          bordered
        >
          <q-card-section class="text-center">
            <div
              class="text-h4"
              :class="fulfillmentRateColor"
            >
              {{ summary?.fulfillmentRate?.toFixed(1) || 0 }}%
            </div>
            <div class="text-caption text-grey">
              Tỷ Lệ Hoàn Thành
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-6 col-md-3">
        <q-card
          flat
          bordered
        >
          <q-card-section class="text-center">
            <div class="text-h4 text-info">
              {{ summary?.avgTransitionHours?.toFixed(1) || 'N/A' }}
              <span
                v-if="summary?.avgTransitionHours"
                class="text-body2"
              >giờ</span>
            </div>
            <div class="text-caption text-grey">
              Thời Gian Xử Lý TB
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-6 col-md-3">
        <q-card
          flat
          bordered
        >
          <q-card-section class="text-center">
            <q-btn
              label="Xuất Excel"
              color="positive"
              icon="download"
              unelevated
              :disable="!hasData"
              @click="handleExport"
            />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Data Table -->
    <q-table
      :rows="allocations"
      :columns="columns"
      row-key="id"
      :loading="isLoading"
      :pagination="{ rowsPerPage: 20 }"
      :rows-per-page-options="[10, 20, 50, 100]"
      flat
      bordered
      class="shadow-1"
    >
      <!-- Loading Skeleton -->
      <template #loading>
        <q-inner-loading showing>
          <q-spinner-dots
            size="50px"
            color="primary"
          />
        </q-inner-loading>
      </template>

      <!-- Fulfillment Rate Column -->
      <template #body-cell-fulfillment_rate="props">
        <q-td :props="props">
          <q-badge :color="getRateColor(props.row.fulfillment_rate)">
            {{ props.row.fulfillment_rate.toFixed(1) }}%
          </q-badge>
        </q-td>
      </template>

      <!-- Status Column -->
      <template #body-cell-status="props">
        <q-td :props="props">
          <q-badge :color="getStatusColor(props.row.status)">
            {{ getStatusLabel(props.row.status) }}
          </q-badge>
        </q-td>
      </template>

      <!-- Priority Column -->
      <template #body-cell-priority="props">
        <q-td :props="props">
          <q-badge
            :color="getPriorityColor(props.row.priority)"
            outline
          >
            {{ getPriorityLabel(props.row.priority) }}
          </q-badge>
        </q-td>
      </template>

      <!-- Created At Column -->
      <template #body-cell-created_at="props">
        <q-td :props="props">
          {{ formatDate(props.row.created_at) }}
        </q-td>
      </template>

      <!-- Transition Hours Column -->
      <template #body-cell-transition_hours="props">
        <q-td :props="props">
          <span v-if="props.row.transition_hours !== null">
            {{ props.row.transition_hours.toFixed(1) }} giờ
          </span>
          <span
            v-else
            class="text-grey"
          >N/A</span>
        </q-td>
      </template>

      <!-- No Data -->
      <template #no-data>
        <div class="full-width row flex-center text-grey q-gutter-sm q-py-xl">
          <q-icon
            size="2em"
            name="assessment"
          />
          <span>Chọn bộ lọc và nhấn "Tạo Báo Cáo" để xem dữ liệu</span>
        </div>
      </template>
    </q-table>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { useReports } from '@/composables/useReports'
import { useThreadTypes } from '@/composables/thread/useThreadTypes'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import DatePicker from '@/components/ui/pickers/DatePicker.vue'
import type { QTableColumn } from 'quasar'

// Composables
const {
  isLoading,
  hasData,
  summary,
  allocations,
  fetchAllocationReport,
  exportToXlsx,
  clearFilters: clearReportFilters,
} = useReports()

const { threadTypes, fetchThreadTypes } = useThreadTypes()

// Filters
const filters = reactive({
  from_date: undefined as string | undefined,
  to_date: undefined as string | undefined,
  thread_type_id: undefined as number | undefined,
  status: undefined as string | undefined,
})

// Options
const threadTypeOptions = computed(() =>
  threadTypes.value.map((t) => ({
    label: `${t.code} - ${t.name}`,
    value: t.id,
  }))
)

const statusOptions = [
  { label: 'Chờ xử lý', value: 'PENDING' },
  { label: 'Phân bổ mềm', value: 'SOFT' },
  { label: 'Phân bổ cứng', value: 'HARD' },
  { label: 'Đã xuất', value: 'ISSUED' },
  { label: 'Đã hủy', value: 'CANCELLED' },
  { label: 'Chờ hàng', value: 'WAITLISTED' },
]

// Table columns
const columns: QTableColumn[] = [
  {
    name: 'order_id',
    label: 'Mã Đơn',
    field: 'order_id',
    align: 'left',
    sortable: true,
  },
  {
    name: 'thread_type_code',
    label: 'Mã Chỉ',
    field: 'thread_type_code',
    align: 'left',
    sortable: true,
  },
  {
    name: 'thread_type_name',
    label: 'Tên Loại Chỉ',
    field: 'thread_type_name',
    align: 'left',
  },
  {
    name: 'requested_meters',
    label: 'Yêu Cầu (m)',
    field: 'requested_meters',
    align: 'right',
    sortable: true,
    format: (val: number) => val.toLocaleString(),
  },
  {
    name: 'allocated_meters',
    label: 'Đã Phân Bổ (m)',
    field: 'allocated_meters',
    align: 'right',
    sortable: true,
    format: (val: number) => val.toLocaleString(),
  },
  {
    name: 'fulfillment_rate',
    label: 'Tỷ Lệ',
    field: 'fulfillment_rate',
    align: 'center',
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
    name: 'created_at',
    label: 'Ngày Tạo',
    field: 'created_at',
    align: 'center',
    sortable: true,
  },
  {
    name: 'transition_hours',
    label: 'Thời Gian XL',
    field: 'transition_hours',
    align: 'right',
    sortable: true,
  },
]

// Computed
const fulfillmentRateColor = computed(() => {
  const rate = summary.value?.fulfillmentRate || 0
  if (rate >= 90) return 'text-positive'
  if (rate >= 70) return 'text-warning'
  return 'text-negative'
})

// Methods
const handleGenerateReport = () => {
  fetchAllocationReport({
    from_date: filters.from_date,
    to_date: filters.to_date,
    thread_type_id: filters.thread_type_id,
    status: filters.status,
  })
}

const handleExport = () => {
  exportToXlsx()
}

const handleClearFilters = () => {
  filters.from_date = undefined
  filters.to_date = undefined
  filters.thread_type_id = undefined
  filters.status = undefined
  clearReportFilters()
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const getRateColor = (rate: number) => {
  if (rate >= 90) return 'positive'
  if (rate >= 70) return 'warning'
  return 'negative'
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    PENDING: 'grey',
    SOFT: 'info',
    HARD: 'primary',
    ISSUED: 'positive',
    CANCELLED: 'negative',
    WAITLISTED: 'warning',
  }
  return colors[status] || 'grey'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: 'Chờ xử lý',
    SOFT: 'Phân bổ mềm',
    HARD: 'Phân bổ cứng',
    ISSUED: 'Đã xuất',
    CANCELLED: 'Đã hủy',
    WAITLISTED: 'Chờ hàng',
  }
  return labels[status] || status
}

const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    URGENT: 'negative',
    HIGH: 'warning',
    NORMAL: 'primary',
    LOW: 'grey',
  }
  return colors[priority] || 'grey'
}

const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = {
    URGENT: 'Khẩn cấp',
    HIGH: 'Cao',
    NORMAL: 'Bình thường',
    LOW: 'Thấp',
  }
  return labels[priority] || priority
}

// Lifecycle
onMounted(() => {
  fetchThreadTypes()
})
</script>
