<template>
  <AppInput
    v-bind="$attrs"
    :model-value="modelValue"
    type="textarea"
    :label="label"
    :hint="hint"
    :placeholder="placeholder"
    :outlined="outlined"
    :filled="filled"
    :dense="dense"
    :disable="disable"
    :readonly="readonly"
    :rules="rules"
    :required="required"
    :error-message="errorMessage"
    :debounce="debounce"
    :autofocus="autofocus"
    :autogrow="autogrow"
    :maxlength="maxlength"
    :counter="counter"
    :color="color"
    :stack-label="stackLabel"
    :hide-bottom-space="hideBottomSpace"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
import type { AppTextareaProps } from '@/types/ui'
import AppInput from './AppInput.vue'

withDefaults(defineProps<AppTextareaProps>(), {
  outlined: true,
  filled: false,
  dense: false,
  disable: false,
  readonly: false,
  required: false,
  debounce: 0,
  autofocus: false,
  autogrow: true,
  counter: false,
  stackLabel: false,
  hideBottomSpace: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null]
}>()
</script>
