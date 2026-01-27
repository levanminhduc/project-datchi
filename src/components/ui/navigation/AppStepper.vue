<script setup lang="ts">
/**
 * AppStepper - Step wizard navigation wrapper
 * Wraps QStepper with standardized props
 */
import { computed } from 'vue'
import type { Color } from '@/types/ui'

interface StepConfig {
  name: string | number
  title: string
  caption?: string
  icon?: string
  activeIcon?: string
  doneIcon?: string
  errorIcon?: string
  color?: Color
  done?: boolean
  error?: boolean
  disable?: boolean
}

interface Props {
  modelValue?: string | number
  steps?: StepConfig[]
  vertical?: boolean
  headerNav?: boolean
  flat?: boolean
  bordered?: boolean
  alternativeLabels?: boolean
  contractedLabelBreakpoint?: number
  inactiveColor?: Color
  inactiveIcon?: string
  doneIcon?: string
  doneColor?: Color
  activeIcon?: string
  activeColor?: Color
  errorIcon?: string
  errorColor?: Color
  animated?: boolean
  keepAlive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  steps: () => [],
  vertical: false,
  headerNav: true,
  flat: false,
  bordered: false,
  alternativeLabels: false,
  doneColor: 'positive',
  activeColor: 'primary',
  errorColor: 'negative',
  animated: true,
  keepAlive: true
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const stepValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val!)
})
</script>

<template>
  <q-stepper
    v-model="stepValue"
    :vertical="vertical"
    :header-nav="headerNav"
    :flat="flat"
    :bordered="bordered"
    :alternative-labels="alternativeLabels"
    :contracted="!!contractedLabelBreakpoint"
    :inactive-color="inactiveColor"
    :inactive-icon="inactiveIcon"
    :done-icon="doneIcon"
    :done-color="doneColor"
    :active-icon="activeIcon"
    :active-color="activeColor"
    :error-icon="errorIcon"
    :error-color="errorColor"
    :animated="animated"
    :keep-alive="keepAlive"
  >
    <q-step
      v-for="step in steps"
      :key="step.name"
      :name="step.name"
      :title="step.title"
      :caption="step.caption"
      :icon="step.icon"
      :active-icon="step.activeIcon"
      :done-icon="step.doneIcon"
      :error-icon="step.errorIcon"
      :color="step.color"
      :done="step.done"
      :error="step.error"
      :disable="step.disable"
      :header-nav="headerNav"
    >
      <slot :name="`step-${step.name}`" :step="step" />
    </q-step>
    <slot />

    <template #navigation>
      <slot name="navigation" />
    </template>
  </q-stepper>
</template>
