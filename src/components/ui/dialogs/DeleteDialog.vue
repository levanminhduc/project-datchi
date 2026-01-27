<script setup lang="ts">
import { computed, ref, watch } from 'vue'

/**
 * DeleteDialog - Delete confirmation with optional text input verification
 * Shows a danger-styled dialog for destructive actions
 */

interface Props {
  modelValue?: boolean
  title?: string
  message?: string
  itemName?: string
  requireConfirmation?: boolean
  confirmationText?: string
  confirmText?: string
  cancelText?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  title: 'Xác nhận xóa',
  message: 'Bạn có chắc chắn muốn xóa mục này? Hành động này không thể hoàn tác.',
  itemName: '',
  requireConfirmation: false,
  confirmText: 'Xóa',
  cancelText: 'Hủy',
  loading: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()

const dialogValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// For typed confirmation
const confirmInput = ref('')

// Reset when dialog closes
watch(dialogValue, (val) => {
  if (!val) {
    confirmInput.value = ''
  }
})

// Text user must type to confirm
const requiredText = computed(() => {
  if (props.confirmationText) return props.confirmationText
  return props.itemName
})

// Check if confirmation is valid
const canConfirm = computed(() => {
  if (!props.requireConfirmation) return true
  return confirmInput.value === requiredText.value
})

const onConfirm = () => {
  if (!canConfirm.value) return
  emit('confirm')
  // We don't automatically close if we want the parent to handle it (e.g. while loading)
  // But the requirement says "dialogValue.value = false" in onConfirm
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
  <q-dialog v-model="dialogValue" :persistent="loading">
    <q-card style="min-width: 350px; max-width: 500px">
      <q-card-section class="row items-center q-pb-none">
        <q-avatar icon="mdi-alert-circle" color="negative" text-color="white" />
        <div class="text-h6 q-ml-md text-negative">{{ title }}</div>
        <q-space />
        <q-btn icon="mdi-close" flat round dense v-close-popup :disable="loading" />
      </q-card-section>

      <q-card-section class="q-pt-md">
        <p class="text-body1 q-mb-md">{{ message }}</p>
        
        <div v-if="itemName" class="q-mb-md">
          Bạn sắp xóa: <strong class="text-negative">{{ itemName }}</strong>
        </div>

        <div v-if="requireConfirmation" class="q-mt-md">
          <p class="q-mb-sm text-weight-medium">
            Nhập '<span class="text-negative">{{ requiredText }}</span>' để xác nhận:
          </p>
          <q-input
            v-model="confirmInput"
            outlined
            dense
            placeholder="Nhập văn bản xác nhận"
            :disable="loading"
            @keyup.enter="onConfirm"
            autofocus
          />
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
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
          color="negative"
          :loading="loading"
          :disable="!canConfirm || loading"
          @click="onConfirm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>
/* Any custom styles for the delete dialog */
</style>
