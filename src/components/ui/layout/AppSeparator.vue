<script setup lang="ts">
/**
 * AppSeparator - Separator/divider wrapper
 * Wraps QSeparator with standardized props
 */
import type { Color } from '@/types/ui'

interface Props {
  dark?: boolean
  spaced?: boolean | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  inset?: boolean | 'item' | 'item-thumbnail'
  vertical?: boolean
  color?: Color
  size?: string
}

const props = withDefaults(defineProps<Props>(), {
  dark: false,
  spaced: false,
  inset: false,
  vertical: false
})
</script>

<template>
  <q-separator
    :dark="dark"
    :spaced="spaced"
    :inset="inset"
    :vertical="vertical"
    :color="color"
    :size="size"
  />
</template>
