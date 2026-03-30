<template>
  <q-page padding>
    <PageHeader
      title="Chi Tiết Tuần Đặt Hàng"
      :subtitle="week ? week.week_name : ''"
      show-back
      :back-to="hasHistory ? undefined : '/thread/loans'"
    >
      <template
        v-if="isConfirmed"
        #actions
      >
        <div class="column items-end">
          <div class="text-caption text-grey-6 q-mb-xs">
            {{ completionProgressText }}
          </div>
          <AppButton
            color="primary"
            icon="assignment_return"
            label="Trả dư"
            :disable="!allItemsCompleted"
            :loading="surplusLoading"
            @click="openSurplusDialog"
          />
        </div>
      </template>
    </PageHeader>

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
          <div class="row q-col-gutter-md items-center">
            <div class="col-12 col-sm-3">
              <div class="text-caption text-grey-6">
                Thông Tin Đơn Hàng
              </div>
              <div class="text-subtitle1 text-weight-medium">
                {{ week.week_name }}
              </div>
            </div>
            <div class="col-12 col-sm-3">
              <div class="text-caption text-grey-6">
                Ngày giao hàng
              </div>
              <div class="text-body2">
                {{ formatDate(week.start_date) }}
              </div>
            </div>
            <div class="col-12 col-sm-3">
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
            <div
              v-if="week.created_by"
              class="col-12 col-sm-3"
            >
              <div class="text-caption text-grey-6">
                Người tạo
              </div>
              <div class="text-body2">
                {{ week.created_by }}
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
          name="calculation"
          label="Tính toán"
          icon="calculate"
        />
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
          <div class="text-caption text-grey-6 q-mb-md">
            Tạo lúc: {{ formatDateTime(week.created_at) }}
          </div>

          <!-- Completion checkboxes for PO-Style-Color items -->
          <template v-if="(isConfirmed || isCompleted) && week.items && week.items.length > 0">
            <q-separator class="q-mb-md" />
            <div class="text-subtitle2 text-weight-medium q-mb-sm">
              Trạng thái xuất chỉ
            </div>
            <q-list
              bordered
              separator
              class="rounded-borders"
            >
              <q-item
                v-for="item in week.items"
                :key="item.id"
              >
                <q-item-section side>
                  <AppCheckbox
                    :model-value="completions.has(item.id)"
                    :disable="isCompleted || completionLoading.has(item.id)"
                    :aria-label="`Đánh dấu hoàn tất ${item.po?.po_number || ''} - ${item.style?.style_code || ''} - ${item.style_color?.color_name || ''}`"
                    @update:model-value="toggleCompletion(item.id)"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label>
                    {{ item.po?.po_number || '(Không có PO)' }} — {{ item.style?.style_code || '-' }} — {{ item.style_color?.color_name || '-' }}
                  </q-item-label>
                  <q-item-label
                    v-if="item.sub_art"
                    caption
                  >
                    Sub-art: {{ item.sub_art.sub_art_code }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-spinner
                    v-if="completionLoading.has(item.id)"
                    size="20px"
                    color="primary"
                  />
                  <q-icon
                    v-else-if="completions.has(item.id)"
                    name="check_circle"
                    color="positive"
                    size="20px"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </template>
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

          <DataTable
            :rows="loans"
            :columns="loanColumns"
            row-key="id"
            flat
            bordered
            dense
            :loading="loansLoading"
            :rows-per-page-options="[20, 50, 0]"
            style="cursor: pointer"
            @row-click="(_evt: Event, row: ThreadOrderLoan) => openLoanDetail(row)"
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
            <template #body-cell-returned="props">
              <q-td :props="props">
                <span :class="props.row.status === 'SETTLED' ? 'text-positive text-weight-medium' : 'text-body2'">
                  {{ props.row.returned_cones }}/{{ props.row.quantity_cones }}
                </span>
              </q-td>
            </template>
            <template #body-cell-actions="props">
              <q-td
                :props="props"
                @click.stop
              >
                <AppButton
                  v-if="props.row.status === 'ACTIVE' && props.row.to_week_id === weekId"
                  flat
                  dense
                  color="primary"
                  icon="undo"
                  size="sm"
                  label="Trả"
                  @click="openLoanManualReturn(props.row)"
                />
              </q-td>
            </template>
            <template #no-data>
              <div class="text-center text-grey q-pa-md">
                Chưa có khoản mượn chỉ nào
              </div>
            </template>
          </DataTable>
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

        <!-- Tab: Calculation -->
        <q-tab-panel name="calculation">
          <div class="row items-center q-mb-md">
            <div class="text-subtitle2 text-weight-medium col">
              Kết quả tính toán
            </div>
            <ButtonToggle
              v-model="calculationView"
              :options="[
                { label: 'Chi tiết', value: 'detail' },
                { label: 'Tổng hợp', value: 'summary' }
              ]"
              color="grey-4"
              toggle-color="primary"
              dense
            />
          </div>

          <template v-if="calculationLoading">
            <div class="row justify-center q-py-xl">
              <q-spinner-dots
                size="40px"
                color="primary"
              />
            </div>
          </template>

          <template v-else-if="calculationResults">
            <ResultsDetailView
              v-if="calculationView === 'detail'"
              :results="deduplicatedCalculationData"
              :order-entries="orderEntriesFromItems"
              readonly
            />
            <ResultsSummaryTable
              v-else
              :rows="calculationResults.summary_data"
              readonly
            />
          </template>

          <template v-else>
            <div class="text-center text-grey q-pa-lg">
              Chưa có kết quả tính toán
            </div>
          </template>
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

    <LoanDetailDialog
      v-if="loanDetailDialog.loan"
      v-model="loanDetailDialog.open"
      :loan-id="loanDetailDialog.loan.id"
      :initial-loan="loanDetailDialog.loan"
      @returned="loadLoans"
    />

    <ManualReturnDialog
      v-if="loanManualReturnDialog.loan"
      v-model="loanManualReturnDialog.open"
      :loan="loanManualReturnDialog.loan"
      :week-id="weekId"
      @returned="loadLoans"
    />

    <!-- Surplus Preview Dialog -->
    <q-dialog v-model="showSurplusDialog">
      <q-card :style="surplusPreview?.breakdown?.length ? 'min-width: 600px; max-width: 90vw' : 'min-width: 400px'">
        <q-card-section>
          <div class="text-h6">
            Trả dư - Hoàn tất tuần
          </div>
        </q-card-section>
        <q-card-section>
          <template v-if="surplusLoading">
            <div class="text-center q-py-md">
              <q-spinner
                size="40px"
                color="primary"
              />
            </div>
          </template>
          <template v-else-if="surplusPreview">
            <template v-if="surplusPreview.breakdown && surplusPreview.breakdown.length > 0">
              <q-markup-table
                flat
                bordered
                dense
                class="q-mb-md"
              >
                <thead>
                  <tr>
                    <th class="text-left">
                      NCC
                    </th>
                    <th class="text-left">
                      Tex
                    </th>
                    <th class="text-left">
                      Màu
                    </th>
                    <th class="text-right">
                      Cuộn riêng
                    </th>
                    <th class="text-right">
                      Cuộn mượn
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in surplusPreview.breakdown"
                    :key="row.thread_type_id"
                  >
                    <td>{{ row.supplier_name }}</td>
                    <td>{{ row.tex_number }}</td>
                    <td>{{ row.color_name }}</td>
                    <td class="text-right">
                      {{ row.own_cones }}
                    </td>
                    <td class="text-right">
                      {{ row.borrowed_cones }}
                    </td>
                  </tr>
                </tbody>
              </q-markup-table>
              <div class="text-body2 text-grey-8">
                <div>
                  Trả <strong>{{ surplusPreview.breakdown.reduce((s, r) => s + r.own_cones, 0) }}</strong> cuộn riêng về Khả dụng.
                </div>
                <template v-if="surplusPreview.breakdown.some(r => r.borrowed_cones > 0)">
                  <div>
                    Trả lại <strong>{{ surplusPreview.breakdown.reduce((s, r) => s + r.borrowed_cones, 0) }}</strong> cuộn mượn:
                  </div>
                  <ul class="q-mt-xs q-mb-none">
                    <li
                      v-for="grp in allBorrowedGroups"
                      :key="grp.original_week_id"
                    >
                      {{ grp.count }} cuộn → {{ grp.week_name }}
                    </li>
                  </ul>
                </template>
              </div>
            </template>
            <template v-else-if="surplusPreview.breakdown && surplusPreview.breakdown.length === 0">
              <div class="text-body1">
                Không còn cuộn nào cần trả. Tuần sẽ được đánh dấu hoàn tất.
              </div>
            </template>
            <template v-else>
              <div
                v-if="surplusPreview.total_cones > 0"
                class="text-body1"
              >
                Sẽ trả <strong>{{ surplusPreview.total_cones }}</strong> cuộn về Khả dụng. Bạn chắc chắn?
              </div>
              <div
                v-else
                class="text-body1"
              >
                Không còn cuộn nào cần trả. Tuần sẽ được đánh dấu hoàn tất.
              </div>
            </template>
          </template>
        </q-card-section>
        <q-card-actions align="right">
          <AppButton
            flat
            label="Hủy"
            @click="showSurplusDialog = false"
          />
          <AppButton
            color="primary"
            label="Xác nhận"
            autofocus
            :loading="releaseLoading"
            :disable="surplusLoading"
            @click="confirmReleaseSurplus"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { weeklyOrderService } from '@/services/weeklyOrderService'
import { useWeeklyOrderReservations } from '@/composables/thread/useWeeklyOrderReservations'
import type { ThreadOrderWeek, ThreadOrderLoan, ReservedCone, ReservationSummary, ThreadOrderItemCompletion, SurplusPreview } from '@/types/thread'
import type { WeeklyOrderResults, StyleOrderEntry } from '@/types/thread/weeklyOrder'
import { useSnackbar } from '@/composables/useSnackbar'
import { formatThreadTypeDisplay } from '@/utils/thread-format'
import type { QTableColumn } from 'quasar'
import PageHeader from '@/components/ui/layout/PageHeader.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppBadge from '@/components/ui/cards/AppBadge.vue'
import DataTable from '@/components/ui/tables/DataTable.vue'
import LoanDialog from '@/components/thread/weekly-order/LoanDialog.vue'
import ReserveFromStockDialog from '@/components/thread/weekly-order/ReserveFromStockDialog.vue'
import LoanDetailDialog from '@/components/thread/weekly-order/LoanDetailDialog.vue'
import ManualReturnDialog from '@/components/thread/weekly-order/ManualReturnDialog.vue'
import AppCheckbox from '@/components/ui/inputs/AppCheckbox.vue'
import ResultsDetailView from '@/components/thread/weekly-order/ResultsDetailView.vue'
import ResultsSummaryTable from '@/components/thread/weekly-order/ResultsSummaryTable.vue'
import ButtonToggle from '@/components/ui/buttons/ButtonToggle.vue'

definePage({
  meta: {
    requiresAuth: true,
    permissions: ['thread.weekly-order.view'],
  },
})

const route = useRoute()
const router = useRouter()
const snackbar = useSnackbar()

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

const completions = ref<Map<number, ThreadOrderItemCompletion>>(new Map())
const completionLoading = ref<Set<number>>(new Set())
const showSurplusDialog = ref(false)
const surplusPreview = ref<SurplusPreview | null>(null)
const surplusLoading = ref(false)
const releaseLoading = ref(false)

const calculationView = ref<'detail' | 'summary'>('detail')
const calculationResults = ref<WeeklyOrderResults | null>(null)
const calculationLoading = ref(false)

const orderEntriesFromItems = computed<StyleOrderEntry[]>(() => {
  if (!week.value?.items) return []
  const map = new Map<string, StyleOrderEntry>()
  for (const item of week.value.items) {
    const key = `${item.po_id ?? 'null'}_${item.style_id}`
    if (!map.has(key)) {
      map.set(key, {
        po_id: item.po_id,
        po_number: item.po?.po_number ?? '',
        style_id: item.style_id,
        style_code: item.style?.style_code ?? '',
        style_name: item.style?.style_name ?? '',
        colors: [],
      })
    }
    const entry = map.get(key)!
    if (!entry.colors.find(c => c.color_id === item.color_id)) {
      entry.colors.push({
        color_id: item.color_id,
        color_name: item.style_color?.color_name ?? item.color?.name ?? '',
        hex_code: item.style_color?.hex_code ?? item.color?.hex_code ?? '',
        quantity: item.quantity,
        style_color_id: item.style_color_id ?? 0,
      })
    }
  }
  return Array.from(map.values())
})

const deduplicatedCalculationData = computed(() => {
  if (!calculationResults.value) return []
  const seen = new Set<number>()
  return calculationResults.value.calculation_data.filter(r => {
    if (seen.has(r.style_id)) return false
    seen.add(r.style_id)
    return true
  })
})

const isCompleted = computed(() => week.value?.status === 'COMPLETED')
const isConfirmed = computed(() => week.value?.status === 'CONFIRMED')
const totalItems = computed(() => week.value?.items?.length || 0)
const completedItems = computed(() => completions.value.size)
const allItemsCompleted = computed(() => totalItems.value > 0 && completedItems.value >= totalItems.value)
const completionProgressText = computed(() => `${completedItems.value}/${totalItems.value} hoàn tất`)

const allBorrowedGroups = computed(() => {
  if (!surplusPreview.value?.breakdown) return []
  const map = new Map<number, { original_week_id: number; week_name: string; count: number }>()
  for (const row of surplusPreview.value.breakdown) {
    for (const bg of row.borrowed_groups || []) {
      const existing = map.get(bg.original_week_id)
      if (existing) {
        existing.count += bg.count
      } else {
        map.set(bg.original_week_id, { original_week_id: bg.original_week_id, week_name: bg.week_name, count: bg.count })
      }
    }
  }
  return Array.from(map.values())
})

const loanDetailDialog = reactive<{ open: boolean; loan: ThreadOrderLoan | null }>({ open: false, loan: null })
const loanManualReturnDialog = reactive<{ open: boolean; loan: ThreadOrderLoan | null }>({ open: false, loan: null })

function openLoanDetail(loan: ThreadOrderLoan) {
  loanDetailDialog.loan = loan
  loanDetailDialog.open = true
}

function openLoanManualReturn(loan: ThreadOrderLoan) {
  loanManualReturnDialog.loan = loan
  loanManualReturnDialog.open = true
}

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

const loadCompletions = async () => {
  if (!weekId.value) return
  try {
    const data = await weeklyOrderService.getCompletions(weekId.value)
    const map = new Map<number, ThreadOrderItemCompletion>()
    for (const c of data) {
      map.set(c.item_id, c)
    }
    completions.value = map
  } catch {
    completions.value = new Map()
  }
}

const toggleCompletion = async (itemId: number) => {
  if (!weekId.value || !isConfirmed.value) return
  completionLoading.value.add(itemId)
  try {
    if (completions.value.has(itemId)) {
      await weeklyOrderService.unmarkItemComplete(weekId.value, itemId)
      completions.value.delete(itemId)
      completions.value = new Map(completions.value)
    } else {
      const result = await weeklyOrderService.markItemComplete(weekId.value, itemId)
      completions.value.set(itemId, result)
      completions.value = new Map(completions.value)
    }
  } catch (err: any) {
    snackbar.error(err.message || 'Lỗi khi cập nhật trạng thái')
  } finally {
    completionLoading.value.delete(itemId)
    completionLoading.value = new Set(completionLoading.value)
  }
}

const openSurplusDialog = async () => {
  if (!weekId.value) return
  surplusLoading.value = true
  showSurplusDialog.value = true
  try {
    surplusPreview.value = await weeklyOrderService.getSurplusPreview(weekId.value)
  } catch (err: any) {
    snackbar.error(err.message || 'Không thể tải preview')
    showSurplusDialog.value = false
  } finally {
    surplusLoading.value = false
  }
}

const confirmReleaseSurplus = async () => {
  if (!weekId.value) return
  releaseLoading.value = true
  try {
    const result = await weeklyOrderService.releaseSurplus(weekId.value)
    showSurplusDialog.value = false
    snackbar.success(`Hoàn tất! Trả ${result.released_own} cuộn về Khả dụng, trả ${result.returned_borrowed} cuộn mượn, thanh toán ${result.settled_loans} khoản mượn.`)
    await loadWeek()
    await loadCompletions()
  } catch (err: any) {
    snackbar.error(err.message || 'Lỗi khi trả dư')
  } finally {
    releaseLoading.value = false
  }
}

const loadCalculationResults = async () => {
  if (!weekId.value || calculationResults.value) return
  calculationLoading.value = true
  try {
    calculationResults.value = await weeklyOrderService.getResults(weekId.value)
  } catch {
    calculationResults.value = null
  } finally {
    calculationLoading.value = false
  }
}

watch(activeTab, (tab) => {
  if (tab === 'reservations' && reservedCones.value.length === 0) {
    loadReservations()
  }
  if (tab === 'loans' && loans.value.length === 0) {
    loadLoans()
  }
  if (tab === 'calculation' && !calculationResults.value) {
    loadCalculationResults()
  }
})

onMounted(async () => {
  await loadWeek()
  if (week.value && (week.value.status === 'CONFIRMED' || week.value.status === 'COMPLETED')) {
    loadCompletions()
  }
  const tabParam = route.query.tab as string
  if (tabParam && ['overview', 'reservations', 'loans', 'deliveries', 'calculation'].includes(tabParam)) {
    activeTab.value = tabParam
  }
})

function formatDate(d: string | null): string {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('vi-VN')
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
    COMPLETED: 'Đã hoàn tất',
  }
  return map[status] || status
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'grey',
    CONFIRMED: 'positive',
    CANCELLED: 'negative',
    COMPLETED: 'info',
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
  { name: 'thread_type', label: 'Loại chỉ', field: (row: ReservedCone) => formatThreadTypeDisplay(row.thread_type?.supplier?.name, row.thread_type?.tex_number, row.thread_type?.color?.name, row.thread_type?.name), align: 'left' },
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
  { name: 'thread_type', label: 'Loại chỉ', field: (row: ThreadOrderLoan) => formatThreadTypeDisplay(row.thread_type?.supplier?.name, row.thread_type?.tex_number, row.thread_type?.color?.name, row.thread_type?.name), align: 'left' },
  { name: 'returned', label: 'Đã trả/Tổng', field: (row: ThreadOrderLoan) => row.returned_cones, align: 'right' },
  { name: 'reason', label: 'Lý do', field: 'reason', align: 'left' },
  { name: 'created_at', label: 'Thời gian', field: (row: ThreadOrderLoan) => formatDateTime(row.created_at), align: 'left' },
  { name: 'actions', label: '', field: 'id', align: 'center' },
]
</script>
