<template>
  <q-page padding>
    <PageHeader
      title="Mượn Chỉ"
      subtitle="Tổng quan tuần hàng và quản lý mượn chỉ"
    />

    <!-- Section 1: Week Summary -->
    <q-card
      flat
      bordered
      class="q-mb-md"
    >
      <q-card-section class="row items-center q-pb-none">
        <div class="text-subtitle1 text-weight-medium col">
          Tổng quan tuần hàng
        </div>
        <AppButton
          flat
          icon="refresh"
          label="Tải lại"
          :loading="summaryLoading"
          @click="loadSummary"
        />
      </q-card-section>

      <q-card-section>
        <q-table
          :rows="summary"
          :columns="summaryColumns"
          row-key="week_id"
          flat
          bordered
          dense
          :loading="summaryLoading"
          :pagination="{ rowsPerPage: 0 }"
          hide-pagination
        >
          <template #body="props">
            <q-tr :props="props">
              <q-td
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
              >
                <template v-if="col.name === 'week_name'">
                  <div class="row items-center no-wrap">
                    <q-btn
                      flat
                      dense
                      round
                      size="sm"
                      :icon="expandedWeeks.includes(props.row.week_id) ? 'expand_less' : 'expand_more'"
                      @click.stop="toggleWeekDetail(props.row.week_id)"
                    />
                    <router-link
                      :to="`/thread/weekly-order/${props.row.week_id}`"
                      class="text-primary text-weight-medium"
                    >
                      {{ props.row.week_name }}
                    </router-link>
                  </div>
                </template>
                <template v-else-if="col.name === 'shortage'">
                  <span :class="props.row.shortage > 0 ? 'text-negative text-weight-bold' : 'text-positive'">
                    {{ props.row.shortage }}
                  </span>
                </template>
                <template v-else-if="col.name === 'ncc_status'">
                  <span
                    v-if="props.row.ncc_pending > 0"
                    class="text-warning"
                  >Chờ {{ props.row.ncc_pending }} cuộn</span>
                  <span
                    v-else-if="props.row.ncc_ordered > 0"
                    class="text-positive"
                  >Đã nhận đủ</span>
                  <span
                    v-else
                    class="text-grey"
                  >-</span>
                </template>
                <template v-else-if="col.name === 'borrowed'">
                  <span
                    v-if="props.row.borrowed_cones > 0"
                    class="text-warning"
                  >{{ props.row.borrowed_cones }} cuộn ({{ props.row.borrowed_count }} khoản)</span>
                  <span
                    v-else
                    class="text-grey"
                  >-</span>
                </template>
                <template v-else-if="col.name === 'borrowed_returned'">
                  <span
                    v-if="props.row.borrowed_returned_cones > 0"
                    class="text-positive"
                  >{{ props.row.borrowed_returned_cones }} cuộn</span>
                  <span
                    v-else
                    class="text-grey"
                  >-</span>
                </template>
                <template v-else-if="col.name === 'lent'">
                  <span
                    v-if="props.row.lent_cones > 0"
                    class="text-info"
                  >{{ props.row.lent_cones }} cuộn ({{ props.row.lent_count }} khoản)</span>
                  <span
                    v-else
                    class="text-grey"
                  >-</span>
                </template>
                <template v-else-if="col.name === 'lent_returned'">
                  <span
                    v-if="props.row.lent_returned_cones > 0"
                    class="text-positive"
                  >{{ props.row.lent_returned_cones }} cuộn</span>
                  <span
                    v-else
                    class="text-grey"
                  >-</span>
                </template>
                <template v-else-if="col.name === 'actions'">
                  <div class="row justify-center">
                    <AppButton
                      v-if="props.row.week_status === 'CONFIRMED'"
                      flat
                      dense
                      color="primary"
                      icon="swap_horiz"
                      size="sm"
                      label="Mượn chỉ"
                      @click.stop="openLoanDialog(props.row.week_id, props.row.week_name)"
                    />
                  </div>
                </template>
                <template v-else>
                  {{ col.value }}
                </template>
              </q-td>
            </q-tr>
            <!-- Expanded detail row -->
            <q-tr
              v-if="expandedWeeks.includes(props.row.week_id)"
              class="bg-grey-1"
            >
              <q-td
                colspan="100%"
                class="q-pa-sm"
              >
                <div
                  v-if="weekDetailLoading.has(props.row.week_id)"
                  class="text-center q-pa-md"
                >
                  <q-spinner
                    size="sm"
                    color="primary"
                  />
                  <span class="q-ml-sm text-grey">Đang tải...</span>
                </div>
                <DataTable
                  v-else-if="weekDetailCache.get(props.row.week_id)?.length"
                  :rows="weekDetailCache.get(props.row.week_id) ?? []"
                  :columns="detailColumns"
                  row-key="thread_type_id"
                  dense
                  :hide-pagination="true"
                  class="q-ml-lg"
                  style="max-width: 900px"
                />
                <div
                  v-else
                  class="text-center text-grey q-pa-sm"
                >
                  Không có dữ liệu chi tiết
                </div>
              </q-td>
            </q-tr>
          </template>

          <template #no-data>
            <div class="text-center text-grey q-pa-md">
              Không có tuần hàng đang hoạt động
            </div>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Section 2: Loan List -->
    <q-card
      flat
      bordered
    >
      <q-card-section class="row items-center q-pb-none">
        <div class="text-subtitle1 text-weight-medium col">
          Danh sách mượn chỉ
        </div>
        <div class="row items-center q-gutter-sm">
          <q-btn-toggle
            v-model="statusFilter"
            dense
            flat
            no-caps
            toggle-color="primary"
            :options="[
              { label: 'Tất cả', value: 'all' },
              { label: 'Đang mượn', value: 'ACTIVE' },
              { label: 'Đã trả', value: 'SETTLED' },
            ]"
          />
          <AppButton
            flat
            icon="refresh"
            :loading="loansLoading"
            @click="loadLoans"
          />
        </div>
      </q-card-section>

      <q-card-section>
        <DataTable
          :rows="filteredLoans"
          :columns="loanColumns"
          row-key="id"
          flat
          bordered
          dense
          :loading="loansLoading"
          :rows-per-page-options="[20, 50, 100]"
          :filter="filter"
        >
          <template #top-right>
            <AppInput
              v-model="filter"
              dense
              outlined
              placeholder="Tìm kiếm..."
            >
              <template #append>
                <q-icon name="search" />
              </template>
            </AppInput>
          </template>

          <template #body="props">
            <!-- Main row -->
            <q-tr
              :props="props"
              class="cursor-pointer"
              @click="openDetail(props.row)"
            >
              <q-td
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
                @click.stop="col.name === 'actions' || col.name === 'expand' ? undefined : openDetail(props.row)"
              >
                <template v-if="col.name === 'expand'">
                  <q-btn
                    flat
                    dense
                    round
                    size="xs"
                    :icon="expandedLoans.includes(props.row.id) ? 'expand_less' : 'expand_more'"
                    @click.stop="toggleLoanExpand(props.row.id)"
                  />
                </template>
                <template v-else-if="col.name === 'from_week'">
                  <router-link
                    v-if="props.row.from_week"
                    :to="`/thread/weekly-order/${props.row.from_week.id}`"
                    class="text-primary"
                    @click.stop
                  >
                    {{ props.row.from_week.week_name }}
                  </router-link>
                  <span
                    v-else
                    class="text-grey"
                  >Tồn kho</span>
                </template>
                <template v-else-if="col.name === 'to_week'">
                  <router-link
                    :to="`/thread/weekly-order/${props.row.to_week?.id}`"
                    class="text-primary"
                    @click.stop
                  >
                    {{ props.row.to_week?.week_name || '-' }}
                  </router-link>
                </template>
                <template v-else-if="col.name === 'thread_type'">
                  <span class="text-weight-medium">{{ formatLoanThreadType(props.row) }}</span>
                </template>
                <template v-else-if="col.name === 'returned'">
                  <span :class="props.row.status === 'SETTLED' ? 'text-positive text-weight-medium' : 'text-body2'">
                    {{ props.row.returned_cones }}/{{ props.row.quantity_cones }}
                  </span>
                </template>
                <template v-else-if="col.name === 'status'">
                  <AppBadge
                    :label="props.row.status === 'SETTLED' ? 'Đã trả' : 'Đang mượn'"
                    :color="props.row.status === 'SETTLED' ? 'positive' : 'warning'"
                  />
                </template>
                <template v-else-if="col.name === 'actions'">
                  <div @click.stop>
                    <AppButton
                      v-if="props.row.status === 'ACTIVE'"
                      flat
                      dense
                      color="primary"
                      icon="undo"
                      size="sm"
                      label="Trả"
                      @click="openManualReturn(props.row)"
                    />
                  </div>
                </template>
                <template v-else>
                  {{ col.value }}
                </template>
              </q-td>
            </q-tr>

            <!-- Expandable return log preview row -->
            <q-tr
              v-if="expandedLoans.includes(props.row.id)"
              class="bg-grey-1"
            >
              <q-td colspan="100%">
                <div
                  v-if="loanLogLoading.has(props.row.id)"
                  class="row items-center q-pa-sm q-gutter-xs text-grey"
                >
                  <q-spinner
                    size="xs"
                    color="primary"
                  />
                  <span>Đang tải lịch sử...</span>
                </div>
                <div
                  v-else-if="loanLogErrors.has(props.row.id)"
                  class="row items-center q-pa-sm q-gutter-xs text-negative text-caption"
                >
                  <q-icon
                    name="error_outline"
                    size="xs"
                  />
                  <span>Lỗi tải lịch sử</span>
                  <AppButton
                    flat
                    dense
                    size="xs"
                    label="Thử lại"
                    @click.stop="retryLoadLogs(props.row.id)"
                  />
                </div>
                <div
                  v-else-if="!loanLogCache.has(props.row.id) || loanLogCache.get(props.row.id)?.length === 0"
                  class="text-grey text-caption q-pa-sm"
                >
                  Chưa có lần trả nào
                </div>
                <div
                  v-else
                  class="q-pa-sm"
                >
                  <div
                    v-for="log in loanLogCache.get(props.row.id)!.slice(0, 3)"
                    :key="log.id"
                    class="row items-center q-gutter-xs q-mb-xs text-caption"
                  >
                    <q-icon
                      :name="log.return_type === 'AUTO' ? 'smart_toy' : 'build'"
                      size="xs"
                      :color="log.return_type === 'AUTO' ? 'grey-6' : 'primary'"
                    />
                    <span class="text-grey-7">{{ formatLogDate(log.created_at) }}</span>
                    <span class="text-weight-medium">{{ log.cones_returned }} cuộn</span>
                    <span class="text-grey-6">–</span>
                    <span>{{ log.returned_by }}</span>
                    <span
                      v-if="log.notes"
                      class="text-grey-6"
                    >({{ log.notes }})</span>
                  </div>
                  <AppButton
                    v-if="(loanLogCache.get(props.row.id)?.length ?? 0) > 3"
                    flat
                    dense
                    size="xs"
                    color="primary"
                    :label="`Xem đầy đủ (${loanLogCache.get(props.row.id)?.length})`"
                    @click.stop="openDetail(props.row)"
                  />
                </div>
              </q-td>
            </q-tr>
          </template>

          <template #no-data>
            <div class="text-center text-grey q-pa-xl">
              <q-icon
                name="swap_horiz"
                size="48px"
                color="grey-5"
              />
              <div class="q-mt-md">
                Chưa có khoản mượn chỉ nào
              </div>
            </div>
          </template>
        </DataTable>
      </q-card-section>
    </q-card>

    <!-- Dialogs -->
    <LoanDialog
      v-if="loanDialog.weekId !== null"
      v-model="loanDialog.open"
      :to-week-id="loanDialog.weekId"
      :to-week-name="loanDialog.weekName"
      @created="handleLoanChanged"
    />

    <LoanDetailDialog
      v-if="detailDialog.loan"
      v-model="detailDialog.open"
      :loan-id="detailDialog.loan.id"
      :initial-loan="detailDialog.loan"
      @returned="handleLoanChanged"
    />

    <ManualReturnDialog
      v-if="manualReturnDialog.loan"
      v-model="manualReturnDialog.open"
      :loan="manualReturnDialog.loan"
      :week-id="manualReturnDialog.loan.to_week_id"
      @returned="handleLoanChanged"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { weeklyOrderService } from '@/services/weeklyOrderService'
import type { ThreadOrderLoan, LoanDashboardSummary, LoanDetailByType, LoanReturnLog } from '@/types/thread'
import type { QTableColumn } from 'quasar'
import { useSnackbar } from '@/composables/useSnackbar'
import { formatThreadTypeDisplay } from '@/utils/thread-format'
import PageHeader from '@/components/ui/layout/PageHeader.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppBadge from '@/components/ui/cards/AppBadge.vue'
import DataTable from '@/components/ui/tables/DataTable.vue'
import LoanDialog from '@/components/thread/weekly-order/LoanDialog.vue'
import LoanDetailDialog from '@/components/thread/weekly-order/LoanDetailDialog.vue'
import ManualReturnDialog from '@/components/thread/weekly-order/ManualReturnDialog.vue'

definePage({
  meta: {
    requiresAuth: true,
    permissions: ['thread.allocations.view'],
  },
})

const snackbar = useSnackbar()

const summary = ref<LoanDashboardSummary[]>([])
const summaryLoading = ref(false)
const loans = ref<ThreadOrderLoan[]>([])
const loansLoading = ref(false)
const filter = ref('')
const statusFilter = ref<'all' | 'ACTIVE' | 'SETTLED'>('all')

const expandedWeeks = ref<number[]>([])
const weekDetailCache = ref<Map<number, LoanDetailByType[]>>(new Map())
const weekDetailLoading = ref<Set<number>>(new Set())

const expandedLoans = ref<number[]>([])
const loanLogCache = ref<Map<number, LoanReturnLog[]>>(new Map())
const loanLogLoading = ref<Set<number>>(new Set())
const loanLogErrors = ref<Set<number>>(new Set())

const loanDialog = reactive<{ open: boolean; weekId: number | null; weekName: string }>({
  open: false,
  weekId: null,
  weekName: '',
})
const detailDialog = reactive<{ open: boolean; loan: ThreadOrderLoan | null }>({ open: false, loan: null })
const manualReturnDialog = reactive<{ open: boolean; loan: ThreadOrderLoan | null }>({ open: false, loan: null })

const filteredLoans = computed(() => {
  if (statusFilter.value === 'all') return loans.value
  return loans.value.filter((l) => l.status === statusFilter.value)
})

const summaryColumns: QTableColumn[] = [
  { name: 'week_name', label: 'Tuần', field: 'week_name', align: 'left', sortable: true },
  { name: 'total_needed', label: 'Cần (cuộn)', field: 'total_needed', align: 'right' },
  { name: 'total_reserved', label: 'Đã có', field: 'total_reserved', align: 'right' },
  { name: 'shortage', label: 'Thiếu', field: 'shortage', align: 'right', sortable: true },
  { name: 'ncc_status', label: 'NCC giao hàng', field: 'ncc_pending', align: 'left' },
  { name: 'borrowed', label: 'Đang mượn', field: 'borrowed_cones', align: 'left' },
  { name: 'borrowed_returned', label: 'Đã trả (mượn)', field: 'borrowed_returned_cones', align: 'right' },
  { name: 'lent', label: 'Đang cho mượn', field: 'lent_cones', align: 'left' },
  { name: 'lent_returned', label: 'Đã thu (cho mượn)', field: 'lent_returned_cones', align: 'right' },
  { name: 'actions', label: '', field: 'week_id', align: 'center' },
]

const loanColumns: QTableColumn[] = [
  { name: 'expand', label: '', field: 'id', align: 'center', style: 'width: 32px' },
  { name: 'from_week', label: 'Tuần cho mượn', field: (row) => row.from_week?.week_name, align: 'left', sortable: true },
  { name: 'to_week', label: 'Tuần mượn', field: (row) => row.to_week?.week_name, align: 'left', sortable: true },
  { name: 'thread_type', label: 'Loại chỉ', field: (row) => formatLoanThreadType(row as ThreadOrderLoan), align: 'left', sortable: true },
  { name: 'returned', label: 'Đã trả/Tổng', field: (row) => row.returned_cones, align: 'right', sortable: true },
  { name: 'status', label: 'Trạng thái', field: 'status', align: 'center' },
  { name: 'reason', label: 'Lý do', field: 'reason', align: 'left' },
  { name: 'created_at', label: 'Ngày tạo', field: 'created_at', align: 'left', sortable: true, format: (val: string) => new Date(val).toLocaleDateString('vi-VN') },
  { name: 'actions', label: '', field: 'id', align: 'center' },
]

const detailColumns: QTableColumn[] = [
  { name: 'thread_type', label: 'Loại chỉ', field: (row) => formatDetailThreadType(row), align: 'left' },
  { name: 'borrowed_cones', label: 'Mượn', field: 'borrowed_cones', align: 'right' },
  { name: 'borrowed_returned', label: 'Đã trả (mượn)', field: 'borrowed_returned_cones', align: 'right' },
  { name: 'lent_cones', label: 'Cho mượn', field: 'lent_cones', align: 'right' },
  { name: 'lent_returned', label: 'Đã thu (cho mượn)', field: 'lent_returned_cones', align: 'right' },
  { name: 'ncc_pending', label: 'Chờ NCC', field: 'ncc_pending', align: 'right' },
]

function openDetail(loan: ThreadOrderLoan) {
  detailDialog.loan = loan
  detailDialog.open = true
}

function openManualReturn(loan: ThreadOrderLoan) {
  manualReturnDialog.loan = loan
  manualReturnDialog.open = true
}

function openLoanDialog(weekId: number, weekName: string) {
  loanDialog.weekId = weekId
  loanDialog.weekName = weekName
  loanDialog.open = true
}

async function toggleLoanExpand(loanId: number) {
  const idx = expandedLoans.value.indexOf(loanId)
  if (idx >= 0) {
    expandedLoans.value.splice(idx, 1)
    return
  }
  expandedLoans.value.push(loanId)
  if (loanLogCache.value.has(loanId)) return
  await fetchLoanLogs(loanId)
}

async function fetchLoanLogs(loanId: number) {
  loanLogLoading.value.add(loanId)
  loanLogErrors.value.delete(loanId)
  try {
    const data = await weeklyOrderService.getReturnLogs(loanId)
    loanLogCache.value.set(loanId, data)
  } catch {
    loanLogErrors.value.add(loanId)
  } finally {
    loanLogLoading.value.delete(loanId)
  }
}

async function retryLoadLogs(loanId: number) {
  await fetchLoanLogs(loanId)
}

function formatLogDate(isoDate: string): string {
  const d = new Date(isoDate)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm} ${hh}:${min}`
}

function formatLoanThreadType(loan: ThreadOrderLoan): string {
  return formatThreadTypeDisplay(loan.supplier_name, loan.tex_number, loan.color_name, loan.thread_type?.name)
}

function formatDetailThreadType(row: LoanDetailByType): string {
  return formatThreadTypeDisplay(row.supplier_name, row.tex_number, row.color_name, row.thread_name)
}

async function loadSummary() {
  summaryLoading.value = true
  try {
    summary.value = await weeklyOrderService.getLoanSummary()
  } catch (err) {
    snackbar.error(err instanceof Error ? err.message : 'Lỗi tải tổng quan')
  } finally {
    summaryLoading.value = false
  }
}

async function toggleWeekDetail(weekId: number) {
  const idx = expandedWeeks.value.indexOf(weekId)
  if (idx >= 0) {
    expandedWeeks.value.splice(idx, 1)
    return
  }
  expandedWeeks.value.push(weekId)
  if (weekDetailCache.value.has(weekId)) return
  weekDetailLoading.value.add(weekId)
  try {
    const data = await weeklyOrderService.getLoanDetailByType(weekId)
    weekDetailCache.value.set(weekId, data)
  } catch (err) {
    snackbar.error(err instanceof Error ? err.message : 'Lỗi tải chi tiết')
    expandedWeeks.value.splice(expandedWeeks.value.indexOf(weekId), 1)
  } finally {
    weekDetailLoading.value.delete(weekId)
  }
}

async function loadLoans() {
  loansLoading.value = true
  try {
    loans.value = await weeklyOrderService.getAllLoans()
  } catch (err) {
    snackbar.error(err instanceof Error ? err.message : 'Lỗi tải dữ liệu')
  } finally {
    loansLoading.value = false
  }
}

async function handleLoanChanged() {
  loanDialog.open = false
  expandedWeeks.value = []
  expandedLoans.value = []
  weekDetailCache.value = new Map()
  loanLogCache.value = new Map()
  loanLogLoading.value = new Set()
  loanLogErrors.value = new Set()
  await Promise.all([loadSummary(), loadLoans()])
}

onMounted(() => {
  loadSummary()
  loadLoans()
})
</script>
