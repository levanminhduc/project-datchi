<template>
  <q-btn
    v-bind="$attrs"
    :icon="icon"
    :color="color"
    :size="size"
    :disable="disable"
    :loading="loading"
    :flat="flat"
    :round="round"
    :dense="dense"
    @click="handleClick"
  >
    <slot />
  </q-btn>
</template>

<script setup lang="ts">
import type { IconButtonProps } from '@/types/ui'

const props = withDefaults(defineProps<IconButtonProps>(), {
  color: 'primary',
  size: 'md',
  disable: false,
  loading: false,
  flat: true,
  round: true,
  dense: true,
})

const emit = defineEmits<{
  click: [event: Event]
}>()

const handleClick = (event: Event) => {
  if (!props.disable && !props.loading) {
    emit('click', event)
  }
}
</script>
