<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useIssueV2 } from '@/composables/thread/useIssueV2'
import { useIssueReturn } from '@/composables/thread/useIssueReturn'
import { useConfirm } from '@/composables/useConfirm'
import type { QTableColumn } from 'quasar'
import PageHeader from '@/components/ui/layout/PageHeader.vue'
import DataTable from '@/components/ui/tables/DataTable.vue'
import IssueV2StatusBadge from '@/components/thread/IssueV2StatusBadge.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'

definePage({
  meta: {
    requiresAuth: true,
    permissions: ['thread.issues.return'],
  },
})

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('vi-VN')
}

const route = useRoute()
const router = useRouter()
const { currentIssue, isLoading, fetchIssue } = useIssueV2()
const issueReturn = useIssueReturn()
const { confirmWarning } = useConfirm()

const notFound = ref(false)
const returnMode = ref(false)

const issueId = computed(() => Number((route.params as { id?: string }).id || '0'))

const canReturn = computed(() =>
  currentIssue.value?.status === 'CONFIRMED' && returnableLines.value.length > 0
)

const returnableLines = computed(() =>
  (currentIssue.value?.lines || []).filter(
    (l) => (l.issued_full + l.issued_partial) - (l.returned_full + l.returned_partial) > 0
  )
)

const columns: QTableColumn[] = [
  { name: 'thread_name', label: 'Loại Chỉ', field: 'thread_name', align: 'left' },
  { name: 'order_info', label: 'Đơn Hàng', field: 'po_number', align: 'left' },
  { name: 'quota_cones', label: 'Định Mức', field: 'quota_cones', align: 'center' },
  { name: 'issued', label: 'Đã Xuất', field: 'issued_full', align: 'center' },
  { name: 'returned', label: 'Đã Trả', field: 'returned_full', align: 'center' },
  { name: 'line_status', label: 'Trạng Thái', field: 'is_over_quota', align: 'center' },
]

const returnColumns: QTableColumn[] = [
  { name: 'thread_name', label: 'Loại Chỉ', field: 'thread_name', align: 'left' },
  { name: 'order_info', label: 'Đơn Hàng', field: 'po_number', align: 'left' },
  { name: 'outstanding', label: 'Còn Lại', field: 'id', align: 'center' },
  { name: 'return_full', label: 'Trả Nguyên', field: 'id', align: 'center' },
  { name: 'return_partial', label: 'Trả Lẻ', field: 'id', align: 'center' },
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

const formatOrderInfo = (row: { po_number?: string; style_code?: string; sub_art_code?: string | null; color_name?: string }) => {
  const parts = []
  if (row.po_number) parts.push(row.po_number)
  if (row.style_code) parts.push(row.style_code)
  if (row.sub_art_code) parts.push(row.sub_art_code)
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

const getTotalRemaining = (row: { issued_full: number; issued_partial: number; returned_full: number; returned_partial: number }) =>
  Math.max(0, (row.issued_full + row.issued_partial) - (row.returned_full + row.returned_partial))

const formatOutstanding = (row: { issued_full: number; issued_partial: number; returned_full: number; returned_partial: number }) => {
  const total = getTotalRemaining(row)
  if (total === 0) return '-'
  const availFull = Math.min(Math.max(0, row.issued_full - row.returned_full), total)
  const availPartial = total - availFull
  if (availPartial === 0) return `${total} ng`
  if (availFull === 0) return `${total} lẻ`
  return `${availFull} ng + ${availPartial} lẻ`
}

const getMaxFullReturn = (row: { id: number; issued_full: number; issued_partial: number; returned_full: number; returned_partial: number }) => {
  const totalRemaining = getTotalRemaining(row)
  const availFull = Math.max(0, row.issued_full - row.returned_full)
  const partialInput = issueReturn.getInput(row.id).returned_partial
  return Math.min(availFull, Math.max(0, totalRemaining - partialInput))
}

const getMaxPartialReturn = (row: { id: number; issued_full: number; issued_partial: number; returned_full: number; returned_partial: number }) => {
  const totalRemaining = getTotalRemaining(row)
  const fullInput = issueReturn.getInput(row.id).returned_full
  return Math.max(0, totalRemaining - fullInput)
}

const getRemainingQuota = (row: { quota_cones: number | null; issued_equivalent: number }) => {
  if (row.quota_cones === null) return null
  return Math.max(0, row.quota_cones - row.issued_equivalent)
}

function toggleReturnMode() {
  returnMode.value = !returnMode.value
  if (!returnMode.value) issueReturn.reset()
}

async function handleSubmitReturn() {
  if (!currentIssue.value) return

  const confirmed = await confirmWarning(
    'Xác nhận trả kho',
    `Bạn có chắc muốn trả kho cho phiếu ${currentIssue.value.issue_code}?`
  )
  if (!confirmed) return

  const success = await issueReturn.submit(issueId.value, currentIssue.value.lines)
  if (success) {
    returnMode.value = false
    await loadIssue()
  }
}

const goBack = () => {
  router.push('/thread/return')
}

onMounted(() => {
  loadIssue()
})
</script>

<template>
  <q-page padding>
    <PageHeader
      title="Chi Tiết Phiếu - Trả Kho"
      subtitle="Xem thông tin chi tiết và trả chỉ về kho"
      show-back
      back-to="/thread/return"
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
        <AppButton
          color="primary"
          label="Quay lại danh sách"
          icon="arrow_back"
          @click="goBack"
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

      <template v-if="canReturn">
        <q-separator class="q-my-lg" />

        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6">
            Trả Kho
          </div>
          <AppButton
            :color="returnMode ? 'grey' : 'orange'"
            :label="returnMode ? 'Hủy trả kho' : 'Trả kho từ phiếu này'"
            :icon="returnMode ? 'close' : 'keyboard_return'"
            :outline="returnMode"
            @click="toggleReturnMode"
          />
        </div>

        <template v-if="returnMode">
          <div class="text-caption text-blue-grey-6 q-mb-sm">
            Cuộn nguyên có thể trả lẻ nếu sản xuất chưa dùng hết
          </div>

          <q-banner
            v-if="issueReturn.errors.value.length > 0"
            class="bg-negative text-white q-mb-md"
            rounded
          >
            <div
              v-for="(err, idx) in issueReturn.errors.value"
              :key="idx"
            >
              {{ err }}
            </div>
          </q-banner>

          <q-table
            :rows="returnableLines"
            :columns="returnColumns"
            row-key="id"
            flat
            bordered
            :pagination="{ rowsPerPage: 0 }"
            hide-bottom
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

            <template #body-cell-outstanding="props">
              <q-td :props="props">
                {{ formatOutstanding(props.row) }}
              </q-td>
            </template>

            <template #body-cell-return_full="props">
              <q-td :props="props">
                <AppInput
                  :model-value="issueReturn.getInput(props.row.id).returned_full"
                  type="number"
                  dense
                  :min="0"
                  :max="getMaxFullReturn(props.row)"
                  style="width: 90px"
                  hide-bottom-space
                  @update:model-value="issueReturn.getInput(props.row.id).returned_full = Number($event) || 0"
                />
              </q-td>
            </template>

            <template #body-cell-return_partial="props">
              <q-td :props="props">
                <AppInput
                  :model-value="issueReturn.getInput(props.row.id).returned_partial"
                  type="number"
                  dense
                  :min="0"
                  :max="getMaxPartialReturn(props.row)"
                  style="width: 90px"
                  hide-bottom-space
                  @update:model-value="issueReturn.getInput(props.row.id).returned_partial = Number($event) || 0"
                />
              </q-td>
            </template>
          </q-table>

          <div class="row justify-end q-mt-md q-gutter-sm">
            <AppButton
              label="Hủy"
              color="grey"
              outline
              @click="toggleReturnMode"
            />
            <AppButton
              label="Xác nhận trả kho"
              color="orange"
              icon="check"
              :loading="issueReturn.isSubmitting.value"
              :disable="!issueReturn.hasInput.value"
              @click="handleSubmitReturn"
            />
          </div>
        </template>
      </template>
    </template>
  </q-page>
</template>

<style scoped>
</style>
