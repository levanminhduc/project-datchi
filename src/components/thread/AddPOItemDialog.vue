<script setup lang="ts">
import { ref, watch } from 'vue'
import FormDialog from '@/components/ui/dialogs/FormDialog.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import CreateStyleDialog from '@/components/thread/CreateStyleDialog.vue'
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

const showCreateStyleDialog = ref(false)

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

let currentSearchId = 0

async function fetchStyles(query: string): Promise<Style[]> {
  return await styleService.search({
    search: query || undefined,
    limit: 2000,
    excludeIds: props.existingStyleIds
  })
}

async function loadInitialStyles() {
  loadingStyles.value = true
  try {
    styles.value = await fetchStyles('')
  } catch (err) {
    console.error('Error loading initial styles:', err)
    styles.value = []
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

async function handleFilter(
  val: string,
  update: (fn: () => void) => void,
  abort: () => void
) {
  const myId = ++currentSearchId
  searchText.value = val
  loadingStyles.value = true
  let result: Style[] = []
  try {
    result = await fetchStyles(val)
  } catch (err) {
    console.error('Error searching styles:', err)
    result = []
  }
  if (myId !== currentSearchId) {
    abort()
    return
  }
  styles.value = result
  loadingStyles.value = false
  update(() => {})
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

function onStyleCreated(style: Style) {
  styles.value = [style, ...styles.value]
  form.value.style_id = style.id
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
        <div class="row q-col-gutter-sm items-start">
          <div class="col">
            <q-select
              v-model="form.style_id"
              :options="styles"
              option-value="id"
              :option-label="(opt: Style) => formatStyleDisplay(opt.style_code, opt.style_name)"
              label="Mã hàng"
              outlined
              use-input
              fill-input
              hide-selected
              input-debounce="300"
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
          <div class="col-auto">
            <q-btn
              icon="add"
              color="primary"
              outline
              style="height: 56px"
              @click="showCreateStyleDialog = true"
            >
              <q-tooltip>Tạo mã hàng mới</q-tooltip>
            </q-btn>
          </div>
        </div>
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

    <CreateStyleDialog
      v-model="showCreateStyleDialog"
      @created="onStyleCreated"
    />
  </FormDialog>
</template>
