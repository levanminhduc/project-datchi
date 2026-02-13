<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import FormDialog from '@/components/ui/dialogs/FormDialog.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import AppWarehouseSelect from '@/components/ui/inputs/AppWarehouseSelect.vue'
import AppTextarea from '@/components/ui/inputs/AppTextarea.vue'
import SupplierSelector from '@/components/ui/inputs/SupplierSelector.vue'
import DatePicker from '@/components/ui/pickers/DatePicker.vue'
import { useThreadTypes } from '@/composables'
import { useLots } from '@/composables/useLots'
import type { Lot, CreateLotRequest, UpdateLotRequest } from '@/types/thread/lot'
import type { Supplier } from '@/types/thread/supplier'

interface Props {
  modelValue: boolean
  lot?: Lot | null
}

const props = withDefaults(defineProps<Props>(), {
  lot: null
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': []
}>()

const { threadTypes, fetchThreadTypes } = useThreadTypes()
const { createLot, updateLot, loading } = useLots()

const isEdit = computed(() => !!props.lot)
const title = computed(() => isEdit.value ? 'Chỉnh sửa lô' : 'Tạo lô mới')

// Form data - includes both supplier text and supplier_id for dual-write
const form = ref<{
  lot_number: string
  thread_type_id: number | null
  warehouse_id: number | null
  production_date: string | null
  expiry_date: string | null
  supplier: string
  supplier_id: number | null
  notes: string
}>({
  lot_number: '',
  thread_type_id: null,
  warehouse_id: null,
  production_date: null,
  expiry_date: null,
  supplier: '',
  supplier_id: null,
  notes: ''
})

// Thread type options for select
const threadTypeOptions = computed(() =>
  threadTypes.value.map(t => ({
    label: `${t.name} (${t.code})`,
    value: t.id
  }))
)

/**
 * Handle supplier selection - update both ID and legacy text field
 */
function handleSupplierChange(supplierData: Supplier | null) {
  if (supplierData) {
    form.value.supplier = supplierData.name
  } else {
    form.value.supplier = ''
  }
}

// Reset form when dialog opens
function resetForm() {
  if (props.lot) {
    form.value = {
      lot_number: props.lot.lot_number,
      thread_type_id: props.lot.thread_type_id,
      warehouse_id: props.lot.warehouse_id,
      production_date: props.lot.production_date,
      expiry_date: props.lot.expiry_date,
      supplier: props.lot.supplier || '',
      supplier_id: props.lot.supplier_id,
      notes: props.lot.notes || ''
    }
  } else {
    form.value = {
      lot_number: '',
      thread_type_id: null,
      warehouse_id: null,
      production_date: null,
      expiry_date: null,
      supplier: '',
      supplier_id: null,
      notes: ''
    }
  }
}

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    resetForm()
    if (threadTypes.value.length === 0) {
      fetchThreadTypes()
    }
  }
})

watch(() => props.lot, () => {
  if (props.modelValue) {
    resetForm()
  }
}, { deep: true })

async function onSubmit() {
  if (isEdit.value && props.lot) {
    // Update existing lot - include supplier_id for dual-write
    const updateData: UpdateLotRequest = {
      production_date: form.value.production_date,
      expiry_date: form.value.expiry_date,
      supplier: form.value.supplier || null,
      supplier_id: form.value.supplier_id,
      notes: form.value.notes || null
    }
    const result = await updateLot(props.lot.id, updateData)
    if (result) {
      emit('saved')
      emit('update:modelValue', false)
    }
  } else {
    // Create new lot
    if (!form.value.lot_number || !form.value.thread_type_id || !form.value.warehouse_id) {
      return
    }
    const createData: CreateLotRequest = {
      lot_number: form.value.lot_number,
      thread_type_id: form.value.thread_type_id,
      warehouse_id: form.value.warehouse_id,
      production_date: form.value.production_date || undefined,
      expiry_date: form.value.expiry_date || undefined,
      supplier: form.value.supplier || undefined,
      supplier_id: form.value.supplier_id || undefined,
      notes: form.value.notes || undefined
    }
    const result = await createLot(createData)
    if (result) {
      emit('saved')
      emit('update:modelValue', false)
    }
  }
}

function onCancel() {
  emit('update:modelValue', false)
}
</script>

<template>
  <FormDialog
    :model-value="modelValue"
    :title="title"
    :loading="loading"
    max-width="600px"
    @update:model-value="val => emit('update:modelValue', val)"
    @submit="onSubmit"
    @cancel="onCancel"
  >
    <div class="row q-col-gutter-md">
      <!-- Lot Number -->
      <div class="col-12 col-sm-6">
        <AppInput
          v-model="form.lot_number"
          label="Mã lô"
          required
          :disable="isEdit"
          hint="Mã định danh duy nhất cho lô"
        />
      </div>

      <!-- Thread Type -->
      <div class="col-12 col-sm-6">
        <AppSelect
          v-model="form.thread_type_id"
          :options="threadTypeOptions"
          label="Loại chỉ"
          required
          :disable="isEdit"
          use-input
          fill-input
          hide-selected
          popup-content-class="z-max"
          emit-value
          map-options
        />
      </div>

      <!-- Warehouse -->
      <div class="col-12 col-sm-6">
        <AppWarehouseSelect
          v-model="form.warehouse_id"
          label="Kho"
          required
          :disable="isEdit"
        />
      </div>

      <!-- Supplier - Using SupplierSelector -->
      <div class="col-12 col-sm-6">
        <SupplierSelector
          v-model="form.supplier_id"
          label="Nhà cung cấp"
          clearable
          @update:supplier-data="handleSupplierChange"
        />
      </div>

      <!-- Production Date -->
      <div class="col-12 col-sm-6">
        <DatePicker
          v-model="form.production_date"
          label="Ngày sản xuất"
        />
      </div>

      <!-- Expiry Date -->
      <div class="col-12 col-sm-6">
        <DatePicker
          v-model="form.expiry_date"
          label="Ngày hết hạn"
        />
      </div>

      <!-- Notes -->
      <div class="col-12">
        <AppTextarea
          v-model="form.notes"
          label="Ghi chú"
          rows="2"
        />
      </div>
    </div>
  </FormDialog>
</template>
