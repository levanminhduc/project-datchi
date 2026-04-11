<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { issueV2Service } from '@/services/issueV2Service'
import { useSnackbar } from '@/composables/useSnackbar'
import { useLoading } from '@/composables/useLoading'
import { getErrorMessage } from '@/utils/errorMessages'
import type { IssueV2WithSummary, ReturnListFilters } from '@/types/thread/issueV2'
import type { QTableColumn, QTableProps } from 'quasar'
import PageHeader from '@/components/ui/layout/PageHeader.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import DataTable from '@/components/ui/tables/DataTable.vue'
import DatePicker from '@/components/ui/pickers/DatePicker.vue'
import IssueV2StatusBadge from '@/components/thread/IssueV2StatusBadge.vue'
import { dateRules } from '@/utils'

definePage({
  meta: {
    requiresAuth: true,
    permissions: ['thread.issues.return'],
  },
})

const router = useRouter()
const snackbar = useSnackbar()
const loading = useLoading()

const issues = ref<IssueV2WithSummary[]>([])
const total = ref(0)

const localFilters = ref<ReturnListFilters>({
  search: undefined,
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

const columns: QTableColumn[] = [
  { name: 'issue_code', label: 'Mã Phiếu', field: 'issue_code', align: 'left' },
  { name: 'order_info', label: 'PO/Style/SubArt', field: 'po_number', align: 'left' },
  { name: 'colors', label: 'Màu Hàng', field: 'color_names', align: 'left' },
  { name: 'department', label: 'Bộ Phận', field: 'department', align: 'left', sortable: true },
  { name: 'status', label: 'Trạng Thái', field: 'status', align: 'center' },
  { name: 'created_at', label: 'Ngày Tạo', field: 'created_at', align: 'left', sortable: true },
  { name: 'created_by', label: 'Người Tạo', field: 'created_by', align: 'left' },
]

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('vi-VN')
}

const loadData = async () => {
  try {
    const result = await loading.withLoading(() =>
      issueV2Service.listForReturn(localFilters.value)
    )
    issues.value = result.data
    total.value = result.total
    pagination.value.rowsNumber = result.total
  } catch (err) {
    snackbar.error(getErrorMessage(err, 'Không thể tải danh sách phiếu trả kho'))
  }
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
    search: undefined,
    from: undefined,
    to: undefined,
    page: 1,
    limit: 20,
  }
  handleSearch()
}

const handleRowClick = (_evt: Event, row: { id: number }) => {
  router.push(`/thread/return/${row.id}`)
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <q-page padding>
    <PageHeader
      title="Trả Kho"
      subtitle="Chọn phiếu xuất đã xác nhận để trả chỉ về kho"
    />

    <q-card
      flat
      bordered
      class="q-mb-lg"
    >
      <q-card-section>
        <div class="row items-end q-col-gutter-md">
          <div class="col-12 col-sm-6 col-md-3">
            <AppInput
              v-model="localFilters.search"
              label="Tìm kiếm"
              placeholder="PO, Style, SubArt, Màu..."
              dense
              clearable
              hide-bottom-space
              @keyup.enter="handleSearch"
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </AppInput>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <AppInput
              v-model="localFilters.from"
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
                    <DatePicker v-model="localFilters.from" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </AppInput>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <AppInput
              v-model="localFilters.to"
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
                    <DatePicker v-model="localFilters.to" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </AppInput>
          </div>

          <div class="col-12 col-sm-6 col-md-auto">
            <div class="row q-gutter-sm">
              <AppButton
                color="primary"
                label="Tìm kiếm"
                icon="search"
                unelevated
                @click="handleSearch"
              />
              <AppButton
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
      :loading="loading.isLoading.value"
      row-key="id"
      empty-icon="assignment_return"
      empty-title="Chưa có phiếu xuất nào đã xác nhận"
      empty-subtitle="Phiếu xuất cần được xác nhận trước khi trả kho"
      class="return-table"
      @request="handleRequest"
      @row-click="handleRowClick"
    >
      <template #body-cell-order_info="props">
        <q-td :props="props">
          <span v-if="props.row.po_number">
            {{ props.row.po_number }} / {{ props.row.style_code || '-' }}
            <template v-if="props.row.sub_art_code"> / {{ props.row.sub_art_code }}</template>
          </span>
          <span v-else>-</span>
        </q-td>
      </template>

      <template #body-cell-colors="props">
        <q-td :props="props">
          {{ props.row.color_names?.join(', ') || '-' }}
        </q-td>
      </template>

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
    </DataTable>
  </q-page>
</template>

<style scoped>
.return-table :deep(.q-table tbody tr) {
  cursor: pointer;
}
.return-table :deep(.q-table tbody tr:hover) {
  background: rgba(0, 0, 0, 0.03);
}
</style>
