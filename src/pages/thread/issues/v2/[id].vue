<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { useIssueV2 } from '@/composables/thread/useIssueV2'
import type { QTableColumn } from 'quasar'
import PageHeader from '@/components/ui/layout/PageHeader.vue'
import DataTable from '@/components/ui/tables/DataTable.vue'
import IssueV2StatusBadge from '@/components/thread/IssueV2StatusBadge.vue'

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('vi-VN')
}

const route = useRoute() as RouteLocationNormalizedLoaded & { params: { id: string } }
const router = useRouter()
const { currentIssue, isLoading, fetchIssue } = useIssueV2()

const notFound = ref(false)

const issueId = computed(() => Number(route.params.id))

const columns: QTableColumn[] = [
  { name: 'thread_name', label: 'Loại Chỉ', field: 'thread_name', align: 'left' },
  { name: 'order_info', label: 'Đơn Hàng', field: 'po_number', align: 'left' },
  { name: 'quota_cones', label: 'Định Mức', field: 'quota_cones', align: 'center' },
  { name: 'issued', label: 'Đã Xuất', field: 'issued_full', align: 'center' },
  { name: 'returned', label: 'Đã Trả', field: 'returned_full', align: 'center' },
  { name: 'line_status', label: 'Trạng Thái', field: 'is_over_quota', align: 'center' },
]

const loadIssue = async () => {
  if (!issueId.value || isNaN(issueId.value)) {
    notFound.value = true
    return
  }

  await fetchIssue(issueId.value)

  if (!currentIssue.value) {
    notFound.value = true
  }
}

const formatOrderInfo = (row: { po_number?: string; style_code?: string; color_name?: string }) => {
  const parts = []
  if (row.po_number) parts.push(row.po_number)
  if (row.style_code) parts.push(row.style_code)
  if (row.color_name) parts.push(row.color_name)
  return parts.length > 0 ? parts.join(' / ') : '-'
}

const formatIssued = (row: { issued_full: number; issued_partial: number }) => {
  if (row.issued_full === 0 && row.issued_partial === 0) return '-'
  return `${row.issued_full} ng + ${row.issued_partial} lẻ`
}

const formatReturned = (row: { returned_full: number; returned_partial: number }) => {
  if (row.returned_full === 0 && row.returned_partial === 0) return '-'
  return `${row.returned_full} ng + ${row.returned_partial} lẻ`
}

const getRemainingQuota = (row: { quota_cones: number | null; issued_equivalent: number }) => {
  if (row.quota_cones === null) return null
  return Math.max(0, row.quota_cones - row.issued_equivalent)
}

const goBackToHistory = () => {
  router.push('/thread/issues/v2?tab=history')
}

onMounted(() => {
  loadIssue()
})
</script>

<template>
  <q-page padding>
    <PageHeader
      title="Chi Tiết Phiếu Xuất"
      subtitle="Xem thông tin chi tiết phiếu xuất chỉ"
      show-back
      back-to="/thread/issues/v2?tab=history"
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
          Không tìm thấy phiếu xuất
        </div>
        <div class="text-body2 text-grey-6 q-mb-lg">
          Phiếu xuất này không tồn tại hoặc đã bị xóa
        </div>
        <q-btn
          color="primary"
          label="Quay lại danh sách"
          icon="arrow_back"
          unelevated
          @click="goBackToHistory"
        />
      </q-card>
    </template>

    <template v-else-if="currentIssue">
      <q-card
        flat
        bordered
        class="q-mb-lg"
      >
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6 col-md-3">
              <div class="text-caption text-grey-6">
                Mã Phiếu
              </div>
              <div class="text-subtitle1 text-weight-medium">
                {{ currentIssue.issue_code }}
              </div>
            </div>

            <div class="col-12 col-sm-6 col-md-3">
              <div class="text-caption text-grey-6">
                Bộ Phận
              </div>
              <div class="text-subtitle1">
                {{ currentIssue.department }}
              </div>
            </div>

            <div class="col-12 col-sm-6 col-md-2">
              <div class="text-caption text-grey-6">
                Trạng Thái
              </div>
              <div class="q-mt-xs">
                <IssueV2StatusBadge :status="currentIssue.status" />
              </div>
            </div>

            <div class="col-12 col-sm-6 col-md-2">
              <div class="text-caption text-grey-6">
                Ngày Tạo
              </div>
              <div class="text-subtitle1">
                {{ formatDateTime(currentIssue.created_at) }}
              </div>
            </div>

            <div class="col-12 col-sm-6 col-md-2">
              <div class="text-caption text-grey-6">
                Người Tạo
              </div>
              <div class="text-subtitle1">
                {{ currentIssue.created_by }}
              </div>
            </div>
          </div>

          <template v-if="currentIssue.notes">
            <q-separator class="q-my-md" />
            <div class="text-caption text-grey-6">
              Ghi chú
            </div>
            <div class="text-body2">
              {{ currentIssue.notes }}
            </div>
          </template>
        </q-card-section>
      </q-card>

      <div class="text-h6 q-mb-md">
        Chi Tiết Dòng ({{ currentIssue.lines.length }})
      </div>

      <DataTable
        :rows="currentIssue.lines"
        :columns="columns"
        row-key="id"
        hide-pagination
        empty-icon="list"
        empty-title="Chưa có dòng nào"
        empty-subtitle="Phiếu xuất này chưa có dòng chi tiết"
      >
        <template #body-cell-thread_name="props">
          <q-td :props="props">
            <div class="text-weight-medium">
              {{ props.row.thread_name }}
            </div>
            <div
              v-if="props.row.thread_code"
              class="text-caption text-grey-6"
            >
              {{ props.row.thread_code }}
            </div>
          </q-td>
        </template>

        <template #body-cell-order_info="props">
          <q-td :props="props">
            {{ formatOrderInfo(props.row) }}
          </q-td>
        </template>

        <template #body-cell-quota_cones="props">
          <q-td :props="props">
            <template v-if="props.row.quota_cones !== null">
              {{ props.row.quota_cones }} cuộn
            </template>
            <span
              v-else
              class="text-grey-5"
            >-</span>
          </q-td>
        </template>

        <template #body-cell-issued="props">
          <q-td :props="props">
            {{ formatIssued(props.row) }}
          </q-td>
        </template>

        <template #body-cell-returned="props">
          <q-td :props="props">
            {{ formatReturned(props.row) }}
          </q-td>
        </template>

        <template #body-cell-line_status="props">
          <q-td :props="props">
            <q-badge
              v-if="props.row.is_over_quota"
              color="warning"
              outline
              class="q-mr-xs"
            >
              <q-icon
                name="warning"
                size="xs"
                class="q-mr-xs"
              />
              Vượt ĐM
              <q-tooltip v-if="props.row.over_quota_notes">
                {{ props.row.over_quota_notes }}
              </q-tooltip>
            </q-badge>

            <q-badge
              v-if="getRemainingQuota(props.row) !== null && getRemainingQuota(props.row)! > 0"
              color="info"
              outline
            >
              Còn {{ getRemainingQuota(props.row) }} cuộn
            </q-badge>

            <span
              v-if="!props.row.is_over_quota && (getRemainingQuota(props.row) === null || getRemainingQuota(props.row) === 0)"
              class="text-grey-5"
            >-</span>
          </q-td>
        </template>
      </DataTable>
    </template>
  </q-page>
</template>

<style scoped>
.detail-table :deep(.q-table__middle) {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
