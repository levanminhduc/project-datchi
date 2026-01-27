<template>
  <q-badge
    v-bind="$attrs"
    :color="color"
    :text-color="textColor"
    :floating="floating"
    :transparent="transparent"
    :multi-line="multiLine"
    :outline="outline"
    :rounded="rounded"
    :label="label"
    :align="align"
  >
    <slot />
  </q-badge>
</template>

<script setup lang="ts">
import type { AppBadgeProps } from '@/types/ui'

withDefaults(defineProps<AppBadgeProps>(), {
  color: 'primary',
  floating: false,
  transparent: false,
  multiLine: false,
  outline: false,
  rounded: false,
  align: 'top',
})
</script>
