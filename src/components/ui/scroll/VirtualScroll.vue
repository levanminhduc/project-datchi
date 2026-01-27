<script setup lang="ts">
/**
 * VirtualScroll - Virtual scrolling for large lists
 * Wraps QVirtualScroll for performance
 */
import { ref } from 'vue'

interface Props {
  items?: any[]
  itemsFn?: (from: number, size: number) => any[]
  itemsSize?: number
  virtualScrollSliceSize?: number | string
  virtualScrollSliceRatioBefore?: number | string
  virtualScrollSliceRatioAfter?: number | string
  virtualScrollItemSize?: number | string
  virtualScrollStickySizeStart?: number | string
  virtualScrollStickySizeEnd?: number | string
  scrollTarget?: Element | string
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  virtualScrollSliceSize: 30,
  virtualScrollSliceRatioBefore: 1,
  virtualScrollSliceRatioAfter: 1,
  virtualScrollItemSize: 24
})

const virtualScrollRef = ref<any>(null)

defineExpose({
  scrollTo: (index: number, edge?: 'start' | 'center' | 'end') =>
    virtualScrollRef.value?.scrollTo?.(index, edge),
  reset: () => virtualScrollRef.value?.reset?.(),
  refresh: (index?: number) => virtualScrollRef.value?.refresh?.(index)
})
</script>

<template>
  <q-virtual-scroll
    ref="virtualScrollRef"
    :items="items"
    :items-fn="itemsFn"
    :items-size="itemsSize"
    :virtual-scroll-slice-size="virtualScrollSliceSize"
    :virtual-scroll-slice-ratio-before="virtualScrollSliceRatioBefore"
    :virtual-scroll-slice-ratio-after="virtualScrollSliceRatioAfter"
    :virtual-scroll-item-size="virtualScrollItemSize"
    :virtual-scroll-sticky-size-start="virtualScrollStickySizeStart"
    :virtual-scroll-sticky-size-end="virtualScrollStickySizeEnd"
    :scroll-target="scrollTarget"
    v-slot="{ item, index }"
  >
    <slot :item="item" :index="index" />
  </q-virtual-scroll>
</template>
