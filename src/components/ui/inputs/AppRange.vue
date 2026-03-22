<template>
  <q-range
    v-bind="$attrs"
    :model-value="modelValue"
    :min="min"
    :max="max"
    :step="step"
    :snap="snap"
    :vertical="vertical"
    :reverse="reverse"
    :color="color"
    :track-color="trackColor"
    :inner-track-color="innerTrackColor"
    :selection-color="selectionColor"
    :disable="disable"
    :readonly="readonly"
    :dense="dense"
    :dark="dark"
    :label="showLabel"
    :left-label-value="leftLabelValue"
    :right-label-value="rightLabelValue"
    :left-label-color="leftLabelColor"
    :right-label-color="rightLabelColor"
    :left-label-text-color="leftLabelTextColor"
    :right-label-text-color="rightLabelTextColor"
    :label-always="labelAlways"
    :markers="markers"
    :marker-labels="markerLabels"
    :marker-labels-class="markerLabelsClass"
    :switch-marker-labels-side="switchMarkerLabelsSide"
    :track-size="trackSize"
    :left-thumb-class="leftThumbClass"
    :right-thumb-class="rightThumbClass"
    :left-thumb-color="leftThumbColor"
    :right-thumb-color="rightThumbColor"
    :drag-range="dragRange"
    :drag-only-range="dragOnlyRange"
    @update:model-value="emit('update:modelValue', $event)"
    @change="emit('change', $event)"
  />
</template>

<script setup lang="ts">
import type { AppRangeProps } from '@/types/ui'

withDefaults(defineProps<AppRangeProps & { showLabel?: boolean }>(), {
  min: 0,
  max: 100,
  step: 1,
  snap: false,
  vertical: false,
  reverse: false,
  color: 'primary',
  disable: false,
  readonly: false,
  dense: false,
  showLabel: false,
  labelAlways: false,
  switchMarkerLabelsSide: false,
  dragRange: false,
  dragOnlyRange: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: { min: number; max: number } | null]
  change: [value: { min: number; max: number }]
}>()
</script>
