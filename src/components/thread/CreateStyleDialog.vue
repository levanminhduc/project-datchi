<script setup lang="ts">
import { ref, reactive } from 'vue'
import FormDialog from '@/components/ui/dialogs/FormDialog.vue'
import { useSnackbar } from '@/composables/useSnackbar'
import { styleService } from '@/services/styleService'
import { getErrorMessage } from '@/utils/errorMessages'
import type { Style, CreateStyleDTO } from '@/types/thread'

interface Props {
  modelValue: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'created': [style: Style]
}>()

const snackbar = useSnackbar()
const loading = ref(false)

const formData = reactive({
  style_code: '',
  style_name: '',
  fabric_type: '',
  description: '',
})

function resetForm() {
  Object.assign(formData, {
    style_code: '',
    style_name: '',
    fabric_type: '',
    description: '',
  })
}

async function onSubmit() {
  if (!formData.style_code.trim() || !formData.style_name.trim()) {
    return
  }

  loading.value = true
  try {
    const data: CreateStyleDTO = {
      style_code: formData.style_code.trim().toUpperCase(),
      style_name: formData.style_name.trim(),
      fabric_type: formData.fabric_type?.trim() || undefined,
      description: formData.description?.trim() || undefined,
    }

    const result = await styleService.create(data)
    snackbar.success('Tạo mã hàng thành công')
    emit('created', result)
    emit('update:modelValue', false)
    resetForm()
  } catch (err) {
    snackbar.error(getErrorMessage(err))
  } finally {
    loading.value = false
  }
}

function onCancel() {
  emit('update:modelValue', false)
  resetForm()
}
</script>

<template>
  <FormDialog
    :model-value="modelValue"
    title="Thêm Mã Hàng Mới"
    submit-text="Tạo"
    :loading="loading"
    max-width="600px"
    @update:model-value="val => emit('update:modelValue', val)"
    @submit="onSubmit"
    @cancel="onCancel"
    @hide="resetForm"
  >
    <div class="row q-col-gutter-md">
      <div class="col-12 col-sm-6">
        <q-input
          v-model="formData.style_code"
          label="Mã hàng"
          outlined
          :rules="[(v: string) => !!v || 'Vui lòng nhập mã hàng']"
          hint="Mã định danh duy nhất"
        />
      </div>

      <div class="col-12 col-sm-6">
        <q-input
          v-model="formData.style_name"
          label="Tên mã hàng"
          outlined
          :rules="[(v: string) => !!v || 'Vui lòng nhập tên']"
        />
      </div>

      <div class="col-12 col-sm-6">
        <q-input
          v-model="formData.fabric_type"
          label="Loại vải"
          outlined
        />
      </div>

      <div class="col-12">
        <q-input
          v-model="formData.description"
          label="Mô tả"
          outlined
          type="textarea"
          rows="2"
        />
      </div>
    </div>
  </FormDialog>
</template>
