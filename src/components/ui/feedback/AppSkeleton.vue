<template>
  <q-skeleton
    v-bind="$attrs"
    :type="type"
    :animation="animation"
    :animation-speed="animationSpeed"
    :square="square"
    :bordered="bordered"
    :size="size"
    :width="width"
    :height="height"
    :dark="dark"
  />
</template>

<script setup lang="ts">
import type { AppSkeletonProps } from '@/types/ui'

withDefaults(defineProps<AppSkeletonProps>(), {
  type: 'rect',
  animation: 'wave',
  animationSpeed: 1500,
  square: false,
  bordered: false,
})
</script>
