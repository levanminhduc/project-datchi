<template>
  <AppDialog
    :model-value="modelValue"
    width="480px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #header>
      Trả chỉ thủ công
    </template>

    <div class="q-gutter-md">
      <div class="bg-grey-1 rounded-borders q-pa-sm">
        <div class="text-caption text-grey-7 q-mb-xs">
          Thông tin khoản mượn
        </div>
        <div class="text-body2">
          <span class="text-weight-medium">{{ loan.from_week?.week_name ?? 'Tồn kho' }}</span>
          <q-icon
            name="arrow_forward"
            size="xs"
            class="q-mx-xs text-grey-6"
          />
          <span class="text-weight-medium">{{ loan.to_week?.week_name ?? '—' }}</span>
        </div>
        <div
          v-if="loan.thread_type"
          class="text-body2 q-mt-xs"
        >
          Chỉ: <span class="text-weight-medium">{{ loan.thread_type.code }} – {{ loan.thread_type.name }}</span>
        </div>
        <div class="text-body2 q-mt-xs row q-gutter-sm">
          <span>Đã mượn: <strong>{{ loan.quantity_cones }}</strong></span>
          <span>Đã trả: <strong class="text-positive">{{ loan.returned_cones }}</strong></span>
          <span>Còn lại: <strong class="text-warning">{{ remaining }}</strong></span>
        </div>
      </div>

      <AppInput
        v-model.number="form.quantity"
        type="number"
        label="Số cuộn trả *"
        :min="1"
        :max="remaining"
        :rules="[
          (v: number) => (v > 0) || 'Phải lớn hơn 0',
          (v: number) => (v <= remaining) || `Tối đa ${remaining} cuộn`,
        ]"
        outlined
        dense
        hint="Nhập số cuộn muốn trả"
      />

      <AppInput
        v-model="form.notes"
        type="textarea"
        label="Ghi chú"
        outlined
        dense
        :rows="2"
        :maxlength="500"
        hint="Tùy chọn"
      />
    </div>

    <template #actions>
      <AppButton
        flat
        label="Hủy"
        :disable="loading"
        @click="$emit('update:modelValue', false)"
      />
      <AppButton
        color="primary"
        label="Trả chỉ"
        icon="undo"
        :loading="loading"
        :disable="!isValid"
        @click="handleSubmit"
      />
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { weeklyOrderService } from '@/services/weeklyOrderService'
import type { ThreadOrderLoan } from '@/types/thread'
import { useSnackbar } from '@/composables/useSnackbar'
import AppDialog from '@/components/ui/dialogs/AppDialog.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'

const props = defineProps<{
  modelValue: boolean
  loan: ThreadOrderLoan
  weekId: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  returned: []
}>()

const snackbar = useSnackbar()
const loading = ref(false)

const form = reactive({
  quantity: 1,
  notes: '',
})

const remaining = computed(() => props.loan.quantity_cones - props.loan.returned_cones)

const isValid = computed(
  () => form.quantity > 0 && form.quantity <= remaining.value,
)

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      form.quantity = 1
      form.notes = ''
    }
  },
)

async function handleSubmit() {
  if (!isValid.value) return
  loading.value = true
  try {
    const result = await weeklyOrderService.manualReturn(props.weekId, props.loan.id, {
      quantity: form.quantity,
      notes: form.notes || undefined,
    })
    snackbar.success(`Đã trả ${result.returned} cuộn${result.settled ? ' – khoản mượn đã thanh toán đầy đủ' : ''}`)
    emit('returned')
    emit('update:modelValue', false)
  } catch (err) {
    snackbar.error(err instanceof Error ? err.message : 'Không thể trả chỉ')
  } finally {
    loading.value = false
  }
}
</script>
