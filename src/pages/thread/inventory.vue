<template>
  <q-page padding>
    <!-- Page Header -->
    <div class="row q-col-gutter-md q-mb-lg items-center">
      <div class="col-12 col-md-3">
        <h1 class="text-h5 q-my-none text-weight-bold text-primary">
          Quản Lý Tồn Kho Chỉ
        </h1>
      </div>
      
      <div class="col-12 col-md-9">
        <div class="row q-col-gutter-sm justify-end">
          <!-- Search Input (only for detail view) -->
          <div
            v-if="activeTab === 'detail'"
            class="col-12 col-sm-4 col-md-3"
          >
            <q-input
              v-model="searchQuery"
              placeholder="Tìm mã cuộn, số lô..."
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

          <!-- Filter: Thread Type (only for detail view) -->
          <div
            v-if="activeTab === 'detail'"
            class="col-12 col-sm-4 col-md-2"
          >
            <AppSelect
              v-model="filters.thread_type_id"
              :options="threadTypeOptions"
              label="Loại chỉ"
              dense
              outlined
              clearable
              emit-value
              map-options
              @update:model-value="handleFilterChange"
            />
          </div>

          <!-- Filter: Status (only for detail view) -->
          <div
            v-if="activeTab === 'detail'"
            class="col-12 col-sm-4 col-md-2"
          >
            <AppSelect
              v-model="filters.status"
              :options="statusOptions"
              label="Trạng thái"
              dense
              outlined
              clearable
              emit-value
              map-options
              @update:model-value="handleFilterChange"
            />
          </div>

          <!-- Filter: Warehouse -->
          <div class="col-12 col-sm-4 col-md-2">
            <AppSelect
              v-model="filters.warehouse_id"
              :options="warehouseOptions"
              label="Kho"
              dense
              outlined
              clearable
              emit-value
              map-options
              @update:model-value="handleFilterChange"
            />
          </div>
          
          <!-- Add Button -->
          <div class="col-12 col-sm-auto">
            <div class="row q-gutter-sm">
              <q-btn
                color="secondary"
                icon="qr_code_scanner"
                label="Quét tra cứu"
                outline
                class="full-width-xs"
                @click="showQrScanner = true"
              />
              <q-btn
                color="primary"
                icon="add"
                label="Nhập Kho"
                unelevated
                class="full-width-xs"
                @click="openReceiptDialog"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab Navigation -->
    <q-tabs
      v-model="activeTab"
      class="text-primary q-mb-md"
      active-color="primary"
      indicator-color="primary"
      narrow-indicator
      align="left"
    >
      <q-tab
        name="detail"
        label="Chi tiết cuộn"
        icon="view_list"
      />
      <q-tab
        name="summary"
        label="Tổng hợp theo cuộn"
        icon="summarize"
      />
    </q-tabs>

    <q-tab-panels
      v-model="activeTab"
      animated
      keep-alive
    >
      <!-- Detail View Panel -->
      <q-tab-panel
        name="detail"
        class="q-pa-none"
      >
        <q-table
          v-model:pagination="pagination"
          flat
          bordered
          :rows="inventory"
          :columns="columns"
          row-key="id"
          :loading="isLoading"
          :rows-per-page-options="[10, 25, 50, 100]"
          class="inventory-table shadow-1"
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

          <!-- Quantity Meters Column -->
          <template #body-cell-quantity_meters="props">
            <q-td
              :props="props"
              align="right"
            >
              <span class="font-mono text-weight-bold">{{ props.value }} m</span>
            </q-td>
          </template>

          <!-- Weight Grams Column -->
          <template #body-cell-weight_grams="props">
            <q-td
              :props="props"
              align="right"
            >
              <span
                v-if="props.value"
                class="font-mono"
              >{{ props.value }} g</span>
              <span
                v-else
                class="text-grey-5"
              >---</span>
            </q-td>
          </template>

          <!-- Status Column -->
          <template #body-cell-status="props">
            <q-td
              :props="props"
              align="center"
            >
              <q-badge
                :color="getStatusColor(props.row.status)"
                class="q-py-xs q-px-sm"
              >
                {{ statusLabels[props.row.status as ConeStatus] }}
              </q-badge>
            </q-td>
          </template>

          <!-- Is Partial Column -->
          <template #body-cell-is_partial="props">
            <q-td
              :props="props"
              align="center"
            >
              <q-badge
                :color="props.row.is_partial ? 'orange' : 'positive'"
                outline
              >
                {{ props.row.is_partial ? 'Cuộn dư' : 'Cuộn đầy' }}
              </q-badge>
            </q-td>
          </template>

          <!-- Actions Column -->
          <template #body-cell-actions="props">
            <q-td
              :props="props"
              align="center"
            >
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
                flat
                round
                color="secondary"
                icon="qr_code"
                size="sm"
                @click="openPrintSingle(props.row)"
              >
                <q-tooltip>In nhãn QR</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-tab-panel>

      <!-- Summary View Panel -->
      <q-tab-panel
        name="summary"
        class="q-pa-none"
      >
        <ConeSummaryTable
          :rows="coneSummaryList"
          :loading="coneSummaryLoading"
          @refresh="handleSummaryRefresh"
          @show-breakdown="handleShowBreakdown"
        />
      </q-tab-panel>
    </q-tab-panels>

    <!-- Stock Receipt Dialog -->
    <FormDialog
      v-model="receiptDialog.isOpen"
      title="Nhập Kho Chỉ Mới"
      :loading="isLoading"
      max-width="600px"
      @submit="handleReceiptSubmit"
      @cancel="closeReceiptDialog"
    >
      <div class="row q-col-gutter-md">
        <div class="col-12">
          <AppSelect
            v-model="receiptData.thread_type_id"
            label="Loại Chỉ"
            :options="threadTypeOptions"
            :loading="threadTypesLoading"
            required
            emit-value
            map-options
          />
        </div>
        
        <div class="col-12 col-sm-6">
          <AppSelect
            v-model="receiptData.warehouse_id"
            label="Kho Nhập"
            :options="warehouseOptions"
            :loading="warehousesLoading"
            required
            emit-value
            map-options
          />
        </div>
        <div class="col-12 col-sm-6">
          <AppInput
            v-model.number="receiptData.quantity_cones"
            label="Số Lượng Cuộn"
            type="number"
            required
            min="1"
          />
        </div>

        <div class="col-12 col-sm-6">
          <AppInput
            v-model.number="receiptData.weight_per_cone_grams"
            label="Trọng Lượng/Cuộn (g)"
            type="number"
            placeholder="Tùy chọn"
          />
        </div>
        <div class="col-12 col-sm-6">
          <AppInput
            v-model="receiptData.lot_number"
            label="Số Lô (Lot Number)"
            placeholder="Tùy chọn"
          />
        </div>

        <div class="col-12 col-sm-6">
          <AppInput
            v-model="receiptData.expiry_date"
            label="Ngày Hết Hạn"
            placeholder="DD/MM/YYYY"
            readonly
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
                  <DatePicker v-model="receiptData.expiry_date" />
                </q-popup-proxy>
              </q-icon>
            </template>
          </AppInput>
        </div>
        <div class="col-12 col-sm-6">
          <AppInput
            v-model="receiptData.location"
            label="Vị Trí Trong Kho"
            placeholder="VD: Kệ A-1"
          />
        </div>
      </div>
    </FormDialog>

    <!-- Detail Dialog -->
    <q-dialog v-model="detailDialog.isOpen">
      <q-card
        v-if="detailDialog.cone"
        style="width: 700px; max-width: 90vw"
      >
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">
            Chi Tiết Cuộn Chỉ
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

        <q-card-section class="q-pa-md">
          <div class="row q-col-gutter-md">
            <!-- Basic Info Section -->
            <div class="col-12">
              <div class="text-subtitle2 text-grey-7 q-mb-sm">
                Thông Tin Cơ Bản
              </div>
              <div
                class="row q-col-gutter-sm q-pa-sm rounded-borders"
                style="background: rgba(128, 128, 128, 0.08)"
              >
                <div class="col-12 col-sm-6">
                  <div class="text-caption text-grey-7">
                    Mã cuộn
                  </div>
                  <div class="text-subtitle1 text-weight-bold text-primary">
                    {{ detailDialog.cone.cone_id }}
                  </div>
                </div>
                <div class="col-12 col-sm-6">
                  <div class="text-caption text-grey-7">
                    Loại chỉ
                  </div>
                  <div class="row items-center q-gutter-x-xs">
                    <div
                      v-if="detailDialog.cone.thread_type?.color_code"
                      class="color-dot shadow-1"
                      :style="{ backgroundColor: detailDialog.cone.thread_type.color_code }"
                    />
                    <div class="text-subtitle1 text-weight-medium">
                      {{ detailDialog.cone.thread_type?.name }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Inventory Info Section -->
            <div class="col-12">
              <div class="text-subtitle2 text-grey-7 q-mb-sm">
                Thông Tin Tồn Kho
              </div>
              <div class="row q-col-gutter-sm">
                <div class="col-12 col-sm-4">
                  <div class="text-caption text-grey-7">
                    Số lượng mét
                  </div>
                  <div class="text-subtitle1 font-mono text-weight-bold">
                    {{ detailDialog.cone.quantity_meters.toLocaleString() }} m
                  </div>
                </div>
                <div class="col-12 col-sm-4">
                  <div class="text-caption text-grey-7">
                    Trọng lượng (g)
                  </div>
                  <div class="text-subtitle1 font-mono">
                    {{ detailDialog.cone.weight_grams?.toLocaleString() || '---' }} g
                  </div>
                </div>
                <div class="col-12 col-sm-4">
                  <div class="text-caption text-grey-7">
                    Trạng thái
                  </div>
                  <q-badge
                    :color="getStatusColor(detailDialog.cone.status)"
                    class="q-py-xs q-px-sm"
                  >
                    {{ statusLabels[detailDialog.cone.status as ConeStatus] }}
                  </q-badge>
                </div>
                
                <div class="col-12 col-sm-4">
                  <div class="text-caption text-grey-7">
                    Kho
                  </div>
                  <div class="text-subtitle1">
                    {{ detailDialog.cone.warehouse_code || '---' }}
                  </div>
                </div>
                <div class="col-12 col-sm-4">
                  <div class="text-caption text-grey-7">
                    Vị trí
                  </div>
                  <div class="text-subtitle1">
                    {{ detailDialog.cone.location || '---' }}
                  </div>
                </div>
                <div class="col-12 col-sm-4">
                  <div class="text-caption text-grey-7">
                    Tính chất
                  </div>
                  <q-badge
                    :color="detailDialog.cone.is_partial ? 'orange' : 'positive'"
                    outline
                  >
                    {{ detailDialog.cone.is_partial ? 'Cuộn dư' : 'Cuộn đầy' }}
                  </q-badge>
                </div>
              </div>
            </div>

            <!-- Traceability Section -->
            <div class="col-12">
              <q-separator q-my-sm />
              <div class="text-subtitle2 text-grey-7 q-mb-sm">
                Thông Tin Truy Xuất
              </div>
              <div class="row q-col-gutter-sm">
                <div class="col-12 col-sm-6">
                  <div class="text-caption text-grey-7">
                    Số lô (Lot number)
                  </div>
                  <div class="text-subtitle1">
                    {{ detailDialog.cone.lot_number || '---' }}
                  </div>
                </div>
                <div class="col-12 col-sm-6">
                  <div class="text-caption text-grey-7">
                    Ngày hết hạn
                  </div>
                  <div class="text-subtitle1 text-negative">
                    {{ detailDialog.cone.expiry_date || '---' }}
                  </div>
                </div>
                <div class="col-12 col-sm-6">
                  <div class="text-caption text-grey-7">
                    Ngày nhập kho
                  </div>
                  <div class="text-subtitle1">
                    {{ formatDate(detailDialog.cone.received_date) }}
                  </div>
                </div>
                <div class="col-12 col-sm-6">
                  <div class="text-caption text-grey-7">
                    Ngày cập nhật
                  </div>
                  <div class="text-subtitle1">
                    {{ formatDate(detailDialog.cone.updated_at) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions
          align="right"
          class="q-px-md q-pb-md"
        >
          <q-btn
            v-close-popup
            unelevated
            label="Đóng"
            color="grey"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- QR Scanner Dialog for Lookup -->
    <QrScannerDialog
      v-model="showQrScanner"
      title="Quét mã tra cứu"
      :formats="['qr_code', 'code_128', 'ean_13']"
      hint="Đưa mã QR hoặc barcode của cuộn chỉ vào khung"
      :close-on-detect="true"
      @confirm="handleQrLookup"
    />

    <!-- QR Print Dialog -->
    <QrPrintDialog
      v-model="showPrintDialog"
      :cones="printCones"
      title="In nhãn QR"
    />

    <!-- Warehouse Breakdown Dialog -->
    <ConeWarehouseBreakdownDialog
      v-model="showBreakdownDialog"
      :thread-type="selectedConeSummary"
      :breakdown="warehouseBreakdown"
      :loading="breakdownLoading"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useQuasar, type QTableColumn } from 'quasar'
import { useInventory, useThreadTypes, useSnackbar, useWarehouses, useConeSummary } from '@/composables'
import { ConeStatus } from '@/types/thread/enums'
import type { Cone, ReceiveStockDTO, ConeSummaryRow } from '@/types/thread/inventory'
import { QrScannerDialog, QrPrintDialog } from '@/components/qr'
import ConeSummaryTable from '@/components/thread/ConeSummaryTable.vue'
import ConeWarehouseBreakdownDialog from '@/components/thread/ConeWarehouseBreakdownDialog.vue'
import type { ConeLabelData } from '@/types/qr-label'

// Composables
const $q = useQuasar()
const snackbar = useSnackbar()
const {
  inventory,
  isLoading,
  fetchInventory,
  receiveStock,
} = useInventory()

const {
  threadTypes,
  fetchThreadTypes,
  loading: threadTypesLoading,
} = useThreadTypes()

const { warehouseOptions, fetchWarehouses, loading: warehousesLoading } = useWarehouses()

// Cone Summary Composable
const {
  summaryList: coneSummaryList,
  warehouseBreakdown,
  selectedThreadType: selectedConeSummary,
  isLoading: coneSummaryLoading,
  breakdownLoading,
  fetchSummary: fetchConeSummary,
  selectThreadType,
} = useConeSummary()

// Local State
const activeTab = ref<'detail' | 'summary'>('detail')
const showBreakdownDialog = ref(false)
const searchQuery = ref('')
const filters = reactive({
  thread_type_id: undefined as number | undefined,
  status: undefined as ConeStatus | undefined,
  warehouse_id: undefined as number | undefined,
})

const pagination = ref({
  page: 1,
  rowsPerPage: 25,
  sortBy: 'received_date',
  descending: true,
})

// Labels and Options
const statusLabels: Record<ConeStatus, string> = {
  [ConeStatus.RECEIVED]: 'Đã nhập',
  [ConeStatus.INSPECTED]: 'Đã kiểm',
  [ConeStatus.AVAILABLE]: 'Khả dụng',
  [ConeStatus.SOFT_ALLOCATED]: 'Đặt mềm',
  [ConeStatus.HARD_ALLOCATED]: 'Đặt cứng',
  [ConeStatus.IN_PRODUCTION]: 'Đang dùng',
  [ConeStatus.PARTIAL_RETURN]: 'Hoàn dư',
  [ConeStatus.PENDING_WEIGH]: 'Chờ cân',
  [ConeStatus.CONSUMED]: 'Đã hết',
  [ConeStatus.WRITTEN_OFF]: 'Loại bỏ',
  [ConeStatus.QUARANTINE]: 'Cách ly',
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case ConeStatus.RECEIVED:
    case ConeStatus.INSPECTED: return 'info'
    case ConeStatus.AVAILABLE: return 'positive'
    case ConeStatus.SOFT_ALLOCATED:
    case ConeStatus.HARD_ALLOCATED: return 'warning'
    case ConeStatus.IN_PRODUCTION: return 'accent'
    case ConeStatus.PARTIAL_RETURN: return 'orange'
    case ConeStatus.PENDING_WEIGH: return 'deep-orange'
    case ConeStatus.CONSUMED: return 'grey'
    case ConeStatus.WRITTEN_OFF:
    case ConeStatus.QUARANTINE: return 'negative'
    default: return 'grey'
  }
}

const statusOptions = computed(() =>
  Object.entries(statusLabels).map(([value, label]) => ({
    label,
    value: value as ConeStatus,
  }))
)

const threadTypeOptions = computed(() =>
  threadTypes.value.map(t => ({
    label: `${t.code} - ${t.name}`,
    value: t.id
  }))
)

// Warehouse options from centralized composable

// Table Configuration
const columns: QTableColumn[] = [
  {
    name: 'cone_id',
    label: 'Mã Cuộn',
    field: 'cone_id',
    align: 'left',
    sortable: true,
  },
  {
    name: 'thread_type',
    label: 'Loại Chỉ',
    field: (row: Cone) => row.thread_type?.name,
    align: 'left',
    sortable: true,
  },
  {
    name: 'quantity_meters',
    label: 'Số Mét',
    field: 'quantity_meters',
    align: 'right',
    sortable: true,
    format: (val: number) => val.toLocaleString(),
  },
  {
    name: 'weight_grams',
    label: 'Trọng Lượng (g)',
    field: 'weight_grams',
    align: 'right',
    sortable: true,
    format: (val: number) => val ? val.toLocaleString() : '---',
  },
  {
    name: 'status',
    label: 'Trạng Thái',
    field: 'status',
    align: 'center',
    sortable: true,
  },
  {
    name: 'warehouse_code',
    label: 'Kho',
    field: 'warehouse_code',
    align: 'left',
    sortable: true,
  },
  {
    name: 'lot_number',
    label: 'Số Lô',
    field: 'lot_number',
    align: 'left',
    sortable: true,
  },
  {
    name: 'is_partial',
    label: 'Còn Dư',
    field: 'is_partial',
    align: 'center',
    sortable: true,
  },
  {
    name: 'received_date',
    label: 'Ngày Nhập',
    field: 'received_date',
    align: 'left',
    sortable: true,
    format: (val: string) => formatDate(val),
  },
  {
    name: 'actions',
    label: 'Thao Tác',
    field: 'actions',
    align: 'center',
  },
]

// Handlers
const handleFilterChange = () => {
  fetchInventory({
    search: searchQuery.value || undefined,
    ...filters
  })
}

// Watchers
watch(searchQuery, (newVal) => {
  pagination.value.page = 1
  fetchInventory({
    search: newVal || undefined,
    ...filters
  })
})

// Dialog States
const receiptDialog = reactive({
  isOpen: false,
})

const detailDialog = reactive({
  isOpen: false,
  cone: null as Cone | null,
})

// QR Scanner and Print states
const showQrScanner = ref(false)
const showPrintDialog = ref(false)
const printCones = ref<ConeLabelData[]>([])

// Receipt Form Data
const receiptData = reactive<ReceiveStockDTO>({
  thread_type_id: 0,
  warehouse_id: 1, // Default to first warehouse
  quantity_cones: 1,
  weight_per_cone_grams: undefined,
  lot_number: '',
  expiry_date: '',
  location: '',
})

// Methods
const openReceiptDialog = () => {
  resetReceiptData()
  receiptDialog.isOpen = true
}

const closeReceiptDialog = () => {
  receiptDialog.isOpen = false
}

const resetReceiptData = () => {
  Object.assign(receiptData, {
    thread_type_id: threadTypes.value[0]?.id || 0,
    warehouse_id: 1,
    quantity_cones: 1,
    weight_per_cone_grams: undefined,
    lot_number: '',
    expiry_date: '',
    location: '',
  })
}

const handleReceiptSubmit = async () => {
  if (!receiptData.thread_type_id || !receiptData.warehouse_id || receiptData.quantity_cones < 1) {
    snackbar.warning('Vui lòng điền đầy đủ các thông tin bắt buộc')
    return
  }

  const newCones = await receiveStock({ ...receiptData })
  if (newCones && newCones.length > 0) {
    closeReceiptDialog()
    await fetchInventory({ search: searchQuery.value || undefined, ...filters })
    
    // Offer to print labels for newly created cones
    $q.dialog({
      title: 'In nhãn QR',
      message: `Đã nhập ${newCones.length} cuộn chỉ thành công. Bạn có muốn in nhãn QR không?`,
      cancel: { label: 'Bỏ qua', flat: true },
      ok: { label: 'In nhãn', color: 'primary' },
      persistent: true,
    }).onOk(() => {
      // Convert cones to label data and open print dialog
      printCones.value = newCones.map(cone => ({
        cone_id: cone.cone_id,
        lot_number: cone.lot_number ?? undefined,
        thread_type_code: cone.thread_type?.code,
        thread_type_name: cone.thread_type?.name,
        weight_grams: cone.weight_grams ?? undefined,
        quantity_meters: cone.quantity_meters,
      }))
      showPrintDialog.value = true
    })
  }
}

const openDetailDialog = (cone: Cone) => {
  detailDialog.cone = cone
  detailDialog.isOpen = true
}

// QR Lookup handlers
const handleQrLookup = (code: string) => {
  // Find cone in current inventory
  const cone = inventory.value.find(c => c.cone_id === code)
  if (cone) {
    // Clear filters to ensure cone is visible
    searchQuery.value = code
    snackbar.success(`Đã tìm thấy: ${code}`)
    // Open detail dialog
    openDetailDialog(cone)
  } else {
    // Try fetching with search
    searchQuery.value = code
    snackbar.info(`Đang tìm kiếm: ${code}`)
  }
  showQrScanner.value = false
}

// Print QR handlers
const openPrintSingle = (cone: Cone) => {
  printCones.value = [{
    cone_id: cone.cone_id,
    lot_number: cone.lot_number ?? undefined,
    thread_type_code: cone.thread_type?.code,
    thread_type_name: cone.thread_type?.name,
    weight_grams: cone.weight_grams ?? undefined,
    quantity_meters: cone.quantity_meters,
  }]
  showPrintDialog.value = true
}

const formatDate = (dateString: string): string => {
  if (!dateString) return '---'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

// Cone Summary handlers
const handleSummaryRefresh = async () => {
  await fetchConeSummary({
    warehouse_id: filters.warehouse_id,
  })
}

const handleShowBreakdown = async (row: ConeSummaryRow) => {
  await selectThreadType(row)
  showBreakdownDialog.value = true
}

// Watch for tab changes to fetch appropriate data
watch(activeTab, async (newTab) => {
  if (newTab === 'summary' && coneSummaryList.value.length === 0) {
    await fetchConeSummary({
      warehouse_id: filters.warehouse_id,
    })
  }
})

// Watch for warehouse filter changes to update summary if in summary tab
watch(() => filters.warehouse_id, async (newWarehouseId) => {
  if (activeTab.value === 'summary') {
    await fetchConeSummary({
      warehouse_id: newWarehouseId,
    })
  }
})

// Lifecycle
onMounted(async () => {
  await Promise.all([
    fetchInventory(),
    fetchThreadTypes(),
    fetchWarehouses()
  ])
})
</script>

<style scoped lang="scss">
.inventory-table {
  :deep(.q-table__top) {
    padding: 0;
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

.full-width-xs {
  @media (max-width: 599px) {
    width: 100%;
  }
}

.rounded-borders {
  border-radius: 4px;
}

/* Horizontal scroll wrapper for mobile */
.inventory-table {
  max-width: 100%;

  :deep(.q-table__middle) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  :deep(.q-table) {
    table-layout: auto;
    min-width: 800px;
  }

  :deep(th),
  :deep(td) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
