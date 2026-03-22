<template>
  <AppInput
    :model-value="modelValue"
    type="search"
    :placeholder="placeholder"
    :debounce="debounce"
    :dense="dense"
    :outlined="outlined"
    :loading="loading"
    :clearable="clearable"
    :autofocus="autofocus"
    prepend-icon="search"
    :class="inputClass"
    @update:model-value="emit('update:modelValue', $event as string)"
    @clear="emit('clear')"
  />
</template>

<script setup lang="ts">
import type { SearchInputProps } from '@/types/ui'
import AppInput from './AppInput.vue'

withDefaults(defineProps<SearchInputProps>(), {
  modelValue: '',
  placeholder: 'Tìm kiếm...',
  debounce: 300,
  dense: true,
  outlined: true,
  loading: false,
  clearable: true,
  autofocus: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  clear: []
}>()
</script>
