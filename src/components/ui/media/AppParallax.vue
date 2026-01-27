<script setup lang="ts">
/**
 * AppParallax - Parallax image wrapper
 * Wraps QParallax for parallax scrolling effect
 */

interface Props {
  src: string
  height?: number
  speed?: number
  scrollTarget?: string | Element
}

const props = withDefaults(defineProps<Props>(), {
  height: 500,
  speed: 1
})
</script>

<template>
  <q-parallax
    :src="src"
    :height="height"
    :speed="speed"
    :scroll-target="scrollTarget"
  >
    <slot />
  </q-parallax>
</template>
