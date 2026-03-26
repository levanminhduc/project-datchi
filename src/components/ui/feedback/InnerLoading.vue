<template>
  <q-inner-loading
    v-bind="$attrs"
    :showing="showing"
    :dark="dark"
    :transition-show="transitionShow"
    :transition-hide="transitionHide"
    :transition-duration="transitionDuration"
    :label="label"
    :label-class="labelClass"
    :label-style="labelStyle"
  >
    <slot>
      <AppSpinner
        :size="size"
        :color="color"
      />
    </slot>
  </q-inner-loading>
</template>

<script setup lang="ts">
import type { InnerLoadingProps } from '@/types/ui'
import AppSpinner from './AppSpinner.vue'

withDefaults(defineProps<InnerLoadingProps>(), {
  showing: false,
  transitionShow: 'fade',
  transitionHide: 'fade',
  transitionDuration: 300,
  size: '50px',
  color: 'primary',
})
</script>
