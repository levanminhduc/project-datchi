<template>
  <q-page padding>
    <!-- Page Header -->
    <div class="row items-center q-mb-lg">
      <q-btn
        flat
        round
        icon="arrow_back"
        color="primary"
        @click="$router.push('/kho')"
      />
      <div class="q-ml-md">
        <h1 class="text-h5 q-my-none text-weight-bold">Lịch Sử Thao Tác</h1>
        <div class="text-grey-6">Xem lịch sử nhập, chuyển, xuất kho</div>
      </div>
      <q-space />
      <q-btn
        color="primary"
        label="Xuất CSV"
        icon="download"
        :disable="transactions.length === 0"
        @click="handleExportCSV"
      />
    </div>

    <!-- Filters -->
    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="row q-col-gutter-md items-end">
          <!-- Operation Type -->
          <div class="col-12 col-sm-6 col-md-3">
            <AppSelect
              v-model="filters.operation_type"
              :options="operationTypeOptions"
              label="Loại thao tác"
              clearable
              dense
            />
          </div>

          <!-- Warehouse -->
          <div class="col-12 col-sm-6 col-md-3">
            <AppWarehouseSelect
              v-model="filters.warehouse_id"
              label="Kho"
              clearable
              dense
            />
          </div>

          <!-- Date Range -->
          <div class="col-12 col-sm-6 col-md-2">
            <AppInput
              v-model="filters.from_date"
              label="Từ ngày"
              placeholder="DD/MM/YYYY"
              dense
              clearable
            >
              <template #append>
                <q-icon name="event" class="cursor-pointer">
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
          <div class="col-12 col-sm-6 col-md-2">
            <AppInput
              v-model="filters.to_date"
              label="Đến ngày"
              placeholder="DD/MM/YYYY"
              dense
              clearable
            >
              <template #append>
                <q-icon name="event" class="cursor-pointer">
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

          <!-- Actions -->
          <div class="col-12 col-md-2">
            <q-btn
              color="primary"
              label="Tìm"
              icon="search"
              :loading="loading"
              @click="applyFilters"
            />
            <q-btn
              flat
              color="grey"
              label="Xóa"
              class="q-ml-sm"
              @click="resetFilters"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Transactions Table -->
    <q-card flat bordered>
      <q-table
        :rows="transactions"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :pagination="pagination"
        :rows-per-page-options="[10, 25, 50, 100]"
        @update:pagination="pagination = $event"
      >
        <!-- Operation Type -->
        <template #body-cell-operation_type="props">
          <q-td :props="props">
            <q-chip
              :color="getOperationColor(props.row.operation_type)"
              text-color="white"
              dense
              size="sm"
            >
              <q-icon :name="getOperationIcon(props.row.operation_type)" size="xs" class="q-mr-xs" />
              {{ getOperationLabel(props.row.operation_type) }}
            </q-chip>
          </q-td>
        </template>

        <!-- Cone Count -->
        <template #body-cell-cone_count="props">
          <q-td :props="props">
            <span class="text-weight-bold">{{ props.row.cone_count }}</span>
            <span class="text-grey-6 q-ml-xs">cuộn</span>
          </q-td>
        </template>

        <!-- Warehouse Info -->
        <template #body-cell-warehouses="props">
          <q-td :props="props">
            <template v-if="props.row.operation_type === 'TRANSFER'">
              <span>{{ props.row.from_warehouse?.name || '-' }}</span>
              <q-icon name="arrow_forward" size="xs" class="q-mx-xs text-grey" />
              <span>{{ props.row.to_warehouse?.name || '-' }}</span>
            </template>
            <template v-else-if="props.row.operation_type === 'RECEIVE'">
              {{ props.row.to_warehouse?.name || '-' }}
            </template>
            <template v-else>
              {{ props.row.from_warehouse?.name || '-' }}
            </template>
          </q-td>
        </template>

        <!-- Recipient -->
        <template #body-cell-recipient="props">
          <q-td :props="props">
            {{ props.row.recipient || '-' }}
          </q-td>
        </template>

        <!-- Date -->
        <template #body-cell-performed_at="props">
          <q-td :props="props">
            {{ formatDate(props.row.performed_at) }}
          </q-td>
        </template>

        <!-- Actions -->
        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              flat
              round
              dense
              icon="visibility"
              color="primary"
              @click="viewTransaction(props.row)"
            >
              <q-tooltip>Chi tiết</q-tooltip>
            </q-btn>
          </q-td>
        </template>

        <!-- Empty State -->
        <template #no-data>
          <div class="text-center q-py-xl text-grey-6">
            <q-icon name="history" size="48px" />
            <div class="q-mt-sm">Chưa có lịch sử thao tác</div>
          </div>
        </template>
      </q-table>
    </q-card>

    <!-- Detail Dialog -->
    <q-dialog v-model="showDetailDialog">
      <q-card style="min-width: 500px; max-width: 90vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Chi tiết giao dịch #{{ selectedTransaction?.id }}</div>
          <q-space />
          <q-btn flat round dense icon="close" @click="showDetailDialog = false" />
        </q-card-section>

        <q-card-section v-if="selectedTransaction">
          <!-- Operation Badge -->
          <div class="q-mb-md">
            <q-chip
              :color="getOperationColor(selectedTransaction.operation_type)"
              text-color="white"
              size="md"
            >
              <q-icon :name="getOperationIcon(selectedTransaction.operation_type)" size="sm" class="q-mr-xs" />
              {{ getOperationLabel(selectedTransaction.operation_type) }}
            </q-chip>
            <span class="q-ml-md text-grey-6">
              {{ formatDateTime(selectedTransaction.performed_at) }}
            </span>
          </div>

          <q-separator class="q-my-md" />

          <!-- Info Grid -->
          <div class="row q-col-gutter-md">
            <div class="col-6">
              <div class="text-caption text-grey">Số cuộn</div>
              <div class="text-body1 text-weight-bold">{{ selectedTransaction.cone_count }}</div>
            </div>

            <div v-if="selectedTransaction.lot" class="col-6">
              <div class="text-caption text-grey">Lô hàng</div>
              <div class="text-body1">{{ selectedTransaction.lot.lot_number }}</div>
            </div>

            <template v-if="selectedTransaction.operation_type === 'TRANSFER'">
              <div class="col-6">
                <div class="text-caption text-grey">Kho xuất</div>
                <div class="text-body1">{{ selectedTransaction.from_warehouse?.name || '-' }}</div>
              </div>
              <div class="col-6">
                <div class="text-caption text-grey">Kho nhận</div>
                <div class="text-body1">{{ selectedTransaction.to_warehouse?.name || '-' }}</div>
              </div>
            </template>

            <template v-else-if="selectedTransaction.operation_type === 'RECEIVE'">
              <div class="col-6">
                <div class="text-caption text-grey">Kho nhập</div>
                <div class="text-body1">{{ selectedTransaction.to_warehouse?.name || '-' }}</div>
              </div>
            </template>

            <template v-else>
              <div class="col-6">
                <div class="text-caption text-grey">Kho xuất</div>
                <div class="text-body1">{{ selectedTransaction.from_warehouse?.name || '-' }}</div>
              </div>
            </template>

            <div v-if="selectedTransaction.recipient" class="col-6">
              <div class="text-caption text-grey">Người nhận</div>
              <div class="text-body1">{{ selectedTransaction.recipient }}</div>
            </div>

            <div v-if="selectedTransaction.reference_number" class="col-6">
              <div class="text-caption text-grey">Số tham chiếu</div>
              <div class="text-body1">{{ selectedTransaction.reference_number }}</div>
            </div>

            <div v-if="selectedTransaction.performed_by" class="col-6">
              <div class="text-caption text-grey">Thực hiện bởi</div>
              <div class="text-body1">{{ selectedTransaction.performed_by }}</div>
            </div>

            <div v-if="selectedTransaction.notes" class="col-12">
              <div class="text-caption text-grey">Ghi chú</div>
              <div class="text-body1">{{ selectedTransaction.notes }}</div>
            </div>
          </div>

          <!-- Cone IDs -->
          <q-separator class="q-my-md" />
          <div class="text-subtitle2 q-mb-sm">Mã cuộn ({{ selectedTransaction.cone_ids?.length || 0 }})</div>
          <div class="cone-id-grid">
            <q-chip
              v-for="coneId in (selectedTransaction.cone_ids || []).slice(0, 50)"
              :key="coneId"
              dense
              size="sm"
              color="grey-3"
            >
              {{ coneId }}
            </q-chip>
            <q-chip
              v-if="(selectedTransaction.cone_ids?.length || 0) > 50"
              dense
              size="sm"
              color="primary"
              text-color="white"
            >
              +{{ selectedTransaction.cone_ids!.length - 50 }} khác
            </q-chip>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Đóng" color="primary" @click="showDetailDialog = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBatchOperations } from '@/composables/useBatchOperations'
import { useWarehouses } from '@/composables'
import AppWarehouseSelect from '@/components/ui/inputs/AppWarehouseSelect.vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import DatePicker from '@/components/ui/pickers/DatePicker.vue'
import type { BatchTransaction, BatchOperationType, BatchTransactionFilters } from '@/types/thread/batch'
import type { QTableColumn } from 'quasar'

const { transactions, loading, fetchTransactions } = useBatchOperations()
const { fetchWarehouses } = useWarehouses()

// State
const showDetailDialog = ref(false)
const selectedTransaction = ref<BatchTransaction | null>(null)

const filters = ref<BatchTransactionFilters>({
  operation_type: undefined,
  warehouse_id: undefined,
  from_date: undefined,
  to_date: undefined
})

const pagination = ref({
  page: 1,
  rowsPerPage: 25,
  sortBy: 'performed_at' as string | null,
  descending: true
})

// Options
const operationTypeOptions = [
  { label: 'Nhập kho', value: 'RECEIVE' },
  { label: 'Chuyển kho', value: 'TRANSFER' },
  { label: 'Xuất kho', value: 'ISSUE' },
  { label: 'Trả lại', value: 'RETURN' }
]

// Table columns
const columns: QTableColumn[] = [
  { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
  { name: 'operation_type', label: 'Loại', field: 'operation_type', align: 'left', sortable: true },
  { name: 'cone_count', label: 'Số cuộn', field: 'cone_count', align: 'left', sortable: true },
  { name: 'warehouses', label: 'Kho', field: 'warehouses', align: 'left' },
  { name: 'recipient', label: 'Người nhận', field: 'recipient', align: 'left' },
  { name: 'performed_at', label: 'Thời gian', field: 'performed_at', align: 'left', sortable: true },
  { name: 'actions', label: '', field: 'actions', align: 'right' }
]

// Helpers
function getOperationColor(type: BatchOperationType): string {
  switch (type) {
    case 'RECEIVE': return 'positive'
    case 'TRANSFER': return 'info'
    case 'ISSUE': return 'warning'
    case 'RETURN': return 'secondary'
    default: return 'grey'
  }
}

function getOperationIcon(type: BatchOperationType): string {
  switch (type) {
    case 'RECEIVE': return 'input'
    case 'TRANSFER': return 'swap_horiz'
    case 'ISSUE': return 'output'
    case 'RETURN': return 'undo'
    default: return 'help'
  }
}

function getOperationLabel(type: BatchOperationType): string {
  switch (type) {
    case 'RECEIVE': return 'Nhập'
    case 'TRANSFER': return 'Chuyển'
    case 'ISSUE': return 'Xuất'
    case 'RETURN': return 'Trả'
    default: return type
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('vi-VN')
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('vi-VN')
}

// Actions
async function applyFilters() {
  const activeFilters: BatchTransactionFilters = {}
  
  if (filters.value.operation_type) {
    activeFilters.operation_type = filters.value.operation_type
  }
  if (filters.value.warehouse_id) {
    activeFilters.warehouse_id = filters.value.warehouse_id
  }
  if (filters.value.from_date) {
    activeFilters.from_date = filters.value.from_date
  }
  if (filters.value.to_date) {
    activeFilters.to_date = filters.value.to_date
  }
  
  await fetchTransactions(Object.keys(activeFilters).length > 0 ? activeFilters : undefined)
}

function resetFilters() {
  filters.value = {
    operation_type: undefined,
    warehouse_id: undefined,
    from_date: undefined,
    to_date: undefined
  }
  applyFilters()
}

function viewTransaction(transaction: BatchTransaction) {
  selectedTransaction.value = transaction
  showDetailDialog.value = true
}

function handleExportCSV() {
  if (transactions.value.length === 0) return
  
  // CSV header
  const headers = [
    'ID',
    'Loại thao tác',
    'Số cuộn',
    'Kho xuất',
    'Kho nhận',
    'Người nhận',
    'Số tham chiếu',
    'Ghi chú',
    'Thực hiện bởi',
    'Thời gian'
  ]
  
  // CSV rows
  const rows = transactions.value.map(t => [
    t.id,
    getOperationLabel(t.operation_type),
    t.cone_count,
    t.from_warehouse?.name || '',
    t.to_warehouse?.name || '',
    t.recipient || '',
    t.reference_number || '',
    t.notes || '',
    t.performed_by || '',
    formatDateTime(t.performed_at)
  ])
  
  // Build CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(cell => 
        typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))
          ? `"${cell.replace(/"/g, '""')}"`
          : cell
      ).join(',')
    )
  ].join('\n')
  
  // Download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `lich-su-thao-tac-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    fetchWarehouses(),
    fetchTransactions()
  ])
})
</script>

<style scoped>
.cone-id-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
}
</style>
