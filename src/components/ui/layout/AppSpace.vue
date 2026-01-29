<script setup lang="ts">
/**
 * AppSpace - Spacing utility component
 * Creates consistent spacing between elements
 */
import { computed } from 'vue'

interface Props {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string
  horizontal?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  horizontal: false
})

const sizeMap: Record<string, string> = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px'
}

const spaceStyle = computed(() => {
  const dimension = sizeMap[props.size] || props.size
  return props.horizontal
    ? { width: dimension, display: 'inline-block' }
    : { height: dimension }
})
</script>

<template>
  <div
    :style="spaceStyle"
    aria-hidden="true"
  />
</template>
