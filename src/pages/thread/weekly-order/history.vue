<template>
  <q-page padding>
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
          Xem lịch sử đặt hàng chỉ theo tuần
        </div>
      </div>
      <q-space />
      <AppButton
        color="primary"
        label="Xuất Excel"
        icon="download"
        :disable="weekGroups.length === 0"
        @click="handleExportXlsx"
      />
    </div>

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
          <div class="col-12 col-sm-6 col-md-2">
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
          <div class="col-12 col-sm-6 col-md-2">
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
            <AppSelect
              v-model="filters.status"
              :options="statusOptions"
              label="Trạng thái"
              dense
              hide-bottom-space
              emit-value
              map-options
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

    <q-card flat bordered>
      <q-inner-loading :showing="loading" />

      <div
        v-if="!loading && weekGroups.length === 0"
        class="text-center q-py-xl text-grey-6"
      >
        <q-icon
          name="history"
          size="48px"
        />
        <div class="q-mt-sm">
          Chưa có lịch sử đặt hàng
        </div>
      </div>

      <q-list
        v-else
        separator
      >
        <q-expansion-item
          v-for="week in weekGroups"
          :key="week.week_id"
          group="weeks"
          header-class="text-weight-medium"
        >
          <template #header>
            <q-item-section>
              <q-item-label>{{ week.week_name }}</q-item-label>
              <q-item-label caption>
                {{ week.created_by || '-' }} · {{ formatDate(week.created_at) }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <div class="row items-center q-gutter-sm">
                <q-chip
                  :color="getStatusColor(week.status)"
                  text-color="white"
                  dense
                  size="sm"
                >
                  {{ getStatusLabel(week.status) }}
                </q-chip>
                <q-chip
                  color="primary"
                  text-color="white"
                  dense
                >
                  {{ week.total_quantity.toLocaleString('vi-VN') }} SP
                </q-chip>
              </div>
            </q-item-section>
          </template>

          <q-card>
            <q-card-section
              v-for="poGroup in week.po_groups"
              :key="poGroup.po_id ?? 'no-po'"
              class="q-pt-sm"
            >
              <div class="text-subtitle2 text-primary q-mb-sm">
                {{ poGroup.po_number }}
              </div>

              <q-card
                v-for="style in poGroup.styles"
                :key="style.style_id"
                flat
                bordered
                class="q-mb-sm q-ml-md"
              >
                <q-card-section class="q-py-sm">
                  <div class="row items-center q-mb-xs">
                    <span class="text-weight-medium">{{ style.style_code }}</span>
                    <span class="text-grey-7 q-ml-sm">{{ style.style_name }}</span>
                    <q-space />
                    <span
                      v-if="style.po_quantity > 0"
                      class="text-caption"
                    >PO: {{ style.po_quantity.toLocaleString('vi-VN') }} SP</span>
                  </div>

                  <div
                    v-if="style.po_quantity > 0"
                    class="q-mb-sm"
                  >
                    <q-linear-progress
                      :value="Math.min(style.progress_pct / 100, 1)"
                      :color="getProgressColor(style.progress_pct)"
                      size="20px"
                      rounded
                      class="q-mb-xs"
                    >
                      <div class="absolute-full flex flex-center">
                        <span class="text-caption text-white text-weight-bold">
                          {{ style.total_ordered.toLocaleString('vi-VN') }} / {{ style.po_quantity.toLocaleString('vi-VN') }} SP ({{ style.progress_pct }}%)
                        </span>
                      </div>
                    </q-linear-progress>
                  </div>

                  <div class="row q-gutter-sm q-mb-xs">
                    <q-chip
                      v-for="color in style.colors"
                      :key="color.color_id"
                      dense
                      size="sm"
                      outline
                    >
                      <span
                        class="q-mr-xs"
                        :style="{
                          display: 'inline-block',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: color.hex_code || '#999',
                          border: '1px solid #ccc',
                        }"
                      />
                      {{ color.color_name }} {{ color.quantity.toLocaleString('vi-VN') }}
                    </q-chip>
                  </div>

                  <div class="text-caption text-grey-7">
                    <span>Tuần này: <b>{{ style.this_week_quantity.toLocaleString('vi-VN') }}</b> SP</span>
                    <span class="q-mx-sm">·</span>
                    <span>Đã đặt trước đó: <b>{{ (style.total_ordered - style.this_week_quantity).toLocaleString('vi-VN') }}</b> SP</span>
                    <template v-if="style.po_quantity > 0">
                      <span class="q-mx-sm">·</span>
                      <span>Còn lại: <b>{{ style.remaining.toLocaleString('vi-VN') }}</b> SP</span>
                    </template>
                  </div>
                </q-card-section>
              </q-card>
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </q-list>

      <q-card-section
        v-if="totalPages > 1"
        class="flex flex-center"
      >
        <q-pagination
          v-model="currentPage"
          :max="totalPages"
          :max-pages="7"
          direction-links
          boundary-links
          @update:model-value="onPageChange"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { usePurchaseOrders, useStyles, useSnackbar } from '@/composables'
import { weeklyOrderService } from '@/services/weeklyOrderService'
import DatePicker from '@/components/ui/pickers/DatePicker.vue'
import type { WeekHistoryGroup, HistoryByWeekFilter } from '@/types/thread'

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

const weekGroups = ref<WeekHistoryGroup[]>([])
const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(0)
const totalItems = ref(0)

const filters = ref<HistoryByWeekFilter>({
  po_id: undefined,
  style_id: undefined,
  from_date: undefined,
  to_date: undefined,
  status: undefined,
})

const statusOptions = [
  { label: 'Tất cả (trừ đã hủy)', value: undefined },
  { label: 'Nháp', value: 'DRAFT' },
  { label: 'Đã xác nhận', value: 'CONFIRMED' },
  { label: 'Đã hủy', value: 'CANCELLED' },
  { label: 'Tất cả', value: 'ALL' },
]

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

function getProgressColor(pct: number): string {
  if (pct > 100) return 'negative'
  if (pct === 100) return 'positive'
  if (pct >= 80) return 'warning'
  return 'primary'
}

async function fetchHistory() {
  loading.value = true
  try {
    const result = await weeklyOrderService.getHistoryByWeek({
      ...filters.value,
      page: currentPage.value,
      limit: 10,
    })
    weekGroups.value = result.data
    totalPages.value = result.pagination.totalPages
    totalItems.value = result.pagination.total
  } catch (err) {
    console.error('[history-by-week] fetch error:', err)
    snackbar.error('Không thể tải lịch sử đặt hàng')
  } finally {
    loading.value = false
  }
}

function onPageChange(page: number) {
  currentPage.value = page
  fetchHistory()
}

function applyFilters() {
  currentPage.value = 1
  fetchHistory()
}

function resetFilters() {
  filters.value = {
    po_id: undefined,
    style_id: undefined,
    from_date: undefined,
    to_date: undefined,
    status: undefined,
  }
  currentPage.value = 1
  fetchHistory()
}

async function handleExportXlsx() {
  if (weekGroups.value.length === 0) return

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
      { header: 'SL (SP)', key: 'quantity', width: 12 },
      { header: 'SL PO', key: 'po_quantity', width: 12 },
      { header: 'Đã đặt', key: 'total_ordered', width: 12 },
      { header: 'Còn lại', key: 'remaining', width: 12 },
      { header: 'Tiến độ %', key: 'progress_pct', width: 12 },
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

    weekGroups.value.forEach((week) => {
      week.po_groups.forEach((poGroup) => {
        poGroup.styles.forEach((style) => {
          style.colors.forEach((color) => {
            worksheet.addRow({
              week_name: week.week_name,
              po_number: poGroup.po_number,
              style_code: style.style_code,
              style_name: style.style_name,
              color_name: color.color_name,
              quantity: color.quantity,
              po_quantity: style.po_quantity,
              total_ordered: style.total_ordered,
              remaining: style.remaining,
              progress_pct: style.progress_pct,
              created_by: week.created_by || '',
              created_at: formatDate(week.created_at),
              status: getStatusLabel(week.status),
            })
          })
        })
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
    console.error('[history-by-week] export error:', err)
    snackbar.error('Không thể xuất file Excel')
  }
}

onMounted(async () => {
  await Promise.all([fetchPurchaseOrders(), fetchStyles(), fetchHistory()])
})
</script>

<style scoped>
.q-expansion-item :deep(.q-item) {
  min-height: 56px;
}
</style>
