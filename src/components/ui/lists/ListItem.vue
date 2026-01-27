<template>
  <q-item
    v-bind="$attrs"
    :clickable="clickable"
    :active="active"
    :active-class="activeClass"
    :focused="focused"
    :manual-focus="manualFocus"
    :dense="dense"
    :inset-level="insetLevel"
    :to="to"
    :href="href"
    :target="target"
    :disable="disable"
    :dark="dark"
    :ripple="ripple"
    @click="emit('click', $event)"
  >
    <slot />
  </q-item>
</template>

<script setup lang="ts">
import type { ListItemProps } from '@/types/ui'

withDefaults(defineProps<ListItemProps>(), {
  clickable: false,
  active: false,
  focused: false,
  manualFocus: false,
  dense: false,
  disable: false,
  ripple: true,
})

const emit = defineEmits<{
  click: [event: Event]
}>()
</script>
