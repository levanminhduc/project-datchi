<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useIssueV2 } from '@/composables/thread/useIssueV2'
import { IssueV2Status } from '@/types/thread/issueV2'
import type { IssueV2Filters } from '@/types/thread/issueV2'
import type { QTableColumn, QTableProps } from 'quasar'
import PageHeader from '@/components/ui/layout/PageHeader.vue'
import DataTable from '@/components/ui/tables/DataTable.vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import DatePicker from '@/components/ui/pickers/DatePicker.vue'
import IssueV2StatusBadge from '@/components/thread/IssueV2StatusBadge.vue'

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('vi-VN')
}

const router = useRouter()
const { issues, total, filters, isLoading, fetchIssues } = useIssueV2()

const localFilters = ref<IssueV2Filters>({
  status: undefined,
  from: undefined,
  to: undefined,
  page: 1,
  limit: 20,
})

const pagination = ref({
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
})

const statusOptions = [
  { label: 'Tất cả', value: null },
  { label: 'Nháp', value: IssueV2Status.DRAFT },
  { label: 'Đã xác nhận', value: IssueV2Status.CONFIRMED },
  { label: 'Đã nhập lại', value: IssueV2Status.RETURNED },
]

const columns: QTableColumn[] = [
  { name: 'issue_code', label: 'Mã Phiếu', field: 'issue_code', align: 'left', sortable: true },
  { name: 'department', label: 'Bộ Phận', field: 'department', align: 'left', sortable: true },
  { name: 'line_count', label: 'Số Dòng', field: 'line_count', align: 'center' },
  { name: 'status', label: 'Trạng Thái', field: 'status', align: 'center' },
  { name: 'created_at', label: 'Ngày Tạo', field: 'created_at', align: 'left', sortable: true },
  { name: 'created_by', label: 'Người Tạo', field: 'created_by', align: 'left' },
]

const loadData = async () => {
  filters.value = { ...localFilters.value }
  await fetchIssues()
  pagination.value.rowsNumber = total.value
}

const handleRequest = async (props: Parameters<NonNullable<QTableProps['onRequest']>>[0]) => {
  localFilters.value.page = props.pagination.page
  localFilters.value.limit = props.pagination.rowsPerPage
  pagination.value.page = props.pagination.page
  pagination.value.rowsPerPage = props.pagination.rowsPerPage
  await loadData()
}

const handleSearch = async () => {
  localFilters.value.page = 1
  pagination.value.page = 1
  await loadData()
}

const handleClearFilters = () => {
  localFilters.value = {
    status: undefined,
    from: undefined,
    to: undefined,
    page: 1,
    limit: 20,
  }
  handleSearch()
}

const handleRowClick = (evt: Event, row: { id: number }) => {
  router.push(`/thread/issues/v2/${row.id}`)
}

const navigateToCreate = () => {
  router.push('/thread/issues/v2')
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <q-page padding>
    <PageHeader
      title="Lịch Sử Phiếu Xuất"
      subtitle="Xem danh sách các phiếu xuất chỉ"
      show-back
      back-to="/thread"
    >
      <template #actions>
        <q-btn
          color="primary"
          label="Tạo Phiếu Xuất"
          icon="add"
          unelevated
          @click="navigateToCreate"
        />
      </template>
    </PageHeader>

    <q-card
      flat
      bordered
      class="q-mb-lg"
    >
      <q-card-section>
        <div class="row items-end q-col-gutter-md">
          <div class="col-12 col-sm-6 col-md-3">
            <AppSelect
              v-model="localFilters.status"
              :options="statusOptions"
              label="Trạng Thái"
              clearable
              dense
              hide-bottom-space
              @update:model-value="handleSearch"
            />
          </div>

          <div class="col-12 col-sm-6 col-md-2">
            <AppInput
              v-model="localFilters.from"
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
                    <DatePicker v-model="localFilters.from" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </AppInput>
          </div>

          <div class="col-12 col-sm-6 col-md-2">
            <AppInput
              v-model="localFilters.to"
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
                    <DatePicker v-model="localFilters.to" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </AppInput>
          </div>

          <div class="col-12 col-sm-6 col-md-auto">
            <div class="row q-gutter-sm">
              <q-btn
                color="primary"
                label="Tìm kiếm"
                icon="search"
                unelevated
                @click="handleSearch"
              />
              <q-btn
                outline
                color="grey"
                label="Xóa"
                icon="clear"
                @click="handleClearFilters"
              />
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <DataTable
      v-model:pagination="pagination"
      :rows="issues"
      :columns="columns"
      :loading="isLoading"
      row-key="id"
      empty-icon="receipt_long"
      empty-title="Chưa có phiếu xuất nào"
      empty-subtitle="Tạo phiếu xuất mới để bắt đầu"
      class="history-table"
      @request="handleRequest"
      @row-click="handleRowClick"
    >
      <template #body-cell-status="props">
        <q-td :props="props">
          <IssueV2StatusBadge :status="props.row.status" />
        </q-td>
      </template>

      <template #body-cell-created_at="props">
        <q-td :props="props">
          {{ formatDate(props.row.created_at) }}
        </q-td>
      </template>

      <template #empty-action>
        <q-btn
          color="primary"
          label="Tạo Phiếu Xuất"
          icon="add"
          unelevated
          @click="navigateToCreate"
        />
      </template>
    </DataTable>
  </q-page>
</template>

<style scoped>
.history-table {
  max-width: 100%;
}

.history-table :deep(.q-table__middle) {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.history-table :deep(.q-table tbody tr) {
  cursor: pointer;
}

.history-table :deep(.q-table tbody tr:hover) {
  background: rgba(0, 0, 0, 0.03);
}
</style>
