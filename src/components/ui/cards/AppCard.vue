<template>
  <q-card
    v-bind="$attrs"
    :flat="flat"
    :bordered="bordered"
    :square="square"
    :dark="isDark"
    :tag="tag"
  >
    <slot />
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import type { AppCardProps } from '@/types/ui'

const props = withDefaults(defineProps<AppCardProps>(), {
  flat: false,
  bordered: false,
  square: false,
  tag: 'div',
})

const $q = useQuasar()

// Auto-detect dark mode from Quasar, allow override via prop
const isDark = computed(() => props.dark ?? $q.dark.isActive)
</script>
