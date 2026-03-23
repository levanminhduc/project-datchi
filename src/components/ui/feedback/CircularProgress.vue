<template>
  <q-circular-progress
    v-bind="$attrs"
    :value="value"
    :indeterminate="indeterminate"
    :color="color"
    :track-color="trackColor"
    :center-color="centerColor"
    :size="size"
    :font-size="fontSize"
    :thickness="thickness"
    :min="min"
    :max="max"
    :reverse="reverse"
    :instant-feedback="instantFeedback"
    :show-value="showValue"
    :angle="angle"
    :animation-speed="animationSpeed"
    :rounded="rounded"
    :dark="dark"
  >
    <slot />
  </q-circular-progress>
</template>

<script setup lang="ts">
import type { CircularProgressProps } from '@/types/ui'

withDefaults(defineProps<CircularProgressProps>(), {
  value: 0,
  indeterminate: false,
  color: 'primary',
  trackColor: 'grey-3',
  size: '100px',
  thickness: 0.2,
  min: 0,
  max: 1,
  reverse: false,
  instantFeedback: false,
  showValue: false,
  angle: 0,
  rounded: false,
})
</script>
