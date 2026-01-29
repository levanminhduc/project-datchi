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
import { computed, watch } from 'vue'
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
  behavior: 'dialog',
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

// Debug handler for model value updates
const handleUpdateModelValue = (val: unknown) => {
   
  console.log('[DEBUG] AppSelect.updateModelValue: label=' + props.label + ' value=' + val)
  emit('update:modelValue', val)
}

// Debug handler for popup show event
const handlePopupShow = () => {
   
  console.log('[DEBUG] AppSelect.popupShow: label=' + props.label + ' disable=' + props.disable + ' readonly=' + props.readonly + ' loading=' + props.loading + ' optionsCount=' + (props.options?.length ?? 0))
  emit('popup-show')
}

// Debug handler for popup hide event
const handlePopupHide = () => {
   
  console.log('[DEBUG] AppSelect.popupHide: label=' + props.label)
  emit('popup-hide')
}

// Debug handler for click event
const handleClick = (evt: Event) => {
   
  console.log('[DEBUG] AppSelect.click: label=' + props.label + ' disable=' + props.disable + ' readonly=' + props.readonly + ' target=' + (evt.target as HTMLElement)?.tagName)
  emit('click', evt)
}

// Debug watcher for modelValue changes
watch(() => props.modelValue, (newVal, oldVal) => {
   
  console.log('[DEBUG] AppSelect.modelValue watch: label=' + props.label + ' oldVal=' + oldVal + ' newVal=' + newVal + ' optionsCount=' + (props.options?.length ?? 0))
}, { immediate: true })

// Debug watcher for options changes
watch(() => props.options, (newOpts) => {
   
  console.log('[DEBUG] AppSelect.options watch: label=' + props.label + ' count=' + (newOpts?.length ?? 0) + ' currentModelValue=' + props.modelValue)
}, { immediate: true })

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
