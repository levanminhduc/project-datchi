<script setup lang="ts">
/**
 * AppSeparator - Separator/divider wrapper
 * Wraps QSeparator with standardized props
 */
import { computed } from 'vue'
import { useQuasar } from 'quasar'
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
  spaced: false,
  inset: false,
  vertical: false
})

const $q = useQuasar()
const isDark = computed(() => props.dark ?? $q.dark.isActive)
</script>

<template>
  <q-separator
    :dark="isDark"
    :spaced="spaced"
    :inset="inset"
    :vertical="vertical"
    :color="color"
    :size="size"
  />
</template>
