<script setup lang="ts">
/**
 * AppPagination - Pagination wrapper with Vietnamese defaults
 * Wraps QPagination with standardized props
 */
import { computed } from 'vue'
import type { Color } from '@/types/ui'

interface Props {
  modelValue?: number
  min?: number
  max?: number
  maxPages?: number
  boundaryLinks?: boolean
  boundaryNumbers?: boolean
  directionLinks?: boolean
  ellipses?: boolean
  color?: Color
  textColor?: string
  activeColor?: Color
  activeTextColor?: string
  round?: boolean
  rounded?: boolean
  flat?: boolean
  outline?: boolean
  unelevated?: boolean
  dense?: boolean
  size?: string
  ripple?: boolean
  inputStyle?: string | Record<string, string>
  inputClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 1,
  min: 1,
  max: 1,
  maxPages: 7,
  boundaryLinks: true,
  boundaryNumbers: false,
  directionLinks: true,
  ellipses: true,
  color: 'primary',
  activeColor: 'primary',
  round: false,
  rounded: false,
  flat: false,
  outline: false,
  unelevated: false,
  dense: false,
  ripple: true
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const pageValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val!)
})
</script>

<template>
  <q-pagination
    v-model="pageValue"
    :min="min"
    :max="max"
    :max-pages="maxPages"
    :boundary-links="boundaryLinks"
    :boundary-numbers="boundaryNumbers"
    :direction-links="directionLinks"
    :ellipses="ellipses"
    :color="color"
    :text-color="textColor"
    :active-color="activeColor"
    :active-text-color="activeTextColor"
    :round="round"
    :rounded="rounded"
    :flat="flat"
    :outline="outline"
    :unelevated="unelevated"
    :dense="dense"
    :size="size"
    :ripple="ripple"
    :input-style="inputStyle"
    :input-class="inputClass"
  />
</template>
