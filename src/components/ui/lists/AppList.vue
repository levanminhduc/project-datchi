<template>
  <q-list
    v-bind="$attrs"
    :bordered="bordered"
    :dense="dense"
    :separator="separator"
    :padding="padding"
    :dark="dark"
  >
    <slot />
  </q-list>
</template>

<script setup lang="ts">
import type { AppListProps } from '@/types/ui'

withDefaults(defineProps<AppListProps>(), {
  bordered: false,
  dense: false,
  separator: false,
  padding: false,
})
</script>
