<template>
  <q-btn
    v-bind="$attrs"
    :color="computedColor"
    :size="size"
    :loading="loading"
    :disable="disable || loading"
    :icon="icon"
    :icon-right="iconRight"
    :label="label"
    :type="type"
    :unelevated="variant === 'filled'"
    :flat="variant === 'flat' || variant === 'text'"
    :outline="variant === 'outlined'"
    :round="round"
    :dense="dense"
    :no-caps="noCaps"
    :class="{ 'full-width': block }"
    @click="handleClick"
  >
    <slot />
    <template v-if="$slots.loading" #loading>
      <slot name="loading" />
    </template>
  </q-btn>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AppButtonProps } from '@/types/ui'

const props = withDefaults(defineProps<AppButtonProps>(), {
  color: 'primary',
  size: 'md',
  variant: 'filled',
  loading: false,
  disable: false,
  round: false,
  dense: false,
  block: false,
  noCaps: true,
  type: 'button',
})

const emit = defineEmits<{
  click: [event: Event]
}>()

const computedColor = computed(() => {
  if (props.variant === 'text') {
    return undefined
  }
  return props.color
})

const handleClick = (event: Event) => {
  if (!props.disable && !props.loading) {
    emit('click', event)
  }
}
</script>

<style scoped>
.full-width {
  width: 100%;
}
</style>
