<script setup lang="ts">
/**
 * AppEditor - Rich text editor wrapper
 * Wraps QEditor with default toolbar
 */
import { computed } from 'vue'

interface Props {
  modelValue?: string
  readonly?: boolean
  disable?: boolean
  minHeight?: string
  maxHeight?: string
  height?: string
  placeholder?: string
  toolbar?: string[][]
  toolbarTextColor?: string
  toolbarColor?: string
  toolbarBg?: string
  toolbarOutline?: boolean
  toolbarPush?: boolean
  toolbarRounded?: boolean
  contentStyle?: string | Record<string, string>
  contentClass?: string | string[] | Record<string, boolean>
  square?: boolean
  flat?: boolean
  dense?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  readonly: false,
  disable: false,
  minHeight: '10rem',
  placeholder: 'Nhập nội dung...',
  toolbar: () => [
    ['bold', 'italic', 'strike', 'underline'],
    ['unordered', 'ordered'],
    ['link', 'quote', 'hr'],
    ['undo', 'redo'],
    ['viewsource']
  ],
  toolbarOutline: false,
  toolbarPush: false,
  toolbarRounded: false,
  square: false,
  flat: false,
  dense: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
</script>

<template>
  <q-editor
    v-model="editorValue"
    :readonly="readonly"
    :disable="disable"
    :min-height="minHeight"
    :max-height="maxHeight"
    :height="height"
    :placeholder="placeholder"
    :toolbar="toolbar"
    :toolbar-text-color="toolbarTextColor"
    :toolbar-color="toolbarColor"
    :toolbar-bg="toolbarBg"
    :toolbar-outline="toolbarOutline"
    :toolbar-push="toolbarPush"
    :toolbar-rounded="toolbarRounded"
    :content-style="contentStyle"
    :content-class="contentClass"
    :square="square"
    :flat="flat"
    :dense="dense"
  />
</template>
