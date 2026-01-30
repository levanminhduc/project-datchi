<template>
  <q-select
    v-bind="$attrs"
    :model-value="modelValue"
    :options="options"
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
    :behavior="behavior"
    :hide-dropdown-icon="hideDropdownIcon"
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
    @filter="(val: string, update: (fn: () => void) => void, abort: () => void) => emit('filter', val, update, abort)"
    @input-value="emit('inputValue', $event)"
    @popup-show="handlePopupShow"
    @popup-hide="handlePopupHide"
    @click="handleClick"
  >
    <template
      v-for="(_, slotName) in $slots"
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
import { computed } from 'vue'
import type { AppSelectProps } from '@/types/ui'

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
  click: [evt: Event]
}>()

const handleUpdateModelValue = (val: unknown) => {
  emit('update:modelValue', val)
}

const handlePopupShow = () => {
  emit('popup-show')
}

const handlePopupHide = () => {
  emit('popup-hide')
}

const handleClick = (evt: Event) => {
  emit('click', evt)
}

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
</script>
