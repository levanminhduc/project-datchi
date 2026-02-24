<template>
  <q-page padding>
    <!-- Page Header -->
    <div class="row items-center q-mb-lg">
      <q-btn
        flat
        round
        icon="arrow_back"
        color="primary"
        @click="$router.push('/thread/weekly-order')"
      />
      <div class="q-ml-md">
        <h1 class="text-h5 q-my-none text-weight-bold">
          Lịch Sử Đặt Hàng Chỉ
        </h1>
        <div class="text-grey-6">
          Xem lịch sử đặt hàng chỉ theo tuần, PO, mã hàng
        </div>
      </div>
      <q-space />
      <AppButton
        color="primary"
        label="Xuất Excel"
        icon="download"
        :disable="historyItems.length === 0"
        @click="handleExportXlsx"
      />
    </div>

    <!-- Filters -->
    <q-card
      flat
      bordered
      class="q-mb-lg"
    >
      <q-card-section>
        <div
          class="row items-end"
          :class="$q.screen.lt.sm ? 'q-col-gutter-sm' : 'q-col-gutter-md'"
        >
          <div class="col-12 col-sm-6 col-md-3">
            <AppSelect
              v-model="filters.po_id"
              :options="poOptions"
              label="PO"
              clearable
              dense
              use-input
              fill-input
              hide-selected
              hide-bottom-space
              emit-value
              map-options
              :loading="posLoading"
            />
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <AppSelect
              v-model="filters.style_id"
              :options="styleOptions"
              label="Mã hàng"
              clearable
              dense
              use-input
              fill-input
              hide-selected
              hide-bottom-space
              emit-value
              map-options
              :loading="stylesLoading"
            />
          </div>

          <div class="col-12 col-sm-6 col-md-2">
            <AppInput
              v-model="filters.from_date"
              label="Từ ngày"
              placeholder="DD/MM/YYYY"
              dense
              clearable
              hide-bottom-space
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
          <div class="col-12 col-sm-6 col-md-2">
            <AppInput
              v-model="filters.to_date"
              label="Đến ngày"
              placeholder="DD/MM/YYYY"
              dense
              clearable
              hide-bottom-space
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

          <div class="col-12 col-md-2">
            <div class="row q-gutter-sm">
              <AppButton
                color="primary"
                label="Tìm"
                icon="search"
                :loading="loading"
                @click="applyFilters"
              />
              <AppButton
                flat
                color="grey"
                label="Xóa"
                @click="resetFilters"
              />
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- History Table -->
    <q-card
      flat
      bordered
    >
      <q-table
        :rows="historyItems"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :pagination="pagination"
        :rows-per-page-options="[10, 25, 50, 100]"
        class="history-table"
        @request="onRequest"
      >
        <template #body-cell-style="slotProps">
          <q-td :props="slotProps">
            <span class="text-weight-medium">{{ slotProps.row.style?.style_code || '' }}</span>
            <span
              v-if="slotProps.row.style?.style_name"
              class="text-grey-7 q-ml-xs"
            >{{ slotProps.row.style.style_name }}</span>
          </q-td>
        </template>

        <template #body-cell-color="slotProps">
          <q-td :props="slotProps">
            <div class="row items-center no-wrap">
              <span
                v-if="slotProps.row.color?.hex_code"
                class="q-mr-sm"
                :style="{
                  display: 'inline-block',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  backgroundColor: slotProps.row.color.hex_code,
                  border: '1px solid #ccc'
                }"
              />
              {{ slotProps.row.color?.name || '' }}
            </div>
          </q-td>
        </template>

        <template #body-cell-quantity="slotProps">
          <q-td :props="slotProps">
            {{ slotProps.row.quantity.toLocaleString('vi-VN') }}
          </q-td>
        </template>

        <template #body-cell-created_at="slotProps">
          <q-td :props="slotProps">
            {{ formatDate(slotProps.row.created_at) }}
          </q-td>
        </template>

        <template #body-cell-status="slotProps">
          <q-td :props="slotProps">
            <q-chip
              :color="getStatusColor(slotProps.row.week?.status)"
              text-color="white"
              dense
              size="sm"
            >
              {{ getStatusLabel(slotProps.row.week?.status) }}
            </q-chip>
          </q-td>
        </template>

        <template #no-data>
          <div class="text-center q-py-xl text-grey-6">
            <q-icon
              name="history"
              size="48px"
            />
            <div class="q-mt-sm">
              Chưa có lịch sử đặt hàng
            </div>
          </div>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { usePurchaseOrders, useStyles, useSnackbar } from '@/composables'
import { weeklyOrderService } from '@/services/weeklyOrderService'
import DatePicker from '@/components/ui/pickers/DatePicker.vue'
import type { OrderHistoryItem, OrderHistoryFilter } from '@/types/thread'
import type { QTableColumn, QTableProps } from 'quasar'

definePage({
  meta: {
    requiresAuth: true,
    permissions: ['thread.view'],
  },
})

const $q = useQuasar()
const snackbar = useSnackbar()
const { purchaseOrders: poList, isLoading: posLoading, fetchPurchaseOrders } = usePurchaseOrders()
const { styles: styleList, loading: stylesLoading, fetchStyles } = useStyles()

const historyItems = ref<OrderHistoryItem[]>([])
const loading = ref(false)

const filters = ref<OrderHistoryFilter>({
  po_id: undefined,
  style_id: undefined,
  from_date: undefined,
  to_date: undefined,
})

const pagination = ref({
  page: 1,
  rowsPerPage: 25,
  rowsNumber: 0,
  sortBy: 'created_at' as string | null,
  descending: true,
})

const poOptions = computed(() =>
  poList.value.map((po) => ({
    label: `${po.po_number}${po.customer_name ? ` - ${po.customer_name}` : ''}`,
    value: po.id,
  })),
)

const styleOptions = computed(() =>
  styleList.value.map((s) => ({
    label: `${s.style_code} - ${s.style_name}`,
    value: s.id,
  })),
)

const columns: QTableColumn[] = [
  { name: 'week', label: 'Tuần', field: (row) => row.week?.week_name || '', align: 'left', sortable: true },
  { name: 'po', label: 'PO', field: (row) => row.po?.po_number || '-', align: 'left' },
  { name: 'style', label: 'Mã hàng', field: 'style', align: 'left' },
  { name: 'color', label: 'Màu', field: 'color', align: 'left' },
  { name: 'quantity', label: 'SL (SP)', field: 'quantity', align: 'right', sortable: true },
  { name: 'created_by', label: 'Người tạo', field: (row) => row.week?.created_by || '-', align: 'left' },
  { name: 'created_at', label: 'Ngày tạo', field: 'created_at', align: 'left', sortable: true },
  { name: 'status', label: 'Trạng thái', field: (row) => row.week?.status || '', align: 'center' },
]

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function getStatusColor(status?: string): string {
  switch (status) {
    case 'CONFIRMED': return 'positive'
    case 'CANCELLED': return 'negative'
    default: return 'grey'
  }
}

function getStatusLabel(status?: string): string {
  switch (status) {
    case 'DRAFT': return 'Nháp'
    case 'CONFIRMED': return 'Đã xác nhận'
    case 'CANCELLED': return 'Đã hủy'
    default: return status || '-'
  }
}

async function fetchHistory() {
  loading.value = true
  try {
    const result = await weeklyOrderService.getOrderHistory({
      ...filters.value,
      page: pagination.value.page,
      limit: pagination.value.rowsPerPage,
    })
    historyItems.value = result.data
    pagination.value.rowsNumber = result.pagination.total
  } catch (err) {
    console.error('[order-history] fetch error:', err)
    snackbar.error('Không thể tải lịch sử đặt hàng')
  } finally {
    loading.value = false
  }
}

function onRequest(props: Parameters<NonNullable<QTableProps['onRequest']>>[0]) {
  pagination.value.page = props.pagination.page ?? 1
  pagination.value.rowsPerPage = props.pagination.rowsPerPage ?? 25
  fetchHistory()
}

function applyFilters() {
  pagination.value.page = 1
  fetchHistory()
}

function resetFilters() {
  filters.value = {
    po_id: undefined,
    style_id: undefined,
    from_date: undefined,
    to_date: undefined,
  }
  pagination.value.page = 1
  fetchHistory()
}

async function handleExportXlsx() {
  if (historyItems.value.length === 0) return

  try {
    const ExcelJS = await import('exceljs')
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Lịch Sử Đặt Hàng')

    worksheet.columns = [
      { header: 'Tuần', key: 'week_name', width: 20 },
      { header: 'PO', key: 'po_number', width: 18 },
      { header: 'Mã hàng', key: 'style_code', width: 15 },
      { header: 'Tên mã hàng', key: 'style_name', width: 25 },
      { header: 'Màu', key: 'color_name', width: 15 },
      { header: 'Số lượng (SP)', key: 'quantity', width: 15 },
      { header: 'Người tạo', key: 'created_by', width: 18 },
      { header: 'Ngày tạo', key: 'created_at', width: 15 },
      { header: 'Trạng thái', key: 'status', width: 15 },
    ]

    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1976D2' },
    }
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

    historyItems.value.forEach((item) => {
      worksheet.addRow({
        week_name: item.week?.week_name || '',
        po_number: item.po?.po_number || '',
        style_code: item.style?.style_code || '',
        style_name: item.style?.style_name || '',
        color_name: item.color?.name || '',
        quantity: item.quantity,
        created_by: item.week?.created_by || '',
        created_at: formatDate(item.created_at),
        status: getStatusLabel(item.week?.status),
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `lich-su-dat-hang-chi-${new Date().toISOString().slice(0, 10)}.xlsx`
    link.click()
    URL.revokeObjectURL(link.href)

    snackbar.success('Đã xuất file Excel')
  } catch (err) {
    console.error('[order-history] export error:', err)
    snackbar.error('Không thể xuất file Excel')
  }
}

onMounted(async () => {
  await Promise.all([fetchPurchaseOrders(), fetchStyles(), fetchHistory()])
})
</script>

<style scoped>
.history-table {
  max-width: 100%;
}

.history-table :deep(.q-table__middle) {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.history-table :deep(.q-table) {
  table-layout: auto;
  min-width: 900px;
}
</style>
