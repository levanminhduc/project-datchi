<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ReceiveStockDTO } from '@/types/thread/inventory'
import { useWarehouses, useThreadTypes } from '@/composables'
import FormDialog from '@/components/ui/dialogs/FormDialog.vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import DatePicker from '@/components/ui/pickers/DatePicker.vue'

interface Props {
  modelValue: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'submit': [data: ReceiveStockDTO]
  'cancel': []
}>()

// Composables for fetching dropdown data
const { warehouseOptions, fetchWarehouses } = useWarehouses()
const { activeThreadTypes, fetchThreadTypes } = useThreadTypes()

const initialForm: ReceiveStockDTO = {
  thread_type_id: null as any,
  warehouse_id: 1, // Default to first warehouse
  quantity_cones: 1,
  weight_per_cone_grams: undefined,
  lot_number: '',
  expiry_date: '',
  location: ''
}

const form = ref<ReceiveStockDTO>({ ...initialForm })

const resetForm = () => {
  form.value = { ...initialForm }
}

watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    resetForm()
    // Fetch both warehouses and thread types when dialog opens
    await Promise.all([
      fetchWarehouses(),
      fetchThreadTypes()
    ])
  }
})

const onSubmit = () => {
  emit('submit', { ...form.value })
}

const onCancel = () => {
  emit('cancel')
}
</script>

<template>
  <FormDialog
    :model-value="modelValue"
    title="Nhập kho chỉ"
    submit-text="Nhập kho"
    :loading="loading"
    max-width="700px"
    @update:model-value="val => emit('update:modelValue', val)"
    @submit="onSubmit"
    @cancel="onCancel"
  >
    <div class="row q-col-gutter-md">
      <!-- Row 1: thread_type_id (100%) -->
      <div class="col-12">
        <AppSelect
          v-model="form.thread_type_id"
          label="Loại chỉ"
          :options="activeThreadTypes"
          option-value="id"
          option-label="name"
          required
          emit-value
          map-options
          popup-content-class="z-max"
        >
          <template #option="{ opt, itemProps }">
            <q-item v-bind="itemProps">
              <q-item-section avatar>
                <div 
                  class="color-dot" 
                  :style="{ 
                    backgroundColor: opt.color_code || '#ccc',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: '1px solid rgba(0,0,0,0.1)'
                  }"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ opt.code }} - {{ opt.name }}</q-item-label>
                <q-item-label caption>{{ opt.material }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </AppSelect>
      </div>

      <!-- Row 2: warehouse_id (50%), location (50%) -->
      <div class="col-12 col-sm-6">
        <AppSelect
          v-model="form.warehouse_id"
          label="Kho"
          :options="warehouseOptions"
          required
          emit-value
          map-options
          popup-content-class="z-max"
        />
      </div>
      <div class="col-12 col-sm-6">
        <AppInput
          v-model="form.location"
          label="Vị trí kho"
          placeholder="VD: Kệ A1-01"
        />
      </div>

      <!-- Row 3: quantity_cones (50%), weight_per_cone_grams (50%) -->
      <div class="col-12 col-sm-6">
        <AppInput
          v-model.number="form.quantity_cones"
          type="number"
          label="Số lượng cuộn"
          required
          :rules="[
            val => !!val || 'Vui lòng nhập số lượng',
            val => val >= 1 || 'Số lượng tối thiểu là 1',
            val => val <= 1000 || 'Số lượng tối đa là 1000'
          ]"
        />
      </div>
      <div class="col-12 col-sm-6">
        <AppInput
          v-model.number="form.weight_per_cone_grams"
          type="number"
          label="Trọng lượng/cuộn (g)"
          suffix="g"
          placeholder="Tùy chọn"
        />
      </div>

      <!-- Row 4: lot_number (50%), expiry_date (50%) -->
      <div class="col-12 col-sm-6">
        <AppInput
          v-model="form.lot_number"
          label="Số lô"
          placeholder="VD: LOT123456"
        />
      </div>
      <div class="col-12 col-sm-6">
        <AppInput
          v-model="form.expiry_date"
          label="Ngày hết hạn"
          placeholder="DD/MM/YYYY"
          clearable
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
                <DatePicker v-model="form.expiry_date" />
              </q-popup-proxy>
            </q-icon>
          </template>
        </AppInput>
      </div>
    </div>
  </FormDialog>
</template>

<style scoped>
.color-dot {
  display: inline-block;
  vertical-align: middle;
}
</style>
