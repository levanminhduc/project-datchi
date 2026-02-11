<script setup lang="ts">
/**
 * Issue V2 Page
 * Phieu Xuat Chi V2 - Simplified thread issuance
 *
 * UI only displays data from API and collects input.
 * All calculations are handled by backend.
 */
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import { useIssueV2 } from '@/composables/thread/useIssueV2'
import { issueV2Service } from '@/services/issueV2Service'
import { employeeService } from '@/services/employeeService'
import { useSnackbar } from '@/composables/useSnackbar'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import type { QTableColumn } from 'quasar'
import type {
  ThreadTypeForIssue,
  ValidateLineResponse,
  OrderOptionPO,
  OrderOptionStyle,
  OrderOptionColor,
} from '@/types/thread/issueV2'

const router = useRouter()
const snackbar = useSnackbar()

const {
  currentIssue,
  isLoading,
  hasIssue,
  lines,
  threadTypes,
  isConfirmed,
  createIssue,
  loadFormData,
  validateLine,
  addLine,
  removeLine,
  confirmIssue,
  clearIssue,
} = useIssueV2()

// ============================================================================
// Form State
// ============================================================================

// Header form
const department = ref('')
const createdBy = ref('')

// PO/Style/Color selectors
const selectedPoId = ref<number | null>(null)
const selectedStyleId = ref<number | null>(null)
const selectedColorId = ref<number | null>(null)

// Options for selects
const poOptions = ref<{ value: number; label: string }[]>([])
const styleOptions = ref<{ value: number; label: string }[]>([])
const colorOptions = ref<{ value: number; label: string }[]>([])
const departmentOptions = ref<{ value: string; label: string }[]>([])

// Loading states
const loadingOptions = ref(false)
const loadingFormData = ref(false)

// Line input state (for quantity entry per thread type)
const lineInputs = ref<Record<number, { full: number; partial: number; notes: string; validation: ValidateLineResponse | null }>>({})

// ============================================================================
// Computed
// ============================================================================

const canCreateIssue = computed(() => {
  return department.value.trim() && createdBy.value.trim() && !hasIssue.value
})

const canLoadThreadTypes = computed(() => {
  return hasIssue.value && selectedPoId.value && selectedStyleId.value && selectedColorId.value
})

const canConfirm = computed(() => {
  if (!hasIssue.value || isConfirmed.value) return false

  // Check if any lines have been added
  const hasLines = lines.value.length > 0

  // Check if all over-quota lines have notes
  const allOverQuotaHaveNotes = lines.value
    .filter((line) => line.is_over_quota)
    .every((line) => line.over_quota_notes?.trim())

  return hasLines && allOverQuotaHaveNotes
})

// Filter out thread types that have already been added to the issue
const availableThreadTypes = computed(() => {
  const addedThreadTypeIds = new Set(lines.value.map((line) => line.thread_type_id))
  return threadTypes.value.filter((tt) => !addedThreadTypeIds.has(tt.thread_type_id))
})

// Table columns
const columns: QTableColumn[] = [
  { name: 'thread', label: 'Loại Chỉ', field: 'thread_name', align: 'left' },
  { name: 'quota', label: 'Định Mức', field: 'quota_cones', align: 'center', format: (v) => v !== null ? `${v} cuộn` : '-' },
  { name: 'stock', label: 'Tồn Kho', field: 'stock', align: 'center' },
  { name: 'issue', label: 'Xuất', field: 'issue', align: 'center' },
  { name: 'equivalent', label: 'Quy Đổi', field: 'issued_equivalent', align: 'center' },
  { name: 'actions', label: '', field: 'actions', align: 'center' },
]

// ============================================================================
// Watchers
// ============================================================================

// When PO changes, load styles from confirmed weekly orders
watch(selectedPoId, async (newPoId) => {
  // Clear dependent selections
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
    snackbar.error('Khong the tai danh sach ma hang')
  }
})

// When Style changes, load colors from confirmed weekly orders
watch(selectedStyleId, async (newStyleId) => {
  // Clear color selection
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
    snackbar.error('Khong the tai danh sach mau')
  }
})

// When all selectors are filled, load form data
watch([selectedPoId, selectedStyleId, selectedColorId], async ([poId, styleId, colorId]) => {
  if (poId && styleId && colorId && hasIssue.value) {
    await handleLoadFormData()
  }
})

// ============================================================================
// Handlers
// ============================================================================

async function loadInitialOptions() {
  loadingOptions.value = true
  try {
    // Load POs from confirmed weekly orders only
    const pos = await issueV2Service.getOrderOptions()
    poOptions.value = (pos as OrderOptionPO[]).map((po) => ({
      value: po.id,
      label: po.po_number,
    }))

    // Load departments
    const depts = await employeeService.getDepartments()
    departmentOptions.value = depts.map((d) => ({ value: d, label: d }))
  } catch (err) {
    console.error('Failed to load options:', err)
    snackbar.error('Khong the tai du lieu')
  } finally {
    loadingOptions.value = false
  }
}

async function handleCreateIssue() {
  if (!canCreateIssue.value) return

  const result = await createIssue({
    department: department.value.trim(),
    created_by: createdBy.value.trim(),
  })

  if (result) {
    // Issue created, now user can select PO/Style/Color
  }
}

async function handleLoadFormData() {
  if (!canLoadThreadTypes.value) return

  loadingFormData.value = true
  try {
    const data = await loadFormData(selectedPoId.value!, selectedStyleId.value!, selectedColorId.value!)

    // Initialize line inputs for each thread type using returned data directly
    // (fixes race condition where threadTypes.value may not be updated yet)
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

// Debounced validation
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

// Handle input change with max limit enforcement
function handleInputChange(threadTypeId: number, field: 'full' | 'partial', value: number, max: number) {
  const input = lineInputs.value[threadTypeId]
  if (!input) return

  // Clamp value to max (stock available)
  const clampedValue = Math.min(Math.max(0, value), max)
  input[field] = clampedValue

  handleQuantityChange(threadTypeId)
}

// Calculate under-quota amount for added lines
function getLineUnderQuotaAmount(line: { quota_cones: number | null; issued_equivalent: number }): number {
  if (!line.quota_cones) return 0
  const remaining = line.quota_cones - line.issued_equivalent
  return remaining > 0 ? remaining : 0
}

// Calculate under-quota amount (how many cones still need to be issued)
function getUnderQuotaAmount(threadType: ThreadTypeForIssue): number {
  const input = lineInputs.value[threadType.thread_type_id]
  if (!input || !threadType.quota_cones) return 0

  const validation = input.validation
  if (!validation) {
    // No validation yet, show full quota as remaining
    if (input.full === 0 && input.partial === 0) {
      return threadType.quota_cones
    }
    return 0
  }

  // If over quota, don't show under-quota message
  if (validation.is_over_quota) return 0

  // Calculate remaining: quota - issued_equivalent
  const remaining = threadType.quota_cones - validation.issued_equivalent
  return remaining > 0 ? remaining : 0
}

// Check if add button should be disabled for a thread type
function isAddButtonDisabled(threadTypeId: number): boolean {
  const input = lineInputs.value[threadTypeId]
  if (!input) return true

  // No quantity entered
  if (input.full === 0 && input.partial === 0) return true

  // Check stock_sufficient from validation
  if (input.validation && !input.validation.stock_sufficient) return true

  return false
}

// Get tooltip for add button
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

  // Check stock_sufficient from validation
  if (input.validation && !input.validation.stock_sufficient) {
    snackbar.error('Không đủ tồn kho để xuất')
    return
  }

  // Check if over quota without notes
  if (input.validation?.is_over_quota && !input.notes.trim()) {
    snackbar.warning('Vượt định mức, yêu cầu ghi chú lý do')
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
    // Reset input for this thread type
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
    // Optionally navigate to list or stay on page
  }
}

function handleBack() {
  clearIssue()
  router.push('/thread/issues')
}

function handleNewIssue() {
  clearIssue()
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

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
  loadInitialOptions()
})
</script>

<template>
  <q-page padding>
    <!-- Header -->
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

    <!-- Issue Code Badge (if issue exists) -->
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

    <!-- Step 1: Create Issue (Department/Created By) -->
    <q-card
      v-if="!hasIssue"
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
          label="Tạo Phiếu Xuất"
          color="primary"
          :loading="isLoading"
          :disable="!canCreateIssue"
          @click="handleCreateIssue"
        />
      </q-card-actions>
    </q-card>

    <!-- Step 2: Select PO/Style/Color -->
    <q-card
      v-if="hasIssue && !isConfirmed"
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

    <!-- Step 3: Thread Type Entry Table -->
    <q-card
      v-if="hasIssue && availableThreadTypes.length > 0 && !isConfirmed"
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
          <!-- Thread Name -->
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

          <!-- Stock -->
          <template #body-cell-stock="props">
            <q-td :props="props">
              <span class="text-positive">{{ props.row.stock_available_full }} ng</span>
              +
              <span class="text-warning">{{ props.row.stock_available_partial }} le</span>
            </q-td>
          </template>

          <!-- Issue Inputs -->
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
              <!-- Under quota warning -->
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
              <!-- Over quota warning and notes -->
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

          <!-- Equivalent -->
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

          <!-- Actions -->
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

    <!-- Added Lines (Current Issue Lines) -->
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
          <!-- Thread -->
          <template #body-cell-thread="props">
            <q-td :props="props">
              <div class="text-weight-medium">
                {{ props.row.thread_code || props.row.thread_name }}
              </div>
            </q-td>
          </template>

          <!-- Issued -->
          <template #body-cell-issued="props">
            <q-td :props="props">
              {{ props.row.issued_full }} ng + {{ props.row.issued_partial }} le
            </q-td>
          </template>

          <!-- Status -->
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

          <!-- Actions -->
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

    <!-- Empty State -->
    <q-card
      v-if="hasIssue && lines.length === 0 && threadTypes.length === 0"
      flat
      bordered
    >
      <q-card-section class="text-center text-grey q-py-xl">
        <q-icon
          name="inventory_2"
          size="48px"
          class="q-mb-md"
        />
        <div>Chon Don Hang, Ma Hang, Mau de bat dau nhap xuat</div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<style scoped>
.bg-warning-1 {
  background-color: rgba(255, 193, 7, 0.1);
}
</style>
