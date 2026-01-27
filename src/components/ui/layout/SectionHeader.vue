<script setup lang="ts">
/**
 * SectionHeader - Section title component
 * Displays section title with optional subtitle and action
 */
import { computed } from 'vue'

interface Props {
  title: string
  subtitle?: string
  icon?: string
  dense?: boolean
  bordered?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  dense: false,
  bordered: false
})

const headerClass = computed(() => ({
  'q-py-xs': props.dense,
  'q-py-sm': !props.dense,
  'q-pb-sm q-mb-sm': props.bordered
}))

const headerStyle = computed(() => 
  props.bordered ? { borderBottom: '1px solid rgba(0,0,0,0.12)' } : {}
)
</script>

<template>
  <div class="section-header row items-center" :class="headerClass" :style="headerStyle">
    <!-- Icon -->
    <q-icon
      v-if="icon"
      :name="icon"
      size="20px"
      class="q-mr-sm text-grey-7"
    />

    <!-- Title & Subtitle -->
    <div class="col">
      <div class="text-subtitle1 text-weight-medium">{{ title }}</div>
      <div v-if="subtitle" class="text-caption text-grey">{{ subtitle }}</div>
    </div>

    <!-- Action slot -->
    <slot name="action" />
  </div>
</template>
