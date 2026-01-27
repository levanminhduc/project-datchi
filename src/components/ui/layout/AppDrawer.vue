<script setup lang="ts">
/**
 * AppDrawer - Drawer/sidebar wrapper
 * Wraps QDrawer with standardized props
 */
import { computed } from 'vue'

type DrawerSide = 'left' | 'right'
type DrawerBehavior = 'default' | 'desktop' | 'mobile'

interface Props {
  modelValue?: boolean
  side?: DrawerSide
  width?: number
  mini?: boolean
  miniWidth?: number
  miniToOverlay?: boolean
  breakpoint?: number
  behavior?: DrawerBehavior
  bordered?: boolean
  elevated?: boolean
  overlay?: boolean
  persistent?: boolean
  noSwipeOpen?: boolean
  noSwipeClose?: boolean
  noSwipeBackdrop?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  side: 'left',
  width: 300,
  mini: false,
  miniWidth: 57,
  miniToOverlay: false,
  breakpoint: 1023,
  behavior: 'default',
  bordered: false,
  elevated: false,
  overlay: false,
  persistent: false,
  noSwipeOpen: false,
  noSwipeClose: false,
  noSwipeBackdrop: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const drawerValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
</script>

<template>
  <q-drawer
    v-model="drawerValue"
    :side="side"
    :width="width"
    :mini="mini"
    :mini-width="miniWidth"
    :mini-to-overlay="miniToOverlay"
    :breakpoint="breakpoint"
    :behavior="behavior"
    :bordered="bordered"
    :elevated="elevated"
    :overlay="overlay"
    :persistent="persistent"
    :no-swipe-open="noSwipeOpen"
    :no-swipe-close="noSwipeClose"
    :no-swipe-backdrop="noSwipeBackdrop"
  >
    <slot />
  </q-drawer>
</template>
