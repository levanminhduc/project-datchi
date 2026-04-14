<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDebounceFn, useLocalStorage } from '@vueuse/core'
import { useIssueV2 } from '@/composables/thread/useIssueV2'
import { useDeptAllocation } from '@/composables/thread/useDeptAllocation'
import { issueV2Service } from '@/services/issueV2Service'
import { subArtService } from '@/services/subArtService'
import type { SubArt } from '@/types/thread/subArt'
import { employeeService } from '@/services/employeeService'
import { useSnackbar } from '@/composables/useSnackbar'
import { useAuth } from '@/composables/useAuth'
import { useConfirm } from '@/composables/useConfirm'
import { IssueV2Status, OVER_QUOTA_REASONS } from '@/types/thread/issueV2'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppWarehouseSelect from '@/components/ui/inputs/AppWarehouseSelect.vue'
import DataTable from '@/components/ui/tables/DataTable.vue'
import DatePicker from '@/components/ui/pickers/DatePicker.vue'
import FormDialog from '@/components/ui/dialogs/FormDialog.vue'
import { dateRules } from '@/utils'
import { formatStyleDisplay } from '@/utils/thread-format'
import IssueV2StatusBadge from '@/components/thread/IssueV2StatusBadge.vue'
import type { QTableColumn, QTableProps } from 'quasar'
import type {
  IssueV2Filters,
  ThreadTypeForIssueWithColor,
  ValidateLineResponse,
  OrderOptionPO,
  OrderOptionStyle,
  OrderOptionColor,
  IssueShortageDetail,
} from '@/types/thread/issueV2'

const route = useRoute()
const router = useRouter()
const snackbar = useSnackbar()
const { employee } = useAuth()
const { confirmWarning, confirmDelete } = useConfirm()

const {
  currentIssue,
  isLoading,
  hasIssue,
  lines,
  isConfirmed,
  issues,
  total,
  filters,
  createIssueWithFirstLine,
  fetchIssue,
  loadFormData,
  validateLine,
  addLine,
  batchAddLines,
  removeLine,
  confirmIssue,
  clearIssue,
  fetchIssues,
} = useIssueV2()

const {
  summary: allocationSummary,
  isLoading: isLoadingAlloc,
  isAllocating,
  hasAllocations,
  getDeptInfo,
  loadSummary: loadAllocationSummary,
  allocate: submitAllocation,
  reset: resetAllocation,
} = useDeptAllocation()

const showAllocationModal = ref(false)
const allocationAddQty = ref<number | null>(null)

const activeTab = ref(route.query.tab === 'history' ? 'history' : 'create')
const step2Visible = ref(false)

const department = ref('')
const createdBy = ref(employee.value?.fullName ?? '')

const currentDeptInfo = computed(() => {
  if (!department.value) return null
  return getDeptInfo(department.value)
})

const selectedPoId = ref<number | null>(null)
const selectedStyleId = ref<number | null>(null)
const selectedSubArtId = ref<number | null>(null)
const selectedColorIds = ref<number[]>([])

const poOptions = ref<{ value: number; label: string }[]>([])
const styleOptions = ref<{ value: number; label: string; has_sub_arts?: boolean }[]>([])
const subArtOptions = ref<{ value: number; label: string }[]>([])
const colorOptions = ref<{ value: number; label: string }[]>([])
const allColorOptions = ref<{ value: number; label: string }[]>([])
const departmentOptions = ref<{ value: string; label: string }[]>([])

const loadingOptions = ref(false)
const loadingFormData = ref(false)
const loadingSubArts = ref(false)
const loadingColorProgress = ref('')
const isBatchAdding = ref(false)
const isConfirming = ref(false)
const multiColorThreadTypes = ref<ThreadTypeForIssueWithColor[]>([])

function ttKey(colorId: number | null | undefined, threadTypeId: number, threadColorId?: number | null): string {
  return `${colorId}-${threadTypeId}-${threadColorId ?? 'null'}`
}

const selectedWarehouseId = useLocalStorage<number | null>('issue-v2-warehouse', null)
const shortageData = ref<IssueShortageDetail[] | null>(null)
const showBorrowDialog = ref(false)
const selectedStyleHasSubArts = computed(() => {
  if (!selectedStyleId.value) return false
  const opt = styleOptions.value.find((s) => s.value === selectedStyleId.value)
  return opt?.has_sub_arts ?? false
})

const lineInputs = ref<Record<string, { full: number; partial: number; notes: string; validation: ValidateLineResponse | null }>>({})

const canCreateIssue = computed(() => {
  return department.value.trim() && createdBy.value.trim() && !hasIssue.value && !step2Visible.value
})

const canLoadThreadTypes = computed(() => {
  if (!selectedPoId.value || !selectedStyleId.value || selectedColorIds.value.length === 0) return false
  if (selectedStyleHasSubArts.value && !selectedSubArtId.value) return false
  return true
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
  const addedKeys = new Set(
    lines.value.map((line) => `${line.color_id || line.style_color_id}-${line.thread_type_id}-${line.thread_color_id ?? 'null'}`)
  )
  return multiColorThreadTypes.value
    .filter((tt) => !addedKeys.has(`${tt.color_id}-${tt.thread_type_id}-${tt.thread_color_id ?? 'null'}`))
    .sort((a, b) => a.color_name.localeCompare(b.color_name) || (a.thread_code || '').localeCompare(b.thread_code || ''))
})

const columns: QTableColumn[] = [
  { name: 'color', label: 'Màu Hàng', field: 'color_name', align: 'left' },
  { name: 'thread', label: 'Loại Chỉ', field: 'thread_name', align: 'left' },
  { name: 'quota', label: 'Định Mức Cấp', field: 'quota_cones', align: 'center' },
  { name: 'stock', label: 'Tồn Kho', field: 'stock', align: 'center' },
  { name: 'issue_full', label: 'Xuất Nguyên', field: 'issue_full', align: 'center' },
  { name: 'issue_partial', label: 'Xuất Lẻ', field: 'issue_partial', align: 'center' },
  { name: 'line_status', label: 'Trạng Thái', field: 'line_status', align: 'center' },
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
  { name: 'order_info', label: 'PO/Style/SubArt', field: 'po_number', align: 'left' },
  { name: 'colors', label: 'Màu Hàng', field: 'color_names', align: 'left' },
  { name: 'department', label: 'Bộ Phận', field: 'department', align: 'left', sortable: true },
  { name: 'status', label: 'Trạng Thái', field: 'status', align: 'center' },
  { name: 'created_at', label: 'Ngày Tạo', field: 'created_at', align: 'left', sortable: true },
  { name: 'created_by', label: 'Người Tạo', field: 'created_by', align: 'left' },
  { name: 'actions', label: 'Thao Tác', field: 'actions', align: 'center', sortable: false },
]

const addedLinesColumns: QTableColumn[] = [
  { name: 'thread', label: 'Loại Chỉ', field: 'thread_name', align: 'left' },
  { name: 'po', label: 'PO', field: 'po_number', align: 'left' },
  { name: 'style', label: 'Mã Hàng', field: 'style_code', align: 'left' },
  { name: 'sub_art', label: 'Sub-Art', field: 'sub_art_code', align: 'left', format: (v: string | null) => v || '-' },
  { name: 'color', label: 'Màu Hàng', field: 'color_name', align: 'left' },
  { name: 'quota', label: 'Định Mức Cấp', field: 'quota_cones', align: 'center', format: (v: number | null) => v !== null ? `${v}` : '-' },
  { name: 'issued', label: 'Xuất', field: 'issued', align: 'center' },
  { name: 'equivalent', label: 'Quy Đổi', field: 'issued_equivalent', align: 'center', format: (v: number) => v.toFixed(2) },
  { name: 'status', label: 'Trạng Thái', field: 'status', align: 'center' },
  { name: 'actions', label: '', field: 'actions', align: 'center' },
]

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('vi-VN')
}

watch(selectedPoId, async (newPoId) => {
  selectedStyleId.value = null
  selectedSubArtId.value = null
  selectedColorIds.value = []
  styleOptions.value = []
  subArtOptions.value = []
  colorOptions.value = []

  if (!newPoId) return

  try {
    const styles = await issueV2Service.getOrderOptions(newPoId)
    styleOptions.value = (styles as OrderOptionStyle[]).map((s) => ({
      value: s.id,
      label: formatStyleDisplay(s.style_code, s.style_name),
      has_sub_arts: s.has_sub_arts,
    }))
  } catch (err) {
    console.error('Failed to load styles:', err)
    snackbar.error('Không thể tải danh sách mã hàng')
  }
})

watch(selectedStyleId, async (newStyleId) => {
  selectedSubArtId.value = null
  selectedColorIds.value = []
  subArtOptions.value = []
  colorOptions.value = []
  allColorOptions.value = []

  if (!newStyleId || !selectedPoId.value) return

  try {
    const colors = await issueV2Service.getOrderOptions(selectedPoId.value, newStyleId)
    allColorOptions.value = (colors as OrderOptionColor[]).map((c) => ({
      value: c.id,
      label: c.name,
    }))
  } catch (err) {
    console.error('Failed to load colors:', err)
    snackbar.error('Không thể tải danh sách màu')
  }

  if (selectedStyleHasSubArts.value) {
    const colorPrefixes = new Set(
      allColorOptions.value.map((c) => c.label.split(' - ')[0]).filter(Boolean)
    )

    loadingSubArts.value = true
    try {
      const subArts = await subArtService.getByStyleId(newStyleId)
      subArtOptions.value = subArts
        .filter((sa: SubArt) => colorPrefixes.has(sa.sub_art_code))
        .map((sa: SubArt) => ({
          value: sa.id,
          label: sa.sub_art_code,
        }))
    } catch (err) {
      console.error('Failed to load sub-arts:', err)
      snackbar.error('Không thể tải danh sách Sub-Art')
    } finally {
      loadingSubArts.value = false
    }
  } else {
    colorOptions.value = [...allColorOptions.value]
  }
})

watch(selectedSubArtId, (newSubArtId) => {
  selectedColorIds.value = []

  if (!newSubArtId) {
    colorOptions.value = []
    return
  }

  const subArt = subArtOptions.value.find((sa) => sa.value === newSubArtId)
  if (!subArt) {
    colorOptions.value = []
    return
  }

  colorOptions.value = allColorOptions.value.filter((c) => c.label.startsWith(subArt.label))
})

watch([selectedPoId, selectedStyleId, selectedSubArtId], () => {
  multiColorThreadTypes.value = []
  lineInputs.value = {}
  resetAllocation()
})

const debouncedLoadFormData = useDebounceFn(() => {
  if (canLoadThreadTypes.value) {
    handleLoadFormData()
  }
}, 500)

watch(selectedColorIds, (colorIds) => {
  if (colorIds.length > 0 && canLoadThreadTypes.value) {
    debouncedLoadFormData()
  } else {
    multiColorThreadTypes.value = []
    lineInputs.value = {}
    resetAllocation()
  }
}, { deep: true })

watch(activeTab, (newTab) => {
  if (newTab === 'history' && !historyLoaded.value) {
    historyLoaded.value = true
    loadHistoryData()
  }
})

async function loadInitialOptions() {
  loadingOptions.value = true
  try {
    const [pos, depts] = await Promise.all([
      issueV2Service.getOrderOptions(),
      employeeService.getIssueDepartments(),
    ])
    poOptions.value = (pos as OrderOptionPO[]).map((po) => ({
      value: po.id,
      label: po.po_number,
    }))

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

async function handleLoadFormData(forceReload = false) {
  if (!canLoadThreadTypes.value) return

  loadingFormData.value = true
  loadingColorProgress.value = ''

  const colorIds = selectedColorIds.value

  if (forceReload) {
    multiColorThreadTypes.value = multiColorThreadTypes.value.filter(
      (tt) => !colorIds.includes(tt.color_id)
    )
    for (const key of Object.keys(lineInputs.value)) {
      const colorId = Number(key.split('-')[0])
      if (colorIds.includes(colorId)) {
        delete lineInputs.value[key]
      }
    }
  }

  const existingColorIds = new Set(multiColorThreadTypes.value.map((tt) => tt.color_id))
  const newColorIds = colorIds.filter((id) => !existingColorIds.has(id))

  const removedColorIds = [...existingColorIds].filter((id) => !colorIds.includes(id))
  if (removedColorIds.length > 0) {
    multiColorThreadTypes.value = multiColorThreadTypes.value.filter(
      (tt) => !removedColorIds.includes(tt.color_id)
    )
    for (const key of Object.keys(lineInputs.value)) {
      const colorId = Number(key.split('-')[0])
      if (removedColorIds.includes(colorId)) {
        delete lineInputs.value[key]
      }
    }
  }

  if (newColorIds.length === 0) {
    loadingFormData.value = false
    return
  }

  try {
    let loadedCount = 0

    await Promise.allSettled(
      newColorIds.map(async (colorId) => {
        const colorOption = colorOptions.value.find((c) => c.value === colorId)
        const colorName = colorOption?.label || ''
        const data = await loadFormData(selectedPoId.value!, selectedStyleId.value!, colorId, department.value || undefined, selectedWarehouseId.value || undefined)
        loadedCount++
        loadingColorProgress.value = `Đang tải ${loadedCount}/${newColorIds.length} màu...`

        if (data?.thread_types) {
          const newTypes: ThreadTypeForIssueWithColor[] = data.thread_types.map((tt) => ({
            ...tt,
            color_id: colorId,
            color_name: colorName,
          }))
          multiColorThreadTypes.value = [...multiColorThreadTypes.value, ...newTypes]

          for (const tt of data.thread_types) {
            const key = ttKey(colorId, tt.thread_type_id, tt.thread_color_id)
            if (!lineInputs.value[key]) {
              lineInputs.value[key] = {
                full: 0,
                partial: 0,
                notes: '',
                validation: null,
              }
            }
          }
        }
      })
    )

    if (colorIds.length === 1) {
      loadAllocationSummary(selectedPoId.value!, selectedStyleId.value!, colorIds[0]!)
    } else {
      resetAllocation()
    }
  } finally {
    loadingFormData.value = false
    loadingColorProgress.value = ''
    startStockPolling()
  }
}

async function handleAllocate() {
  if (!allocationAddQty.value || allocationAddQty.value <= 0) return
  if (!selectedPoId.value || !selectedStyleId.value || selectedColorIds.value.length !== 1 || !department.value) return

  try {
    await submitAllocation({
      po_id: selectedPoId.value,
      style_id: selectedStyleId.value,
      style_color_id: selectedColorIds.value[0]!,
      department: department.value,
      add_quantity: allocationAddQty.value,
      created_by: createdBy.value,
    })
    showAllocationModal.value = false
    allocationAddQty.value = null
    await loadFormData(selectedPoId.value!, selectedStyleId.value!, selectedColorIds.value[0]!, department.value || undefined)
  } catch {
  }
}

function fillRemainingAllocation() {
  const remaining = allocationSummary.value?.remaining ?? 0
  allocationAddQty.value = remaining > 0 ? remaining : null
}

const isValidating = ref(false)
let validatingCount = 0

const debouncedValidate = useDebounceFn(async (colorId: number, threadTypeId: number, threadColorId?: number | null) => {
  const key = ttKey(colorId, threadTypeId, threadColorId)
  const input = lineInputs.value[key]
  if (!input) {
    validatingCount = Math.max(0, validatingCount - 1)
    if (validatingCount === 0) isValidating.value = false
    return
  }
  if (input.full === 0 && input.partial === 0) {
    input.validation = null
    validatingCount = Math.max(0, validatingCount - 1)
    if (validatingCount === 0) isValidating.value = false
    return
  }

  try {
    const result = await validateLine({
      thread_type_id: threadTypeId,
      thread_color_id: threadColorId ?? undefined,
      issued_full: input.full,
      issued_partial: input.partial,
      po_id: selectedPoId.value,
      style_id: selectedStyleId.value,
      color_id: colorId,
      style_color_id: colorId,
      sub_art_id: selectedSubArtId.value,
      department: department.value || undefined,
      warehouse_id: selectedWarehouseId.value || undefined,
    })

    if (result) {
      input.validation = result
    }
  } finally {
    validatingCount = Math.max(0, validatingCount - 1)
    if (validatingCount === 0) isValidating.value = false
  }
}, 300)

function handleQuantityChange(colorId: number, threadTypeId: number, threadColorId?: number | null) {
  validatingCount++
  isValidating.value = true
  debouncedValidate(colorId, threadTypeId, threadColorId)
}

function handleInputChange(colorId: number, threadTypeId: number, field: 'full' | 'partial', value: number, max: number, threadColorId?: number | null) {
  const key = ttKey(colorId, threadTypeId, threadColorId)
  const input = lineInputs.value[key]
  if (!input) return

  const clampedValue = Math.min(Math.max(0, value), max)
  input[field] = clampedValue

  handleQuantityChange(colorId, threadTypeId, threadColorId)
}

function getLineUnderQuotaAmount(line: { quota_cones: number | null; issued_equivalent: number }): number {
  if (!line.quota_cones) return 0
  const remaining = line.quota_cones - line.issued_equivalent
  return remaining > 0 ? remaining : 0
}

function getUnderQuotaAmount(row: ThreadTypeForIssueWithColor): number {
  const key = ttKey(row.color_id, row.thread_type_id, row.thread_color_id)
  const input = lineInputs.value[key]
  if (!input || !row.quota_cones) return 0

  const validation = input.validation
  if (!validation) {
    if (input.full === 0 && input.partial === 0) {
      return row.quota_cones
    }
    return 0
  }

  if (validation.is_over_quota) return 0

  const remaining = row.quota_cones - validation.issued_equivalent
  return remaining > 0 ? remaining : 0
}

function isAddButtonDisabled(colorId: number, threadTypeId: number, threadColorId?: number | null): boolean {
  const key = ttKey(colorId, threadTypeId, threadColorId)
  const input = lineInputs.value[key]
  if (!input) return true
  if (input.full === 0 && input.partial === 0) return true
  if (input.validation && !input.validation.stock_sufficient && !input.validation.can_borrow) return true
  if (input.validation?.is_over_quota && !input.notes) return true
  if (isBatchAdding.value || isConfirming.value || isValidating.value) return true
  return false
}

function getAddButtonTooltip(colorId: number, threadTypeId: number, threadColorId?: number | null): string {
  const key = ttKey(colorId, threadTypeId, threadColorId)
  const input = lineInputs.value[key]
  if (!input) return 'Nhập số lượng xuất'
  if (input.full === 0 && input.partial === 0) return 'Nhập số lượng xuất'
  if (input.validation && !input.validation.stock_sufficient && !input.validation.can_borrow) return 'Không đủ tồn kho'
  if (input.validation && !input.validation.stock_sufficient && input.validation.can_borrow) return 'Thiếu tồn kho — sẽ mượn từ kho khác khi xác nhận'
  return 'Thêm vào phiếu'
}

async function handleAddLine(row: ThreadTypeForIssueWithColor) {
  const key = ttKey(row.color_id, row.thread_type_id, row.thread_color_id)
  const input = lineInputs.value[key]
  if (!input || (input.full === 0 && input.partial === 0)) {
    snackbar.warning('Nhập số lượng xuất')
    return
  }

  if (input.validation && !input.validation.stock_sufficient && !input.validation.can_borrow) {
    snackbar.error('Không đủ tồn kho để xuất')
    return
  }

  if (input.validation?.is_over_quota && !input.notes.trim()) {
    snackbar.warning('Vượt định mức, yêu cầu ghi chú lý do')
    return
  }

  const lineData = {
    po_id: selectedPoId.value,
    style_id: selectedStyleId.value,
    color_id: row.color_id,
    style_color_id: row.color_id,
    sub_art_id: selectedSubArtId.value,
    thread_type_id: row.thread_type_id,
    thread_color_id: row.thread_color_id ?? null,
    issued_full: input.full,
    issued_partial: input.partial,
    over_quota_notes: input.notes.trim() || null,
  }

  if (!hasIssue.value) {
    const result = await createIssueWithFirstLine({
      department: department.value.trim(),
      created_by: createdBy.value.trim(),
      ...lineData,
    })

    if (result) {
      input.full = 0
      input.partial = 0
      input.notes = ''
      input.validation = null
    }
    return
  }

  const result = await addLine(lineData)

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

async function handleBatchAddAll() {
  const linesToAdd: Array<{
    colorId: number
    key: string
    data: {
      po_id: number | null
      style_id: number | null
      color_id: number
      style_color_id: number
      sub_art_id: number | null
      thread_type_id: number
      thread_color_id: number | null
      issued_full: number
      issued_partial: number
      over_quota_notes: string | null
    }
  }> = []

  const skippedLines: string[] = []

  for (const row of availableThreadTypes.value) {
    const key = ttKey(row.color_id, row.thread_type_id, row.thread_color_id)
    const input = lineInputs.value[key]
    if (!input || (input.full === 0 && input.partial === 0)) continue

    const label = `${row.color_name} - ${row.thread_code}`

    if (input.validation && !input.validation.stock_sufficient && !input.validation.can_borrow) {
      const v = input.validation
      const shortFull = Math.max(0, input.full - v.stock_available_full)
      const shortPartial = Math.max(0, input.partial - v.stock_available_partial)
      const details = [
        shortFull > 0 ? `thiếu ${shortFull} nguyên` : '',
        shortPartial > 0 ? `thiếu ${shortPartial} lẻ` : '',
      ].filter(Boolean).join(', ')
      skippedLines.push(`${label}: Không đủ tồn kho (${details})`)
      continue
    }

    if (input.validation?.is_over_quota && !input.notes.trim()) {
      const v = input.validation
      const overBy = v.issued_equivalent - (v.quota_cones ?? 0)
      skippedLines.push(`${label}: Vượt định mức ${overBy.toFixed(1)} cuộn, cần ghi chú`)
      continue
    }

    linesToAdd.push({
      colorId: row.color_id,
      key,
      data: {
        po_id: selectedPoId.value,
        style_id: selectedStyleId.value,
        color_id: row.color_id,
        style_color_id: row.color_id,
        sub_art_id: selectedSubArtId.value,
        thread_type_id: row.thread_type_id,
        thread_color_id: row.thread_color_id ?? null,
        issued_full: input.full,
        issued_partial: input.partial,
        over_quota_notes: input.notes.trim() || null,
      },
    })
  }

  if (linesToAdd.length === 0) {
    if (skippedLines.length > 0) {
      snackbar.warning(`Không có dòng hợp lệ để thêm. Bỏ qua ${skippedLines.length} dòng:\n${skippedLines.join('\n')}`)
    } else {
      snackbar.warning('Không có dòng nào để thêm')
    }
    return
  }

  isBatchAdding.value = true

  try {
    if (!hasIssue.value) {
      const firstLine = linesToAdd[0]!
      const result = await createIssueWithFirstLine({
        department: department.value.trim(),
        created_by: createdBy.value.trim(),
        ...firstLine.data,
      })

      if (!result) {
        return
      }

      const input = lineInputs.value[firstLine.key]
      if (input) {
        input.full = 0
        input.partial = 0
        input.notes = ''
        input.validation = null
      }

      if (linesToAdd.length === 1) return

      const remainingLines = linesToAdd.slice(1).map((l) => l.data)
      const batchResult = await batchAddLines({ lines: remainingLines })

      if (batchResult) {
        for (const l of linesToAdd.slice(1)) {
          const inp = lineInputs.value[l.key]
          if (inp) {
            inp.full = 0
            inp.partial = 0
            inp.notes = ''
            inp.validation = null
          }
        }
      }
    } else {
      const allLines = linesToAdd.map((l) => l.data)
      const batchResult = await batchAddLines({ lines: allLines })

      if (batchResult) {
        for (const l of linesToAdd) {
          const inp = lineInputs.value[l.key]
          if (inp) {
            inp.full = 0
            inp.partial = 0
            inp.notes = ''
            inp.validation = null
          }
        }
      }
    }

    if (skippedLines.length > 0) {
      snackbar.warning(`Đã bỏ qua ${skippedLines.length} dòng:\n${skippedLines.join('\n')}`)
    }
  } finally {
    isBatchAdding.value = false
  }
}

const hasBatchLines = computed(() => {
  return Object.entries(lineInputs.value).some(([, input]) => input.full > 0 || input.partial > 0)
})

async function handleConfirm() {
  if (!canConfirm.value) return
  isConfirming.value = true
  try {
    const result = await confirmIssue(selectedWarehouseId.value || undefined)
    if (typeof result === 'object' && result !== null && 'status' in result && result.status === 'INSUFFICIENT_STOCK') {
      shortageData.value = result.shortages
      showBorrowDialog.value = true
    }
  } finally {
    isConfirming.value = false
  }
}

async function handleConfirmWithTransfer() {
  isConfirming.value = true
  try {
    await confirmIssue(selectedWarehouseId.value || undefined, true)
    showBorrowDialog.value = false
    shortageData.value = null
  } finally {
    isConfirming.value = false
  }
}

function handleBack() {
  stopStockPolling()
  if (step2Visible.value && !hasIssue.value) {
    step2Visible.value = false
    selectedPoId.value = null
    selectedStyleId.value = null
    selectedSubArtId.value = null
    selectedColorIds.value = []
    subArtOptions.value = []
    colorOptions.value = []
    lineInputs.value = {}
    return
  }
  clearIssue()
  activeTab.value = 'history'
  router.replace({ query: { tab: 'history' } })
}

function handleNewIssue() {
  clearIssue()
  step2Visible.value = false
  department.value = ''
  createdBy.value = employee.value?.fullName ?? ''
  selectedPoId.value = null
  selectedStyleId.value = null
  selectedSubArtId.value = null
  selectedColorIds.value = []
  subArtOptions.value = []
  lineInputs.value = {}
  shortageData.value = null
  showBorrowDialog.value = false
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

const handleConfirmFromList = async (issue: { id: number; issue_code: string }) => {
  const confirmed = await confirmWarning(
    'Phiếu sẽ được xác nhận và trừ tồn kho. Bạn có chắc chắn?',
    'Xác nhận phiếu xuất'
  )
  if (!confirmed) return

  try {
    await issueV2Service.confirm(issue.id)
    snackbar.success('Xác nhận phiếu xuất thành công')
    await fetchIssues()
  } catch (err: unknown) {
    snackbar.error(err instanceof Error ? err.message : 'Không thể xác nhận phiếu xuất')
  }
}

const handleDeleteFromList = async (issue: { id: number; issue_code: string }) => {
  const confirmed = await confirmDelete(issue.issue_code)
  if (!confirmed) return

  try {
    await issueV2Service.deleteIssue(issue.id)
    snackbar.success('Xóa phiếu xuất thành công')
    await fetchIssues()
  } catch (err: unknown) {
    snackbar.error(err instanceof Error ? err.message : 'Không thể xóa phiếu xuất')
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

const STOCK_POLL_INTERVAL = 20_000
const STOCK_STALE_THRESHOLD = 30_000
let stockPollTimer: ReturnType<typeof setInterval> | null = null
let tabHiddenAt = 0

async function refreshStockData() {
  if (!selectedPoId.value || !selectedStyleId.value) return
  const items = multiColorThreadTypes.value.map((tt) => ({
    thread_type_id: tt.thread_type_id,
    thread_color_id: tt.thread_color_id ?? undefined,
    warehouse_id: selectedWarehouseId.value || (tt.detected_warehouse_id ?? undefined),
    color_id: tt.color_id,
  }))
  if (items.length === 0) return

  try {
    const stocks = await issueV2Service.refreshStock({
      po_id: selectedPoId.value!,
      style_id: selectedStyleId.value!,
      items,
      department: department.value || undefined,
    })

    for (const stock of stocks) {
      const matches = multiColorThreadTypes.value.filter(
        (tt) =>
          tt.thread_type_id === stock.thread_type_id &&
          (tt.thread_color_id ?? null) === (stock.thread_color_id ?? null)
      )
      for (const match of matches) {
        match.stock_available_full = stock.full_cones
        match.stock_available_partial = stock.partial_cones
        if (stock.quota_cones !== null) match.quota_cones = stock.quota_cones
        if (stock.base_quota_cones !== null) match.base_quota_cones = stock.base_quota_cones
        if (stock.confirmed_issued_gross !== null) match.confirmed_issued_gross = stock.confirmed_issued_gross
      }
    }
  } catch (err) {
    console.error('[IssueV2] refreshStockData error:', err)
  }
}

function startStockPolling() {
  stopStockPolling()
  if (multiColorThreadTypes.value.length === 0) return
  if (isConfirmed.value) return
  stockPollTimer = setInterval(refreshStockData, STOCK_POLL_INTERVAL)
}

function stopStockPolling() {
  if (stockPollTimer) {
    clearInterval(stockPollTimer)
    stockPollTimer = null
  }
}

function handleVisibilityChange() {
  if (document.hidden) {
    tabHiddenAt = Date.now()
    stopStockPolling()
    return
  }

  startStockPolling()

  const hiddenDuration = Date.now() - tabHiddenAt
  if (hiddenDuration < STOCK_STALE_THRESHOLD) return
  if (!step2Visible.value && !hasIssue.value) return
  if (multiColorThreadTypes.value.length === 0) return
  if (isConfirmed.value) return
  if (loadingFormData.value) return

  refreshStockData()
}

watch(isConfirmed, (confirmed) => {
  if (confirmed) stopStockPolling()
})

watch(
  () => multiColorThreadTypes.value.length,
  (len) => {
    if (len === 0) stopStockPolling()
  }
)

onMounted(async () => {
  document.addEventListener('visibilitychange', handleVisibilityChange)
  loadInitialOptions()

  const loaded = await loadDraftFromQuery(route.query.issue)
  if (loaded) return

  if (activeTab.value === 'history') {
    historyLoaded.value = true
    loadHistoryData()
  }
})

onUnmounted(() => {
  stopStockPolling()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<template>
  <q-page padding>
    <div class="row q-col-gutter-md q-mb-md items-center">
      <div class="col">
        <h1 class="text-h5 q-my-none text-weight-bold text-primary">
          Phiếu Xuất Chỉ
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
            <AppButton
              icon="arrow_back"
              variant="flat"
              round
              @click="handleBack"
            />
            <h5 class="q-ma-none q-ml-sm">
              Phiếu Xuất Chỉ
            </h5>
            <q-space />
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
                <div class="col-12 col-md-4">
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
                <div class="col-12 col-md-4">
                  <AppWarehouseSelect
                    v-model="selectedWarehouseId"
                    label="Kho Xuất"
                    clearable
                    hint="Bỏ trống để tự động phát hiện"
                  />
                </div>
                <div class="col-12 col-md-4">
                  <AppInput
                    v-model="createdBy"
                    label="Người Tạo"
                    required
                    readonly
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
                <div
                  v-if="selectedStyleHasSubArts"
                  class="col-12 col-md-3"
                >
                  <AppSelect
                    v-model="selectedSubArtId"
                    label="Sub-Art"
                    :options="subArtOptions"
                    :disable="!selectedStyleId"
                    :loading="loadingSubArts"
                    emit-value
                    map-options
                    use-input
                    fill-input
                    hide-selected
                    placeholder="Chọn Sub-Art..."
                  >
                    <template #no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          Không có Sub-Art cho mã hàng này
                        </q-item-section>
                      </q-item>
                    </template>
                  </AppSelect>
                </div>
                <div class="col-12 col-md-3">
                  <AppSelect
                    v-model="selectedColorIds"
                    label="Màu Hàng"
                    :options="colorOptions"
                    :disable="!selectedStyleId || (selectedStyleHasSubArts && !selectedSubArtId)"
                    emit-value
                    map-options
                    multiple
                    use-chips
                    use-input
                    fill-input
                    hide-selected
                    placeholder="Chọn màu..."
                  >
                    <template #option="{ itemProps, opt, selected, toggleOption }">
                      <q-item v-bind="itemProps">
                        <q-item-section side>
                          <q-checkbox
                            :model-value="selected"
                            dense
                            @update:model-value="toggleOption(opt)"
                          />
                        </q-item-section>
                        <q-item-section>
                          {{ opt.label }}
                        </q-item-section>
                      </q-item>
                    </template>
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
                    @click="handleLoadFormData(true)"
                  />
                  <div
                    v-if="loadingColorProgress"
                    class="text-caption text-grey q-mt-xs"
                  >
                    {{ loadingColorProgress }}
                  </div>
                </div>
              </div>
              <div
                v-if="selectedPoId && selectedStyleId && selectedColorIds.length === 1"
                class="q-mt-sm row items-center"
              >
                <q-btn
                  flat
                  dense
                  color="primary"
                  label="Phân bổ SP theo Bộ Phận"
                  icon="groups"
                  @click="showAllocationModal = true"
                />
                <span
                  v-if="hasAllocations && currentDeptInfo"
                  class="text-caption text-grey-8 q-ml-md"
                >
                  {{ department }} — {{ currentDeptInfo.product_quantity.toLocaleString() }} SP
                  (đã phân bổ {{ allocationSummary?.total_allocated.toLocaleString() }}/{{ allocationSummary?.total_product_quantity.toLocaleString() }})
                </span>
                <span
                  v-else-if="hasAllocations"
                  class="text-caption text-orange-8 q-ml-md"
                >
                  {{ department }} chưa phân bổ (còn {{ allocationSummary?.remaining.toLocaleString() }} SP)
                </span>
              </div>
            </q-card-section>
          </q-card>

          <q-card
            v-if="(step2Visible || hasIssue) && (availableThreadTypes.length > 0 || loadingFormData) && !isConfirmed"
            flat
            bordered
            class="q-mb-lg"
          >
            <q-card-section>
              <div class="text-subtitle1 q-mb-md">
                Bước 3: Nhập Số Lượng Xuất
              </div>

              <div
                v-if="loadingFormData && availableThreadTypes.length === 0"
                class="text-center q-py-lg"
              >
                <q-spinner-dots
                  color="primary"
                  size="40px"
                />
                <div class="text-caption text-grey q-mt-sm">
                  {{ loadingColorProgress || 'Đang tải dữ liệu...' }}
                </div>
              </div>

              <q-table
                v-if="availableThreadTypes.length > 0"
                :rows="availableThreadTypes"
                :columns="columns"
                :row-key="(row: any) => ttKey(row.color_id, row.thread_type_id, row.thread_color_id)"
                flat
                bordered
                virtual-scroll
                :virtual-scroll-item-size="72"
                :virtual-scroll-sticky-size-start="40"
                style="max-height: 60vh"
                :pagination="{ rowsPerPage: 0 }"
                :rows-per-page-options="[0]"
                hide-bottom
                :loading="loadingFormData"
              >
                <template #body-cell-color="props">
                  <q-td :props="props">
                    <span class="text-weight-medium">{{ props.row.color_name }}</span>
                  </q-td>
                </template>

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

                <template #body-cell-quota="props">
                  <q-td :props="props">
                    <template v-if="props.row.base_quota_cones !== null">
                      <div class="text-weight-medium">
                        {{ props.row.confirmed_issued_gross }}/{{ props.row.base_quota_cones }} cuộn
                      </div>
                      <div class="text-caption text-grey">
                        Còn {{ props.row.quota_cones }} cuộn
                      </div>
                    </template>
                    <span v-else>-</span>
                  </q-td>
                </template>

                <template #body-cell-stock="props">
                  <q-td :props="props">
                    <span class="text-positive">{{ props.row.stock_available_full }} ng</span>
                    +
                    <span class="text-warning">{{ props.row.stock_available_partial }} le</span>
                  </q-td>
                </template>

                <template #body-cell-issue_full="props">
                  <q-td :props="props">
                    <AppInput
                      :model-value="lineInputs[ttKey(props.row.color_id, props.row.thread_type_id, props.row.thread_color_id)]?.full || null"
                      type="number"
                      dense
                      :min="0"
                      :max="props.row.stock_available_full"
                      style="width: 90px"
                      :rules="[(v: any) => !v || Number(v) <= props.row.stock_available_full || `Tối đa ${props.row.stock_available_full}`]"
                      @update:model-value="(v) => handleInputChange(props.row.color_id, props.row.thread_type_id, 'full', Number(v) || 0, props.row.stock_available_full, props.row.thread_color_id)"
                    />
                  </q-td>
                </template>

                <template #body-cell-issue_partial="props">
                  <q-td :props="props">
                    <AppInput
                      :model-value="lineInputs[ttKey(props.row.color_id, props.row.thread_type_id, props.row.thread_color_id)]?.partial || null"
                      type="number"
                      dense
                      :min="0"
                      :max="props.row.stock_available_partial"
                      style="width: 90px"
                      :rules="[(v: any) => !v || Number(v) <= props.row.stock_available_partial || `Tối đa ${props.row.stock_available_partial}`]"
                      @update:model-value="(v) => handleInputChange(props.row.color_id, props.row.thread_type_id, 'partial', Number(v) || 0, props.row.stock_available_partial, props.row.thread_color_id)"
                    />
                  </q-td>
                </template>

                <template #body-cell-line_status="props">
                  <q-td :props="props">
                    <div
                      v-if="getUnderQuotaAmount(props.row) > 0 && (lineInputs[ttKey(props.row.color_id, props.row.thread_type_id, props.row.thread_color_id)]?.full || lineInputs[ttKey(props.row.color_id, props.row.thread_type_id, props.row.thread_color_id)]?.partial)"
                    >
                      <q-badge
                        color="info"
                        outline
                      >
                        Còn {{ getUnderQuotaAmount(props.row).toFixed(2) }} cuộn chưa xuất
                      </q-badge>
                    </div>
                    <div
                      v-if="lineInputs[ttKey(props.row.color_id, props.row.thread_type_id, props.row.thread_color_id)]?.validation?.is_over_quota"
                    >
                      <q-badge
                        color="warning"
                        class="q-mb-xs"
                      >
                        Vượt định mức!
                      </q-badge>
                      <div class="q-mt-xs q-gutter-xs">
                        <q-chip
                          v-for="reason in OVER_QUOTA_REASONS"
                          :key="reason"
                          :outline="lineInputs[ttKey(props.row.color_id, props.row.thread_type_id, props.row.thread_color_id)]?.notes !== reason"
                          :color="lineInputs[ttKey(props.row.color_id, props.row.thread_type_id, props.row.thread_color_id)]?.notes === reason ? 'warning' : undefined"
                          clickable
                          dense
                          @click="() => { const input = lineInputs[ttKey(props.row.color_id, props.row.thread_type_id, props.row.thread_color_id)]; if (input) { input.notes = input.notes === reason ? '' : reason } }"
                        >
                          {{ reason }}
                        </q-chip>
                      </div>
                    </div>
                  </q-td>
                </template>

                <template #body-cell-equivalent="props">
                  <q-td :props="props">
                    <span v-if="lineInputs[ttKey(props.row.color_id, props.row.thread_type_id, props.row.thread_color_id)]?.validation">
                      {{ lineInputs[ttKey(props.row.color_id, props.row.thread_type_id, props.row.thread_color_id)]?.validation?.issued_equivalent.toFixed(2) }}
                      <q-icon
                        v-if="!lineInputs[ttKey(props.row.color_id, props.row.thread_type_id, props.row.thread_color_id)]?.validation?.stock_sufficient && !lineInputs[ttKey(props.row.color_id, props.row.thread_type_id, props.row.thread_color_id)]?.validation?.can_borrow"
                        name="warning"
                        color="negative"
                      >
                        <q-tooltip>Không đủ tồn kho</q-tooltip>
                      </q-icon>
                      <q-icon
                        v-else-if="!lineInputs[ttKey(props.row.color_id, props.row.thread_type_id, props.row.thread_color_id)]?.validation?.stock_sufficient && lineInputs[ttKey(props.row.color_id, props.row.thread_type_id, props.row.thread_color_id)]?.validation?.can_borrow"
                        name="swap_horiz"
                        color="warning"
                      >
                        <q-tooltip>Thiếu tồn kho — sẽ mượn từ kho khác khi xác nhận</q-tooltip>
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
                      :disable="isAddButtonDisabled(props.row.color_id, props.row.thread_type_id, props.row.thread_color_id)"
                      @click="handleAddLine(props.row)"
                    >
                      <q-tooltip>{{ getAddButtonTooltip(props.row.color_id, props.row.thread_type_id, props.row.thread_color_id) }}</q-tooltip>
                    </AppButton>
                  </q-td>
                </template>
              </q-table>
              <div
                v-if="hasBatchLines"
                class="q-mt-md row justify-end"
              >
                <AppButton
                  label="Thêm tất cả"
                  color="primary"
                  icon="playlist_add"
                  :loading="isBatchAdding"
                  :disable="isBatchAdding || isConfirming || isValidating"
                  @click="handleBatchAddAll"
                />
              </div>
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
                :columns="addedLinesColumns"
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
                    <AppButton
                      v-if="!isConfirmed"
                      icon="delete"
                      size="sm"
                      variant="flat"
                      round
                      color="negative"
                      :disable="isConfirming || isBatchAdding"
                      @click="handleRemoveLine(props.row.id)"
                    >
                      <q-tooltip>Xóa dòng</q-tooltip>
                    </AppButton>
                  </q-td>
                </template>
              </q-table>
            </q-card-section>
            <q-inner-loading :showing="isConfirming">
              <q-spinner-gears
                size="50px"
                color="primary"
              />
              <div class="q-mt-sm text-grey">
                Đang xác nhận xuất chỉ...
              </div>
            </q-inner-loading>
          </q-card>

          <q-card
            v-if="(step2Visible || hasIssue) && lines.length === 0 && multiColorThreadTypes.length === 0 && !loadingFormData"
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

          <div
            v-if="hasIssue && !isConfirmed"
            class="row justify-end q-mt-lg"
          >
            <AppButton
              label="Xác Nhận Xuất"
              color="positive"
              icon="check"
              :loading="isConfirming"
              :disable="!canConfirm || isConfirming || isBatchAdding"
              @click="handleConfirm"
            />
          </div>
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

                <div class="col-12 col-sm-6 col-md-2">
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

            <template #body-cell-actions="props">
              <q-td :props="props">
                <div class="row no-wrap justify-center q-gutter-xs">
                  <AppButton
                    v-if="props.row.status === IssueV2Status.DRAFT"
                    variant="flat"
                    round
                    dense
                    size="sm"
                    icon="check_circle"
                    color="positive"
                    @click.stop="handleConfirmFromList(props.row)"
                  >
                    <q-tooltip>Xác nhận</q-tooltip>
                  </AppButton>
                  <AppButton
                    v-if="props.row.status === IssueV2Status.DRAFT"
                    variant="flat"
                    round
                    dense
                    size="sm"
                    icon="delete"
                    color="negative"
                    @click.stop="handleDeleteFromList(props.row)"
                  >
                    <q-tooltip>Xóa</q-tooltip>
                  </AppButton>
                  <AppButton
                    v-if="props.row.status === IssueV2Status.CONFIRMED"
                    variant="flat"
                    round
                    dense
                    size="sm"
                    icon="replay"
                    color="info"
                    @click.stop="handleReturnFromList()"
                  >
                    <q-tooltip>Nhập trả</q-tooltip>
                  </AppButton>
                </div>
              </q-td>
            </template>

            <template #empty-action>
              <AppButton
                color="primary"
                label="Tạo Phiếu Xuất"
                icon="add"
                @click="activeTab = 'create'"
              />
            </template>
          </DataTable>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </q-page>

  <FormDialog
    v-model="showAllocationModal"
    title="Phân Bổ Sản Phẩm"
    submit-text="Xác nhận"
    :loading="isAllocating"
    @submit="handleAllocate"
    @cancel="allocationAddQty = null"
  >
    <div class="text-caption text-grey q-mb-md">
      PO: {{ poOptions.find(p => p.value === selectedPoId)?.label }}
      · Style: {{ styleOptions.find(s => s.value === selectedStyleId)?.label }}
      · Màu: {{ colorOptions.find(c => c.value === selectedColorIds[0])?.label }}
    </div>

    <template v-if="allocationSummary">
      <div class="text-subtitle2 q-mb-sm">
        Tổng SP: {{ allocationSummary.total_product_quantity.toLocaleString() }}
        · Đã phân bổ: {{ allocationSummary.total_allocated.toLocaleString() }}
        · Còn lại: {{ allocationSummary.remaining.toLocaleString() }}
      </div>

      <q-table
        v-if="allocationSummary.allocated.length > 0"
        :rows="allocationSummary.allocated"
        :columns="[
          { name: 'department', label: 'Bộ Phận', field: 'department', align: 'left' as const },
          { name: 'product_quantity', label: 'Số SP', field: 'product_quantity', align: 'right' as const, format: (v: number) => v.toLocaleString() },
        ]"
        row-key="department"
        flat
        bordered
        dense
        :pagination="{ rowsPerPage: 0 }"
        hide-bottom
        class="q-mb-md"
      />

      <div class="row items-center q-col-gutter-sm q-mt-md">
        <div class="col-12 col-sm">
          <AppInput
            v-model.number="allocationAddQty"
            label="Nhập thêm SP"
            type="number"
            min="1"
            :rules="[
              (v: number | null) => (v !== null && v > 0) || 'Số lượng phải lớn hơn 0',
              (v: number | null) => (v !== null && v - (allocationSummary?.remaining ?? 0) < 1) || `Vượt quá SP còn lại (${allocationSummary?.remaining.toLocaleString()})`,
            ]"
            reactive-rules
            dense
            hide-bottom-space
          />
        </div>
        <div class="col-12 col-sm-auto">
          <q-btn
            flat
            dense
            color="secondary"
            :label="`Nhận hết ${allocationSummary.remaining.toLocaleString()} SP`"
            :disable="allocationSummary.remaining <= 0"
            @click="fillRemainingAllocation"
          />
        </div>
      </div>
    </template>

    <div
      v-else
      class="text-center"
    >
      <q-spinner
        v-if="isLoadingAlloc"
        color="primary"
        size="2em"
      />
      <div
        v-else
        class="text-grey"
      >
        Không có dữ liệu phân bổ
      </div>
    </div>
  </FormDialog>

  <q-dialog
    v-model="showBorrowDialog"
    persistent
  >
    <q-card style="min-width: 600px; max-width: 800px;">
      <q-card-section>
        <div class="text-h6 text-negative">
          Kho xuất không đủ tồn
        </div>
      </q-card-section>
      <q-card-section>
        <q-markup-table
          flat
          bordered
          dense
        >
          <thead>
            <tr>
              <th class="text-left">
                Loại chỉ
              </th>
              <th class="text-right">
                Cần
              </th>
              <th class="text-right">
                Có
              </th>
              <th class="text-right">
                Thiếu
              </th>
              <th class="text-left">
                Kho khác
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="shortage in shortageData"
              :key="shortage.thread_type_id"
            >
              <td>{{ shortage.thread_name }}</td>
              <td class="text-right">
                {{ shortage.needed_full }} / {{ shortage.needed_partial }}
              </td>
              <td class="text-right">
                {{ shortage.available_full }} / {{ shortage.available_partial }}
              </td>
              <td class="text-right text-negative">
                {{ shortage.shortage_full }} / {{ shortage.shortage_partial }}
              </td>
              <td>
                <span
                  v-for="(wh, idx) in shortage.other_warehouses"
                  :key="wh.warehouse_id"
                >
                  {{ wh.warehouse_name }}: {{ wh.full_cones + wh.partial_cones }}{{ idx < shortage.other_warehouses.length - 1 ? ', ' : '' }}
                </span>
                <span
                  v-if="shortage.other_warehouses.length === 0"
                  class="text-grey"
                >
                  Không có kho khác
                </span>
              </td>
            </tr>
          </tbody>
        </q-markup-table>
        <div class="text-caption text-grey q-mt-sm">
          Cuộn nguyên / Cuộn lẻ
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <AppButton
          label="Hủy"
          variant="flat"
          :disable="isConfirming"
          @click="showBorrowDialog = false; shortageData = null"
        />
        <AppButton
          label="Mượn & Xuất"
          color="primary"
          :loading="isConfirming"
          @click="handleConfirmWithTransfer"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
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
