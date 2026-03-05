<template>
  <AppDialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #header>
      Mượn chỉ cho tuần {{ toWeekName }}
    </template>

    <div class="q-gutter-md">
      <AppSelect
        v-model="form.from_week_id"
        :options="weekOptions"
        label="Mượn từ tuần *"
        :loading="weeksLoading"
        :rules="[val => !!val || 'Vui lòng chọn tuần cho mượn']"
        emit-value
        map-options
      />

      <AppSelect
        v-model="form.thread_type_id"
        :options="threadTypeOptions"
        label="Loại chỉ *"
        :loading="typesLoading"
        :disable="!form.from_week_id"
        :hint="!form.from_week_id ? 'Chọn tuần nguồn trước' : undefined"
        :rules="[val => !!val || 'Vui lòng chọn loại chỉ']"
        emit-value
        map-options
      />

      <AppInput
        v-model.number="form.quantity_cones"
        label="Số cuộn *"
        type="number"
        :min="1"
        :max="selectedMaxCones ?? undefined"
        :hint="selectedMaxCones !== null ? `Tối đa ${selectedMaxCones} cuộn` : undefined"
        :rules="[
          val => val > 0 || 'Số cuộn phải lớn hơn 0',
          val => !selectedMaxCones || val <= selectedMaxCones || `Tối đa ${selectedMaxCones} cuộn`,
        ]"
      />

      <AppInput
        v-model="form.reason"
        label="Lý do"
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
        label="Xác nhận mượn"
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
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import type { ThreadOrderWeek } from '@/types/thread'

interface ThreadTypeSummary {
  thread_type_id: number
  code: string
  name: string
  available_cones: number
}

const props = defineProps<{
  modelValue: boolean
  toWeekId: number
  toWeekName: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  created: []
}>()

const snackbar = useSnackbar()

const loading = ref(false)
const weeksLoading = ref(false)
const typesLoading = ref(false)
const weeks = ref<ThreadOrderWeek[]>([])
const availableThreadTypes = ref<ThreadTypeSummary[]>([])

const form = ref({
  from_week_id: null as number | null,
  thread_type_id: null as number | null,
  quantity_cones: 1,
  reason: '',
})

const isValid = computed(() =>
  !!form.value.from_week_id &&
  !!form.value.thread_type_id &&
  form.value.quantity_cones > 0
)

const weekOptions = computed(() =>
  weeks.value
    .filter((w) => w.id !== props.toWeekId)
    .map((w) => ({ label: w.week_name, value: w.id }))
)

const threadTypeOptions = computed(() =>
  availableThreadTypes.value.map((t) => ({
    label: `${t.code} - ${t.name} (${t.available_cones} cuộn)`,
    value: t.thread_type_id,
  }))
)

const selectedMaxCones = computed(() => {
  if (!form.value.thread_type_id) return null
  return availableThreadTypes.value.find((t) => t.thread_type_id === form.value.thread_type_id)?.available_cones ?? null
})

const resetForm = () => {
  form.value = { from_week_id: null, thread_type_id: null, quantity_cones: 1, reason: '' }
  availableThreadTypes.value = []
}

const loadWeeks = async () => {
  weeksLoading.value = true
  try {
    weeks.value = await weeklyOrderService.getAll({ status: 'CONFIRMED' })
  } catch {
    weeks.value = []
  } finally {
    weeksLoading.value = false
  }
}

const loadAvailableThreadTypes = async (weekId: number) => {
  typesLoading.value = true
  try {
    const { cones } = await weeklyOrderService.getReservations(weekId)
    const map = new Map<number, ThreadTypeSummary>()
    for (const cone of cones) {
      const tt = cone.thread_type as { id: number; code: string; name: string } | undefined
      if (!tt) continue
      const existing = map.get(tt.id)
      if (existing) {
        existing.available_cones++
      } else {
        map.set(tt.id, { thread_type_id: tt.id, code: tt.code, name: tt.name, available_cones: 1 })
      }
    }
    availableThreadTypes.value = Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code))
  } catch {
    availableThreadTypes.value = []
  } finally {
    typesLoading.value = false
  }
}

const handleSubmit = async () => {
  if (!isValid.value || !form.value.from_week_id || !form.value.thread_type_id) return

  loading.value = true
  try {
    await weeklyOrderService.createLoan(props.toWeekId, {
      from_week_id: form.value.from_week_id,
      thread_type_id: form.value.thread_type_id,
      quantity_cones: form.value.quantity_cones,
      reason: form.value.reason || undefined,
    })
    snackbar.success('Mượn chỉ thành công')
    emit('created')
    resetForm()
  } catch (err: any) {
    snackbar.error(err?.message || 'Không thể mượn chỉ')
  } finally {
    loading.value = false
  }
}

watch(
  () => form.value.from_week_id,
  (weekId) => {
    form.value.thread_type_id = null
    form.value.quantity_cones = 1
    if (weekId) {
      loadAvailableThreadTypes(weekId)
    } else {
      availableThreadTypes.value = []
    }
  }
)

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      resetForm()
      loadWeeks()
    }
  }
)
</script>
