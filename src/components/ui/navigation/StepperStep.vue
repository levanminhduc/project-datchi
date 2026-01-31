<script setup lang="ts">
/**
 * StepperStep - Individual step wrapper
 * Wraps QStep for use inside AppStepper or QStepper
 */
import type { Color } from '@/types/ui'

interface Props {
  name: string | number
  title: string
  caption?: string
  prefix?: string | number
  icon?: string
  activeIcon?: string
  doneIcon?: string
  errorIcon?: string
  color?: Color
  done?: boolean
  error?: boolean
  disable?: boolean
  headerNav?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  done: false,
  error: false,
  disable: false,
  headerNav: true
})
</script>

<template>
  <q-step
    :name="name"
    :title="title"
    :caption="caption"
    :prefix="prefix"
    :icon="icon"
    :active-icon="activeIcon"
    :done-icon="doneIcon"
    :error-icon="errorIcon"
    :color="color"
    :done="done"
    :error="error"
    :disable="disable"
    :header-nav="headerNav"
  >
    <slot />
  </q-step>
</template>
