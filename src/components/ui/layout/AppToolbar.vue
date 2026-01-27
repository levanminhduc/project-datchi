<script setup lang="ts">
/**
 * AppToolbar - Toolbar wrapper
 * Wraps QToolbar with standardized props
 */

interface Props {
  inset?: boolean
  dense?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  inset: false,
  dense: false
})
</script>

<template>
  <q-toolbar :inset="inset" :dense="dense">
    <slot name="left" />
    <q-toolbar-title>
      <slot name="title" />
      <slot />
    </q-toolbar-title>
    <slot name="right" />
  </q-toolbar>
</template>
