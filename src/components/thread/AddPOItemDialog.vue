<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import FormDialog from '@/components/ui/dialogs/FormDialog.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import { useSnackbar } from '@/composables/useSnackbar'
import { purchaseOrderService } from '@/services/purchaseOrderService'
import { styleService } from '@/services/styleService'
import type { Style } from '@/types/thread'
import { formatStyleDisplay } from '@/utils/thread-format'

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
const searchText = ref('')

const form = ref({
  style_id: null as number | null,
  quantity: 1
})

function resetForm() {
  form.value = {
    style_id: null,
    quantity: 1
  }
  searchText.value = ''
  styles.value = []
}

const searchStyles = useDebounceFn(async (query: string) => {
  loadingStyles.value = true
  try {
    styles.value = await styleService.search({
      search: query,
      limit: 2000,
      excludeIds: props.existingStyleIds
    })
  } catch (err) {
    console.error('Error searching styles:', err)
    styles.value = []
  } finally {
    loadingStyles.value = false
  }
}, 300)

async function loadInitialStyles() {
  loadingStyles.value = true
  try {
    styles.value = await styleService.search({
      limit: 2000,
      excludeIds: props.existingStyleIds
    })
  } finally {
    loadingStyles.value = false
  }
}

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    resetForm()
    loadInitialStyles()
  }
})

function handleFilter(val: string, update: (fn: () => void) => void) {
  update(() => {
    searchText.value = val
    if (val.length >= 1) {
      searchStyles(val)
    } else if (val === '') {
      loadInitialStyles()
    }
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
          :options="styles"
          option-value="id"
          :option-label="(opt: Style) => formatStyleDisplay(opt.style_code, opt.style_name)"
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
                {{ searchText ? 'Không tìm thấy mã hàng' : 'Nhập để tìm kiếm...' }}
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
