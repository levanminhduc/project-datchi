<script setup lang="ts">
/**
 * TabPanel - Tab content panel wrapper
 * Wraps QTabPanel with standardized props
 */

interface Props {
  name: string | number
  disable?: boolean
  keepAlive?: boolean
  keepAliveInclude?: string | RegExp | string[]
  keepAliveExclude?: string | RegExp | string[]
  keepAliveMax?: number
}

const props = withDefaults(defineProps<Props>(), {
  disable: false,
  keepAlive: false
})
</script>

<template>
  <q-tab-panel
    :name="name"
    :disable="disable"
    :keep-alive="keepAlive"
    :keep-alive-include="keepAliveInclude"
    :keep-alive-exclude="keepAliveExclude"
    :keep-alive-max="keepAliveMax"
  >
    <slot />
  </q-tab-panel>
</template>
