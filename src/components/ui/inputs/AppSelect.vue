<template>
  <q-select
    v-bind="$attrs"
    :model-value="modelValue"
    :options="computedOptions"
    :option-value="optionValue"
    :option-label="optionLabel"
    :option-disable="optionDisable"
    :multiple="multiple"
    :label="label"
    :hint="hint"
    :outlined="outlined"
    :filled="filled"
    :dense="dense"
    :disable="disable"
    :readonly="readonly"
    :clearable="clearable"
    :use-input="useInput"
    :use-chips="useChips"
    :emit-value="emitValue"
    :map-options="mapOptions"
    :color="color"
    :loading="loading"
    :popup-content-class="popupContentClass"
    :popup-content-style="popupContentStyle"
    :hide-dropdown-icon="hideDropdownIcon"
    :behavior="behavior"
    :dropdown-icon="dropdownIcon"
    :new-value-mode="newValueMode"
    :max-values="maxValues"
    :options-dense="optionsDense"
    :virtual-scroll-slice-size="virtualScrollSliceSize"
    :input-debounce="inputDebounce"
    :hide-selected="hideSelected"
    :fill-input="fillInput"
    :stack-label="stackLabel"
    :hide-bottom-space="hideBottomSpace"
    :rules="computedRules"
    :error="!!errorMessage"
    :error-message="errorMessage"
    lazy-rules
    @update:model-value="handleUpdateModelValue"
    @filter="handleFilter"
    @input-value="emit('inputValue', $event)"
    @popup-show="emit('popup-show')"
    @popup-hide="emit('popup-hide')"
  >
    <template
      v-for="(_, slotName) in $slots"
      :key="slotName"
      #[slotName]="slotProps"
    >
      <slot
        :name="slotName"
        v-bind="slotProps || {}"
      />
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { computed, ref, useAttrs } from 'vue'
import type { AppSelectProps } from '@/types/ui'

defineOptions({
  name: 'AppSelect',
  inheritAttrs: false
})

const attrs = useAttrs()

const props = withDefaults(defineProps<AppSelectProps>(), {
  optionValue: 'value',
  optionLabel: 'label',
  multiple: false,
  outlined: true,
  filled: false,
  dense: false,
  disable: false,
  readonly: false,
  clearable: false,
  useInput: false,
  useChips: false,
  emitValue: true,
  mapOptions: true,
  loading: false,
  hideDropdownIcon: false,
  behavior: 'menu',
  optionsDense: false,
  inputDebounce: 0,
  hideSelected: false,
  fillInput: false,
  stackLabel: false,
  hideBottomSpace: false,
  required: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: any]
  filter: [inputValue: string, doneFn: (callbackFn: () => void) => void, abortFn: () => void]
  inputValue: [value: string]
  'popup-show': []
  'popup-hide': []
}>()

// Explicit v-model handler - key fix for wrapper component
const handleUpdateModelValue = (val: unknown) => {
  emit('update:modelValue', val)
}

const filteredOptions = ref<Array<any>>([])
const isFiltering = ref(false)

const computedOptions = computed(() => {
  if (props.useInput && isFiltering.value) {
    return filteredOptions.value
  }
  return props.options ?? []
})

const computedRules = computed(() => {
  const rules = [...(props.rules || [])]
  if (props.required) {
    rules.unshift((val: any) => {
      if (props.multiple) {
        return (val && val.length > 0) || 'Vui lòng chọn ít nhất một mục'
      }
      return val !== null && val !== undefined && val !== '' || 'Vui lòng chọn một mục'
    })
  }
  return rules
})

// Handle @filter event - auto-calls update() if no parent handler exists
// This prevents infinite loading when QSelect waits for update() to be called
const handleFilter = (val: string, update: (fn: () => void) => void, abort: () => void) => {
  if (attrs.onFilter) {
    emit('filter', val, update, abort)
  } else {
    update(() => {
      if (!val) {
        isFiltering.value = false
        filteredOptions.value = props.options ?? []
        return
      }
      isFiltering.value = true
      const needle = val.toLowerCase()
      const labelFn = typeof props.optionLabel === 'function'
        ? props.optionLabel
        : (opt: any) => {
            if (typeof opt === 'string') return opt
            return opt?.[props.optionLabel as string] ?? ''
          }
      filteredOptions.value = (props.options ?? []).filter((opt) =>
        String(labelFn(opt)).toLowerCase().includes(needle)
      )
    })
  }
}
</script>
