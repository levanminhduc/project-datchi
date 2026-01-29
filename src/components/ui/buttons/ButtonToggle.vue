<template>
  <q-btn-toggle
    v-bind="$attrs"
    :model-value="modelValue"
    :options="options"
    :color="color"
    :text-color="textColor"
    :toggle-color="toggleColor"
    :toggle-text-color="toggleTextColor"
    :spread="spread"
    :outline="outline"
    :flat="flat"
    :unelevated="unelevated"
    :square="square"
    :rounded="rounded"
    :push="push"
    :dense="dense"
    :readonly="readonly"
    :disable="disable"
    :stack="stack"
    :stretch="stretch"
    :no-caps="noCaps"
    :ripple="ripple"
    :size="size"
    :clearable="clearable"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <!-- Forward named slots for custom button content -->
    <template
      v-for="(_, name) in $slots"
      :key="name"
      #[name]
    >
      <slot :name="name" />
    </template>
  </q-btn-toggle>
</template>

<script setup lang="ts">
import type { ButtonToggleProps } from '@/types/ui'

withDefaults(defineProps<ButtonToggleProps>(), {
  color: 'primary',
  spread: false,
  outline: false,
  flat: false,
  unelevated: true,
  square: false,
  rounded: false,
  push: false,
  dense: false,
  readonly: false,
  disable: false,
  stack: false,
  stretch: false,
  noCaps: true,
  ripple: true,
  size: 'md',
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()
</script>
