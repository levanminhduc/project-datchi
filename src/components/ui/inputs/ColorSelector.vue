<template>
  <q-select
    v-bind="$attrs"
    :model-value="modelValue"
    :options="filteredOptions"
    :option-value="optionValue"
    :option-label="optionLabel"
    :label="label"
    :hint="hint"
    :outlined="outlined"
    :filled="filled"
    :dense="dense"
    :disable="disable"
    :readonly="readonly"
    :clearable="clearable"
    :loading="loading || isLoading"
    :emit-value="emitValue"
    :map-options="mapOptions"
    :use-input="useInput"
    :input-debounce="inputDebounce"
    :behavior="behavior"
    :popup-content-class="popupContentClass"
    :rules="computedRules"
    :error="!!errorMessage"
    :error-message="errorMessage"
    lazy-rules
    @update:model-value="handleUpdateModelValue"
    @filter="handleFilter"
  >
    <!-- Custom option template with color swatch -->
    <template #option="{ opt, itemProps }">
      <q-item
        v-bind="itemProps"
        class="color-option"
      >
        <q-item-section avatar>
          <div
            class="color-swatch"
            :style="{ backgroundColor: opt.hex_code }"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ opt.name }}</q-item-label>
          <q-item-label
            caption
            class="text-grey-6"
          >
            {{ opt.hex_code }}
            <span v-if="opt.pantone_code"> | {{ opt.pantone_code }}</span>
          </q-item-label>
        </q-item-section>
      </q-item>
    </template>

    <!-- Selected value display with color swatch -->
    <template #selected-item="{ opt }">
      <div
        v-if="opt"
        class="row items-center no-wrap"
      >
        <div
          class="color-swatch-small q-mr-sm"
          :style="{ backgroundColor: opt.hex_code }"
        />
        <span>{{ opt.name }}</span>
      </div>
    </template>

    <!-- No options slot -->
    <template #no-option>
      <q-item>
        <q-item-section class="text-grey">
          Không tìm thấy màu
        </q-item-section>
      </q-item>
    </template>

    <!-- Forward other slots -->
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
import { computed, onMounted, ref, watch } from 'vue'
import { useColors } from '@/composables/thread/useColors'
import type { Color } from '@/types/thread/color'

defineOptions({
  name: 'ColorSelector',
  inheritAttrs: false
})

interface Props {
  /** v-model value (color id) */
  modelValue?: number | null
  /** Label for the select */
  label?: string
  /** Hint text */
  hint?: string
  /** Only show active colors */
  activeOnly?: boolean
  /** Outlined style */
  outlined?: boolean
  /** Filled style */
  filled?: boolean
  /** Dense padding */
  dense?: boolean
  /** Disable select */
  disable?: boolean
  /** Readonly mode */
  readonly?: boolean
  /** Clearable */
  clearable?: boolean
  /** Loading state (external) */
  loading?: boolean
  /** Emit value only */
  emitValue?: boolean
  /** Map options */
  mapOptions?: boolean
  /** Enable search/filter */
  useInput?: boolean
  /** Input debounce */
  inputDebounce?: number
  /** Popup behavior */
  behavior?: 'menu' | 'dialog'
  /** Popup content class */
  popupContentClass?: string
  /** Validation rules */
  rules?: Array<(val: any) => boolean | string>
  /** Required field */
  required?: boolean
  /** Error message */
  errorMessage?: string
  /** Auto-fetch colors on mount */
  autoFetch?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Chọn màu',
  activeOnly: true,
  outlined: true,
  filled: false,
  dense: false,
  disable: false,
  readonly: false,
  clearable: false,
  loading: false,
  emitValue: true,
  mapOptions: true,
  useInput: true,
  inputDebounce: 300,
  behavior: 'menu',
  required: false,
  autoFetch: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  'update:colorData': [value: Color | null]
}>()

// Composables
const {
  colors,
  activeColors,
  loading: isLoading,
  fetchColors,
} = useColors()

// Local state
const filterText = ref('')

// Option accessors
const optionValue = 'id'
const optionLabel = (opt: Color) => opt.name

/**
 * Build options list based on props
 */
const allOptions = computed(() => {
  if (props.activeOnly) {
    return activeColors.value
  }
  return colors.value
})

/**
 * Filter options based on search text
 */
const filteredOptions = computed(() => {
  if (!filterText.value) {
    return allOptions.value
  }

  const search = filterText.value.toLowerCase()
  return allOptions.value.filter(c =>
    c.name.toLowerCase().includes(search) ||
    c.hex_code.toLowerCase().includes(search) ||
    (c.pantone_code && c.pantone_code.toLowerCase().includes(search))
  )
})

/**
 * Validation rules
 */
const computedRules = computed(() => {
  const rules = [...(props.rules || [])]
  if (props.required) {
    rules.unshift((val: any) =>
      (val !== null && val !== undefined) || 'Vui lòng chọn màu'
    )
  }
  return rules
})

/**
 * Handle model value update - emit both ID and full color data
 */
const handleUpdateModelValue = (val: number | null) => {
  emit('update:modelValue', val)

  // Emit full color data for dual-write support
  if (val !== null) {
    const colorData = colors.value.find(c => c.id === val) || null
    emit('update:colorData', colorData)
  } else {
    emit('update:colorData', null)
  }
}

/**
 * Handle filter input
 */
const handleFilter = (val: string, update: (fn: () => void) => void) => {
  update(() => {
    filterText.value = val
  })
}

/**
 * Fetch data on mount
 */
onMounted(async () => {
  if (props.autoFetch && colors.value.length === 0) {
    await fetchColors()
  }
})

/**
 * Re-fetch when activeOnly changes
 */
watch(() => props.activeOnly, async () => {
  if (colors.value.length === 0) {
    await fetchColors()
  }
})
</script>

<style scoped>
.color-option {
  min-height: 48px;
}

.color-swatch {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.12);
}

.color-swatch-small {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.12);
}
</style>
