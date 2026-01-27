<template>
  <q-card
    v-bind="$attrs"
    :flat="flat"
    :bordered="bordered"
    :square="square"
    :dark="dark"
    :tag="tag"
  >
    <slot />
  </q-card>
</template>

<script setup lang="ts">
import type { AppCardProps } from '@/types/ui'

withDefaults(defineProps<AppCardProps>(), {
  flat: false,
  bordered: false,
  square: false,
  tag: 'div',
})
</script>
