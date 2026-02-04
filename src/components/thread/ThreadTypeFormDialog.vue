<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ThreadType, ThreadTypeFormData, Color, Supplier } from '@/types/thread'
import { ThreadMaterial } from '@/types/thread/enums'
import FormDialog from '@/components/ui/dialogs/FormDialog.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import AppToggle from '@/components/ui/inputs/AppToggle.vue'
import ColorSelector from '@/components/ui/inputs/ColorSelector.vue'
import SupplierSelector from '@/components/ui/inputs/SupplierSelector.vue'

interface Props {
  modelValue: boolean
  mode: 'create' | 'edit'
  threadType?: ThreadType | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  threadType: null,
  loading: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'submit': [data: ThreadTypeFormData]
  'cancel': []
}>()

const materialOptions = [
  { label: 'Polyester', value: ThreadMaterial.POLYESTER },
  { label: 'Cotton', value: ThreadMaterial.COTTON },
  { label: 'Nylon', value: ThreadMaterial.NYLON },
  { label: 'Lụa', value: ThreadMaterial.SILK },
  { label: 'Rayon', value: ThreadMaterial.RAYON },
  { label: 'Hỗn hợp', value: ThreadMaterial.MIXED },
]

const defaultForm: ThreadTypeFormData = {
  code: '',
  name: '',
  color: '',
  color_code: '',
  color_id: null,
  supplier: '',
  supplier_id: null,
  material: ThreadMaterial.POLYESTER,
  tex_number: undefined,
  density_grams_per_meter: 0.1,
  meters_per_cone: undefined,
  reorder_level_meters: 1000,
  lead_time_days: 7,
  is_active: true
}

const form = ref<ThreadTypeFormData>({ ...defaultForm })

// Store color/supplier data for dual-write
const selectedColorData = ref<Color | null>(null)
const selectedSupplierData = ref<Supplier | null>(null)

const title = computed(() => props.mode === 'create' ? 'Thêm loại chỉ mới' : 'Chỉnh sửa loại chỉ')

const resetForm = () => {
  if (props.mode === 'edit' && props.threadType) {
    form.value = {
      code: props.threadType.code,
      name: props.threadType.name,
      color: props.threadType.color || '',
      color_code: props.threadType.color_code || '',
      color_id: props.threadType.color_id,
      supplier: props.threadType.supplier || '',
      supplier_id: props.threadType.supplier_id,
      material: props.threadType.material,
      tex_number: props.threadType.tex_number ?? undefined,
      density_grams_per_meter: props.threadType.density_grams_per_meter,
      meters_per_cone: props.threadType.meters_per_cone ?? undefined,
      reorder_level_meters: props.threadType.reorder_level_meters,
      lead_time_days: props.threadType.lead_time_days,
      is_active: props.threadType.is_active
    }
    // Reset color/supplier data from joined data
    selectedColorData.value = props.threadType.color_data ? {
      id: props.threadType.color_data.id,
      name: props.threadType.color_data.name,
      hex_code: props.threadType.color_data.hex_code,
      pantone_code: props.threadType.color_data.pantone_code,
      ral_code: null,
      is_active: true,
      created_at: '',
      updated_at: ''
    } : null
    selectedSupplierData.value = props.threadType.supplier_data ? {
      id: props.threadType.supplier_data.id,
      code: props.threadType.supplier_data.code,
      name: props.threadType.supplier_data.name,
      contact_name: null,
      phone: null,
      email: null,
      address: null,
      lead_time_days: 0,
      is_active: true,
      created_at: '',
      updated_at: ''
    } : null
  } else {
    form.value = { ...defaultForm }
    selectedColorData.value = null
    selectedSupplierData.value = null
  }
}

// Watchers
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    resetForm()
  }
})

watch(() => props.mode, () => {
  resetForm()
})

watch(() => props.threadType, () => {
  if (props.mode === 'edit') {
    resetForm()
  }
}, { deep: true })

/**
 * Handle color selection - update both ID and legacy text fields
 */
const handleColorChange = (colorData: Color | null) => {
  selectedColorData.value = colorData
  if (colorData) {
    form.value.color = colorData.name
    form.value.color_code = colorData.hex_code
  } else {
    form.value.color = ''
    form.value.color_code = ''
  }
}

/**
 * Handle supplier selection - update both ID and legacy text fields
 */
const handleSupplierChange = (supplierData: Supplier | null) => {
  selectedSupplierData.value = supplierData
  if (supplierData) {
    form.value.supplier = supplierData.name
    // Update lead_time_days from supplier if available
    if (supplierData.lead_time_days) {
      form.value.lead_time_days = supplierData.lead_time_days
    }
  } else {
    form.value.supplier = ''
  }
}

const onSubmit = () => {
  // Deep copy form to avoid reactive issues
  const submitData = { ...form.value }
  
  // Ensure color_id and supplier_id are included
  // Backend will auto-populate legacy text fields via dual-write
  
  // Clean up undefined optional values
  if (submitData.tex_number === undefined) delete submitData.tex_number
  if (submitData.meters_per_cone === undefined) delete submitData.meters_per_cone
  
  emit('submit', submitData)
}

const onCancel = () => {
  emit('cancel')
}
</script>

<template>
  <FormDialog
    :model-value="modelValue"
    :title="title"
    :loading="loading"
    max-width="700px"
    @update:model-value="val => emit('update:modelValue', val)"
    @submit="onSubmit"
    @cancel="onCancel"
  >
    <div class="row q-col-gutter-md">
      <!-- Row 1: Code & Name -->
      <div class="col-12 col-sm-6">
        <AppInput
          v-model="form.code"
          label="Mã loại chỉ"
          required
          :disable="mode === 'edit'"
          hint="Dùng để định danh duy nhất (không thể sửa sau khi tạo)"
        />
      </div>
      <div class="col-12 col-sm-6">
        <AppInput
          v-model="form.name"
          label="Tên loại chỉ"
          required
        />
      </div>

      <!-- Row 2: Color Selector & Color Code Preview -->
      <div class="col-12 col-sm-6">
        <ColorSelector
          v-model="form.color_id"
          label="Màu chỉ"
          clearable
          @update:color-data="handleColorChange"
        />
      </div>
      <div class="col-12 col-sm-6">
        <AppInput
          v-model="form.color_code"
          label="Mã màu"
          readonly
          hint="Tự động điền từ màu đã chọn"
        >
          <template #append>
            <div
              v-if="form.color_code"
              class="color-preview shadow-1"
              :style="{ backgroundColor: form.color_code.startsWith('#') ? form.color_code : undefined }"
            >
              <q-tooltip v-if="!form.color_code.startsWith('#')">
                Chỉ hiển thị xem trước cho mã HEX (bắt đầu bằng #)
              </q-tooltip>
            </div>
          </template>
        </AppInput>
      </div>

      <!-- Row 3: Material & Tex Number -->
      <div class="col-12 col-sm-6">
        <AppSelect
          v-model="form.material"
          :options="materialOptions"
          label="Chất liệu"
          required
          popup-content-class="z-max"
          emit-value
          map-options
        />
      </div>
      <div class="col-12 col-sm-6">
        <AppInput
          v-model.number="form.tex_number"
          type="number"
          label="Số Tex"
        />
      </div>

      <!-- Row 4: Density & Meters per Cone -->
      <div class="col-12 col-sm-6">
        <AppInput
          v-model.number="form.density_grams_per_meter"
          type="number"
          label="Mật độ (g/m)"
          required
          :step="0.001"
          :min="0.001"
        />
      </div>
      <div class="col-12 col-sm-6">
        <AppInput
          v-model.number="form.meters_per_cone"
          type="number"
          label="Mét/cuộn"
          :min="1"
        />
      </div>

      <!-- Row 5: Supplier Selector -->
      <div class="col-12">
        <SupplierSelector
          v-model="form.supplier_id"
          label="Nhà cung cấp"
          clearable
          @update:supplier-data="handleSupplierChange"
        />
      </div>

      <!-- Row 6: Reorder Level & Lead Time -->
      <div class="col-12 col-sm-6">
        <AppInput
          v-model.number="form.reorder_level_meters"
          type="number"
          label="Mức tái đặt hàng (m)"
          :min="0"
        />
      </div>
      <div class="col-12 col-sm-6">
        <AppInput
          v-model.number="form.lead_time_days"
          type="number"
          label="Thời gian giao hàng (ngày)"
          hint="Tự động cập nhật từ nhà cung cấp"
          :min="1"
        />
      </div>

      <!-- Row 7: Is Active -->
      <div class="col-12">
        <AppToggle
          v-model="form.is_active"
          label="Hoạt động"
        />
      </div>
    </div>
  </FormDialog>
</template>

<style scoped>
.color-preview {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.12);
}
</style>
