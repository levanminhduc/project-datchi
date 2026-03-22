<script setup lang="ts">
/**
 * FilePicker - File input wrapper
 * Wraps QFile with standardized props
 */
import { computed } from 'vue'
import type { Color } from '@/types/ui'

interface Props {
  modelValue?: File | File[] | null
  accept?: string
  multiple?: boolean
  maxFileSize?: number
  maxTotalSize?: number
  maxFiles?: number
  label?: string
  hint?: string
  clearable?: boolean
  outlined?: boolean
  filled?: boolean
  dense?: boolean
  disable?: boolean
  readonly?: boolean
  color?: Color
  useChips?: boolean
  counter?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false,
  label: 'Chọn tệp',
  clearable: true,
  outlined: true,
  filled: false,
  dense: false,
  disable: false,
  readonly: false,
  color: 'primary',
  useChips: false,
  counter: false
})

const emit = defineEmits<{
  'update:modelValue': [value: File | File[] | null]
  rejected: [entries: any[]]
}>()

const fileValue = computed({
  get: () => props.modelValue ?? null,
  set: (val) => emit('update:modelValue', val ?? null)
})

const onRejected = (rejectedEntries: any[]) => {
  emit('rejected', rejectedEntries)
}
</script>

<template>
  <q-file
    v-model="fileValue"
    :accept="accept"
    :multiple="multiple"
    :max-file-size="maxFileSize"
    :max-total-size="maxTotalSize"
    :max-files="maxFiles"
    :label="label"
    :hint="hint"
    :clearable="clearable"
    :outlined="outlined"
    :filled="filled"
    :dense="dense"
    :disable="disable"
    :readonly="readonly"
    :color="color"
    :use-chips="useChips"
    :counter="counter"
    @rejected="onRejected"
  >
    <template #prepend>
      <q-icon name="mdi-attachment" />
    </template>
  </q-file>
</template>
