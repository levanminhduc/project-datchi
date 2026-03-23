<script setup lang="ts">
/**
 * Timeline - Timeline wrapper
 * Wraps QTimeline with entries array support
 */
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import type { Color } from '@/types/ui'

interface TimelineEntryConfig {
  title: string
  subtitle?: string
  body?: string
  color?: Color
  icon?: string
  side?: 'left' | 'right'
  avatar?: string
}

interface Props {
  entries?: TimelineEntryConfig[]
  color?: Color
  side?: 'left' | 'right'
  layout?: 'dense' | 'comfortable' | 'loose'
  dark?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  entries: () => [],
  color: 'primary',
  side: 'right',
  layout: 'comfortable'
})

const $q = useQuasar()
const isDark = computed(() => props.dark ?? $q.dark.isActive)
</script>

<template>
  <q-timeline
    :color="color"
    :side="side"
    :layout="layout"
    :dark="isDark"
  >
    <q-timeline-entry
      v-for="(entry, index) in entries"
      :key="index"
      :title="entry.title"
      :subtitle="entry.subtitle"
      :body="entry.body"
      :color="entry.color || color"
      :icon="entry.icon"
      :side="entry.side"
      :avatar="entry.avatar"
    />
    <slot />
  </q-timeline>
</template>
