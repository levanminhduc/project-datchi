<script setup lang="ts">
/**
 * Issue Request List Page
 * Danh sách phiếu xuất kho sản xuất
 *
 * Shows all issue requests with filtering and navigation to detail/new pages
 */
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useIssueRequests } from '@/composables/thread/useIssueRequests'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import type { QTableColumn } from 'quasar'
import { IssueRequestStatus } from '@/types/thread/issue'

const router = useRouter()
const { issueRequests, isLoading, filters, fetchRequests, cancelRequest } = useIssueRequests()

// Filters
const statusOptions = [
  { value: '', label: 'Tất cả' },
  { value: IssueRequestStatus.PENDING, label: 'Chờ xuất' },
  { value: IssueRequestStatus.PARTIAL, label: 'Đang xuất' },
  { value: IssueRequestStatus.COMPLETED, label: 'Hoàn thành' },
  { value: IssueRequestStatus.CANCELLED, label: 'Đã hủy' },
]

const columns: QTableColumn[] = [
  { name: 'issue_code', label: 'Mã Phiếu', field: 'issue_code', align: 'left', sortable: true },
  { name: 'po_number', label: 'PO', field: 'po_number', align: 'left', sortable: true },
  { name: 'style_code', label: 'Mã Hàng', field: 'style_code', align: 'left' },
  { name: 'color_name', label: 'Màu', field: 'color_name', align: 'left' },
  { name: 'department', label: 'Bộ Phận', field: 'department', align: 'left' },
  { name: 'quota_meters', label: 'Định Mức', field: 'quota_meters', align: 'right', format: (v: number) => `${v.toLocaleString('vi-VN')} m` },
  { name: 'issued_meters', label: 'Đã Xuất', field: 'issued_meters', align: 'right', format: (v: number) => `${v.toLocaleString('vi-VN')} m` },
  { name: 'status', label: 'Trạng Thái', field: 'status', align: 'center' },
  { name: 'created_at', label: 'Ngày Tạo', field: 'created_at', align: 'left', format: (v: string) => new Date(v).toLocaleDateString('vi-VN') },
  { name: 'actions', label: '', field: 'actions', align: 'center' },
]

onMounted(() => {
  fetchRequests()
})

function goToDetail(id: number) {
  router.push(`/thread/issues/${id}`)
}

function goToNew() {
  router.push('/thread/issues/new')
}

const statusColor = (status: IssueRequestStatus) => {
  switch (status) {
    case IssueRequestStatus.PENDING: return 'grey'
    case IssueRequestStatus.PARTIAL: return 'warning'
    case IssueRequestStatus.COMPLETED: return 'positive'
    case IssueRequestStatus.CANCELLED: return 'negative'
    default: return 'grey'
  }
}

const statusLabel = (status: IssueRequestStatus) => {
  switch (status) {
    case IssueRequestStatus.PENDING: return 'Chờ xuất'
    case IssueRequestStatus.PARTIAL: return 'Đang xuất'
    case IssueRequestStatus.COMPLETED: return 'Hoàn thành'
    case IssueRequestStatus.CANCELLED: return 'Đã hủy'
    default: return status
  }
}
</script>

<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <h5 class="q-ma-none">
        Phiếu Xuất Kho
      </h5>
      <AppButton
        label="Tạo Phiếu Xuất"
        icon="add"
        color="primary"
        @click="goToNew"
      />
    </div>

    <q-card
      flat
      bordered
      class="q-mb-md"
    >
      <q-card-section>
        <div class="row q-gutter-md">
          <AppSelect
            v-model="filters.status"
            :options="statusOptions"
            label="Trạng thái"
            emit-value
            map-options
            style="min-width: 150px"
            @update:model-value="fetchRequests()"
          />
        </div>
      </q-card-section>
    </q-card>

    <q-table
      :rows="issueRequests"
      :columns="columns"
      row-key="id"
      :loading="isLoading"
      flat
      bordered
      :pagination="{ rowsPerPage: 20 }"
      class="cursor-pointer"
      @row-click="(evt, row) => goToDetail(row.id)"
    >
      <template #body-cell-status="props">
        <q-td :props="props">
          <q-badge :color="statusColor(props.value)">
            {{ statusLabel(props.value) }}
          </q-badge>
        </q-td>
      </template>

      <template #body-cell-actions="props">
        <q-td
          :props="props"
          @click.stop
        >
          <q-btn
            v-if="props.row.status === 'PENDING'"
            icon="cancel"
            size="sm"
            flat
            round
            color="negative"
            @click="cancelRequest(props.row.id)"
          >
            <q-tooltip>Hủy phiếu</q-tooltip>
          </q-btn>
        </q-td>
      </template>

      <template #no-data>
        <div class="text-center q-pa-lg text-grey">
          Chưa có phiếu xuất nào
        </div>
      </template>
    </q-table>
  </q-page>
</template>
