<template>
  <q-btn-group
    v-bind="$attrs"
    :spread="spread"
    :stretch="stretch"
    :flat="flat"
    :outline="outline"
    :push="push"
    :rounded="rounded"
    :square="square"
    :unelevated="unelevated"
  >
    <slot />
  </q-btn-group>
</template>

<script setup lang="ts">
import type { ButtonGroupProps } from '@/types/ui'

withDefaults(defineProps<ButtonGroupProps>(), {
  spread: false,
  stretch: false,
  flat: false,
  outline: false,
  push: false,
  rounded: false,
  square: false,
  unelevated: true,
})
</script>
