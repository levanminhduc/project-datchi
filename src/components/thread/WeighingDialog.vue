<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import FormDialog from '@/components/ui/dialogs/FormDialog.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import type { Recovery } from '@/types/thread'

interface Props {
  modelValue: boolean
  recovery: Recovery | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  recovery: null,
  loading: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': [data: { weight: number, notes: string }]
  'reject': [data: { reason: string }]
}>()

const weight = ref<number | null>(null)
const notes = ref('')
const rejectReason = ref('')
const showRejectInput = ref(false)

const threadType = computed(() => props.recovery?.cone?.thread_type)
const originalWeight = computed(() => props.recovery?.cone?.weight_grams || 0)
const density = computed(() => threadType.value?.density_grams_per_meter || 0)

const remainingMeters = computed(() => {
  if (!weight.value || !density.value) return 0
  return Math.round(weight.value / density.value)
})

const consumedMeters = computed(() => {
  const original = props.recovery?.original_meters || 0
  return Math.max(0, original - remainingMeters.value)
})

const isAbnormal = computed(() => {
  const original = props.recovery?.original_meters || 0
  if (!original) return false
  // Flag if consumption is > 95% or weirdly negative (handled by max(0))
  return consumedMeters.value > original * 0.95
})

watch(() => props.modelValue, (val) => {
  if (val) {
    weight.value = null
    notes.value = ''
    rejectReason.value = ''
    showRejectInput.value = false
  }
})

const onConfirm = () => {
  if (weight.value === null) return
  emit('confirm', {
    weight: weight.value,
    notes: notes.value
  })
}

const onReject = () => {
  if (!showRejectInput.value) {
    showRejectInput.value = true
    return
  }
  if (!rejectReason.value) return
  emit('reject', {
    reason: rejectReason.value
  })
}

const onCancel = () => {
  emit('update:modelValue', false)
}
</script>

<template>
  <FormDialog
    :model-value="modelValue"
    title="Cân và xác nhận cuộn chỉ"
    :loading="loading"
    max-width="500px"
    @update:model-value="val => emit('update:modelValue', val)"
    @submit="onConfirm"
    @cancel="onCancel"
  >
    <div
      v-if="recovery"
      class="column q-gutter-sm"
    >
      <!-- Info Section -->
      <q-card
        flat
        bordered
        class="bg-grey-1"
      >
        <q-card-section class="q-py-sm">
          <div class="row justify-between items-center">
            <div class="text-caption text-grey-7">
              Mã cuộn:
            </div>
            <div class="text-weight-bold">
              {{ recovery.cone?.cone_id }}
            </div>
          </div>
          <div class="row justify-between items-center">
            <div class="text-caption text-grey-7">
              Loại chỉ:
            </div>
            <div class="text-subtitle2 text-primary">
              {{ threadType?.name || 'N/A' }}
            </div>
          </div>
          <div class="row justify-between items-center">
            <div class="text-caption text-grey-7">
              Độ dài ban đầu:
            </div>
            <div class="text-weight-medium">
              {{ recovery.original_meters.toLocaleString() }} m
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Input Section -->
      <div class="row q-col-gutter-sm items-start">
        <div class="col-12">
          <AppInput
            v-model.number="weight"
            label="Trọng lượng thực tế (grams)"
            type="number"
            required
            autofocus
            prepend-icon="scale"
            suffix="g"
            hint="Nhập trọng lượng sau khi trừ lõi (nếu có)"
          />
        </div>
      </div>

      <!-- Live Conversion -->
      <div
        v-if="weight"
        class="q-pa-sm rounded-borders bg-blue-1 text-blue-9"
      >
        <div class="row justify-between">
          <span>Độ dài còn lại ước tính:</span>
          <span class="text-weight-bold">{{ remainingMeters.toLocaleString() }} m</span>
        </div>
        <div class="row justify-between">
          <span>Đã tiêu thụ:</span>
          <span class="text-weight-bold">{{ consumedMeters.toLocaleString() }} m</span>
        </div>
      </div>

      <!-- Abnormal Warning -->
      <q-banner
        v-if="isAbnormal"
        dense
        class="bg-amber-1 text-amber-9 rounded-borders"
      >
        <template #avatar>
          <q-icon
            name="warning"
            color="amber-9"
          />
        </template>
        Lượng tiêu thụ có vẻ bất thường (> 95% độ dài ban đầu).
      </q-banner>

      <AppInput
        v-model="notes"
        label="Ghi chú"
        placeholder="Ghi chú về tình trạng cuộn chỉ..."
      />

      <!-- Reject Section -->
      <div
        v-if="showRejectInput"
        class="q-mt-sm"
      >
        <AppInput
          v-model="rejectReason"
          label="Lý do từ chối"
          required
          color="negative"
          placeholder="Tại sao bạn từ chối cuộn chỉ này?"
        />
      </div>
    </div>

    <template #footer-actions>
      <AppButton
        v-if="!showRejectInput"
        flat
        label="Từ chối"
        color="negative"
        @click="onReject"
      />
      <AppButton
        v-else
        label="Xác nhận từ chối"
        color="negative"
        :disable="!rejectReason"
        @click="onReject"
      />
    </template>
  </FormDialog>
</template>
