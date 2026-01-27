<template>
  <q-banner
    v-bind="$attrs"
    :inline="inline"
    :dense="dense"
    :rounded="rounded"
    :dark="dark"
  >
    <template v-if="$slots.avatar" #avatar>
      <slot name="avatar" />
    </template>
    
    <slot />
    
    <template v-if="$slots.action" #action>
      <slot name="action" />
    </template>
  </q-banner>
</template>

<script setup lang="ts">
import type { AppBannerProps } from '@/types/ui'

withDefaults(defineProps<AppBannerProps>(), {
  inline: false,
  dense: false,
  rounded: false,
})
</script>
