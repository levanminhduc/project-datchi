<template>
  <q-dialog
    v-model="dialogValue"
    v-bind="$attrs"
    :persistent="persistent"
    :maximized="maximized"
    :full-width="fullWidth"
    :full-height="fullHeight"
    :transition-show="transitionShow"
    :transition-hide="transitionHide"
    :no-esc-dismiss="noEscDismiss"
    :no-backdrop-dismiss="noBackdropDismiss"
    :position="position"
    @hide="emit('hide')"
    @show="emit('show')"
  >
    <q-card class="column no-wrap" :style="cardStyle">
      <!-- Header slot -->
      <q-card-section v-if="$slots.header" class="row items-center q-pb-none">
        <div class="text-h6"><slot name="header" /></div>
        <q-space />
        <q-btn v-if="!persistent" icon="close" flat round dense v-close-popup />
      </q-card-section>

      <!-- Default content slot -->
      <q-card-section class="col q-pt-md scroll">
        <slot />
      </q-card-section>

      <!-- Actions slot -->
      <q-card-actions v-if="$slots.actions" align="right" class="q-px-md q-pb-md">
        <slot name="actions" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
/**
 * AppDialog - Base dialog wrapper component
 * Wraps QDialog with standardized props and Vietnamese defaults
 */
import { computed } from 'vue'
import type { AppDialogProps } from '@/types/ui'

const props = withDefaults(defineProps<AppDialogProps>(), {
  modelValue: false,
  persistent: false,
  maximized: false,
  fullWidth: false,
  fullHeight: false,
  transitionShow: 'slide-up',
  transitionHide: 'slide-down',
  noEscDismiss: false,
  noBackdropDismiss: false,
  position: 'standard'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  hide: []
  show: []
}>()

const dialogValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// Optional: specific card styles if needed based on props
const cardStyle = computed(() => {
  if (props.maximized) return {}
  return {
    minWidth: props.fullWidth ? '100%' : '400px',
    maxWidth: '90vw'
  }
})
</script>
