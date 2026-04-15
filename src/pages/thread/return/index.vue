<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { watchDebounced } from '@vueuse/core'
import { useRouter } from 'vue-router'
import { issueV2Service } from '@/services/issueV2Service'
import { useSnackbar } from '@/composables/useSnackbar'
import { useLoading } from '@/composables/useLoading'
import { getErrorMessage } from '@/utils/errorMessages'
import type { IssueV2WithSummary, ReturnListFilters, ReturnGroup } from '@/types/thread/issueV2'
import type { QTableColumn, QTableProps } from 'quasar'
import PageHeader from '@/components/ui/layout/PageHeader.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import DataTable from '@/components/ui/tables/DataTable.vue'
import DatePicker from '@/components/ui/pickers/DatePicker.vue'
import IssueV2StatusBadge from '@/components/thread/IssueV2StatusBadge.vue'
import { dateRules } from '@/utils'
import ReturnGroupCard from '@/components/thread/ReturnGroupCard.vue'
import ReturnGroupDetail from '@/components/thread/ReturnGroupDetail.vue'
import { useReturnV2 } from '@/composables/thread/useReturnV2'
import { useConfirm } from '@/composables/useConfirm'

definePage({
  meta: {
    requiresAuth: true,
    permissions: ['thread.issues.return'],
  },
})

const router = useRouter()
const snackbar = useSnackbar()
const loading = useLoading()

const viewMode = ref<'by-issue' | 'by-group'>('by-group')

const {
  returnGroups,
  selectedGroup,
  isLoading: isGroupLoading,
  loadReturnGroups,
  selectGroup,
  submitGroupedReturn,
  validateReturnQuantities,
} = useReturnV2()

const { confirmWarning } = useConfirm()

async function handleSelectGroup(group: ReturnGroup) {
  selectGroup(group)
}

function handleCancelGroup() {
  selectGroup(null)
}

async function handleGroupReturn(
  lines: { thread_type_id: number; returned_full: number; returned_partial: number }[]
) {
  if (!selectedGroup.value) return
  const { valid, errors } = validateReturnQuantities(lines, selectedGroup.value.threads)
  if (!valid) {
    snackbar.error(errors[0] ?? 'Số lượng trả không hợp lệ')
    return
  }
  const confirmed = await confirmWarning(
    `Trả kho cho nhóm ${selectedGroup.value.po_number} / ${selectedGroup.value.style_code} / ${selectedGroup.value.color_name}?`,
    'Xác nhận trả kho'
  )
  if (!confirmed) return
  await submitGroupedReturn(selectedGroup.value, lines)
}

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

const handleRowClick = (_evt: Event, row: { id: number }) => {
  router.push(`/thread/return/${row.id}`)
}

const filterFields = computed(() => ({
  search: localFilters.value.search,
  from: localFilters.value.from,
  to: localFilters.value.to,
}))

watchDebounced(
  filterFields,
  () => {
    const search = localFilters.value.search
    if (search && search.length < 2) return

    localFilters.value.page = 1
    pagination.value.page = 1
    loadData()
  },
  { debounce: 400, maxWait: 2000, deep: true, immediate: true }
)

watch(viewMode, (mode) => {
  if (mode === 'by-group') {
    selectGroup(null)
    loadReturnGroups()
  }
}, { immediate: true })
</script>

<template>
  <q-page padding>
    <PageHeader
      title="Trả Kho"
      subtitle="Chọn phiếu xuất đã xác nhận để trả chỉ về kho"
    />

    <q-tabs
      v-model="viewMode"
      class="text-grey q-mb-md"
      active-color="primary"
      indicator-color="primary"
      narrow-indicator
      align="left"
    >
      <q-tab
        name="by-group"
        label="Theo nhóm"
        icon="group_work"
      />
      <q-tab
        name="by-issue"
        label="Theo phiếu"
        icon="receipt_long"
      />
    </q-tabs>

    <!-- === Tab: Theo phiếu (existing) === -->
    <template v-if="viewMode === 'by-issue'">
      <q-card
        flat
        bordered
        class="q-mb-lg"
      >
        <q-card-section>
          <div class="row items-end q-col-gutter-md">
            <div class="col-12 col-sm-6 col-md-4">
              <AppInput
                v-model="localFilters.search"
                label="Tìm kiếm"
                placeholder="PO, Style, SubArt, Màu... (≥2 ký tự)"
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

            <div class="col-12 col-sm-6 col-md-4">
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

            <div class="col-12 col-sm-6 col-md-4">
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
    </template>

    <!-- === Tab: Theo nhóm (new) === -->
    <template v-else>
      <ReturnGroupDetail
        v-if="selectedGroup"
        :group="selectedGroup"
        :loading="isGroupLoading"
        @submit="handleGroupReturn"
        @cancel="handleCancelGroup"
      />

      <template v-else>
        <div
          v-if="isGroupLoading"
          class="row justify-center q-py-xl"
        >
          <q-spinner-dots
            size="50px"
            color="primary"
          />
        </div>

        <div
          v-else-if="returnGroups.length === 0"
          class="text-center q-py-xl"
        >
          <q-icon
            name="check_circle"
            size="64px"
            color="positive"
          />
          <div class="text-h6 q-mt-md text-grey-7">
            Không có nhóm nào cần trả
          </div>
          <div class="text-body2 text-grey-6">
            Tất cả phiếu xuất đã được trả đầy đủ
          </div>
        </div>

        <div v-else>
          <ReturnGroupCard
            v-for="group in returnGroups"
            :key="group.group_key"
            :group="group"
            @select="handleSelectGroup"
          />
        </div>
      </template>
    </template>
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
