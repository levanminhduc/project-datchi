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
          <template #body-cell-week_name="props">
            <q-td :props="props">
              <router-link
                :to="`/thread/weekly-order/${props.row.week_id}`"
                class="text-primary text-weight-medium"
              >
                {{ props.row.week_name }}
              </router-link>
            </q-td>
          </template>

          <template #body-cell-shortage="props">
            <q-td :props="props">
              <span :class="props.row.shortage > 0 ? 'text-negative text-weight-bold' : 'text-positive'">
                {{ props.row.shortage }}
              </span>
            </q-td>
          </template>

          <template #body-cell-ncc_status="props">
            <q-td :props="props">
              <span
                v-if="props.row.ncc_pending > 0"
                class="text-warning"
              >
                Chờ {{ props.row.ncc_pending }} cuộn
              </span>
              <span
                v-else-if="props.row.ncc_ordered > 0"
                class="text-positive"
              >
                Đã nhận đủ
              </span>
              <span
                v-else
                class="text-grey"
              >-</span>
            </q-td>
          </template>

          <template #body-cell-borrowed="props">
            <q-td :props="props">
              <span
                v-if="props.row.borrowed_cones > 0"
                class="text-warning"
              >
                {{ props.row.borrowed_cones }} cuộn ({{ props.row.borrowed_count }} khoản)
              </span>
              <span
                v-else
                class="text-grey"
              >-</span>
            </q-td>
          </template>

          <template #body-cell-lent="props">
            <q-td :props="props">
              <span
                v-if="props.row.lent_cones > 0"
                class="text-info"
              >
                {{ props.row.lent_cones }} cuộn ({{ props.row.lent_count }} khoản)
              </span>
              <span
                v-else
                class="text-grey"
              >-</span>
            </q-td>
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
        <q-table
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

          <template #body-cell-from_week="props">
            <q-td :props="props">
              <router-link
                v-if="props.row.from_week"
                :to="`/thread/weekly-order/${props.row.from_week.id}`"
                class="text-primary"
              >
                {{ props.row.from_week.week_name }}
              </router-link>
              <span
                v-else
                class="text-grey"
              >Tồn kho</span>
            </q-td>
          </template>

          <template #body-cell-to_week="props">
            <q-td :props="props">
              <router-link
                :to="`/thread/weekly-order/${props.row.to_week?.id}`"
                class="text-primary"
              >
                {{ props.row.to_week?.week_name || '-' }}
              </router-link>
            </q-td>
          </template>

          <template #body-cell-thread_type="props">
            <q-td :props="props">
              <span class="text-weight-medium">{{ props.row.thread_type?.code }}</span>
              <span class="text-grey-6 q-ml-xs">{{ props.row.thread_type?.name }}</span>
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
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { weeklyOrderService } from '@/services/weeklyOrderService'
import type { ThreadOrderLoan, LoanDashboardSummary } from '@/types/thread'
import type { QTableColumn } from 'quasar'
import { useSnackbar } from '@/composables/useSnackbar'
import PageHeader from '@/components/ui/layout/PageHeader.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppBadge from '@/components/ui/cards/AppBadge.vue'

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
  { name: 'lent', label: 'Đang cho mượn', field: 'lent_cones', align: 'left' },
]

const loanColumns: QTableColumn[] = [
  { name: 'from_week', label: 'Tuần cho mượn', field: (row) => row.from_week?.week_name, align: 'left', sortable: true },
  { name: 'to_week', label: 'Tuần mượn', field: (row) => row.to_week?.week_name, align: 'left', sortable: true },
  { name: 'thread_type', label: 'Loại chỉ', field: (row) => row.thread_type?.code, align: 'left', sortable: true },
  { name: 'quantity_cones', label: 'Số cuộn', field: 'quantity_cones', align: 'right', sortable: true },
  { name: 'status', label: 'Trạng thái', field: 'status', align: 'center' },
  { name: 'reason', label: 'Lý do', field: 'reason', align: 'left' },
  { name: 'created_at', label: 'Ngày tạo', field: 'created_at', align: 'left', sortable: true, format: (val: string) => new Date(val).toLocaleDateString('vi-VN') },
]

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

onMounted(() => {
  loadSummary()
  loadLoans()
})
</script>
