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
    <!-- Custom option template with code and name -->
    <template #option="{ opt, itemProps }">
      <q-item
        v-bind="itemProps"
        class="supplier-option"
      >
        <q-item-section avatar>
          <q-avatar
            size="32px"
            color="primary"
            text-color="white"
            class="text-weight-bold"
          >
            {{ getInitials(opt.name) }}
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ opt.name }}</q-item-label>
          <q-item-label
            caption
            class="text-grey-6"
          >
            {{ opt.code }}
            <span v-if="opt.lead_time_days"> | {{ opt.lead_time_days }} ngày</span>
          </q-item-label>
        </q-item-section>
        <q-item-section
          v-if="!opt.is_active"
          side
        >
          <q-badge
            color="grey"
            label="Ngừng"
          />
        </q-item-section>
      </q-item>
    </template>

    <!-- Selected value display -->
    <template #selected-item="{ opt }">
      <div
        v-if="opt"
        class="row items-center no-wrap"
      >
        <q-avatar
          size="20px"
          color="primary"
          text-color="white"
          class="q-mr-sm text-caption text-weight-bold"
        >
          {{ getInitials(opt.name) }}
        </q-avatar>
        <span>{{ opt.name }}</span>
        <span class="text-grey-6 q-ml-xs">({{ opt.code }})</span>
      </div>
    </template>

    <!-- No options slot -->
    <template #no-option>
      <q-item>
        <q-item-section class="text-grey">
          Không tìm thấy nhà cung cấp
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
import { useSuppliers } from '@/composables/thread/useSuppliers'
import type { Supplier } from '@/types/thread/supplier'

defineOptions({
  name: 'SupplierSelector',
  inheritAttrs: false
})

interface Props {
  /** v-model value (supplier id) */
  modelValue?: number | null
  /** Label for the select */
  label?: string
  /** Hint text */
  hint?: string
  /** Only show active suppliers */
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
  /** Auto-fetch suppliers on mount */
  autoFetch?: boolean
  /** Exclude supplier IDs from the list */
  excludeIds?: number[]
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Chọn nhà cung cấp',
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
  excludeIds: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  'update:supplierData': [value: Supplier | null]
}>()

// Composables
const {
  suppliers,
  activeSuppliers,
  loading: isLoading,
  fetchSuppliers,
} = useSuppliers()

// Local state
const filterText = ref('')

// Option accessors
const optionValue = 'id'
const optionLabel = (opt: Supplier) => `${opt.name} (${opt.code})`

/**
 * Get initials from supplier name (first 2 chars)
 */
const getInitials = (name: string): string => {
  if (!name) return '?'
  const words = name.trim().split(/\s+/)
  if (words.length >= 2 && words[0] && words[1]) {
    return ((words[0][0] || '') + (words[1][0] || '')).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

/**
 * Build options list based on props
 */
const allOptions = computed(() => {
  let options = props.activeOnly ? activeSuppliers.value : suppliers.value
  
  // Exclude specified IDs
  if (props.excludeIds && props.excludeIds.length > 0) {
    options = options.filter(s => !props.excludeIds!.includes(s.id))
  }
  
  return options
})

/**
 * Filter options based on search text
 */
const filteredOptions = computed(() => {
  if (!filterText.value) {
    return allOptions.value
  }

  const search = filterText.value.toLowerCase()
  return allOptions.value.filter(s =>
    s.name.toLowerCase().includes(search) ||
    s.code.toLowerCase().includes(search)
  )
})

/**
 * Validation rules
 */
const computedRules = computed(() => {
  const rules = [...(props.rules || [])]
  if (props.required) {
    rules.unshift((val: any) =>
      (val !== null && val !== undefined) || 'Vui lòng chọn nhà cung cấp'
    )
  }
  return rules
})

/**
 * Handle model value update - emit both ID and full supplier data
 */
const handleUpdateModelValue = (val: number | null) => {
  emit('update:modelValue', val)

  // Emit full supplier data for dual-write support
  if (val !== null) {
    const supplierData = suppliers.value.find(s => s.id === val) || null
    emit('update:supplierData', supplierData)
  } else {
    emit('update:supplierData', null)
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
  if (props.autoFetch && suppliers.value.length === 0) {
    await fetchSuppliers()
  }
})

/**
 * Re-fetch when activeOnly changes
 */
watch(() => props.activeOnly, async () => {
  if (suppliers.value.length === 0) {
    await fetchSuppliers()
  }
})
</script>

<style scoped>
.supplier-option {
  min-height: 48px;
}
</style>
