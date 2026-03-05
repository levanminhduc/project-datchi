<template>
  <q-page padding>
    <PageHeader
      title="Chi Tiết Tuần Đặt Hàng"
      :subtitle="week ? week.week_name : ''"
      show-back
      :back-to="hasHistory ? undefined : '/thread/loans'"
    />

    <template v-if="isLoading">
      <div class="row justify-center q-py-xl">
        <q-spinner-dots
          size="50px"
          color="primary"
        />
      </div>
    </template>

    <template v-else-if="notFound">
      <q-card
        flat
        bordered
        class="text-center q-pa-xl"
      >
        <q-icon
          name="search_off"
          size="64px"
          color="grey-5"
        />
        <div class="text-h6 q-mt-md text-grey-7">
          Không tìm thấy tuần đặt hàng
        </div>
        <AppButton
          color="primary"
          label="Quay lại danh sách"
          icon="arrow_back"
          class="q-mt-md"
          @click="goBack"
        />
      </q-card>
    </template>

    <template v-else-if="week">
      <!-- Week Info Summary -->
      <q-card
        flat
        bordered
        class="q-mb-md"
      >
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-4">
              <div class="text-caption text-grey-6">
                Tuần
              </div>
              <div class="text-subtitle1 text-weight-medium">
                {{ week.week_name }}
              </div>
            </div>
            <div class="col-12 col-sm-4">
              <div class="text-caption text-grey-6">
                Thời gian
              </div>
              <div class="text-body2">
                {{ formatDateRange(week.start_date, week.end_date) }}
              </div>
            </div>
            <div class="col-12 col-sm-4">
              <div class="text-caption text-grey-6">
                Trạng thái
              </div>
              <div class="q-mt-xs">
                <AppBadge
                  :label="statusLabel(week.status)"
                  :color="statusColor(week.status)"
                />
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Tabs -->
      <q-tabs
        v-model="activeTab"
        dense
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="left"
        narrow-indicator
      >
        <q-tab
          name="overview"
          label="Tổng quan"
          icon="info"
        />
        <q-tab
          name="reservations"
          label="Đặt trước"
          icon="bookmark"
        />
        <q-tab
          name="loans"
          label="Mượn chỉ"
          icon="swap_horiz"
        />
        <q-tab
          name="deliveries"
          label="Giao hàng"
          icon="local_shipping"
        />
      </q-tabs>

      <q-separator />

      <q-tab-panels
        v-model="activeTab"
        animated
        keep-alive
      >
        <!-- Tab: Overview -->
        <q-tab-panel name="overview">
          <div class="text-subtitle2 text-weight-medium q-mb-md">
            Thông tin chung
          </div>
          <div
            v-if="week.notes"
            class="text-body2 text-grey-7 q-mb-md"
          >
            {{ week.notes }}
          </div>
          <div class="text-caption text-grey-6">
            Tạo lúc: {{ formatDateTime(week.created_at) }}
          </div>
        </q-tab-panel>

        <!-- Tab: Reservations -->
        <q-tab-panel name="reservations">
          <div class="row items-center q-mb-md">
            <div class="text-subtitle2 text-weight-medium col">
              Danh sách cuộn đặt trước
            </div>
            <AppButton
              flat
              icon="refresh"
              label="Tải lại"
              size="sm"
              :loading="reservationLoading"
              @click="loadReservations"
            />
          </div>

          <!-- Reservation summary by thread type -->
          <q-table
            v-if="reservationSummary.length > 0"
            :rows="reservationSummary"
            :columns="reservationSummaryColumns"
            row-key="thread_type_id"
            flat
            bordered
            dense
            class="q-mb-md"
            :rows-per-page-options="[0]"
            hide-pagination
          >
            <template #body-cell-status="props">
              <q-td :props="props">
                <AppBadge
                  :label="props.row.shortage > 0 ? 'Thiếu' : 'Đủ'"
                  :color="props.row.shortage > 0 ? 'negative' : 'positive'"
                />
              </q-td>
            </template>
            <template #body-cell-actions="props">
              <q-td :props="props">
                <AppButton
                  v-if="week?.status === 'CONFIRMED' && props.row.shortage > 0 && props.row.available_stock > 0 && props.row.can_reserve"
                  size="sm"
                  color="primary"
                  label="Lấy từ tồn kho"
                  flat
                  dense
                  @click="openReserveFromStockDialog(props.row, props.row.thread_type_name || String(props.row.thread_type_id))"
                />
              </q-td>
            </template>
          </q-table>

          <!-- Reserved cones list -->
          <div class="text-subtitle2 text-weight-medium q-mb-sm">
            Chi tiết cuộn đặt trước
          </div>
          <q-table
            :rows="reservedCones"
            :columns="reservedConesColumns"
            row-key="id"
            flat
            bordered
            dense
            :loading="reservationLoading"
            :rows-per-page-options="[20, 50, 0]"
          >
            <template #no-data>
              <div class="text-center text-grey q-pa-md">
                Chưa có cuộn nào được đặt trước
              </div>
            </template>
          </q-table>
        </q-tab-panel>

        <!-- Tab: Loans -->
        <q-tab-panel name="loans">
          <div class="row items-center q-mb-md">
            <div class="text-subtitle2 text-weight-medium col">
              Lịch sử mượn chỉ
            </div>
            <AppButton
              v-if="week.status === 'CONFIRMED'"
              color="primary"
              icon="add"
              label="Mượn chỉ"
              size="sm"
              @click="showLoanDialog = true"
            />
          </div>

          <q-table
            :rows="loans"
            :columns="loanColumns"
            row-key="id"
            flat
            bordered
            dense
            :loading="loansLoading"
            :rows-per-page-options="[20, 50, 0]"
          >
            <template #body-cell-direction="props">
              <q-td :props="props">
                <AppBadge
                  v-if="props.row.from_week_id === null"
                  label="Tồn kho"
                  color="info"
                />
                <AppBadge
                  v-else
                  :label="props.row.to_week_id === weekId ? 'Nhận' : 'Cho'"
                  :color="props.row.to_week_id === weekId ? 'positive' : 'warning'"
                />
              </q-td>
            </template>
            <template #body-cell-status="props">
              <q-td :props="props">
                <AppBadge
                  :label="props.row.status === 'SETTLED' ? 'Đã trả' : 'Đang mượn'"
                  :color="props.row.status === 'SETTLED' ? 'positive' : 'warning'"
                />
              </q-td>
            </template>
            <template #no-data>
              <div class="text-center text-grey q-pa-md">
                Chưa có khoản mượn chỉ nào
              </div>
            </template>
          </q-table>
        </q-tab-panel>

        <!-- Tab: Deliveries -->
        <q-tab-panel name="deliveries">
          <div class="text-subtitle2 text-weight-medium q-mb-md">
            Thông tin giao hàng
          </div>
          <div class="text-body2 text-grey-7">
            Xem chi tiết giao hàng tại trang
            <AppButton
              flat
              dense
              color="primary"
              label="Quản lý giao hàng"
              @click="router.push('/thread/weekly-order/deliveries')"
            />
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </template>

    <!-- Loan Dialog -->
    <LoanDialog
      v-if="week"
      v-model="showLoanDialog"
      :to-week-id="weekId"
      :to-week-name="week.week_name"
      @created="onLoanCreated"
    />

    <!-- Reserve from Stock Dialog -->
    <ReserveFromStockDialog
      v-if="week"
      v-model="showReserveFromStockDialog"
      :week-id="weekId"
      :summary-item="selectedReservationSummary"
      :thread-type-name="selectedThreadTypeName"
      @reserved="onReserveFromStockComplete"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { weeklyOrderService } from '@/services/weeklyOrderService'
import { useWeeklyOrderReservations } from '@/composables/thread/useWeeklyOrderReservations'
import type { ThreadOrderWeek, ThreadOrderLoan, ReservedCone, ReservationSummary } from '@/types/thread'
import type { QTableColumn } from 'quasar'
import PageHeader from '@/components/ui/layout/PageHeader.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppBadge from '@/components/ui/cards/AppBadge.vue'
import LoanDialog from '@/components/thread/weekly-order/LoanDialog.vue'
import ReserveFromStockDialog from '@/components/thread/weekly-order/ReserveFromStockDialog.vue'

definePage({
  meta: {
    requiresAuth: true,
    permissions: ['thread.view'],
  },
})

const route = useRoute()
const router = useRouter()

const weekId = computed(() => Number((route.params as { id?: string }).id || '0'))

const hasHistory = Boolean(window.history.state?.back)

const goBack = () => {
  if (hasHistory) {
    router.back()
  } else {
    router.push('/thread/loans')
  }
}

const week = ref<ThreadOrderWeek | null>(null)
const notFound = ref(false)
const isLoading = ref(false)

const activeTab = ref('overview')
const showLoanDialog = ref(false)
const showReserveFromStockDialog = ref(false)
const selectedReservationSummary = ref<ReservationSummary | null>(null)
const selectedThreadTypeName = ref('')

const loans = ref<ThreadOrderLoan[]>([])
const loansLoading = ref(false)

const { reservationSummary, reservedCones, isLoading: reservationLoading, fetchReservations } = useWeeklyOrderReservations()

const loadWeek = async () => {
  if (!weekId.value || isNaN(weekId.value)) {
    notFound.value = true
    return
  }
  isLoading.value = true
  try {
    week.value = await weeklyOrderService.getById(weekId.value)
  } catch {
    notFound.value = true
  } finally {
    isLoading.value = false
  }
}

const loadReservations = async () => {
  if (!weekId.value) return
  await fetchReservations(weekId.value)
}

const loadLoans = async () => {
  if (!weekId.value) return
  loansLoading.value = true
  try {
    const data = await weeklyOrderService.getLoans(weekId.value)
    loans.value = data.all
  } catch {
    loans.value = []
  } finally {
    loansLoading.value = false
  }
}

const onLoanCreated = async () => {
  showLoanDialog.value = false
  await loadLoans()
}

const openReserveFromStockDialog = (summary: ReservationSummary, threadTypeName: string) => {
  selectedReservationSummary.value = summary
  selectedThreadTypeName.value = threadTypeName
  showReserveFromStockDialog.value = true
}

const onReserveFromStockComplete = async () => {
  showReserveFromStockDialog.value = false
  await loadReservations()
  await loadLoans()
}

watch(activeTab, (tab) => {
  if (tab === 'reservations' && reservedCones.value.length === 0) {
    loadReservations()
  }
  if (tab === 'loans' && loans.value.length === 0) {
    loadLoans()
  }
})

onMounted(() => {
  loadWeek()
})

function formatDateRange(start: string | null, end: string | null): string {
  if (!start && !end) return '-'
  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('vi-VN') : '?'
  return `${fmt(start)} - ${fmt(end)}`
}

function formatDateTime(dt: string): string {
  if (!dt) return '-'
  return new Date(dt).toLocaleString('vi-VN')
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'Nháp',
    CONFIRMED: 'Đã xác nhận',
    CANCELLED: 'Đã hủy',
  }
  return map[status] || status
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'grey',
    CONFIRMED: 'positive',
    CANCELLED: 'negative',
  }
  return map[status] || 'grey'
}

const reservationSummaryColumns: QTableColumn[] = [
  { name: 'thread_type_id', label: 'Loại chỉ', field: 'thread_type_id', align: 'left' },
  { name: 'needed', label: 'Cần (cuộn)', field: 'needed', align: 'right' },
  { name: 'reserved', label: 'Đã đặt trước (cuộn)', field: 'reserved', align: 'right' },
  { name: 'shortage', label: 'Thiếu (cuộn)', field: 'shortage', align: 'right' },
  { name: 'available_stock', label: 'Tồn kho', field: 'available_stock', align: 'right' },
  { name: 'status', label: 'Trạng thái', field: 'shortage', align: 'center' },
  { name: 'actions', label: '', field: 'actions', align: 'center' },
]

const reservedConesColumns: QTableColumn[] = [
  { name: 'cone_id', label: 'Mã cuộn', field: 'cone_id', align: 'left' },
  { name: 'thread_type', label: 'Loại chỉ', field: (row: ReservedCone) => row.thread_type?.name || '-', align: 'left' },
  { name: 'warehouse', label: 'Kho', field: (row: ReservedCone) => row.warehouse?.name || '-', align: 'left' },
  { name: 'quantity_meters', label: 'Mét', field: 'quantity_meters', align: 'right' },
  { name: 'lot_number', label: 'Lô', field: 'lot_number', align: 'left' },
  { name: 'expiry_date', label: 'HSD', field: (row: ReservedCone) => row.expiry_date ? new Date(row.expiry_date).toLocaleDateString('vi-VN') : '-', align: 'left' },
]

const loanColumns: QTableColumn[] = [
  { name: 'direction', label: 'Chiều', field: 'to_week_id', align: 'center' },
  { name: 'status', label: 'Trạng thái', field: 'status', align: 'center' },
  { name: 'from_week', label: 'Nguồn', field: (row: ThreadOrderLoan) => row.from_week_id === null ? 'Tồn kho' : (row.from_week?.week_name || '-'), align: 'left' },
  { name: 'to_week', label: 'Tuần nhận', field: (row: ThreadOrderLoan) => row.to_week?.week_name || '-', align: 'left' },
  { name: 'thread_type', label: 'Loại chỉ', field: (row: ThreadOrderLoan) => row.thread_type?.name || '-', align: 'left' },
  { name: 'quantity_cones', label: 'Cuộn', field: 'quantity_cones', align: 'right' },
  { name: 'reason', label: 'Lý do', field: 'reason', align: 'left' },
  { name: 'created_at', label: 'Thời gian', field: (row: ThreadOrderLoan) => formatDateTime(row.created_at), align: 'left' },
]
</script>
