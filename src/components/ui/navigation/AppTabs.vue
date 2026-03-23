<script setup lang="ts">
/**
 * AppTabs - Tab navigation wrapper
 * Wraps QTabs with standardized props
 */
import { computed } from 'vue'
import type { Color } from '@/types/ui'

interface TabConfig {
  name: string
  label: string
  icon?: string
  disable?: boolean
  alert?: boolean | string
  alertIcon?: string
}

interface Props {
  modelValue?: string | number
  tabs?: TabConfig[]
  vertical?: boolean
  outsideArrows?: boolean
  mobileArrows?: boolean
  align?: 'left' | 'center' | 'right' | 'justify'
  breakpoint?: number
  activeColor?: Color
  indicatorColor?: Color
  dense?: boolean
  noCaps?: boolean
  inlineLabel?: boolean
  switchIndicator?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  tabs: () => [],
  vertical: false,
  outsideArrows: false,
  mobileArrows: false,
  align: 'left',
  dense: false,
  noCaps: true,
  inlineLabel: false,
  switchIndicator: false,
  activeColor: 'primary',
  indicatorColor: 'primary'
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const tabValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val!)
})
</script>

<template>
  <q-tabs
    v-model="tabValue"
    :vertical="vertical"
    :outside-arrows="outsideArrows"
    :mobile-arrows="mobileArrows"
    :align="align"
    :breakpoint="breakpoint"
    :active-color="activeColor"
    :indicator-color="indicatorColor"
    :dense="dense"
    :no-caps="noCaps"
    :inline-label="inlineLabel"
    :switch-indicator="switchIndicator"
  >
    <q-tab
      v-for="tab in tabs"
      :key="tab.name"
      :name="tab.name"
      :label="tab.label"
      :icon="tab.icon"
      :disable="tab.disable"
      :alert="tab.alert"
      :alert-icon="tab.alertIcon"
    />
    <slot />
  </q-tabs>
</template>
