<script setup lang="ts">
import { ref } from 'vue'
import FormDialog from '@/components/ui/dialogs/FormDialog.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import AppTextarea from '@/components/ui/inputs/AppTextarea.vue'

interface Props {
  modelValue: boolean
  productionOrderId?: string
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  productionOrderId: '',
  loading: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'submit': [data: { coneId: string, reason: string, notes: string }]
}>()

const coneId = ref('')
const reason = ref('job_complete')
const notes = ref('')

const reasonOptions = [
  { label: 'Hoàn thành lệnh sản xuất', value: 'job_complete' },
  { label: 'Hủy lệnh sản xuất', value: 'job_cancelled' },
  { label: 'Sản phẩm lỗi/hỏng', value: 'defective' },
  { label: 'Lý do khác', value: 'other' }
]

const resetForm = () => {
  coneId.value = ''
  reason.value = 'job_complete'
  notes.value = ''
}

const onSubmit = () => {
  emit('submit', {
    coneId: coneId.value,
    reason: reason.value,
    notes: notes.value
  })
}

const onCancel = () => {
  emit('update:modelValue', false)
  resetForm()
}
</script>

<template>
  <FormDialog
    :model-value="modelValue"
    title="Yêu cầu hoàn trả cuộn chỉ"
    :loading="loading"
    max-width="500px"
    @update:model-value="val => emit('update:modelValue', val)"
    @submit="onSubmit"
    @cancel="onCancel"
  >
    <div class="column q-gutter-md">
      <AppInput
        v-model="coneId"
        label="Mã vạch cuộn chỉ"
        required
        autofocus
        prepend-icon="qr_code_scanner"
        placeholder="Quét hoặc nhập mã cuộn chỉ..."
      />

      <div
        v-if="productionOrderId"
        class="q-px-sm"
      >
        <div class="text-caption text-grey-7">
          Lệnh sản xuất
        </div>
        <div class="text-subtitle2">
          {{ productionOrderId }}
        </div>
      </div>

      <AppSelect
        v-model="reason"
        label="Lý do hoàn trả"
        :options="reasonOptions"
        required
        emit-value
        map-options
      />

      <AppTextarea
        v-model="notes"
        label="Ghi chú"
        placeholder="Nhập thêm thông tin nếu cần..."
        rows="3"
      />
    </div>
  </FormDialog>
</template>
