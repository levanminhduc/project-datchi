<script setup lang="ts">
/**
 * ConfirmDialog - Confirmation modal with Vietnamese defaults
 * Used for confirming user actions
 */
import { computed } from 'vue'
import type { Color } from '@/types/ui'

type DialogType = 'info' | 'warning' | 'error' | 'success'

interface Props {
  modelValue?: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: DialogType
  icon?: string
  confirmColor?: Color
  loading?: boolean
  persistent?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  title: 'Xác nhận',
  confirmText: 'Đồng ý',
  cancelText: 'Hủy',
  type: 'info',
  loading: false,
  persistent: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()

// Map type to icon
const typeIcon = computed(() => {
  if (props.icon) return props.icon
  const iconMap: Record<DialogType, string> = {
    info: 'mdi-information',
    warning: 'mdi-alert',
    error: 'mdi-alert-circle',
    success: 'mdi-check-circle'
  }
  return iconMap[props.type]
})

// Map type to color for icon
const typeColor = computed(() => {
  const colorMap: Record<DialogType, string> = {
    info: 'info',
    warning: 'warning',
    error: 'negative',
    success: 'positive'
  }
  return colorMap[props.type]
})

// Confirm button color
const buttonColor = computed(() => {
  if (props.confirmColor) return props.confirmColor
  if (props.type === 'error') return 'negative'
  return 'primary'
})

const dialogValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const onConfirm = () => {
  emit('confirm')
  // We don't automatically close if we want to handle loading state externally
  // But usually confirmation dialogs close after confirm unless loading is handled here
  if (!props.loading) {
    dialogValue.value = false
  }
}

const onCancel = () => {
  emit('cancel')
  dialogValue.value = false
}
</script>

<template>
  <q-dialog
    v-model="dialogValue"
    :persistent="persistent || loading"
    transition-show="scale"
    transition-hide="scale"
  >
    <q-card style="min-width: 350px; max-width: 500px">
      <q-card-section class="row items-center q-pb-none">
        <q-icon
          :name="typeIcon"
          :color="typeColor"
          size="md"
          class="q-mr-sm"
        />
        <div class="text-h6 text-weight-bold">{{ title }}</div>
        <q-space />
        <q-btn
          v-if="!persistent && !loading"
          icon="mdi-close"
          flat
          round
          dense
          v-close-popup
        />
      </q-card-section>

      <q-card-section class="q-pt-md">
        <div class="text-body1 text-grey-9 preserve-whitespace">
          {{ message }}
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md q-gutter-sm">
        <q-btn
          flat
          :label="cancelText"
          color="grey-7"
          :disable="loading"
          @click="onCancel"
        />
        <q-btn
          unelevated
          :label="confirmText"
          :color="buttonColor"
          :loading="loading"
          @click="onConfirm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.preserve-whitespace {
  white-space: pre-line;
}
</style>
