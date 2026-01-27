<script setup lang="ts">
/**
 * AppVideo - Video embed wrapper
 * Wraps QVideo for iframe embeds
 */

interface Props {
  src: string
  ratio?: string | number
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  ratio: '16/9',
  title: 'Video'
})
</script>

<template>
  <q-video
    :src="src"
    :ratio="ratio"
    :title="title"
  />
</template>
