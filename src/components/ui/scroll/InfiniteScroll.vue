<script setup lang="ts">
/**
 * InfiniteScroll - Infinite scrolling wrapper
 * Wraps QInfiniteScroll for lazy loading
 */
import { ref } from 'vue'

interface Props {
  offset?: number
  debounce?: number | string
  scrollTarget?: Element | string
  disable?: boolean
  reverse?: boolean
}

withDefaults(defineProps<Props>(), {
  offset: 500,
  debounce: 100,
  disable: false,
  reverse: false
})

const emit = defineEmits<{
  load: [index: number, done: (stop?: boolean) => void]
}>()

const infiniteScrollRef = ref<any>(null)

const onLoad = (index: number, done: (stop?: boolean) => void) => {
  emit('load', index, done)
}

defineExpose({
  poll: () => infiniteScrollRef.value?.poll?.(),
  trigger: () => infiniteScrollRef.value?.trigger?.(),
  stop: () => infiniteScrollRef.value?.stop?.(),
  reset: () => infiniteScrollRef.value?.reset?.(),
  resume: () => infiniteScrollRef.value?.resume?.()
})
</script>

<template>
  <q-infinite-scroll
    ref="infiniteScrollRef"
    :offset="offset"
    :debounce="debounce"
    :scroll-target="scrollTarget"
    :disable="disable"
    :reverse="reverse"
    @load="onLoad"
  >
    <slot />
    <template #loading>
      <slot name="loading">
        <div class="row justify-center q-my-md">
          <q-spinner
            color="primary"
            size="40px"
          />
        </div>
      </slot>
    </template>
  </q-infinite-scroll>
</template>
