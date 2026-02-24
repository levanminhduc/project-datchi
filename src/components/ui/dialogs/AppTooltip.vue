<script setup lang="ts">
/**
 * AppTooltip - Tooltip wrapper component
 * Simple wrapper for QTooltip with standardized props
 */

interface Props {
  /** Tooltip text content */
  text?: string
  /** Anchor position on parent */
  anchor?: any
  /** Self alignment point */
  self?: any
  /** Offset from anchor [x, y] */
  offset?: [number, number]
  /** Delay before showing (ms) */
  delay?: number
  /** Delay before hiding (ms) */
  hideDelay?: number
  /** Max width of tooltip */
  maxWidth?: string
  /** Transition for showing */
  transitionShow?: string
  /** Transition for hiding */
  transitionHide?: string
  /** Background class */
  contentClass?: string
  /** Text color class */
  contentStyle?: string | Record<string, string>
}

withDefaults(defineProps<Props>(), {
  text: '',
  anchor: 'top middle',
  self: 'bottom middle',
  delay: 300,
  hideDelay: 0,
  maxWidth: '300px',
  transitionShow: 'jump-down',
  transitionHide: 'jump-up'
})
</script>

<template>
  <q-tooltip
    :anchor="anchor"
    :self="self"
    :offset="offset"
    :delay="delay"
    :hide-delay="hideDelay"
    :max-width="maxWidth"
    :transition-show="transitionShow"
    :transition-hide="transitionHide"
    :class="contentClass"
    :style="contentStyle"
  >
    <template v-if="$slots.default">
      <slot />
    </template>
    <template v-else>
      {{ text }}
    </template>
  </q-tooltip>
</template>
