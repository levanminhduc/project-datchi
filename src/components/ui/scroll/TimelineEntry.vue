<script setup lang="ts">
/**
 * TimelineEntry - Individual timeline entry
 * Wraps QTimelineEntry for custom content
 */
import type { Color } from '@/types/ui'

interface Props {
  title?: string
  subtitle?: string
  body?: string
  color?: Color
  icon?: string
  avatar?: string
  side?: 'left' | 'right'
  heading?: boolean
  tag?: string
}

const props = withDefaults(defineProps<Props>(), {
  color: 'primary',
  heading: false,
  tag: 'div'
})
</script>

<template>
  <q-timeline-entry
    :title="title"
    :subtitle="subtitle"
    :body="body"
    :color="color"
    :icon="icon"
    :avatar="avatar"
    :side="side"
    :heading="heading"
    :tag="tag"
  >
    <template v-if="$slots.title" #title>
      <slot name="title" />
    </template>
    <template v-if="$slots.subtitle" #subtitle>
      <slot name="subtitle" />
    </template>
    <template v-if="$slots.body" #default>
      <slot name="body" />
    </template>
    <slot />
  </q-timeline-entry>
</template>
