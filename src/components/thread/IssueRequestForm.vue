<script setup lang="ts">
/**
 * IssueRequestForm - Form for creating issue requests
 * Xuất kho sản xuất - Issue to Production
 *
 * Cascading selectors: PO -> Style -> Color -> Thread Type
 * Includes quota checking and validation
 */
import { ref, computed, watch, onMounted } from 'vue'
import { purchaseOrderService } from '@/services/purchaseOrderService'
import { styleService } from '@/services/styleService'
import { threadService } from '@/services/threadService'
import { employeeService } from '@/services/employeeService'
import { issueService } from '@/services/issueService'
import { useSnackbar } from '@/composables/useSnackbar'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppTextarea from '@/components/ui/inputs/AppTextarea.vue'
import QuotaWarning from './QuotaWarning.vue'
import type { CreateIssueRequestDTO, QuotaCheck } from '@/types/thread/issue'
import type { PurchaseOrder, Style, ThreadType } from '@/types/thread'

const emit = defineEmits<{
  'submit': [data: CreateIssueRequestDTO]
  'cancel': []
}>()

const snackbar = useSnackbar()

// Form data - use null for IDs to show placeholder correctly
const form = ref<{
  po_id: number | null
  style_id: number | null
  color_id: number | null
  thread_type_id: number | null
  department: string
  requested_meters: number
  notes: string
}>({
  po_id: null,
  style_id: null,
  color_id: null,
  thread_type_id: null,
  department: '',
  requested_meters: 0,
  notes: '',
})

// Options for selects
const poOptions = ref<{ value: number; label: string }[]>([])
const styleOptions = ref<{ value: number; label: string }[]>([])
const colorOptions = ref<{ value: number; label: string }[]>([])
const threadTypeOptions = ref<{ value: number; label: string }[]>([])
const departmentOptions = ref<{ value: string; label: string }[]>([])

// Raw data for filtering
const allStyles = ref<Style[]>([])
const allThreadTypes = ref<ThreadType[]>([])

// Quota check
const quotaInfo = ref<QuotaCheck | null>(null)
const loading = ref(false)
const loadingOptions = ref(false)

// Load initial options on mount
onMounted(async () => {
  loadingOptions.value = true
  try {
    // Load POs - lấy tất cả PO đang pending hoặc in_production
    const pos = await purchaseOrderService.getAll()
    poOptions.value = pos
      .filter((po: PurchaseOrder) => po.status !== 'cancelled' && po.status !== 'completed')
      .map((po: PurchaseOrder) => ({
        value: po.id,
        label: `${po.po_number} - ${po.customer_name || 'N/A'}`
      }))

    // Load all styles
    allStyles.value = await styleService.getAll()

    // Load departments
    const depts = await employeeService.getDepartments()
    departmentOptions.value = depts.map(d => ({ value: d, label: d }))

    // Load thread types
    allThreadTypes.value = await threadService.getAll({ is_active: true })
    threadTypeOptions.value = allThreadTypes.value.map(t => ({
      value: t.id,
      label: t.name || `${t.code} - Tex ${t.tex_number || 'N/A'}`
    }))
  } catch (err) {
    snackbar.error('Không thể tải dữ liệu')
    console.error('Load options error:', err)
  } finally {
    loadingOptions.value = false
  }
})

// When PO changes, load styles for that PO from po_items
watch(() => form.value.po_id, async (poId) => {
  // Reset dependent fields
  form.value.style_id = null
  form.value.color_id = null
  colorOptions.value = []
  quotaInfo.value = null

  if (!poId) {
    styleOptions.value = []
    return
  }

  try {
    // Load PO with items to get styles for this PO
    const poWithItems = await purchaseOrderService.getWithItems(poId)
    if (poWithItems.items && poWithItems.items.length > 0) {
      styleOptions.value = poWithItems.items
        .filter(item => item.style)
        .map(item => ({
          value: item.style!.id,
          label: `${item.style!.style_code} - ${item.style!.style_name || ''}`
        }))
    } else {
      // Fallback: show all styles if PO has no items
      styleOptions.value = allStyles.value.map(s => ({
        value: s.id,
        label: `${s.style_code} - ${s.style_name || ''}`
      }))
    }
  } catch (err) {
    console.error('Load PO items error:', err)
    // Fallback to all styles
    styleOptions.value = allStyles.value.map(s => ({
      value: s.id,
      label: `${s.style_code} - ${s.style_name || ''}`
    }))
  }
})

// When style changes, load colors that have thread specs for this style
watch(() => form.value.style_id, async (styleId) => {
  // Reset dependent fields
  form.value.color_id = null
  quotaInfo.value = null

  if (!styleId) {
    colorOptions.value = []
    return
  }

  try {
    // Load colors that have thread specs configured for this style
    const colors = await styleService.getSpecColors(styleId)
    colorOptions.value = colors.map(c => ({
      value: c.id,
      label: c.name
    }))
  } catch (err) {
    console.error('Load colors error:', err)
    colorOptions.value = []
  }
})

// Check quota when all selections made
watch(
  () => [form.value.po_id, form.value.style_id, form.value.color_id, form.value.thread_type_id],
  async ([poId, styleId, colorId, threadTypeId]) => {
    quotaInfo.value = null
    if (poId && styleId && colorId && threadTypeId) {
      try {
        quotaInfo.value = await issueService.checkQuota(
          poId as number,
          styleId as number,
          colorId as number,
          threadTypeId as number
        )
      } catch (err) {
        console.error('Check quota error:', err)
        quotaInfo.value = null
      }
    }
  }
)

// Form validation
const isValid = computed(() => {
  return (
    form.value.po_id !== null && form.value.po_id > 0 &&
    form.value.style_id !== null && form.value.style_id > 0 &&
    form.value.color_id !== null && form.value.color_id > 0 &&
    form.value.thread_type_id !== null && form.value.thread_type_id > 0 &&
    form.value.department.trim() !== '' &&
    form.value.requested_meters > 0
  )
})

// Check if over quota
const isOverQuota = computed(() => {
  if (!quotaInfo.value) return false
  return form.value.requested_meters > quotaInfo.value.remaining_meters
})

// Submit handler
async function handleSubmit() {
  if (!isValid.value) return

  // Warn if over quota
  if (isOverQuota.value && !form.value.notes?.trim()) {
    snackbar.warning('Vui long ghi chu ly do xuat vuot dinh muc')
    return
  }

  loading.value = true
  try {
    // Convert null to number for API (already validated as non-null)
    const payload: CreateIssueRequestDTO = {
      po_id: form.value.po_id!,
      style_id: form.value.style_id!,
      color_id: form.value.color_id!,
      thread_type_id: form.value.thread_type_id!,
      department: form.value.department,
      requested_meters: form.value.requested_meters,
      notes: form.value.notes,
    }
    emit('submit', payload)
  } finally {
    loading.value = false
  }
}

// Cancel handler
function handleCancel() {
  emit('cancel')
}

// Reset form
function resetForm() {
  form.value = {
    po_id: null,
    style_id: null,
    color_id: null,
    thread_type_id: null,
    department: '',
    requested_meters: 0,
    notes: '',
  }
  quotaInfo.value = null
}

// Expose reset method
defineExpose({ resetForm })
</script>

<template>
  <q-card
    flat
    bordered
    class="issue-request-form"
  >
    <q-card-section>
      <div class="text-h6">
        Tạo Phiếu Xuất Kho
      </div>
    </q-card-section>

    <q-card-section>
      <div class="column q-gutter-md">
        <!-- PO Selector -->
        <AppSelect
          v-model="form.po_id"
          label="Đơn Hàng (PO)"
          :options="poOptions"
          :loading="loadingOptions"
          required
          emit-value
          map-options
          use-input
          fill-input
          hide-selected
          option-value="value"
          option-label="label"
          placeholder="Chọn đơn hàng..."
        />

        <!-- Style Selector -->
        <AppSelect
          v-model="form.style_id"
          label="Mã Hàng"
          :options="styleOptions"
          :disable="!form.po_id"
          required
          emit-value
          map-options
          use-input
          fill-input
          hide-selected
          option-value="value"
          option-label="label"
          placeholder="Chọn mã hàng..."
        />

        <!-- Color Selector -->
        <AppSelect
          v-model="form.color_id"
          label="Màu"
          :options="colorOptions"
          :disable="!form.style_id"
          required
          emit-value
          map-options
          use-input
          fill-input
          hide-selected
          option-value="value"
          option-label="label"
          placeholder="Chọn màu..."
        />

        <!-- Thread Type Selector -->
        <AppSelect
          v-model="form.thread_type_id"
          label="Loại Chỉ"
          :options="threadTypeOptions"
          :loading="loadingOptions"
          required
          use-input
          fill-input
          hide-selected
          emit-value
          map-options
          option-value="value"
          option-label="label"
          placeholder="Chọn loại chỉ..."
        />

        <!-- Department Selector -->
        <AppSelect
          v-model="form.department"
          label="Bộ Phận"
          :options="departmentOptions"
          :loading="loadingOptions"
          required
          emit-value
          map-options
          use-input
          fill-input
          hide-selected
          option-value="value"
          option-label="label"
          placeholder="Chọn bộ phận..."
        />

        <!-- Quota Warning -->
        <QuotaWarning
          :quota="quotaInfo"
          :requested-meters="form.requested_meters"
        />

        <!-- Requested Meters -->
        <AppInput
          v-model.number="form.requested_meters"
          type="number"
          label="Số Mét Yêu Cầu"
          required
          :min="0"
          :error="isOverQuota && !form.notes?.trim()"
          :error-message="isOverQuota ? 'Vượt định mức - cần ghi chú lý do' : undefined"
        />

        <!-- Notes -->
        <AppTextarea
          v-model="form.notes"
          label="Ghi Chú"
          :placeholder="isOverQuota ? 'Bắt buộc khi vượt định mức...' : 'Nhập ghi chú (tùy chọn)...'"
          :required="isOverQuota"
          rows="2"
        />
      </div>
    </q-card-section>

    <q-card-actions align="right">
      <AppButton
        label="Hủy"
        variant="flat"
        color="grey"
        @click="handleCancel"
      />
      <AppButton
        label="Tạo Phiếu Xuất"
        color="primary"
        :loading="loading"
        :disable="!isValid"
        @click="handleSubmit"
      />
    </q-card-actions>
  </q-card>
</template>

<style scoped>
.issue-request-form {
  max-width: 600px;
}
</style>
