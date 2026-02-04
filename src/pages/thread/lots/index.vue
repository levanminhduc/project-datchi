<template>
  <q-page padding>
    <!-- Page Header -->
    <div class="row q-col-gutter-md q-mb-lg items-center">
      <div class="col-12 col-md-2">
        <h1 class="text-h5 q-my-none text-weight-bold text-primary">
          Quản Lý Lô Hàng
        </h1>
      </div>
      
      <div class="col-12 col-md-10">
        <div class="row q-col-gutter-sm justify-end">
          <!-- Search Input -->
          <div class="col-12 col-sm-4 col-md-2">
            <SearchInput
              v-model="searchQuery"
              placeholder="Tìm mã lô..."
              @update:model-value="handleSearch"
            />
          </div>

          <!-- Filter: Status -->
          <div class="col-12 col-sm-3 col-md-2">
            <AppSelect
              v-model="filters.status"
              :options="statusOptions"
              label="Trạng thái"
              dense
              clearable
              @update:model-value="handleFilterChange"
            />
          </div>

          <!-- Filter: Warehouse -->
          <div class="col-12 col-sm-3 col-md-2">
            <AppSelect
              v-model="filters.warehouse_id"
              :options="warehouseOptions"
              label="Kho"
              dense
              clearable
              @update:model-value="handleFilterChange"
            />
          </div>

          <!-- Filter: Supplier -->
          <div class="col-12 col-sm-3 col-md-2">
            <SupplierSelector
              v-model="filters.supplier_id"
              label="Nhà cung cấp"
              dense
              clearable
              :active-only="true"
              @update:model-value="handleFilterChange"
            />
          </div>
          
          <!-- Add Button -->
          <div class="col-12 col-sm-auto">
            <q-btn
              color="primary"
              icon="add"
              label="Tạo Lô"
              unelevated
              class="full-width-xs"
              @click="showCreateDialog = true"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <q-table
      v-model:pagination="pagination"
      flat
      bordered
      :rows="lots"
      :columns="columns"
      :loading="loading"
      row-key="id"
      :rows-per-page-options="[10, 25, 50]"
      class="lots-table"
      @request="onRequest"
    >
      <!-- Lot Number Column -->
      <template #body-cell-lot_number="props">
        <q-td :props="props">
          <router-link
            :to="`/thread/lots/${props.row.id}`"
            class="text-primary text-weight-medium"
          >
            {{ props.row.lot_number }}
          </router-link>
        </q-td>
      </template>

      <!-- Thread Type Column -->
      <template #body-cell-thread_type="props">
        <q-td :props="props">
          <div class="row items-center no-wrap q-gutter-xs">
            <div
              v-if="props.row.thread_type?.color_code"
              class="color-swatch"
              :style="{ backgroundColor: props.row.thread_type.color_code }"
            />
            <span>{{ props.row.thread_type?.name || '-' }}</span>
          </div>
        </q-td>
      </template>

      <!-- Status Column -->
      <template #body-cell-status="props">
        <q-td :props="props">
          <LotStatusBadge :status="props.row.status" />
        </q-td>
      </template>

      <!-- Cones Column -->
      <template #body-cell-cones="props">
        <q-td :props="props">
          <span class="text-weight-medium">{{ props.row.available_cones }}</span>
          <span class="text-grey-6"> / {{ props.row.total_cones }}</span>
        </q-td>
      </template>

      <!-- Warehouse Column -->
      <template #body-cell-warehouse="props">
        <q-td :props="props">
          {{ props.row.warehouse?.name || '-' }}
        </q-td>
      </template>

      <!-- Supplier Column - Display from supplier_data joined object -->
      <template #body-cell-supplier="props">
        <q-td :props="props">
          <div
            v-if="props.row.supplier_data"
            class="row items-center no-wrap"
          >
            <q-avatar
              size="20px"
              color="primary"
              text-color="white"
              class="q-mr-xs text-caption text-weight-bold"
            >
              {{ getSupplierInitials(props.row.supplier_data.name) }}
            </q-avatar>
            <span>{{ props.row.supplier_data.name }}</span>
          </div>
          <span v-else>{{ props.row.supplier || '-' }}</span>
        </q-td>
      </template>

      <!-- Expiry Date Column -->
      <template #body-cell-expiry_date="props">
        <q-td :props="props">
          <span :class="isExpiringSoon(props.row.expiry_date) ? 'text-warning' : ''">
            {{ formatDate(props.row.expiry_date) }}
          </span>
        </q-td>
      </template>

      <!-- Actions Column -->
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
            @click="viewLot(props.row)"
          >
            <q-tooltip>Xem chi tiết</q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            dense
            icon="edit"
            color="secondary"
            @click="editLot(props.row)"
          >
            <q-tooltip>Sửa thông tin</q-tooltip>
          </q-btn>
          <q-btn
            v-if="props.row.status === 'ACTIVE'"
            flat
            round
            dense
            icon="block"
            color="negative"
            @click="quarantineLot(props.row)"
          >
            <q-tooltip>Cách ly</q-tooltip>
          </q-btn>
          <q-btn
            v-if="props.row.status === 'QUARANTINE'"
            flat
            round
            dense
            icon="check_circle"
            color="positive"
            @click="releaseLot(props.row)"
          >
            <q-tooltip>Giải phóng</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Create/Edit Dialog -->
    <LotFormDialog
      v-model="showCreateDialog"
      :lot="selectedLot"
      @saved="onLotSaved"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLots } from '@/composables/useLots'
import { useConfirm } from '@/composables/useConfirm'
import { warehouseService } from '@/services/warehouseService'
import LotStatusBadge from '@/components/thread/LotStatusBadge.vue'
import LotFormDialog from '@/components/thread/LotFormDialog.vue'
import SearchInput from '@/components/ui/inputs/SearchInput.vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import SupplierSelector from '@/components/ui/inputs/SupplierSelector.vue'
import type { Lot, LotStatus, LotFilters } from '@/types/thread/lot'

const router = useRouter()
const { lots, loading, fetchLots, quarantineLot: doQuarantine, releaseLot: doRelease } = useLots()
const { confirm } = useConfirm()

// State
const searchQuery = ref('')
const showCreateDialog = ref(false)
const selectedLot = ref<Lot | null>(null)
const warehouseOptions = ref<Array<{ label: string; value: number }>>([])

const filters = ref<LotFilters>({
  status: undefined,
  warehouse_id: undefined,
  supplier_id: undefined
})

const pagination = ref({
  page: 1,
  rowsPerPage: 25,
  rowsNumber: 0
})

// Status options
const statusOptions = [
  { label: 'Đang hoạt động', value: 'ACTIVE' },
  { label: 'Đã hết', value: 'DEPLETED' },
  { label: 'Hết hạn', value: 'EXPIRED' },
  { label: 'Cách ly', value: 'QUARANTINE' }
]

// Table columns
const columns = [
  { name: 'lot_number', label: 'Mã Lô', field: 'lot_number', align: 'left' as const, sortable: true },
  { name: 'thread_type', label: 'Loại Chỉ', field: 'thread_type', align: 'left' as const },
  { name: 'status', label: 'Trạng Thái', field: 'status', align: 'center' as const },
  { name: 'cones', label: 'Cuộn (Còn/Tổng)', field: 'available_cones', align: 'center' as const },
  { name: 'warehouse', label: 'Kho', field: 'warehouse', align: 'left' as const },
  { name: 'supplier', label: 'Nhà Cung Cấp', field: (row: Lot) => row.supplier_data?.name || row.supplier, align: 'left' as const },
  { name: 'expiry_date', label: 'Hết Hạn', field: 'expiry_date', align: 'center' as const },
  { name: 'actions', label: 'Thao Tác', field: 'actions', align: 'center' as const }
]

// Helpers
/**
 * Get initials from supplier name for avatar display
 */
function getSupplierInitials(name: string): string {
  if (!name) return '?'
  const words = name.trim().split(/\s+/)
  if (words.length >= 2 && words[0] && words[1]) {
    return ((words[0][0] || '') + (words[1][0] || '')).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

function formatDate(date: string | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('vi-VN')
}

function isExpiringSoon(date: string | null): boolean {
  if (!date) return false
  const expiry = new Date(date)
  const now = new Date()
  const diff = expiry.getTime() - now.getTime()
  const days = diff / (1000 * 60 * 60 * 24)
  return days <= 30 && days > 0
}

// Actions
async function loadData() {
  await fetchLots({
    ...filters.value,
    search: searchQuery.value || undefined
  })
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

function viewLot(lot: Lot) {
  router.push(`/thread/lots/${lot.id}`)
}

function editLot(lot: Lot) {
  selectedLot.value = lot
  showCreateDialog.value = true
}

async function quarantineLot(lot: Lot) {
  const confirmed = await confirm({
    title: `Cách ly lô ${lot.lot_number}?`,
    message: 'Tất cả cuộn trong lô sẽ không khả dụng cho đến khi giải phóng.',
    ok: 'Cách ly',
    type: 'warning'
  })
  if (confirmed) {
    await doQuarantine(lot.id)
    loadData()
  }
}

async function releaseLot(lot: Lot) {
  const confirmed = await confirm({
    title: `Giải phóng lô ${lot.lot_number}?`,
    message: 'Các cuộn trong lô sẽ khả dụng trở lại.',
    ok: 'Giải phóng',
    type: 'success'
  })
  if (confirmed) {
    await doRelease(lot.id)
    loadData()
  }
}

function onLotSaved() {
  showCreateDialog.value = false
  selectedLot.value = null
  loadData()
}

// Load warehouses
async function loadWarehouses() {
  const warehouses = await warehouseService.getStorageOnly()
  warehouseOptions.value = warehouses.map(w => ({
    label: w.name,
    value: w.id
  }))
}

onMounted(() => {
  loadData()
  loadWarehouses()
})
</script>

<style scoped>
.color-swatch {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

/* Horizontal scroll wrapper for mobile */
.lots-table {
  max-width: 100%;
}

.lots-table :deep(.q-table__middle) {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.lots-table :deep(.q-table) {
  table-layout: auto;
  min-width: 600px;
}

.lots-table :deep(th),
.lots-table :deep(td) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.full-width-xs {
  @media (max-width: 599px) {
    width: 100%;
  }
}
</style>
