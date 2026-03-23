<template>
  <q-btn-dropdown
    v-bind="$attrs"
    :model-value="modelValue"
    :color="color"
    :text-color="textColor"
    :label="label"
    :icon="icon"
    :icon-right="iconRight"
    :split="split"
    :disable="disable"
    :no-icon-animation="noIconAnimation"
    :size="size"
    :dense="dense"
    :flat="flat"
    :unelevated="unelevated"
    :outline="outline"
    :push="push"
    :no-caps="noCaps"
    :round="round"
    :rounded="rounded"
    :square="square"
    :ripple="ripple"
    :menu-offset="menuOffset"
    :auto-close="autoClose"
    @update:model-value="emit('update:modelValue', $event)"
    @click="emit('click', $event)"
  >
    <slot />
  </q-btn-dropdown>
</template>

<script setup lang="ts">
import type { ButtonDropdownProps } from '@/types/ui'

withDefaults(defineProps<ButtonDropdownProps>(), {
  color: 'primary',
  split: false,
  disable: false,
  noIconAnimation: false,
  size: 'md',
  dense: false,
  flat: false,
  unelevated: true,
  outline: false,
  push: false,
  noCaps: true,
  round: false,
  rounded: false,
  square: false,
  ripple: true,
  autoClose: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  click: [event: Event]
}>()
</script>
