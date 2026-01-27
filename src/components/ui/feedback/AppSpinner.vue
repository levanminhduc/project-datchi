<template>
  <q-spinner-dots
    v-bind="$attrs"
    :size="size"
    :color="color"
  />
</template>

<script setup lang="ts">
import type { AppSpinnerProps } from '@/types/ui'

withDefaults(defineProps<AppSpinnerProps>(), {
  size: '40px',
  color: 'primary',
})
</script>
