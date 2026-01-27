<template>
  <q-slider
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
    :thumb-size="thumbSize"
    :thumb-color="thumbColor"
    :thumb-path="thumbPath"
    :disable="disable"
    :readonly="readonly"
    :dense="dense"
    :dark="dark"
    :label="showLabel"
    :label-value="labelValue"
    :label-color="labelColor"
    :label-text-color="labelTextColor"
    :switch-label-side="switchLabelSide"
    :label-always="labelAlways"
    :markers="markers"
    :marker-labels="markerLabels"
    :marker-labels-class="markerLabelsClass"
    :switch-marker-labels-side="switchMarkerLabelsSide"
    :track-size="trackSize"
    :thumb-class="thumbClass"
    :inner-min="innerMin"
    :inner-max="innerMax"
    @update:model-value="emit('update:modelValue', $event)"
    @change="emit('change', $event)"
  />
</template>

<script setup lang="ts">
import type { AppSliderProps } from '@/types/ui'

const props = withDefaults(defineProps<AppSliderProps & { showLabel?: boolean }>(), {
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
  switchLabelSide: false,
  switchMarkerLabelsSide: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  change: [value: number]
}>()
</script>
