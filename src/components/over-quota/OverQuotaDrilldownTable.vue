<script setup lang="ts">
import { ref, watch } from 'vue'
import type { OverQuotaFilters, OverQuotaDetailRow } from '@/types/thread/overQuota'
import { overQuotaService } from '@/services/overQuotaService'
import { useSnackbar } from '@/composables/useSnackbar'
import { getErrorMessage } from '@/utils/errorMessages'
import DataTable from '@/components/ui/tables/DataTable.vue'
import type { QTableColumn } from 'quasar'

const props = defineProps<{
  filters: OverQuotaFilters
}>()

const snackbar = useSnackbar()
const rows = ref<OverQuotaDetailRow[]>([])
const loading = ref(false)
const pagination = ref({
  page: 1,
  rowsPerPage: 25,
  rowsNumber: 0,
  sortBy: 'excess_cones',
  descending: true,
})

const columns: QTableColumn[] = [
  { name: 'style_code', label: 'Mã hàng', field: 'style_code', align: 'left', sortable: true },
  { name: 'po_number', label: 'PO', field: 'po_number', align: 'left', sortable: true },
  { name: 'color_name', label: 'Màu', field: 'color_name', align: 'left' },
  { name: 'thread_name', label: 'Loại chỉ', field: 'thread_name', align: 'left' },
  { name: 'quota_cones', label: 'Quota (cuộn)', field: 'quota_cones', align: 'center', sortable: true },
  { name: 'consumed_equivalent_cones', label: 'Thực cấp (cuộn)', field: 'consumed_equivalent_cones', align: 'center', sortable: true },
  { name: 'excess_cones', label: 'Vượt (cuộn)', field: 'excess_cones', align: 'center', sortable: true },
  { name: 'consumption_pct', label: 'Vượt %', field: 'consumption_pct', align: 'center', sortable: true },
  { name: 'over_quota_notes', label: 'Lý do', field: 'over_quota_notes', align: 'left' },
]

function getBadgeColor(pct: number): string {
  if (pct >= 100) return 'negative'
  if (pct >= 90) return 'warning'
  return 'positive'
}

function getSeverityClass(excess: number): string {
  if (excess > 10) return 'text-negative'
  if (excess > 0) return 'text-warning'
  return 'text-positive'
}

const REASON_MAP: Record<string, { label: string; color: string }> = {
  ky_thuat: { label: 'Kỹ Thuật', color: 'negative' },
  rai_dau_may: { label: 'Rãi đầu máy', color: 'warning' },
  khac: { label: 'Khác', color: 'grey' },
}

function getReasonDisplay(category: string | null | undefined) {
  if (!category) return null
  return REASON_MAP[category] ?? { label: category, color: 'grey' }
}

async function handleTableRequest(reqProps: {
  pagination: { page: number; rowsPerPage: number; sortBy: string; descending: boolean }
}) {
  const { page, rowsPerPage, sortBy, descending } = reqProps.pagination
  loading.value = true
  try {
    const result = await overQuotaService.getDetail(props.filters, {
      page,
      page_size: rowsPerPage,
      sort_by: sortBy || undefined,
      descending,
    })
    rows.value = result.rows
    pagination.value = {
      page: result.page,
      rowsPerPage: result.page_size,
      rowsNumber: result.total,
      sortBy,
      descending,
    }
  } catch (err) {
    snackbar.error(getErrorMessage(err, 'Không thể tải dữ liệu chi tiết'))
  } finally {
    loading.value = false
  }
}

function fetchData() {
  handleTableRequest({ pagination: pagination.value })
}

watch(
  () => props.filters,
  () => {
    pagination.value.page = 1
    fetchData()
  },
  { deep: true },
)
</script>

<template>
  <q-card
    flat
    bordered
    class="q-mt-md"
  >
    <q-card-section class="q-pb-none">
      <div class="text-subtitle1 text-weight-medium">
        Bảng Chi Tiết Vi Phạm
      </div>
    </q-card-section>

    <q-card-section>
      <DataTable
        :rows="rows"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        row-key="issue_id"
        @request="handleTableRequest"
        @update:pagination="(val) => { if (val) Object.assign(pagination, val) }"
      >
        <template #body-cell-excess_cones="{ row }">
          <q-td class="text-center">
            <span
              class="text-weight-bold"
              :class="getSeverityClass(row.excess_cones)"
            >
              +{{ row.excess_cones }} cuộn
            </span>
          </q-td>
        </template>

        <template #body-cell-consumption_pct="{ row }">
          <q-td class="text-center">
            <q-badge
              :color="getBadgeColor(row.consumption_pct)"
              :label="`${row.consumption_pct?.toFixed(1)}%`"
            />
          </q-td>
        </template>

        <template #body-cell-over_quota_notes="{ row }">
          <q-td>
            <q-chip
              v-if="getReasonDisplay(row.reason_category)"
              dense
              :color="getReasonDisplay(row.reason_category)!.color"
              text-color="white"
              :label="row.over_quota_notes || '---'"
            />
            <span
              v-else
              class="text-grey-5"
            >---</span>
          </q-td>
        </template>
      </DataTable>
    </q-card-section>
  </q-card>
</template>
