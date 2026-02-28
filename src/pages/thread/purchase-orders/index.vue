<template>
  <q-page padding>
    <div class="row q-col-gutter-md q-mb-lg items-center">
      <div class="col-12 col-md-2">
        <h1 class="text-h5 q-my-none text-weight-bold text-primary">
          Đơn Hàng (PO)
        </h1>
      </div>

      <div class="col-12 col-md-10">
        <div class="row q-col-gutter-sm justify-end">
          <div class="col-12 col-sm-4 col-md-2">
            <SearchInput
              v-model="searchQuery"
              placeholder="Tìm PO..."
              @update:model-value="handleSearch"
            />
          </div>

          <div class="col-12 col-sm-3 col-md-2">
            <AppSelect
              v-model="filters.status"
              :options="statusOptions"
              label="Trạng thái"
              dense
              clearable
              emit-value
              map-options
              @update:model-value="handleFilterChange"
            />
          </div>

          <div class="col-12 col-sm-auto">
            <q-btn
              color="secondary"
              icon="upload"
              label="Import"
              unelevated
              class="full-width-xs q-mr-sm"
              @click="router.push('/thread/purchase-orders/import')"
            />
            <q-btn
              color="primary"
              icon="add"
              label="Tạo PO"
              unelevated
              class="full-width-xs"
              @click="showCreateDialog = true"
            />
          </div>
        </div>
      </div>
    </div>

    <q-table
      v-model:pagination="pagination"
      flat
      bordered
      :rows="purchaseOrders"
      :columns="columns"
      :loading="loading"
      row-key="id"
      :rows-per-page-options="[10, 25, 50]"
      class="po-table"
      @request="onRequest"
      @row-click="onRowClick"
    >
      <template #body-cell-po_number="props">
        <q-td :props="props">
          <router-link
            :to="`/thread/purchase-orders/${props.row.id}`"
            class="text-primary text-weight-medium"
          >
            {{ props.row.po_number }}
          </router-link>
        </q-td>
      </template>

      <template #body-cell-status="props">
        <q-td :props="props">
          <q-badge
            :color="getStatusColor(props.row.status)"
            :label="getStatusLabel(props.row.status)"
          />
        </q-td>
      </template>

      <template #body-cell-priority="props">
        <q-td :props="props">
          <q-badge
            :color="getPriorityColor(props.row.priority)"
            :label="getPriorityLabel(props.row.priority)"
            outline
          />
        </q-td>
      </template>

      <template #body-cell-order_date="props">
        <q-td :props="props">
          {{ formatDate(props.row.order_date) }}
        </q-td>
      </template>

      <template #body-cell-delivery_date="props">
        <q-td :props="props">
          {{ formatDate(props.row.delivery_date) }}
        </q-td>
      </template>

      <template #body-cell-actions="props">
        <q-td
          :props="props"
          class="q-gutter-xs"
        >
          <q-btn
            flat
            round
            dense
            icon="visibility"
            color="primary"
            @click.stop="viewPO(props.row)"
          >
            <q-tooltip>Xem chi tiết</q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            dense
            icon="edit"
            color="secondary"
            @click.stop="editPO(props.row)"
          >
            <q-tooltip>Sửa</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <POFormDialog
      v-model="showCreateDialog"
      :purchase-order="selectedPO"
      @saved="onPOSaved"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { purchaseOrderService } from '@/services/purchaseOrderService'
import POFormDialog from '@/components/thread/POFormDialog.vue'
import SearchInput from '@/components/ui/inputs/SearchInput.vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import { POStatus } from '@/types/thread/enums'
import type { PurchaseOrder, PurchaseOrderFilter } from '@/types/thread'

definePage({
  meta: {
    requiresAuth: true,
    permissions: ['thread.purchase-orders.view'],
  },
})

const router = useRouter()

const purchaseOrders = ref<PurchaseOrder[]>([])
const loading = ref(false)
const searchQuery = ref('')
const showCreateDialog = ref(false)
const selectedPO = ref<PurchaseOrder | null>(null)

const filters = ref<PurchaseOrderFilter>({
  status: undefined,
  po_number: undefined
})

const pagination = ref({
  page: 1,
  rowsPerPage: 25,
  rowsNumber: 0
})

const statusOptions = [
  { label: 'Chờ xử lý', value: POStatus.PENDING },
  { label: 'Đã xác nhận', value: POStatus.CONFIRMED },
  { label: 'Đang sản xuất', value: POStatus.IN_PRODUCTION },
  { label: 'Hoàn thành', value: POStatus.COMPLETED },
  { label: 'Đã hủy', value: POStatus.CANCELLED }
]

const columns = [
  { name: 'po_number', label: 'Số PO', field: 'po_number', align: 'left' as const, sortable: true },
  { name: 'customer_name', label: 'Khách hàng', field: 'customer_name', align: 'left' as const },
  { name: 'order_date', label: 'Ngày đặt', field: 'order_date', align: 'center' as const },
  { name: 'delivery_date', label: 'Ngày giao', field: 'delivery_date', align: 'center' as const },
  { name: 'status', label: 'Trạng thái', field: 'status', align: 'center' as const },
  { name: 'priority', label: 'Ưu tiên', field: 'priority', align: 'center' as const },
  { name: 'actions', label: 'Thao tác', field: 'actions', align: 'center' as const }
]

function getStatusColor(status: POStatus): string {
  const colors: Record<POStatus, string> = {
    [POStatus.PENDING]: 'grey',
    [POStatus.CONFIRMED]: 'info',
    [POStatus.IN_PRODUCTION]: 'warning',
    [POStatus.COMPLETED]: 'positive',
    [POStatus.CANCELLED]: 'negative'
  }
  return colors[status] || 'grey'
}

function getStatusLabel(status: POStatus): string {
  const labels: Record<POStatus, string> = {
    [POStatus.PENDING]: 'Chờ xử lý',
    [POStatus.CONFIRMED]: 'Đã xác nhận',
    [POStatus.IN_PRODUCTION]: 'Đang SX',
    [POStatus.COMPLETED]: 'Hoàn thành',
    [POStatus.CANCELLED]: 'Đã hủy'
  }
  return labels[status] || status
}

function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    LOW: 'grey',
    NORMAL: 'primary',
    HIGH: 'warning',
    URGENT: 'negative'
  }
  return colors[priority] || 'grey'
}

function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    LOW: 'Thấp',
    NORMAL: 'BT',
    HIGH: 'Cao',
    URGENT: 'Khẩn'
  }
  return labels[priority] || priority
}

function formatDate(date: string | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('vi-VN')
}

async function loadData() {
  loading.value = true
  try {
    const filterParams: PurchaseOrderFilter = {
      ...filters.value,
      po_number: searchQuery.value || undefined
    }
    purchaseOrders.value = await purchaseOrderService.getAll(filterParams)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.value.page = 1
  loadData()
}

function handleFilterChange() {
  pagination.value.page = 1
  loadData()
}

function onRequest() {
  loadData()
}

function onRowClick(_evt: Event, row: PurchaseOrder) {
  router.push(`/thread/purchase-orders/${row.id}`)
}

function viewPO(po: PurchaseOrder) {
  router.push(`/thread/purchase-orders/${po.id}`)
}

function editPO(po: PurchaseOrder) {
  selectedPO.value = po
  showCreateDialog.value = true
}

function onPOSaved() {
  showCreateDialog.value = false
  selectedPO.value = null
  loadData()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.po-table {
  max-width: 100%;
}

.po-table :deep(.q-table__middle) {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.po-table :deep(.q-table) {
  table-layout: auto;
  min-width: 600px;
}

.po-table :deep(th),
.po-table :deep(td) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.po-table :deep(tbody tr) {
  cursor: pointer;
}

.po-table :deep(tbody tr:hover) {
  background-color: rgba(0, 0, 0, 0.03);
}

.full-width-xs {
  @media (max-width: 599px) {
    width: 100%;
  }
}
</style>
