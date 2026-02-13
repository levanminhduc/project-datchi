<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import { useIssueV2 } from '@/composables/thread/useIssueV2'
import { issueV2Service } from '@/services/issueV2Service'
import { employeeService } from '@/services/employeeService'
import { useSnackbar } from '@/composables/useSnackbar'
import { useConfirm } from '@/composables/useConfirm'
import { IssueV2Status } from '@/types/thread/issueV2'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import DataTable from '@/components/ui/tables/DataTable.vue'
import DatePicker from '@/components/ui/pickers/DatePicker.vue'
import IssueV2StatusBadge from '@/components/thread/IssueV2StatusBadge.vue'
import type { QTableColumn, QTableProps } from 'quasar'
import type {
  IssueV2Filters,
  ThreadTypeForIssue,
  ValidateLineResponse,
  OrderOptionPO,
  OrderOptionStyle,
  OrderOptionColor,
} from '@/types/thread/issueV2'

const route = useRoute()
const router = useRouter()
const snackbar = useSnackbar()
const { confirmWarning, confirmDelete } = useConfirm()

const {
  currentIssue,
  isLoading,
  hasIssue,
  lines,
  threadTypes,
  isConfirmed,
  issues,
  total,
  filters,
  createIssue,
  createIssueWithFirstLine,
  fetchIssue,
  loadFormData,
  validateLine,
  addLine,
  removeLine,
  confirmIssue,
  clearIssue,
  fetchIssues,
} = useIssueV2()

const activeTab = ref(route.query.tab === 'history' ? 'history' : 'create')
const step2Visible = ref(false)

const department = ref('')
const createdBy = ref('')

const selectedPoId = ref<number | null>(null)
const selectedStyleId = ref<number | null>(null)
const selectedColorId = ref<number | null>(null)

const poOptions = ref<{ value: number; label: string }[]>([])
const styleOptions = ref<{ value: number; label: string }[]>([])
const colorOptions = ref<{ value: number; label: string }[]>([])
const departmentOptions = ref<{ value: string; label: string }[]>([])

const loadingOptions = ref(false)
const loadingFormData = ref(false)

const lineInputs = ref<Record<number, { full: number; partial: number; notes: string; validation: ValidateLineResponse | null }>>({})

const canCreateIssue = computed(() => {
  return department.value.trim() && createdBy.value.trim() && !hasIssue.value && !step2Visible.value
})

const canLoadThreadTypes = computed(() => {
  return selectedPoId.value && selectedStyleId.value && selectedColorId.value
})

const canConfirm = computed(() => {
  if (!hasIssue.value || isConfirmed.value) return false

  const hasLines = lines.value.length > 0

  const allOverQuotaHaveNotes = lines.value
    .filter((line) => line.is_over_quota)
    .every((line) => line.over_quota_notes?.trim())

  return hasLines && allOverQuotaHaveNotes
})

const availableThreadTypes = computed(() => {
  const addedThreadTypeIds = new Set(lines.value.map((line) => line.thread_type_id))
  return threadTypes.value.filter((tt) => !addedThreadTypeIds.has(tt.thread_type_id))
})

const columns: QTableColumn[] = [
  { name: 'thread', label: 'Loại Chỉ', field: 'thread_name', align: 'left' },
  { name: 'quota', label: 'Định Mức', field: 'quota_cones', align: 'center', format: (v) => v !== null ? `${v} cuộn` : '-' },
  { name: 'stock', label: 'Tồn Kho', field: 'stock', align: 'center' },
  { name: 'issue', label: 'Xuất', field: 'issue', align: 'center' },
  { name: 'equivalent', label: 'Quy Đổi', field: 'issued_equivalent', align: 'center' },
  { name: 'actions', label: '', field: 'actions', align: 'center' },
]

const historyLoaded = ref(false)

const localFilters = ref<IssueV2Filters>({
  status: undefined,
  from: undefined,
  to: undefined,
  page: 1,
  limit: 20,
})

const historyPagination = ref({
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

const historyColumns: QTableColumn[] = [
  { name: 'issue_code', label: 'Mã Phiếu', field: 'issue_code', align: 'left', sortable: true },
  { name: 'department', label: 'Bộ Phận', field: 'department', align: 'left', sortable: true },
  { name: 'line_count', label: 'Số Dòng', field: 'line_count', align: 'center' },
  { name: 'status', label: 'Trạng Thái', field: 'status', align: 'center' },
  { name: 'created_at', label: 'Ngày Tạo', field: 'created_at', align: 'left', sortable: true },
  { name: 'created_by', label: 'Người Tạo', field: 'created_by', align: 'left' },
  { name: 'actions', label: 'Thao Tác', field: 'actions', align: 'center', sortable: false },
]

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('vi-VN')
}

watch(selectedPoId, async (newPoId) => {
  selectedStyleId.value = null
  selectedColorId.value = null
  styleOptions.value = []
  colorOptions.value = []

  if (!newPoId) return

  try {
    const styles = await issueV2Service.getOrderOptions(newPoId)
    styleOptions.value = (styles as OrderOptionStyle[]).map((s) => ({
      value: s.id,
      label: `${s.style_code} - ${s.style_name || ''}`.trim(),
    }))
  } catch (err) {
    console.error('Failed to load styles:', err)
    snackbar.error('Không thể tải danh sách mã hàng')
  }
})

watch(selectedStyleId, async (newStyleId) => {
  selectedColorId.value = null
  colorOptions.value = []

  if (!newStyleId || !selectedPoId.value) return

  try {
    const colors = await issueV2Service.getOrderOptions(selectedPoId.value, newStyleId)
    colorOptions.value = (colors as OrderOptionColor[]).map((c) => ({
      value: c.id,
      label: c.name,
    }))
  } catch (err) {
    console.error('Failed to load colors:', err)
    snackbar.error('Không thể tải danh sách màu')
  }
})

watch([selectedPoId, selectedStyleId, selectedColorId], async ([poId, styleId, colorId]) => {
  if (poId && styleId && colorId) {
    await handleLoadFormData()
  }
})

watch(activeTab, (newTab) => {
  if (newTab === 'history' && !historyLoaded.value) {
    historyLoaded.value = true
    loadHistoryData()
  }
})

async function loadInitialOptions() {
  loadingOptions.value = true
  try {
    const pos = await issueV2Service.getOrderOptions()
    poOptions.value = (pos as OrderOptionPO[]).map((po) => ({
      value: po.id,
      label: po.po_number,
    }))

    const depts = await employeeService.getDepartments()
    departmentOptions.value = depts.map((d) => ({ value: d, label: d }))
  } catch (err) {
    console.error('Failed to load options:', err)
    snackbar.error('Không thể tải dữ liệu')
  } finally {
    loadingOptions.value = false
  }
}

async function handleCreateIssue() {
  if (!canCreateIssue.value) return
  step2Visible.value = true
}

async function handleLoadFormData() {
  if (!canLoadThreadTypes.value) return

  loadingFormData.value = true
  try {
    const data = await loadFormData(selectedPoId.value!, selectedStyleId.value!, selectedColorId.value!)

    lineInputs.value = {}
    if (data?.thread_types) {
      for (const tt of data.thread_types) {
        lineInputs.value[tt.thread_type_id] = {
          full: 0,
          partial: 0,
          notes: '',
          validation: null,
        }
      }
    }
  } finally {
    loadingFormData.value = false
  }
}

const debouncedValidate = useDebounceFn(async (threadTypeId: number) => {
  const input = lineInputs.value[threadTypeId]
  if (!input) return
  if (input.full === 0 && input.partial === 0) {
    input.validation = null
    return
  }

  const result = await validateLine({
    thread_type_id: threadTypeId,
    issued_full: input.full,
    issued_partial: input.partial,
    po_id: selectedPoId.value,
    style_id: selectedStyleId.value,
    color_id: selectedColorId.value,
  })

  if (result) {
    input.validation = result
  }
}, 300)

function handleQuantityChange(threadTypeId: number) {
  debouncedValidate(threadTypeId)
}

function handleInputChange(threadTypeId: number, field: 'full' | 'partial', value: number, max: number) {
  const input = lineInputs.value[threadTypeId]
  if (!input) return

  const clampedValue = Math.min(Math.max(0, value), max)
  input[field] = clampedValue

  handleQuantityChange(threadTypeId)
}

function getLineUnderQuotaAmount(line: { quota_cones: number | null; issued_equivalent: number }): number {
  if (!line.quota_cones) return 0
  const remaining = line.quota_cones - line.issued_equivalent
  return remaining > 0 ? remaining : 0
}

function getUnderQuotaAmount(threadType: ThreadTypeForIssue): number {
  const input = lineInputs.value[threadType.thread_type_id]
  if (!input || !threadType.quota_cones) return 0

  const validation = input.validation
  if (!validation) {
    if (input.full === 0 && input.partial === 0) {
      return threadType.quota_cones
    }
    return 0
  }

  if (validation.is_over_quota) return 0

  const remaining = threadType.quota_cones - validation.issued_equivalent
  return remaining > 0 ? remaining : 0
}

function isAddButtonDisabled(threadTypeId: number): boolean {
  const input = lineInputs.value[threadTypeId]
  if (!input) return true

  if (input.full === 0 && input.partial === 0) return true

  if (input.validation && !input.validation.stock_sufficient) return true

  return false
}

function getAddButtonTooltip(threadTypeId: number): string {
  const input = lineInputs.value[threadTypeId]
  if (!input) return 'Nhập số lượng xuất'

  if (input.full === 0 && input.partial === 0) {
    return 'Nhập số lượng xuất'
  }

  if (input.validation && !input.validation.stock_sufficient) {
    return 'Không đủ tồn kho'
  }

  return 'Thêm vào phiếu'
}

async function handleAddLine(threadType: ThreadTypeForIssue) {
  const input = lineInputs.value[threadType.thread_type_id]
  if (!input || (input.full === 0 && input.partial === 0)) {
    snackbar.warning('Nhập số lượng xuất')
    return
  }

  if (input.validation && !input.validation.stock_sufficient) {
    snackbar.error('Không đủ tồn kho để xuất')
    return
  }

  if (input.validation?.is_over_quota && !input.notes.trim()) {
    snackbar.warning('Vượt định mức, yêu cầu ghi chú lý do')
    return
  }

  if (!hasIssue.value) {
    const result = await createIssueWithFirstLine({
      department: department.value.trim(),
      created_by: createdBy.value.trim(),
      po_id: selectedPoId.value,
      style_id: selectedStyleId.value,
      color_id: selectedColorId.value,
      thread_type_id: threadType.thread_type_id,
      issued_full: input.full,
      issued_partial: input.partial,
      over_quota_notes: input.notes.trim() || null,
    })

    if (result) {
      input.full = 0
      input.partial = 0
      input.notes = ''
      input.validation = null
    }
    return
  }

  const result = await addLine({
    po_id: selectedPoId.value,
    style_id: selectedStyleId.value,
    color_id: selectedColorId.value,
    thread_type_id: threadType.thread_type_id,
    issued_full: input.full,
    issued_partial: input.partial,
    over_quota_notes: input.notes.trim() || null,
  })

  if (result) {
    input.full = 0
    input.partial = 0
    input.notes = ''
    input.validation = null
  }
}

async function handleRemoveLine(lineId: number) {
  await removeLine(lineId)
}

async function handleConfirm() {
  if (!canConfirm.value) return

  const success = await confirmIssue()
  if (success) {
  }
}

function handleBack() {
  clearIssue()
  router.push('/thread/issues')
}

function handleNewIssue() {
  clearIssue()
  step2Visible.value = false
  department.value = ''
  createdBy.value = ''
  selectedPoId.value = null
  selectedStyleId.value = null
  selectedColorId.value = null
  lineInputs.value = {}
}

function getRowClass(line: { is_over_quota: boolean }): string {
  return line.is_over_quota ? 'bg-warning-1' : ''
}

const loadHistoryData = async () => {
  filters.value = { ...localFilters.value }
  await fetchIssues()
  historyPagination.value.rowsNumber = total.value
}

const handleHistoryRequest = async (props: Parameters<NonNullable<QTableProps['onRequest']>>[0]) => {
  localFilters.value.page = props.pagination.page
  localFilters.value.limit = props.pagination.rowsPerPage
  historyPagination.value.page = props.pagination.page
  historyPagination.value.rowsPerPage = props.pagination.rowsPerPage
  await loadHistoryData()
}

const handleHistorySearch = async () => {
  localFilters.value.page = 1
  historyPagination.value.page = 1
  await loadHistoryData()
}

const handleClearHistoryFilters = () => {
  localFilters.value = {
    status: undefined,
    from: undefined,
    to: undefined,
    page: 1,
    limit: 20,
  }
  handleHistorySearch()
}

const handleHistoryRowClick = (evt: Event, row: { id: number; status: string }) => {
  if (row.status === IssueV2Status.DRAFT) {
    router.push(`/thread/issues/v2?tab=create&issue=${row.id}`)
  } else {
    router.push(`/thread/issues/v2/${row.id}`)
  }
}

const handleConfirmFromList = async (issue: any) => {
  const confirmed = await confirmWarning(
    'Phiếu sẽ được xác nhận và trừ tồn kho. Bạn có chắc chắn?',
    'Xác nhận phiếu xuất'
  )
  if (!confirmed) return

  try {
    await issueV2Service.confirm(issue.id)
    snackbar.success('Xác nhận phiếu xuất thành công')
    await fetchIssues()
  } catch (err: any) {
    snackbar.error(err.message || 'Không thể xác nhận phiếu xuất')
  }
}

const handleDeleteFromList = async (issue: any) => {
  const confirmed = await confirmDelete(issue.issue_code)
  if (!confirmed) return

  try {
    await issueV2Service.deleteIssue(issue.id)
    snackbar.success('Xóa phiếu xuất thành công')
    await fetchIssues()
  } catch (err: any) {
    snackbar.error(err.message || 'Không thể xóa phiếu xuất')
  }
}

const handleReturnFromList = () => {
  router.push('/thread/issues/v2/return')
}

const loadDraftFromQuery = async (issueParam: unknown) => {
  if (!issueParam) return false
  const issueId = Number(issueParam)
  if (isNaN(issueId)) return false

  await fetchIssue(issueId)
  if (currentIssue.value && currentIssue.value.status === IssueV2Status.DRAFT) {
    activeTab.value = 'create'
    step2Visible.value = true
    department.value = currentIssue.value.department || ''
    createdBy.value = currentIssue.value.created_by || ''
    router.replace({ query: { tab: 'create' } })
    return true
  } else {
    router.replace(`/thread/issues/v2/${issueId}`)
    return true
  }
}

watch(
  () => route.query.issue,
  async (newIssue, oldIssue) => {
    if (newIssue && newIssue !== oldIssue) {
      await loadDraftFromQuery(newIssue)
    }
  }
)

onMounted(async () => {
  loadInitialOptions()

  const loaded = await loadDraftFromQuery(route.query.issue)
  if (loaded) return

  if (activeTab.value === 'history') {
    historyLoaded.value = true
    loadHistoryData()
  }
})
</script>

<template>
  <q-page padding>
    <div class="row q-col-gutter-md q-mb-md items-center">
      <div class="col">
        <h1 class="text-h5 q-my-none text-weight-bold text-primary">
          Phiếu Xuất Chỉ V2
        </h1>
        <p class="text-caption text-grey-7 q-mb-none">
          Tạo phiếu xuất và xem lịch sử
        </p>
      </div>
    </div>

    <q-card
      flat
      bordered
    >
      <q-tabs
        v-model="activeTab"
        class="text-primary"
        align="left"
        active-color="primary"
        indicator-color="primary"
      >
        <q-tab
          name="create"
          label="Tạo Phiếu Xuất"
          icon="o_add_circle"
        />
        <q-tab
          name="history"
          label="Lịch Sử"
          icon="o_history"
        />
      </q-tabs>

      <q-separator />

      <q-tab-panels
        v-model="activeTab"
        animated
      >
        <q-tab-panel name="create">
          <div class="row items-center q-mb-lg">
            <q-btn
              icon="arrow_back"
              flat
              round
              @click="handleBack"
            />
            <h5 class="q-ma-none q-ml-sm">
              Phiếu Xuất Chỉ V2
            </h5>
            <q-space />
            <AppButton
              v-if="hasIssue && !isConfirmed"
              label="Xác Nhận Xuất"
              color="positive"
              icon="check"
              :loading="isLoading"
              :disable="!canConfirm"
              @click="handleConfirm"
            />
            <AppButton
              v-if="isConfirmed"
              label="Tạo Phiếu Mới"
              color="primary"
              icon="add"
              class="q-ml-sm"
              @click="handleNewIssue"
            />
          </div>

          <div
            v-if="hasIssue && currentIssue"
            class="q-mb-md"
          >
            <q-badge
              :color="isConfirmed ? 'positive' : 'grey'"
              class="text-subtitle1 q-pa-sm"
            >
              {{ currentIssue.issue_code }}
              <q-chip
                v-if="isConfirmed"
                dense
                color="white"
                text-color="positive"
                class="q-ml-sm"
              >
                ĐÃ XÁC NHẬN
              </q-chip>
            </q-badge>
          </div>

          <q-card
            v-if="!hasIssue && !step2Visible"
            flat
            bordered
            class="q-mb-lg"
          >
            <q-card-section>
              <div class="text-subtitle1 q-mb-md">
                Bước 1: Tạo Phiếu Xuất
              </div>
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <AppSelect
                    v-model="department"
                    label="Bộ Phận"
                    :options="departmentOptions"
                    :loading="loadingOptions"
                    required
                    emit-value
                    map-options
                    use-input
                    fill-input
                    hide-selected
                    placeholder="Chọn bộ phận..."
                  />
                </div>
                <div class="col-12 col-md-6">
                  <AppInput
                    v-model="createdBy"
                    label="Người Tạo"
                    required
                    placeholder="Nhập tên người tạo..."
                  />
                </div>
              </div>
            </q-card-section>
            <q-card-actions align="right">
              <AppButton
                label="Tiếp Tục"
                color="primary"
                :loading="isLoading"
                :disable="!canCreateIssue"
                @click="handleCreateIssue"
              />
            </q-card-actions>
          </q-card>

          <q-card
            v-if="(step2Visible || hasIssue) && !isConfirmed"
            flat
            bordered
            class="q-mb-lg"
          >
            <q-card-section>
              <div class="text-subtitle1 q-mb-md">
                Bước 2: Chọn Đơn Hàng / Mã Hàng / Màu
              </div>
              <div class="row q-col-gutter-md items-end">
                <div class="col-12 col-md-3">
                  <AppSelect
                    v-model="selectedPoId"
                    label="PO"
                    :options="poOptions"
                    :loading="loadingOptions"
                    emit-value
                    map-options
                    use-input
                    fill-input
                    hide-selected
                    placeholder="Chọn đơn hàng..."
                  >
                    <template #no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          Không có đơn hàng trong tuần đã xác nhận
                        </q-item-section>
                      </q-item>
                    </template>
                  </AppSelect>
                </div>
                <div class="col-12 col-md-3">
                  <AppSelect
                    v-model="selectedStyleId"
                    label="Mã Hàng (Style)"
                    :options="styleOptions"
                    :disable="!selectedPoId"
                    emit-value
                    map-options
                    use-input
                    fill-input
                    hide-selected
                    placeholder="Chọn mã hàng..."
                  >
                    <template #no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          Không có mã hàng cho PO này
                        </q-item-section>
                      </q-item>
                    </template>
                  </AppSelect>
                </div>
                <div class="col-12 col-md-3">
                  <AppSelect
                    v-model="selectedColorId"
                    label="Màu"
                    :options="colorOptions"
                    :disable="!selectedStyleId"
                    emit-value
                    map-options
                    use-input
                    fill-input
                    hide-selected
                    placeholder="Chọn màu..."
                  >
                    <template #no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          Không có màu cho mã hàng này
                        </q-item-section>
                      </q-item>
                    </template>
                  </AppSelect>
                </div>
                <div class="col-12 col-md-3">
                  <AppButton
                    label="Tải Chỉ"
                    color="secondary"
                    icon="refresh"
                    :loading="loadingFormData"
                    :disable="!canLoadThreadTypes"
                    @click="handleLoadFormData"
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>

          <q-card
            v-if="(step2Visible || hasIssue) && availableThreadTypes.length > 0 && !isConfirmed"
            flat
            bordered
            class="q-mb-lg"
          >
            <q-card-section>
              <div class="text-subtitle1 q-mb-md">
                Bước 3: Nhập Số Lượng Xuất
              </div>

              <q-table
                :rows="availableThreadTypes"
                :columns="columns"
                row-key="thread_type_id"
                flat
                bordered
                :pagination="{ rowsPerPage: 0 }"
                hide-bottom
              >
                <template #body-cell-thread="props">
                  <q-td :props="props">
                    <div class="text-weight-medium">
                      {{ props.row.thread_code }}
                    </div>
                    <div class="text-caption text-grey">
                      {{ props.row.thread_name }}
                    </div>
                  </q-td>
                </template>

                <template #body-cell-stock="props">
                  <q-td :props="props">
                    <span class="text-positive">{{ props.row.stock_available_full }} ng</span>
                    +
                    <span class="text-warning">{{ props.row.stock_available_partial }} le</span>
                  </q-td>
                </template>

                <template #body-cell-issue="props">
                  <q-td :props="props">
                    <div class="row q-gutter-xs items-center no-wrap">
                      <q-input
                        :model-value="lineInputs[props.row.thread_type_id]?.full ?? 0"
                        type="number"
                        dense
                        outlined
                        class="col"
                        style="min-width: 60px; max-width: 80px"
                        :min="0"
                        :max="props.row.stock_available_full"
                        placeholder="Nguyên"
                        @update:model-value="(v) => handleInputChange(props.row.thread_type_id, 'full', Number(v) || 0, props.row.stock_available_full)"
                      />
                      <span>+</span>
                      <q-input
                        :model-value="lineInputs[props.row.thread_type_id]?.partial ?? 0"
                        type="number"
                        dense
                        outlined
                        class="col"
                        style="min-width: 60px; max-width: 80px"
                        :min="0"
                        :max="props.row.stock_available_partial"
                        placeholder="Lẻ"
                        @update:model-value="(v) => handleInputChange(props.row.thread_type_id, 'partial', Number(v) || 0, props.row.stock_available_partial)"
                      />
                    </div>
                    <div
                      v-if="getUnderQuotaAmount(props.row) > 0 && (lineInputs[props.row.thread_type_id]?.full || lineInputs[props.row.thread_type_id]?.partial)"
                      class="q-mt-xs"
                    >
                      <q-badge
                        color="info"
                        outline
                      >
                        Còn {{ getUnderQuotaAmount(props.row).toFixed(2) }} cuộn chưa xuất
                      </q-badge>
                    </div>
                    <div
                      v-if="lineInputs[props.row.thread_type_id]?.validation?.is_over_quota"
                      class="q-mt-xs"
                    >
                      <q-badge
                        color="warning"
                        class="q-mb-xs"
                      >
                        Vượt định mức!
                      </q-badge>
                      <q-input
                        :model-value="lineInputs[props.row.thread_type_id]?.notes ?? ''"
                        dense
                        outlined
                        placeholder="Ghi chú lý do..."
                        class="q-mt-xs"
                        @update:model-value="(v) => { const input = lineInputs[props.row.thread_type_id]; if (input) { input.notes = String(v) } }"
                      />
                    </div>
                  </q-td>
                </template>

                <template #body-cell-equivalent="props">
                  <q-td :props="props">
                    <span v-if="lineInputs[props.row.thread_type_id]?.validation">
                      {{ lineInputs[props.row.thread_type_id]?.validation?.issued_equivalent.toFixed(2) }}
                      <q-icon
                        v-if="!lineInputs[props.row.thread_type_id]?.validation?.stock_sufficient"
                        name="warning"
                        color="negative"
                      >
                        <q-tooltip>Không đủ tồn kho</q-tooltip>
                      </q-icon>
                    </span>
                    <span
                      v-else
                      class="text-grey"
                    >-</span>
                  </q-td>
                </template>

                <template #body-cell-actions="props">
                  <q-td :props="props">
                    <AppButton
                      icon="add"
                      size="sm"
                      color="primary"
                      dense
                      round
                      :disable="isAddButtonDisabled(props.row.thread_type_id)"
                      @click="handleAddLine(props.row)"
                    >
                      <q-tooltip>{{ getAddButtonTooltip(props.row.thread_type_id) }}</q-tooltip>
                    </AppButton>
                  </q-td>
                </template>
              </q-table>
            </q-card-section>
          </q-card>

          <q-card
            v-if="hasIssue && lines.length > 0"
            flat
            bordered
          >
            <q-card-section>
              <div class="text-subtitle1 q-mb-md">
                Các Dòng Đã Thêm ({{ lines.length }})
              </div>

              <q-table
                :rows="lines"
                :columns="[
                  { name: 'thread', label: 'Loại Chỉ', field: 'thread_name', align: 'left' },
                  { name: 'po', label: 'PO', field: 'po_number', align: 'left' },
                  { name: 'style', label: 'Mã Hàng', field: 'style_code', align: 'left' },
                  { name: 'color', label: 'Màu', field: 'color_name', align: 'left' },
                  { name: 'quota', label: 'Định Mức', field: 'quota_cones', align: 'center', format: (v: number | null) => v !== null ? `${v}` : '-' },
                  { name: 'issued', label: 'Xuất', field: 'issued', align: 'center' },
                  { name: 'equivalent', label: 'Quy Đổi', field: 'issued_equivalent', align: 'center', format: (v: number) => v.toFixed(2) },
                  { name: 'status', label: 'Trạng Thái', field: 'status', align: 'center' },
                  { name: 'actions', label: '', field: 'actions', align: 'center' },
                ]"
                row-key="id"
                flat
                bordered
                :pagination="{ rowsPerPage: 0 }"
                hide-bottom
                :row-class="(row: { is_over_quota?: boolean }) => getRowClass(row as { is_over_quota: boolean })"
              >
                <template #body-cell-thread="props">
                  <q-td :props="props">
                    <div class="text-weight-medium">
                      {{ props.row.thread_code || props.row.thread_name }}
                    </div>
                  </q-td>
                </template>

                <template #body-cell-issued="props">
                  <q-td :props="props">
                    {{ props.row.issued_full }} ng + {{ props.row.issued_partial }} le
                  </q-td>
                </template>

                <template #body-cell-status="props">
                  <q-td :props="props">
                    <q-badge
                      v-if="props.row.is_over_quota"
                      color="warning"
                    >
                      Vượt ĐM
                    </q-badge>
                    <q-badge
                      v-else-if="getLineUnderQuotaAmount(props.row) > 0"
                      color="info"
                      outline
                    >
                      Còn {{ getLineUnderQuotaAmount(props.row).toFixed(2) }} cuộn
                    </q-badge>
                    <q-badge
                      v-else
                      color="positive"
                    >
                      Đủ ĐM
                    </q-badge>
                    <div
                      v-if="props.row.over_quota_notes"
                      class="text-caption text-grey q-mt-xs"
                    >
                      {{ props.row.over_quota_notes }}
                    </div>
                  </q-td>
                </template>

                <template #body-cell-actions="props">
                  <q-td :props="props">
                    <q-btn
                      v-if="!isConfirmed"
                      icon="delete"
                      size="sm"
                      flat
                      round
                      color="negative"
                      @click="handleRemoveLine(props.row.id)"
                    >
                      <q-tooltip>Xóa dòng</q-tooltip>
                    </q-btn>
                  </q-td>
                </template>
              </q-table>
            </q-card-section>
          </q-card>

          <q-card
            v-if="(step2Visible || hasIssue) && lines.length === 0 && threadTypes.length === 0"
            flat
            bordered
          >
            <q-card-section class="text-center text-grey q-py-xl">
              <q-icon
                name="inventory_2"
                size="48px"
                class="q-mb-md"
              />
              <div>Chọn Đơn Hàng, Mã Hàng, Màu để bắt đầu nhập xuất</div>
            </q-card-section>
          </q-card>
        </q-tab-panel>

        <q-tab-panel name="history">
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
                    @update:model-value="handleHistorySearch"
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
                    <AppButton
                      color="primary"
                      label="Tìm kiếm"
                      icon="search"
                      unelevated
                      @click="handleHistorySearch"
                    />
                    <AppButton
                      outline
                      color="grey"
                      label="Xóa"
                      icon="clear"
                      @click="handleClearHistoryFilters"
                    />
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <DataTable
            v-model:pagination="historyPagination"
            :rows="issues"
            :columns="historyColumns"
            :loading="isLoading"
            row-key="id"
            empty-icon="receipt_long"
            empty-title="Chưa có phiếu xuất nào"
            empty-subtitle="Tạo phiếu xuất mới để bắt đầu"
            class="history-table"
            @request="handleHistoryRequest"
            @row-click="handleHistoryRowClick"
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

            <template #body-cell-actions="props">
              <q-td :props="props">
                <div class="row no-wrap justify-center q-gutter-xs">
                  <q-btn
                    v-if="props.row.status === IssueV2Status.DRAFT"
                    flat
                    round
                    dense
                    size="sm"
                    icon="check_circle"
                    color="positive"
                    @click.stop="handleConfirmFromList(props.row)"
                  >
                    <q-tooltip>Xác nhận</q-tooltip>
                  </q-btn>
                  <q-btn
                    v-if="props.row.status === IssueV2Status.DRAFT"
                    flat
                    round
                    dense
                    size="sm"
                    icon="delete"
                    color="negative"
                    @click.stop="handleDeleteFromList(props.row)"
                  >
                    <q-tooltip>Xóa</q-tooltip>
                  </q-btn>
                  <q-btn
                    v-if="props.row.status === IssueV2Status.CONFIRMED"
                    flat
                    round
                    dense
                    size="sm"
                    icon="replay"
                    color="info"
                    @click.stop="handleReturnFromList()"
                  >
                    <q-tooltip>Nhập trả</q-tooltip>
                  </q-btn>
                </div>
              </q-td>
            </template>

            <template #empty-action>
              <q-btn
                color="primary"
                label="Tạo Phiếu Xuất"
                icon="add"
                unelevated
                @click="activeTab = 'create'"
              />
            </template>
          </DataTable>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </q-page>
</template>

<style scoped>
.bg-warning-1 {
  background-color: rgba(255, 193, 7, 0.1);
}

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
