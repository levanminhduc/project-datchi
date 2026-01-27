<script setup lang="ts">
/**
 * PopupEdit - Inline popup editor wrapper
 * Wraps QPopupEdit for in-place editing with Vietnamese defaults
 */

interface Props {
  /** v-model value being edited */
  modelValue?: any
  /** Title shown above input */
  title?: string
  /** Show save/cancel buttons */
  buttons?: boolean
  /** Save button label */
  labelSet?: string
  /** Cancel button label */
  labelCancel?: string
  /** Auto save on blur */
  autoSave?: boolean
  /** Input type */
  inputType?: 'text' | 'number' | 'textarea'
  /** Input placeholder */
  placeholder?: string
  /** Validation rules */
  rules?: ((val: any) => boolean | string)[]
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  buttons: true,
  labelSet: 'Lưu',
  labelCancel: 'Hủy',
  autoSave: false,
  inputType: 'text',
  placeholder: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: any]
  save: [value: any]
  cancel: []
}>()
</script>

<template>
  <q-popup-edit
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    :title="title"
    :buttons="buttons"
    :label-set="labelSet"
    :label-cancel="labelCancel"
    :auto-save="autoSave"
    @save="emit('save', $event)"
    @cancel="emit('cancel')"
    v-slot="scope"
  >
    <q-input
      v-if="inputType === 'textarea'"
      type="textarea"
      autogrow
      v-model="scope.value"
      :placeholder="placeholder"
      :rules="rules"
      autofocus
      dense
      @keyup.enter="scope.set"
    />
    <q-input
      v-else
      :type="inputType"
      v-model="scope.value"
      :placeholder="placeholder"
      :rules="rules"
      autofocus
      dense
      @keyup.enter="scope.set"
    />
  </q-popup-edit>
</template>
