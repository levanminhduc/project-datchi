<template>
  <q-select
    v-bind="$attrs"
    :model-value="internalValue"
    :options="filteredOptions"
    :option-value="getOptionValue"
    :option-label="getOptionLabel"
    :label="label"
    :hint="hint"
    :outlined="outlined"
    :filled="filled"
    :dense="dense"
    :disable="disable"
    :readonly="readonly"
    :clearable="clearable"
    :loading="loading || isLoading"
    :emit-value="false"
    :map-options="false"
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
      <q-item
        v-bind="itemProps"
        class="lot-option"
      >
        <q-item-section avatar>
          <q-avatar
            v-if="isUnassignedGroup(opt)"
            size="32px"
            color="orange-2"
            text-color="orange-9"
            icon="inventory_2"
          />
          <q-avatar
            v-else
            size="32px"
            :color="opt.thread_type?.color_data?.hex_code ? undefined : 'grey-3'"
            :style="opt.thread_type?.color_data?.hex_code ? { backgroundColor: opt.thread_type.color_data.hex_code } : undefined"
          >
            <span class="text-caption text-weight-bold text-white">
              {{ (opt.thread_type?.code || 'L').substring(0, 2).toUpperCase() }}
            </span>
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label>
            <span class="text-weight-medium">
              {{ isUnassignedGroup(opt) ? opt.thread_type_name : opt.lot_number }}
            </span>
            <q-badge
              v-if="isUnassignedGroup(opt)"
              class="q-ml-sm"
              color="orange"
              label="Chưa phân lô"
            />
          </q-item-label>
          <q-item-label caption>
            <template v-if="isUnassignedGroup(opt)">
              <span>{{ opt.thread_type_code }}</span>
              <span class="q-mx-xs">•</span>
              <span>{{ opt.cone_count }} cuộn</span>
            </template>
            <template v-else>
              <span>{{ opt.thread_type?.name || '-' }}</span>
              <span class="q-mx-xs">•</span>
              <span>{{ opt.warehouse?.name || '-' }}</span>
              <span class="q-mx-xs">•</span>
              <span>{{ opt.available_cones }}/{{ opt.total_cones }} cuộn</span>
            </template>
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-badge
            v-if="!isUnassignedGroup(opt)"
            :color="getStatusColor(opt.status)"
            :label="getStatusLabel(opt.status)"
          />
        </q-item-section>
      </q-item>
    </template>

    <!-- Selected value display -->
    <template #selected-item="{ opt }">
      <span v-if="opt">
        <template v-if="isUnassignedGroup(opt)">
          {{ opt.thread_type_name }}
          <q-badge
            class="q-ml-xs"
            color="orange"
            label="Chưa phân lô"
          />
          <span class="text-grey-6 q-ml-xs">({{ opt.cone_count }} cuộn)</span>
        </template>
        <template v-else>
          {{ opt.lot_number }}
          <span class="text-grey-6 q-ml-xs">({{ opt.available_cones }} cuộn)</span>
        </template>
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
import { inventoryService } from '@/services/inventoryService'
import type { Lot, LotStatus, LotFilters, UnassignedThreadGroup } from '@/types/thread/lot'

defineOptions({
  name: 'LotSelector',
  inheritAttrs: false
})

type SelectionOption = Lot | UnassignedThreadGroup

interface Props {
  modelValue?: number | string | null
  label?: string
  hint?: string
  warehouseId?: number | null
  threadTypeId?: number | null
  activeOnly?: boolean
  includeUnassigned?: boolean
  outlined?: boolean
  filled?: boolean
  dense?: boolean
  disable?: boolean
  readonly?: boolean
  clearable?: boolean
  loading?: boolean
  emitValue?: boolean
  mapOptions?: boolean
  useInput?: boolean
  inputDebounce?: number
  behavior?: 'menu' | 'dialog'
  popupContentClass?: string
  rules?: Array<(val: any) => boolean | string>
  required?: boolean
  errorMessage?: string
  autoFetch?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Chọn lô',
  activeOnly: true,
  includeUnassigned: true,
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
  'update:modelValue': [value: number | string | null]
  'lot-selected': [lot: Lot | null]
  'unassigned-selected': [group: UnassignedThreadGroup | null]
}>()

const { lots, loading: isLoading, fetchLots } = useLots()

const filterText = ref('')
const unassignedGroups = ref<UnassignedThreadGroup[]>([])
const loadingUnassigned = ref(false)

const UNASSIGNED_PREFIX = 'unassigned:'

function isUnassignedGroup(opt: SelectionOption): opt is UnassignedThreadGroup {
  return 'thread_type_id' in opt && 'cone_ids' in opt
}

function getOptionValue(opt: SelectionOption): number | string {
  if (isUnassignedGroup(opt)) {
    return `${UNASSIGNED_PREFIX}${opt.thread_type_id}`
  }
  return opt.id
}

function getOptionLabel(opt: SelectionOption): string {
  if (isUnassignedGroup(opt)) {
    return `${opt.thread_type_name} (Chưa phân lô)`
  }
  return opt.lot_number
}

const internalValue = computed(() => {
  if (!props.modelValue) return null
  
  if (typeof props.modelValue === 'string' && props.modelValue.startsWith(UNASSIGNED_PREFIX)) {
    const threadTypeId = parseInt(props.modelValue.replace(UNASSIGNED_PREFIX, ''))
    return unassignedGroups.value.find(g => g.thread_type_id === threadTypeId) || null
  }
  
  if (typeof props.modelValue === 'number') {
    return lots.value.find(l => l.id === props.modelValue) || null
  }
  
  return null
})

const allOptions = computed<SelectionOption[]>(() => {
  let lotOptions: Lot[] = lots.value

  if (props.activeOnly) {
    lotOptions = lotOptions.filter(l => l.status === 'ACTIVE')
  }

  if (props.threadTypeId) {
    lotOptions = lotOptions.filter(l => l.thread_type_id === props.threadTypeId)
  }

  const combined: SelectionOption[] = [...lotOptions]

  if (props.includeUnassigned && unassignedGroups.value.length > 0) {
    combined.push(...unassignedGroups.value)
  }

  return combined
})

const filteredOptions = computed(() => {
  if (!filterText.value) {
    return allOptions.value
  }

  const search = filterText.value.toLowerCase()
  return allOptions.value.filter(opt => {
    if (isUnassignedGroup(opt)) {
      return opt.thread_type_name.toLowerCase().includes(search) ||
             opt.thread_type_code.toLowerCase().includes(search)
    }
    return opt.lot_number.toLowerCase().includes(search) ||
           opt.thread_type?.name?.toLowerCase().includes(search) ||
           opt.warehouse?.name?.toLowerCase().includes(search)
  })
})

const computedRules = computed(() => {
  const rules = [...(props.rules || [])]
  if (props.required) {
    rules.unshift((val: any) =>
      (val !== null && val !== undefined) || 'Vui lòng chọn lô hoặc loại chỉ'
    )
  }
  return rules
})

function getStatusColor(status: LotStatus): string {
  const colors: Record<LotStatus, string> = {
    ACTIVE: 'positive',
    DEPLETED: 'grey',
    EXPIRED: 'negative',
    QUARANTINE: 'warning'
  }
  return colors[status]
}

function getStatusLabel(status: LotStatus): string {
  const labels: Record<LotStatus, string> = {
    ACTIVE: 'Hoạt động',
    DEPLETED: 'Đã hết',
    EXPIRED: 'Hết hạn',
    QUARANTINE: 'Cách ly'
  }
  return labels[status]
}

const handleUpdateModelValue = (opt: SelectionOption | null) => {
  if (!opt) {
    emit('update:modelValue', null)
    emit('lot-selected', null)
    emit('unassigned-selected', null)
    return
  }

  if (isUnassignedGroup(opt)) {
    emit('update:modelValue', `${UNASSIGNED_PREFIX}${opt.thread_type_id}`)
    emit('lot-selected', null)
    emit('unassigned-selected', opt)
  } else {
    emit('update:modelValue', opt.id)
    emit('lot-selected', opt)
    emit('unassigned-selected', null)
  }
}

const handleFilter = (val: string, update: (fn: () => void) => void) => {
  update(() => {
    filterText.value = val
  })
}

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

async function loadUnassignedGroups() {
  if (!props.warehouseId || !props.includeUnassigned) {
    unassignedGroups.value = []
    return
  }

  loadingUnassigned.value = true
  try {
    unassignedGroups.value = await inventoryService.getUnassignedByThreadType(props.warehouseId)
  } catch {
    unassignedGroups.value = []
  } finally {
    loadingUnassigned.value = false
  }
}

async function loadAll() {
  await Promise.all([loadLots(), loadUnassignedGroups()])
}

onMounted(async () => {
  if (props.autoFetch) {
    await loadAll()
  }
})

watch([() => props.warehouseId, () => props.threadTypeId], async () => {
  await loadAll()
})

defineExpose({
  refresh: loadAll,
  getUnassignedConeIds: (value: string | number | null): number[] | null => {
    if (typeof value === 'string' && value.startsWith(UNASSIGNED_PREFIX)) {
      const threadTypeId = parseInt(value.replace(UNASSIGNED_PREFIX, ''))
      const group = unassignedGroups.value.find(g => g.thread_type_id === threadTypeId)
      return group?.cone_ids || null
    }
    return null
  }
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
