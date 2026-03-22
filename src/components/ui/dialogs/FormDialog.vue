<script setup lang="ts">
import { computed } from 'vue'

/**
 * FormDialog - Dialog wrapper for forms with validation
 * Provides title, form slot, and submit/cancel actions
 */

interface Props {
  modelValue?: boolean
  title?: string
  submitText?: string
  cancelText?: string
  loading?: boolean
  persistent?: boolean
  resetOnClose?: boolean
  maxWidth?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  title: '',
  submitText: 'Lưu',
  cancelText: 'Hủy',
  loading: false,
  persistent: true,
  resetOnClose: true,
  maxWidth: '500px'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: []
  cancel: []
  hide: []
}>()

const dialogValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const onSubmit = () => {
  emit('submit')
}

const onCancel = () => {
  emit('cancel')
  dialogValue.value = false
}

const onHide = () => {
  emit('hide')
}
</script>

<template>
  <q-dialog
    v-model="dialogValue"
    :persistent="persistent"
    @hide="onHide"
  >
    <q-card :style="{ maxWidth: maxWidth, width: '100%' }">
      <q-form @submit.prevent="onSubmit">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">
            {{ title }}
          </div>
          <q-space />
          <q-btn
            v-if="!loading"
            v-close-popup
            icon="close"
            flat
            round
            dense
          />
        </q-card-section>

        <q-card-section class="q-pt-md">
          <slot />
        </q-card-section>

        <q-card-actions
          align="right"
          class="text-primary q-pa-md"
        >
          <q-btn
            flat
            :label="cancelText"
            color="grey"
            :disable="loading"
            @click="onCancel"
          />
          <q-btn
            unelevated
            type="submit"
            :label="submitText"
            color="primary"
            :loading="loading"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>
