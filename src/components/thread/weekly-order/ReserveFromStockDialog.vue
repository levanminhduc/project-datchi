<template>
  <AppDialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #header>
      Lấy từ tồn kho
    </template>

    <div class="q-gutter-md">
      <div
        v-if="summaryItem"
        class="q-mb-md"
      >
        <div class="text-subtitle2 text-grey-7 q-mb-sm">
          Thông tin loại chỉ
        </div>
        <div class="row q-col-gutter-sm">
          <div class="col-6">
            <div class="text-caption text-grey-6">
              Loại chỉ
            </div>
            <div class="text-body2">
              {{ threadTypeName }}
            </div>
          </div>
          <div class="col-6">
            <div class="text-caption text-grey-6">
              Màu chỉ
            </div>
            <div class="text-body2">
              {{ colorName }}
            </div>
          </div>
          <div class="col-6">
            <div class="text-caption text-grey-6">
              Thiếu (quy đổi)
            </div>
            <div class="text-body2 text-negative text-weight-medium">
              {{ formatQty(summaryItem.shortage) }}
            </div>
          </div>
          <div class="col-6">
            <div class="text-caption text-grey-6">
              Tồn kho khả dụng (quy đổi)
            </div>
            <div class="text-body2 text-positive text-weight-medium">
              {{ formatQty(summaryItem.available_stock) }}
            </div>
          </div>
          <div class="col-6">
            <div class="text-caption text-grey-6">
              Có thể lấy tối đa (quy đổi)
            </div>
            <div class="text-body2 text-weight-medium">
              {{ formatQty(maxQuantity) }}
            </div>
          </div>
          <div class="col-6">
            <div class="text-caption text-grey-6">
              Tồn kho vật lý
            </div>
            <div class="text-body2 text-weight-medium">
              {{ summaryItem.available_physical_cones }} cuộn
            </div>
          </div>
        </div>
      </div>

      <q-separator />

      <AppInput
        v-model.number="form.quantity"
        label="Số lượng quy đổi lấy *"
        type="number"
        :min="0.01"
        :max="maxQuantity"
        :step="0.1"
        :rules="[
          val => val > 0 || 'Số lượng phải lớn hơn 0',
          val => val <= maxQuantity || `Tối đa ${formatQty(maxQuantity)} cuộn quy đổi`
        ]"
      />

      <AppInput
        v-model="form.reason"
        label="Lý do (tùy chọn)"
        type="textarea"
        autogrow
      />
    </div>

    <template #actions>
      <AppButton
        v-close-popup
        flat
        label="Hủy"
        :disable="loading"
      />
      <AppButton
        color="primary"
        label="Xác nhận"
        :loading="loading"
        :disable="!isValid"
        @click="handleSubmit"
      />
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { weeklyOrderService } from '@/services/weeklyOrderService'
import { useSnackbar } from '@/composables/useSnackbar'
import AppDialog from '@/components/ui/dialogs/AppDialog.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import type { ReservationSummary } from '@/types/thread'

const props = defineProps<{
  modelValue: boolean
  weekId: number
  summaryItem: ReservationSummary | null
  threadTypeName: string
  colorName: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  reserved: [count: number]
}>()

const snackbar = useSnackbar()

const loading = ref(false)

const form = ref({
  quantity: 0,
  reason: '',
})

const maxQuantity = computed(() => {
  if (!props.summaryItem) return 0
  return Math.min(props.summaryItem.shortage, props.summaryItem.available_stock)
})

const isValid = computed(() =>
  form.value.quantity > 0 && form.value.quantity <= maxQuantity.value
)

const formatQty = (value: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value || 0)

const resetForm = () => {
  form.value = {
    quantity: maxQuantity.value,
    reason: '',
  }
}

const handleSubmit = async () => {
  if (!isValid.value || !props.summaryItem) return

  loading.value = true
  try {
    const result = await weeklyOrderService.reserveFromStock(props.weekId, {
      thread_type_id: props.summaryItem.thread_type_id,
      color_id: props.summaryItem.color_id,
      quantity: form.value.quantity,
      reason: form.value.reason || undefined,
    })
    snackbar.success(`Đã lấy ${result.reserved_physical_cones} cuộn từ tồn kho (${formatQty(result.reserved_equivalent_cones)} cuộn quy đổi)`)
    emit('reserved', result.reserved_equivalent_cones)
    resetForm()
  } catch (err: any) {
    snackbar.error(err?.message || 'Không thể lấy từ tồn kho')
  } finally {
    loading.value = false
  }
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      resetForm()
    }
  }
)
</script>
