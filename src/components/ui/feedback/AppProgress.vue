<template>
  <q-linear-progress
    v-bind="$attrs"
    :value="value"
    :buffer="buffer"
    :indeterminate="indeterminate"
    :query="query"
    :stripe="stripe"
    :animation-speed="animationSpeed"
    :color="color"
    :track-color="trackColor"
    :instant-feedback="instantFeedback"
    :rounded="rounded"
    :size="size"
    :dark="dark"
  >
    <template
      v-if="showValue && !indeterminate"
      #default
    >
      <div class="absolute-full flex flex-center">
        <q-badge
          color="white"
          text-color="primary"
          :label="progressLabel"
        />
      </div>
    </template>
    <slot />
  </q-linear-progress>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AppProgressProps } from '@/types/ui'

const props = withDefaults(defineProps<AppProgressProps>(), {
  value: 0,
  indeterminate: false,
  query: false,
  stripe: false,
  color: 'primary',
  instantFeedback: false,
  rounded: false,
  size: '4px',
  showValue: false,
})

const progressLabel = computed(() => `${Math.round((props.value || 0) * 100)}%`)
</script>
