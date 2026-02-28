<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import FormDialog from '@/components/ui/dialogs/FormDialog.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import { useSnackbar } from '@/composables/useSnackbar'
import { purchaseOrderService } from '@/services/purchaseOrderService'
import { styleService } from '@/services/styleService'
import type { Style } from '@/types/thread'

interface Props {
  modelValue: boolean
  poId: number
  existingStyleIds?: number[]
}

const props = withDefaults(defineProps<Props>(), {
  existingStyleIds: () => []
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': []
}>()

const snackbar = useSnackbar()
const loading = ref(false)
const loadingStyles = ref(false)
const styles = ref<Style[]>([])
const filterText = ref('')

const form = ref({
  style_id: null as number | null,
  quantity: 1
})

const filteredStyles = computed(() => {
  let result = styles.value.filter(s => !props.existingStyleIds.includes(s.id))
  if (filterText.value) {
    const search = filterText.value.toLowerCase()
    result = result.filter(s =>
      s.style_code.toLowerCase().includes(search) ||
      s.style_name.toLowerCase().includes(search)
    )
  }
  return result
})

function resetForm() {
  form.value = {
    style_id: null,
    quantity: 1
  }
  filterText.value = ''
}

async function loadStyles() {
  if (styles.value.length > 0) return
  loadingStyles.value = true
  try {
    styles.value = await styleService.getAll()
  } finally {
    loadingStyles.value = false
  }
}

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    resetForm()
    loadStyles()
  }
})

function handleFilter(val: string, update: (fn: () => void) => void) {
  update(() => {
    filterText.value = val
  })
}

async function onSubmit() {
  if (!form.value.style_id) {
    snackbar.error('Vui lòng chọn mã hàng')
    return
  }
  if (!form.value.quantity || form.value.quantity <= 0) {
    snackbar.error('Số lượng phải lớn hơn 0')
    return
  }

  loading.value = true
  try {
    await purchaseOrderService.addItem(props.poId, {
      style_id: form.value.style_id,
      quantity: form.value.quantity
    })
    snackbar.success('Thêm mã hàng thành công')
    emit('saved')
    emit('update:modelValue', false)
  } catch (err) {
    snackbar.error((err as Error).message || 'Không thể thêm mã hàng')
  } finally {
    loading.value = false
  }
}

function onCancel() {
  emit('update:modelValue', false)
}
</script>

<template>
  <FormDialog
    :model-value="modelValue"
    title="Thêm mã hàng"
    :loading="loading"
    max-width="500px"
    @update:model-value="val => emit('update:modelValue', val)"
    @submit="onSubmit"
    @cancel="onCancel"
  >
    <div class="row q-col-gutter-md">
      <div class="col-12">
        <q-select
          v-model="form.style_id"
          :options="filteredStyles"
          option-value="id"
          :option-label="(opt: Style) => `${opt.style_code} - ${opt.style_name}`"
          label="Mã hàng"
          outlined
          use-input
          emit-value
          map-options
          :loading="loadingStyles"
          @filter="handleFilter"
        >
          <template #option="{ opt, itemProps }">
            <q-item v-bind="itemProps">
              <q-item-section>
                <q-item-label>{{ opt.style_code }}</q-item-label>
                <q-item-label caption>
                  {{ opt.style_name }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </template>
          <template #no-option>
            <q-item>
              <q-item-section class="text-grey">
                Không tìm thấy mã hàng
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>

      <div class="col-12">
        <AppInput
          v-model.number="form.quantity"
          label="Số lượng SP"
          type="number"
          required
          :min="1"
        />
      </div>
    </div>
  </FormDialog>
</template>
