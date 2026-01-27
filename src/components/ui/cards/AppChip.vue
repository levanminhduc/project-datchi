<template>
  <q-chip
    v-bind="$attrs"
    :model-value="modelValue"
    :label="label"
    :icon="icon"
    :icon-right="iconRight"
    :icon-remove="iconRemove"
    :icon-selected="iconSelected"
    :color="color"
    :text-color="textColor"
    :selected="selected"
    :square="square"
    :outline="outline"
    :clickable="clickable"
    :removable="removable"
    :ripple="ripple"
    :disable="disable"
    :dense="dense"
    :size="size"
    :dark="dark"
    @update:model-value="emit('update:modelValue', $event)"
    @click="emit('click', $event)"
    @remove="emit('remove', $event)"
  >
    <slot />
  </q-chip>
</template>

<script setup lang="ts">
import type { AppChipProps } from '@/types/ui'

withDefaults(defineProps<AppChipProps>(), {
  color: 'primary',
  square: false,
  outline: false,
  clickable: false,
  removable: false,
  ripple: true,
  disable: false,
  dense: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  click: [event: Event]
  remove: [value: any]
}>()
</script>
