<template>
  <q-checkbox
    v-bind="$attrs"
    :model-value="modelValue"
    :label="label"
    :true-value="trueValue"
    :false-value="falseValue"
    :indeterminate-value="indeterminateValue"
    :toggle-indeterminate="toggleIndeterminate"
    :toggle-order="toggleOrder"
    :keep-color="keepColor"
    :color="color"
    :disable="disable"
    :dense="dense"
    :size="size"
    :left-label="leftLabel"
    :checked-icon="checkedIcon"
    :unchecked-icon="uncheckedIcon"
    :indeterminate-icon="indeterminateIcon"
    :dark="dark"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <slot />
  </q-checkbox>
</template>

<script setup lang="ts">
import type { AppCheckboxProps } from '@/types/ui'

withDefaults(defineProps<AppCheckboxProps>(), {
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
  'update:modelValue': [value: boolean | any[] | null]
}>()
</script>
