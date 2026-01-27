<script setup lang="ts">
/**
 * TimePicker - Time picker wrapper
 * Wraps QTime with 24h format default
 */
import { computed } from 'vue'
import type { Color } from '@/types/ui'

interface Props {
  modelValue?: string | null
  mask?: string
  landscape?: boolean
  color?: Color
  textColor?: string
  dark?: boolean
  square?: boolean
  flat?: boolean
  bordered?: boolean
  readonly?: boolean
  disable?: boolean
  format24h?: boolean
  withSeconds?: boolean
  nowBtn?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mask: 'HH:mm',
  landscape: false,
  color: 'primary',
  dark: false,
  square: false,
  flat: false,
  bordered: true,
  readonly: false,
  disable: false,
  format24h: true,
  withSeconds: false,
  nowBtn: true
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const timeValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val ?? null)
})
</script>

<template>
  <q-time
    v-model="timeValue"
    :mask="mask"
    :landscape="landscape"
    :color="color"
    :text-color="textColor"
    :dark="dark"
    :square="square"
    :flat="flat"
    :bordered="bordered"
    :readonly="readonly"
    :disable="disable"
    :format24h="format24h"
    :with-seconds="withSeconds"
    :now-btn="nowBtn"
  />
</template>
