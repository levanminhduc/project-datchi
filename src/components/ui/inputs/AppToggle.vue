<template>
  <q-toggle
    v-bind="$attrs"
    :model-value="modelValue"
    :label="label"
    :true-value="trueValue"
    :false-value="falseValue"
    :toggle-indeterminate="toggleIndeterminate"
    :toggle-order="toggleOrder"
    :keep-color="keepColor"
    :color="color"
    :disable="disable"
    :dense="dense"
    :size="size"
    :left-label="leftLabel"
    :icon="icon"
    :checked-icon="checkedIcon"
    :unchecked-icon="uncheckedIcon"
    :icon-color="iconColor"
    :dark="dark"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <slot />
  </q-toggle>
</template>

<script setup lang="ts">
import type { AppToggleProps } from '@/types/ui'

withDefaults(defineProps<AppToggleProps>(), {
  trueValue: true,
  falseValue: false,
  toggleIndeterminate: false,
  toggleOrder: 'tf',
  keepColor: false,
  color: 'primary',
  disable: false,
  dense: false,
  leftLabel: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean | any]
}>()
</script>
