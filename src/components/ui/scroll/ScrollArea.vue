<script setup lang="ts">
/**
 * ScrollArea - Custom scrollbar wrapper
 * Wraps QScrollArea with standardized props
 */
import { ref } from 'vue'

interface Props {
  dark?: boolean
  thumbStyle?: string | Record<string, string>
  barStyle?: string | Record<string, string>
  contentStyle?: string | Record<string, string>
  contentActiveStyle?: string | Record<string, string>
  visible?: boolean
  delay?: number
  tabindex?: number | string
}

const props = withDefaults(defineProps<Props>(), {
  dark: false,
  visible: false,
  delay: 1000
})

const scrollAreaRef = ref<any>(null)

// Expose scroll methods
defineExpose({
  getScrollTarget: () => scrollAreaRef.value?.getScrollTarget?.(),
  getScrollPosition: () => scrollAreaRef.value?.getScrollPosition?.(),
  setScrollPosition: (axis: 'vertical' | 'horizontal', offset: number, duration?: number) => 
    scrollAreaRef.value?.setScrollPosition?.(axis, offset, duration),
  setScrollPercentage: (axis: 'vertical' | 'horizontal', offset: number, duration?: number) =>
    scrollAreaRef.value?.setScrollPercentage?.(axis, offset, duration)
})
</script>

<template>
  <q-scroll-area
    ref="scrollAreaRef"
    :dark="dark"
    :thumb-style="thumbStyle"
    :bar-style="barStyle"
    :content-style="contentStyle"
    :content-active-style="contentActiveStyle"
    :visible="visible"
    :delay="delay"
    :tabindex="tabindex"
  >
    <slot />
  </q-scroll-area>
</template>
