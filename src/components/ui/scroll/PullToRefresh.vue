<script setup lang="ts">
/**
 * PullToRefresh - Pull to refresh wrapper
 * Wraps QPullToRefresh for mobile refresh
 */
import type { Color } from '@/types/ui'

interface Props {
  color?: Color
  bgColor?: string
  icon?: string
  noMouse?: boolean
  disable?: boolean
  scrollTarget?: Element | string
}

const props = withDefaults(defineProps<Props>(), {
  color: 'primary',
  icon: 'mdi-refresh',
  noMouse: false,
  disable: false
})

const emit = defineEmits<{
  refresh: [done: () => void]
}>()

const onRefresh = (done: () => void) => {
  emit('refresh', done)
}
</script>

<template>
  <q-pull-to-refresh
    :color="color"
    :bg-color="bgColor"
    :icon="icon"
    :no-mouse="noMouse"
    :disable="disable"
    :scroll-target="scrollTarget"
    @refresh="onRefresh"
  >
    <slot />
  </q-pull-to-refresh>
</template>
