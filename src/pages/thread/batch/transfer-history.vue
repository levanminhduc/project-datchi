<template>
  <q-page padding>
    <div class="row items-center q-mb-lg">
      <IconButton
        icon="arrow_back"
        color="primary"
        @click="$router.push('/thread/batch/transfer')"
      />
      <div class="q-ml-md">
        <h1 class="text-h5 q-my-none text-weight-bold text-primary">
          Lịch Sử Chuyển Kho
        </h1>
        <div class="text-grey-6">
          Xem lịch sử các lần chuyển kho
        </div>
      </div>
      <q-space />
      <AppButton
        color="primary"
        label="Xuất Excel"
        icon="download"
        :disable="items.length === 0"
        @click="exportExcel"
      />
    </div>

    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-6 col-md-3">
        <AppCard
          flat
          bordered
        >
          <q-card-section class="row items-center no-wrap">
            <q-icon
              name="swap_horiz"
              color="info"
              size="36px"
              class="q-mr-md"
            />
            <div>
              <div class="text-caption text-grey">
                Tổng lần chuyển
              </div>
              <div class="text-h6 text-weight-bold">
                {{ summary.total_transfers }}
              </div>
            </div>
          </q-card-section>
        </AppCard>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <AppCard
          flat
          bordered
        >
          <q-card-section class="row items-center no-wrap">
            <q-icon
              name="inventory_2"
              color="primary"
              size="36px"
              class="q-mr-md"
            />
            <div>
              <div class="text-caption text-grey">
                Tổng cuộn đã chuyển
              </div>
              <div class="text-h6 text-weight-bold">
                {{ summary.total_cones }}
              </div>
            </div>
          </q-card-section>
        </AppCard>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <AppCard
          flat
          bordered
        >
          <q-card-section class="row items-center no-wrap">
            <q-icon
              name="output"
              color="warning"
              size="36px"
              class="q-mr-md"
            />
            <div>
              <div class="text-caption text-grey">
                Kho xuất nhiều nhất
              </div>
              <div class="text-h6 text-weight-bold">
                {{ summary.top_source?.name || '-' }}
              </div>
              <div
                v-if="summary.top_source"
                class="text-caption text-grey"
              >
                {{ summary.top_source.count }} lần
              </div>
            </div>
          </q-card-section>
        </AppCard>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <AppCard
          flat
          bordered
        >
          <q-card-section class="row items-center no-wrap">
            <q-icon
              name="input"
              color="positive"
              size="36px"
              class="q-mr-md"
            />
            <div>
              <div class="text-caption text-grey">
                Kho nhận nhiều nhất
              </div>
              <div class="text-h6 text-weight-bold">
                {{ summary.top_destination?.name || '-' }}
              </div>
              <div
                v-if="summary.top_destination"
                class="text-caption text-grey"
              >
                {{ summary.top_destination.count }} lần
              </div>
            </div>
          </q-card-section>
        </AppCard>
      </div>
    </div>

    <AppCard
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
            <AppWarehouseSelect
              v-model="filters.from_warehouse_id"
              label="Kho nguồn"
              clearable
              dense
              hide-bottom-space
            />
          </div>
          <div class="col-12 col-sm-6 col-md-2">
            <AppWarehouseSelect
              v-model="filters.to_warehouse_id"
              label="Kho đích"
              clearable
              dense
              hide-bottom-space
            />
          </div>
          <div class="col-12 col-sm-6 col-md-2">
            <AppInput
              v-model="filters.from_date"
              label="Từ ngày"
              placeholder="DD/MM/YYYY"
              :rules="[dateRules.date]"
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
              :rules="[dateRules.date]"
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
            <AppInput
              v-model="filters.search"
              label="Tìm kiếm"
              placeholder="Ghi chú, số tham chiếu..."
              dense
              clearable
              hide-bottom-space
              @keyup.enter="applyFilters"
            />
          </div>
          <div class="col-12 col-md-2">
            <div class="row q-gutter-sm">
              <AppButton
                color="primary"
                label="Tìm"
                icon="search"
                class="full-width-xs"
                :loading="loading"
                @click="applyFilters"
              />
              <AppButton
                variant="flat"
                color="grey"
                label="Xóa"
                class="full-width-xs"
                @click="resetFilters"
              />
            </div>
          </div>
        </div>
      </q-card-section>
    </AppCard>

    <DataTable
      :rows="items"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :pagination="pagination"
      class="transfer-history-table"
      @request="handleTableRequest"
    >
      <template #body-cell-warehouses="props">
        <q-td :props="props">
          <span>{{ props.row.from_warehouse?.name || '-' }}</span>
          <q-icon
            name="arrow_forward"
            size="xs"
            class="q-mx-xs text-grey"
          />
          <span>{{ props.row.to_warehouse?.name || '-' }}</span>
        </q-td>
      </template>

      <template #body-cell-cone_count="props">
        <q-td :props="props">
          <span class="text-weight-bold">{{ props.row.cone_count }}</span>
          <span class="text-grey-6 q-ml-xs">cuộn</span>
        </q-td>
      </template>

      <template #body-cell-performed_at="props">
        <q-td :props="props">
          {{ formatDateTime(props.row.performed_at) }}
        </q-td>
      </template>

      <template #body-cell-notes="props">
        <q-td :props="props">
          <span :title="props.row.notes || ''">
            {{ truncate(props.row.notes, 40) }}
          </span>
        </q-td>
      </template>

      <template #body-cell-actions="props">
        <q-td :props="props">
          <IconButton
            icon="visibility"
            color="primary"
            @click="viewDetail(props.row)"
          >
            <AppTooltip text="Chi tiết" />
          </IconButton>
        </q-td>
      </template>
    </DataTable>

    <AppDialog v-model="showDetail">
      <template #header>
        Chi tiết chuyển kho #{{ selected?.id }}
      </template>

      <template
        v-if="selected"
        #default
      >
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <div class="text-caption text-grey">
              Kho xuất
            </div>
            <div class="text-body1">
              {{ selected.from_warehouse?.name || '-' }}
            </div>
          </div>
          <div class="col-6">
            <div class="text-caption text-grey">
              Kho nhận
            </div>
            <div class="text-body1">
              {{ selected.to_warehouse?.name || '-' }}
            </div>
          </div>
          <div class="col-6">
            <div class="text-caption text-grey">
              Số cuộn
            </div>
            <div class="text-body1 text-weight-bold">
              {{ selected.cone_count }}
            </div>
          </div>
          <div
            v-if="selected.lot"
            class="col-6"
          >
            <div class="text-caption text-grey">
              Lô hàng
            </div>
            <div class="text-body1">
              {{ selected.lot.lot_number }}
            </div>
          </div>
          <div
            v-if="selected.reference_number"
            class="col-6"
          >
            <div class="text-caption text-grey">
              Số tham chiếu
            </div>
            <div class="text-body1">
              {{ selected.reference_number }}
            </div>
          </div>
          <div
            v-if="selected.performed_by"
            class="col-6"
          >
            <div class="text-caption text-grey">
              Người thực hiện
            </div>
            <div class="text-body1">
              {{ selected.performed_by }}
            </div>
          </div>
          <div class="col-6">
            <div class="text-caption text-grey">
              Thời gian
            </div>
            <div class="text-body1">
              {{ formatDateTime(selected.performed_at) }}
            </div>
          </div>
          <div
            v-if="selected.notes"
            class="col-12"
          >
            <div class="text-caption text-grey">
              Ghi chú
            </div>
            <div class="text-body1">
              {{ selected.notes }}
            </div>
          </div>
        </div>

        <q-separator class="q-my-md" />
        <div class="text-subtitle2 q-mb-sm">
          Loại chỉ ({{ coneSummary.length }} loại — {{ selected.cone_count }} cuộn)
        </div>
        <q-spinner
          v-if="coneSummaryLoading"
          color="primary"
          size="24px"
          class="q-my-sm"
        />
        <div
          v-else
          class="cone-summary-list"
        >
          <div
            v-for="item in coneSummary"
            :key="item.thread_type_id"
            class="cone-summary-row"
          >
            <q-avatar
              size="20px"
              class="q-mr-sm"
              :style="item.color_hex
                ? { backgroundColor: item.color_hex }
                : { backgroundColor: '#ccc' }"
            />
            <span class="cone-summary-label">
              {{ item.supplier_name }} - TEX{{ item.tex_number }} - {{ item.color_name }}
            </span>
            <q-space />
            <span class="text-weight-bold">{{ item.cone_count }}</span>
            <span class="text-grey-6 q-ml-xs">cuộn</span>
          </div>
          <div
            v-if="coneSummary.length === 0 && !coneSummaryLoading"
            class="text-grey-5 text-body2"
          >
            Không có dữ liệu
          </div>
        </div>
      </template>

      <template #actions>
        <AppButton
          variant="flat"
          label="Đóng"
          color="primary"
          @click="showDetail = false"
        />
      </template>
    </AppDialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useTransferHistory } from '@/composables/useTransferHistory'
import { useWarehouses } from '@/composables'
import { useSnackbar } from '@/composables/useSnackbar'
import AppWarehouseSelect from '@/components/ui/inputs/AppWarehouseSelect.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import IconButton from '@/components/ui/buttons/IconButton.vue'
import AppCard from '@/components/ui/cards/AppCard.vue'
import AppDialog from '@/components/ui/dialogs/AppDialog.vue'
import AppTooltip from '@/components/ui/dialogs/AppTooltip.vue'
import DatePicker from '@/components/ui/pickers/DatePicker.vue'
import DataTable from '@/components/ui/tables/DataTable.vue'
import { batchService } from '@/services/batchService'
import { dateRules } from '@/utils'
import type { TransferHistoryItem, ConeSummaryItem } from '@/types/thread/batch'
import type { QTableColumn } from 'quasar'

definePage({
  meta: {
    requiresAuth: true,
    permissions: ['thread.inventory.view'],
  },
})

const $q = useQuasar()
const snackbar = useSnackbar()
const { fetchWarehouses } = useWarehouses()
const {
  items,
  summary,
  loading,
  filters,
  pagination,
  fetchHistory,
  fetchSummary,
  handleTableRequest,
  applyFilters,
  resetFilters,
  exportExcel,
} = useTransferHistory()

const showDetail = ref(false)
const selected = ref<TransferHistoryItem | null>(null)
const coneSummary = ref<ConeSummaryItem[]>([])
const coneSummaryLoading = ref(false)

const columns: QTableColumn[] = [
  { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
  { name: 'warehouses', label: 'Kho nguồn → Kho đích', field: 'warehouses', align: 'left' },
  { name: 'cone_count', label: 'Số cuộn', field: 'cone_count', align: 'left', sortable: true },
  { name: 'performed_by', label: 'Người thực hiện', field: 'performed_by', align: 'left' },
  { name: 'performed_at', label: 'Thời gian', field: 'performed_at', align: 'left', sortable: true },
  { name: 'notes', label: 'Ghi chú', field: 'notes', align: 'left' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
]

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('vi-VN')
}

function truncate(text: string | null, max: number): string {
  if (!text) return '-'
  return text.length > max ? text.slice(0, max) + '...' : text
}

async function viewDetail(row: TransferHistoryItem) {
  selected.value = row
  coneSummary.value = []
  showDetail.value = true
  coneSummaryLoading.value = true
  try {
    coneSummary.value = await batchService.getTransferConeSummary(row.id)
  } catch {
    coneSummary.value = []
    snackbar.error('Không tải được tổng hợp cuộn chỉ')
  } finally {
    coneSummaryLoading.value = false
  }
}

onMounted(async () => {
  await fetchWarehouses()
  await Promise.all([fetchHistory(), fetchSummary()])
})
</script>

<style scoped>
.cone-summary-list {
  max-height: 300px;
  overflow-y: auto;
}

.cone-summary-row {
  display: flex;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.cone-summary-row:last-child {
  border-bottom: none;
}

.cone-summary-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.transfer-history-table {
  max-width: 100%;
}

.transfer-history-table :deep(.q-table__middle) {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.transfer-history-table :deep(.q-table) {
  table-layout: auto;
  min-width: 900px;
}

.transfer-history-table :deep(th),
.transfer-history-table :deep(td) {
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
