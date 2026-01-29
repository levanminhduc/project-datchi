<template>
  <q-input
    v-bind="$attrs"
    :model-value="modelValue"
    :type="type"
    :label="label"
    :hint="hint"
    :placeholder="placeholder"
    :outlined="outlined"
    :filled="filled"
    :standout="standout"
    :borderless="borderless"
    :dense="dense"
    :disable="disable"
    :readonly="readonly"
    :rules="computedRules"
    :error="!!errorMessage"
    :error-message="errorMessage"
    :debounce="debounce"
    :autofocus="autofocus"
    :autogrow="autogrow"
    :maxlength="maxlength"
    :counter="counter"
    :mask="mask"
    :loading="loading"
    :color="color"
    :label-color="labelColor"
    :bg-color="bgColor"
    :stack-label="stackLabel"
    :hide-bottom-space="hideBottomSpace"
    lazy-rules
    @update:model-value="emit('update:modelValue', $event)"
    @focus="emit('focus', $event)"
    @blur="emit('blur', $event)"
  >
    <template
      v-if="prependIcon"
      #prepend
    >
      <q-icon :name="prependIcon" />
    </template>

    <template
      v-if="appendIcon || clearable || $slots.append"
      #append
    >
      <slot name="append">
        <q-icon
          v-if="clearable && modelValue"
          name="close"
          class="cursor-pointer"
          @click.stop="handleClear"
        />
        <q-icon
          v-else-if="appendIcon"
          :name="appendIcon"
        />
      </slot>
    </template>

    <template
      v-if="$slots.prepend"
      #prepend
    >
      <slot name="prepend" />
    </template>

    <template
      v-if="$slots.before"
      #before
    >
      <slot name="before" />
    </template>

    <template
      v-if="$slots.after"
      #after
    >
      <slot name="after" />
    </template>

    <slot />
  </q-input>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AppInputProps } from '@/types/ui'

const props = withDefaults(defineProps<AppInputProps>(), {
  type: 'text',
  outlined: true,
  filled: false,
  borderless: false,
  dense: false,
  disable: false,
  readonly: false,
  required: false,
  clearable: false,
  debounce: 0,
  autofocus: false,
  autogrow: false,
  counter: false,
  loading: false,
  stackLabel: false,
  hideBottomSpace: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null]
  clear: []
  focus: [event: Event]
  blur: [event: Event]
}>()

const computedRules = computed(() => {
  const rules = [...(props.rules || [])]
  if (props.required) {
    rules.unshift((val: any) => !!val?.toString().trim() || 'Trường này là bắt buộc')
  }
  return rules
})

const handleClear = () => {
  emit('update:modelValue', '')
  emit('clear')
}
</script>
