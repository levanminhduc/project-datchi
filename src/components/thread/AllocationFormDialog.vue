<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Allocation, CreateAllocationDTO, ThreadType } from '@/types/thread'
import { AllocationPriority, AllocationStatus } from '@/types/thread/enums'
import { useThreadTypes } from '@/composables/thread/useThreadTypes'
import FormDialog from '@/components/ui/dialogs/FormDialog.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import AppTextarea from '@/components/ui/inputs/AppTextarea.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import DatePicker from '@/components/ui/pickers/DatePicker.vue'
import WeightMeterDisplay from './WeightMeterDisplay.vue'

interface Props {
  allocation?: Allocation | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  allocation: null,
  loading: false
})

const isOpen = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  (e: 'submit', data: CreateAllocationDTO): void
  (e: 'update', id: number, data: Partial<CreateAllocationDTO>): void
  (e: 'cancel'): void
}>()

// Composables
const { activeThreadTypes, fetchThreadTypes } = useThreadTypes()

// Form State
const defaultForm: CreateAllocationDTO = {
  order_id: '',
  order_reference: '',
  thread_type_id: 0,
  requested_meters: 0,
  priority: AllocationPriority.NORMAL,
  due_date: '',
  notes: ''
}

const form = ref<CreateAllocationDTO>({ ...defaultForm })
const qtyMode = ref<'meters' | 'weight'>('meters')
const weightInput = ref<number>(0)

// Priority options
const priorityOptions = [
  { label: 'Thấp', value: AllocationPriority.LOW },
  { label: 'Bình thường', value: AllocationPriority.NORMAL },
  { label: 'Cao', value: AllocationPriority.HIGH },
  { label: 'Khẩn cấp', value: AllocationPriority.URGENT }
]

const isEditMode = computed(() => !!props.allocation)
const title = computed(() => isEditMode.value ? 'Chỉnh sửa yêu cầu phân bổ' : 'Tạo yêu cầu phân bổ mới')

const selectedThreadType = computed(() => {
  return activeThreadTypes.value.find(t => t.id === form.value.thread_type_id)
})

const availableStock = computed(() => {
  // In a real scenario, this would come from an API call or a store
  // For now, we use a placeholder or assume it's part of the thread type object if extended
  return 5000 // Placeholder: 5000m
})

// Conversion logic
watch(weightInput, (newWeight) => {
  if (qtyMode.value === 'weight' && selectedThreadType.value) {
    const density = selectedThreadType.value.density_grams_per_meter || 0.1
    form.value.requested_meters = Math.round(newWeight / density)
  }
})

watch(() => form.value.requested_meters, (newMeters) => {
  if (qtyMode.value === 'meters' && selectedThreadType.value) {
    const density = selectedThreadType.value.density_grams_per_meter || 0.1
    weightInput.value = Math.round(newMeters * density)
  }
})

// Initialize form
const initForm = () => {
  if (props.allocation) {
    form.value = {
      order_id: props.allocation.order_id,
      order_reference: props.allocation.order_reference || '',
      thread_type_id: props.allocation.thread_type_id,
      requested_meters: props.allocation.requested_meters,
      priority: props.allocation.priority,
      due_date: props.allocation.due_date?.split('T')[0] || '',
      notes: props.allocation.notes || ''
    }
    
    // Set weight based on meters
    if (selectedThreadType.value) {
      weightInput.value = Math.round(form.value.requested_meters * (selectedThreadType.value.density_grams_per_meter || 0.1))
    }
  } else {
    form.value = { ...defaultForm }
    weightInput.value = 0
  }
}

watch(isOpen, (val) => {
  if (val) {
    fetchThreadTypes()
    initForm()
  }
})

const handleSubmit = () => {
  if (isEditMode.value && props.allocation) {
    emit('update', props.allocation.id, { ...form.value })
  } else {
    emit('submit', { ...form.value })
  }
  isOpen.value = false
}

const onCancel = () => {
  isOpen.value = false
  emit('cancel')
}
</script>

<template>
  <FormDialog
    v-model="isOpen"
    :title="title"
    :loading="loading"
    max-width="700px"
    @submit="handleSubmit"
    @cancel="onCancel"
  >
    <div class="row q-col-gutter-md">
      <!-- Order Info -->
      <div class="col-12 col-sm-6">
        <AppInput
          v-model="form.order_id"
          label="Mã lệnh sản xuất (LSX)"
          required
          placeholder="Ví dụ: LSX-2024-001"
          :disable="isEditMode"
        />
      </div>
      <div class="col-12 col-sm-6">
        <AppInput
          v-model="form.order_reference"
          label="Tham chiếu đơn hàng"
          placeholder="Mã PO hoặc khách hàng..."
        />
      </div>

      <!-- Thread Selection -->
      <div class="col-12">
        <AppSelect
          v-model="form.thread_type_id"
          :options="activeThreadTypes"
          option-label="name"
          option-value="id"
          label="Loại chỉ"
          required
          searchable
          emit-value
          map-options
          :disable="isEditMode"
        >
          <template #option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section>
                <q-item-label>{{ scope.opt.name }}</q-item-label>
                <q-item-label caption>
                  {{ scope.opt.code }} - {{ scope.opt.color }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-chip
                  size="xs"
                  color="grey-2"
                  dense
                >
                  {{ scope.opt.material }}
                </q-chip>
              </q-item-section>
            </q-item>
          </template>
        </AppSelect>
      </div>

      <!-- Stock Info (Contextual) -->
      <div
        v-if="selectedThreadType"
        class="col-12"
      >
        <div class="bg-blue-1 q-pa-sm rounded-borders flex items-center justify-between border-blue">
          <div class="row items-center">
            <q-icon
              name="inventory_2"
              color="blue-9"
              class="q-mr-sm"
            />
            <span class="text-caption text-blue-9">Tồn kho khả dụng:</span>
            <span class="text-subtitle2 text-blue-9 q-ml-sm">{{ availableStock.toLocaleString() }} m</span>
          </div>
          <div class="text-caption text-blue-8">
            Mật độ: {{ selectedThreadType.density_grams_per_meter }} g/m
          </div>
        </div>
      </div>

      <!-- Quantity Inputs -->
      <div class="col-12">
        <div class="row items-center justify-between q-mb-xs">
          <div class="text-subtitle2">
            Số lượng yêu cầu
          </div>
          <q-btn-toggle
            v-model="qtyMode"
            toggle-color="primary"
            flat
            dense
            size="sm"
            no-caps
            :options="[
              { label: 'Theo Mét', value: 'meters' },
              { label: 'Theo Cân nặng', value: 'weight' }
            ]"
          />
        </div>
        
        <div class="row q-col-gutter-sm">
          <div class="col-6">
            <AppInput
              v-model.number="form.requested_meters"
              type="number"
              label="Số mét (m)"
              required
              :disable="qtyMode === 'weight'"
              :min="1"
            />
          </div>
          <div class="col-6">
            <AppInput
              v-model.number="weightInput"
              type="number"
              label="Cân nặng (g)"
              required
              :disable="qtyMode === 'meters'"
              :min="1"
            />
          </div>
        </div>
      </div>

      <!-- Priority & Date -->
      <div class="col-12 col-sm-6">
        <AppSelect
          v-model="form.priority"
          :options="priorityOptions"
          label="Mức độ ưu tiên"
          required
          emit-value
          map-options
        />
      </div>
      <div class="col-12 col-sm-6">
        <AppInput
          v-model="form.due_date"
          label="Ngày cần hàng"
          placeholder="DD/MM/YYYY"
          hint="Thời hạn sản xuất cần chỉ"
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
                <DatePicker v-model="form.due_date" />
              </q-popup-proxy>
            </q-icon>
          </template>
        </AppInput>
      </div>

      <!-- Notes -->
      <div class="col-12">
        <AppTextarea
          v-model="form.notes"
          label="Ghi chú sản xuất"
          placeholder="Yêu cầu đặc biệt về lô hàng, đóng gói..."
          rows="3"
        />
      </div>
    </div>
  </FormDialog>
</template>

<style scoped>
.border-blue {
  border: 1px solid #bbdefb;
}

.rounded-borders {
  border-radius: 8px;
}
</style>
