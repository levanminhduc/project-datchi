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
    <!-- Custom option template -->
    <template #option="{ opt, itemProps }">
      <q-item v-bind="itemProps" class="lot-option">
        <q-item-section>
          <q-item-label>
            <span class="text-weight-medium">{{ opt.lot_number }}</span>
          </q-item-label>
          <q-item-label caption>
            <span>{{ opt.thread_type?.name || '-' }}</span>
            <span class="q-mx-xs">•</span>
            <span>{{ opt.warehouse?.name || '-' }}</span>
            <span class="q-mx-xs">•</span>
            <span>{{ opt.available_cones }}/{{ opt.total_cones }} cuộn</span>
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-badge
            :color="getStatusColor(opt.status)"
            :label="getStatusLabel(opt.status)"
          />
        </q-item-section>
      </q-item>
    </template>

    <!-- Selected value display -->
    <template #selected-item="{ opt }">
      <span v-if="opt">
        {{ opt.lot_number }}
        <span class="text-grey-6 q-ml-xs">({{ opt.available_cones }} cuộn)</span>
      </span>
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
import { useLots } from '@/composables/useLots'
import type { Lot, LotStatus, LotFilters } from '@/types/thread/lot'

defineOptions({
  name: 'LotSelector',
  inheritAttrs: false
})

interface Props {
  /** v-model value (lot id) */
  modelValue?: number | null
  /** Label for the select */
  label?: string
  /** Hint text */
  hint?: string
  /** Filter by warehouse ID */
  warehouseId?: number | null
  /** Filter by thread type ID */
  threadTypeId?: number | null
  /** Only show active lots (default true) */
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
  /** Auto-fetch lots on mount */
  autoFetch?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Chọn lô',
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
  popupContentClass: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  'lot-selected': [lot: Lot | null]
}>()

// Composables
const { lots, loading: isLoading, fetchLots } = useLots()

// Local state
const filterText = ref('')

// Option accessors
const optionValue = 'id'
const optionLabel = (opt: Lot) => opt.lot_number

/**
 * Build options list based on props
 */
const allOptions = computed(() => {
  let filtered = lots.value

  // Filter by status
  if (props.activeOnly) {
    filtered = filtered.filter(l => l.status === 'ACTIVE')
  }

  // Filter by warehouse
  if (props.warehouseId) {
    filtered = filtered.filter(l => l.warehouse_id === props.warehouseId)
  }

  // Filter by thread type
  if (props.threadTypeId) {
    filtered = filtered.filter(l => l.thread_type_id === props.threadTypeId)
  }

  return filtered
})

/**
 * Filter options based on search text
 */
const filteredOptions = computed(() => {
  if (!filterText.value) {
    return allOptions.value
  }

  const search = filterText.value.toLowerCase()
  return allOptions.value.filter(l =>
    l.lot_number.toLowerCase().includes(search) ||
    l.thread_type?.name?.toLowerCase().includes(search) ||
    l.warehouse?.name?.toLowerCase().includes(search)
  )
})

/**
 * Validation rules
 */
const computedRules = computed(() => {
  const rules = [...(props.rules || [])]
  if (props.required) {
    rules.unshift((val: any) =>
      (val !== null && val !== undefined) || 'Vui lòng chọn lô'
    )
  }
  return rules
})

/**
 * Get status color
 */
function getStatusColor(status: LotStatus): string {
  const colors: Record<LotStatus, string> = {
    ACTIVE: 'positive',
    DEPLETED: 'grey',
    EXPIRED: 'negative',
    QUARANTINE: 'warning'
  }
  return colors[status]
}

/**
 * Get status label
 */
function getStatusLabel(status: LotStatus): string {
  const labels: Record<LotStatus, string> = {
    ACTIVE: 'Hoạt động',
    DEPLETED: 'Đã hết',
    EXPIRED: 'Hết hạn',
    QUARANTINE: 'Cách ly'
  }
  return labels[status]
}

/**
 * Handle model value update
 */
const handleUpdateModelValue = (val: number | null) => {
  emit('update:modelValue', val)
  
  // Emit selected lot object
  const selectedLot = val ? lots.value.find(l => l.id === val) || null : null
  emit('lot-selected', selectedLot)
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
 * Fetch lots with current filters
 */
async function loadLots() {
  const filters: LotFilters = {}
  if (props.activeOnly) {
    filters.status = 'ACTIVE'
  }
  if (props.warehouseId) {
    filters.warehouse_id = props.warehouseId
  }
  if (props.threadTypeId) {
    filters.thread_type_id = props.threadTypeId
  }
  await fetchLots(filters)
}

/**
 * Fetch data on mount
 */
onMounted(async () => {
  if (props.autoFetch) {
    await loadLots()
  }
})

/**
 * Re-fetch when filter props change
 */
watch([() => props.warehouseId, () => props.threadTypeId], async () => {
  await loadLots()
})

// Expose for parent access
defineExpose({
  refresh: loadLots
})
</script>

<style scoped>
.lot-option {
  min-height: 48px;
}

.lot-option:hover {
  background-color: var(--q-primary-opacity);
}
</style>
