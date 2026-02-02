<script setup lang="ts">
/**
 * ColorPicker - Color picker wrapper
 * Wraps QColor with standardized props
 */
import { computed } from 'vue'
import { useQuasar } from 'quasar'

interface Props {
  modelValue?: string | null
  defaultValue?: string
  defaultView?: 'spectrum' | 'tune' | 'palette'
  formatModel?: 'auto' | 'hex' | 'rgb' | 'hexa' | 'rgba'
  palette?: string[]
  noHeader?: boolean
  noHeaderTabs?: boolean
  noFooter?: boolean
  square?: boolean
  flat?: boolean
  bordered?: boolean
  disable?: boolean
  readonly?: boolean
  dark?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  defaultView: 'spectrum',
  formatModel: 'hex',
  noHeader: false,
  noHeaderTabs: false,
  noFooter: false,
  square: false,
  flat: false,
  bordered: true,
  disable: false,
  readonly: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const $q = useQuasar()
const isDark = computed(() => props.dark ?? $q.dark.isActive)

const colorValue = computed({
  get: () => props.modelValue ?? null,
  set: (val) => emit('update:modelValue', val ?? null)
})
</script>

<template>
  <q-color
    v-model="colorValue"
    :default-value="defaultValue"
    :default-view="defaultView"
    :format-model="formatModel"
    :palette="palette"
    :no-header="noHeader"
    :no-header-tabs="noHeaderTabs"
    :no-footer="noFooter"
    :square="square"
    :flat="flat"
    :bordered="bordered"
    :disable="disable"
    :readonly="readonly"
    :dark="isDark"
  />
</template>
