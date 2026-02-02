<template>
  <q-select
    v-bind="$attrs"
    :model-value="modelValue"
    :options="filteredOptions"
    :option-value="optionValue"
    :option-label="optionLabel"
    :option-disable="optionDisable"
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
    <!-- Custom option template for grouped display -->
    <template #option="{ opt, itemProps }">
      <!-- LOCATION: Group header (disabled, bold) -->
      <q-item
        v-if="opt.type === 'LOCATION'"
        v-bind="itemProps"
        class="warehouse-location-header"
        disable
      >
        <q-item-section>
          <q-item-label class="text-weight-bold text-grey-8">
            <q-icon
              name="location_on"
              size="xs"
              class="q-mr-xs"
            />
            {{ opt.name }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <!-- STORAGE: Selectable option (indented) -->
      <q-item
        v-else
        v-bind="itemProps"
        class="warehouse-storage-option"
      >
        <q-item-section>
          <q-item-label>
            <span class="q-ml-md">{{ opt.name }}</span>
            <span class="text-grey-6 q-ml-xs">({{ opt.code }})</span>
          </q-item-label>
        </q-item-section>
      </q-item>
    </template>

    <!-- Selected value display -->
    <template #selected-item="{ opt }">
      <span v-if="opt">{{ opt.name }} ({{ opt.code }})</span>
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
import { useWarehouses } from '@/composables/useWarehouses'
import type { Warehouse } from '@/services/warehouseService'

defineOptions({
  name: 'AppWarehouseSelect',
  inheritAttrs: false
})

interface Props {
  /** v-model value (warehouse id) */
  modelValue?: number | null
  /** Label for the select */
  label?: string
  /** Hint text */
  hint?: string
  /** Only show STORAGE type warehouses */
  storageOnly?: boolean
  /** Filter by parent location ID */
  locationId?: number | null
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
  /** Auto-fetch warehouses on mount */
  autoFetch?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Chọn kho',
  storageOnly: true,  // Default to storage only for inventory operations
  outlined: true,
  filled: false,
  dense: false,
  disable: false,
  readonly: false,
  clearable: false,
  loading: false,
  emitValue: true,
  mapOptions: true,
  useInput: false,
  inputDebounce: 0,
  behavior: 'menu',
  required: false,
  autoFetch: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

// Composables
const {
  warehouses,
  warehouseTree,
  loading: isLoading,
  fetchWarehouseTree,
  fetchWarehouses,
} = useWarehouses()

// Local state
const filterText = ref('')

// Option accessors
const optionValue = 'id'
const optionLabel = (opt: Warehouse) => `${opt.name} (${opt.code})`
const optionDisable = (opt: Warehouse) => opt.type === 'LOCATION'

/**
 * Build options list based on props
 */
const allOptions = computed(() => {
  if (props.storageOnly) {
    // Return only STORAGE warehouses
    let storages = warehouses.value.filter(w => w.type === 'STORAGE')
    
    // Filter by location if specified
    if (props.locationId) {
      storages = storages.filter(w => w.parent_id === props.locationId)
    }
    
    return storages
  }

  // Return grouped list with LOCATION headers
  const options: Warehouse[] = []
  
  for (const location of warehouseTree.value) {
    // Add location as header
    options.push(location)
    
    // Add children
    for (const storage of location.children) {
      options.push(storage)
    }
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
  return allOptions.value.filter(w => 
    w.name.toLowerCase().includes(search) ||
    w.code.toLowerCase().includes(search)
  )
})

/**
 * Validation rules
 */
const computedRules = computed(() => {
  const rules = [...(props.rules || [])]
  if (props.required) {
    rules.unshift((val: any) => 
      (val !== null && val !== undefined) || 'Vui lòng chọn kho'
    )
  }
  return rules
})

/**
 * Handle model value update
 */
const handleUpdateModelValue = (val: number | null) => {
  emit('update:modelValue', val)
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
  if (props.autoFetch && warehouses.value.length === 0) {
    if (props.storageOnly) {
      await fetchWarehouses()
    } else {
      await fetchWarehouseTree()
    }
  }
})

/**
 * Re-fetch when storageOnly changes
 */
watch(() => props.storageOnly, async (newVal) => {
  if (!newVal && warehouseTree.value.length === 0) {
    await fetchWarehouseTree()
  }
})
</script>

<style scoped>
.warehouse-location-header {
  background-color: var(--q-grey-2);
  cursor: default;
  min-height: 32px;
}

.warehouse-storage-option {
  min-height: 40px;
}

.warehouse-storage-option:hover {
  background-color: var(--q-primary-opacity);
}
</style>
