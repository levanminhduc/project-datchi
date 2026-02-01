<script setup lang="ts">
import { computed } from 'vue'
import type { AllocationConflict, Allocation } from '@/types/thread'
import { AllocationStatus } from '@/types/thread/enums'
import AllocationStatusBadge from './AllocationStatusBadge.vue'

interface Props {
  conflict: AllocationConflict
  selectedAllocationId?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'select', allocationId: string): void
}>()

/**
 * Sort allocations by priority score (descending) then by created date
 */
const sortedAllocations = computed(() => {
  return [...props.conflict.competing_allocations].sort((a, b) => {
    if (b.priority_score !== a.priority_score) {
      return b.priority_score - a.priority_score
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })
})

/**
 * Map allocation status to timeline item color
 */
const getStatusColor = (status: AllocationStatus) => {
  switch (status) {
    case AllocationStatus.PENDING:
      return 'blue'
    case AllocationStatus.WAITLISTED:
      return 'orange'
    case AllocationStatus.SOFT:
      return 'cyan'
    case AllocationStatus.HARD:
      return 'purple'
    case AllocationStatus.ISSUED:
      return 'positive'
    case AllocationStatus.CANCELLED:
      return 'negative'
    default:
      return 'grey'
  }
}

/**
 * Formatter for quantity with unit
 */
const formatQty = (qty: number) => {
  return `${qty.toLocaleString()} m`
}

/**
 * Calculate shortage for a specific allocation based on its position in the queue
 */
const getAllocationMetrics = (index: number) => {
  let cumulativeDemand = 0
  for (let i = 0; i <= index; i++) {
    const alloc = sortedAllocations.value[i]
    if (alloc) {
      cumulativeDemand += alloc.requested_meters
    }
  }

  const available = props.conflict.total_available
  const isShortage = cumulativeDemand > available
  const currentAlloc = sortedAllocations.value[index]
  const shortageAmount = isShortage && currentAlloc ? Math.min(currentAlloc.requested_meters, cumulativeDemand - available) : 0
  
  return {
    isShortage,
    shortageAmount
  }
}
</script>

<template>
  <div class="conflict-timeline q-pa-md">
    <div class="text-subtitle1 q-mb-md flex items-center">
      <q-icon
        name="history"
        color="primary"
        size="sm"
        class="q-mr-sm"
      />
      Dòng thời gian ưu tiên phân bổ
    </div>

    <q-timeline color="secondary">
      <q-timeline-entry
        v-for="(alloc, index) in sortedAllocations"
        :key="alloc.id"
        :color="getStatusColor(alloc.status)"
        :icon="alloc.id.toString() === selectedAllocationId ? 'check_circle' : undefined"
        :side="index % 2 === 0 ? 'left' : 'right'"
        class="allocation-item"
        :class="{ 'selected-allocation': alloc.id.toString() === selectedAllocationId }"
        @click="emit('select', alloc.id.toString())"
      >
        <template #title>
          <div class="row items-center justify-between no-wrap">
            <span class="text-weight-bold text-primary">LSX: {{ alloc.order_id }}</span>
            <div class="row items-center q-gutter-x-xs">
              <q-chip
                size="sm"
                color="blue-1"
                text-color="blue-9"
                dense
              >
                Ưu tiên: {{ alloc.priority_score }}
              </q-chip>
              <AllocationStatusBadge
                :status="alloc.status"
                size="sm"
              />
            </div>
          </div>
        </template>

        <template #subtitle>
          {{ new Date(alloc.created_at).toLocaleDateString('vi-VN') }}
        </template>

        <div>
          <div class="row q-col-gutter-sm text-caption">
            <div class="col-6">
              <div class="text-grey-7">
                Yêu cầu:
              </div>
              <div class="text-weight-medium">
                {{ formatQty(alloc.requested_meters) }}
              </div>
            </div>
            <div class="col-6">
              <div class="text-grey-7">
                Đã cấp:
              </div>
              <div class="text-weight-medium">
                {{ formatQty(alloc.allocated_meters) }}
              </div>
            </div>
          </div>

          <div
            v-if="getAllocationMetrics(index).isShortage"
            class="shortage-warning q-mt-sm q-pa-xs bg-red-1 border-red rounded-borders"
          >
            <div class="row items-center text-red-9">
              <q-icon
                name="warning"
                size="xs"
                class="q-mr-xs"
              />
              <span class="text-weight-bold">Thiếu: {{ formatQty(getAllocationMetrics(index).shortageAmount) }}</span>
            </div>
          </div>

          <div
            v-if="alloc.notes"
            class="text-italic text-grey-8 q-mt-xs ellipsis-2-lines text-caption"
          >
            "{{ alloc.notes }}"
          </div>
        </div>
      </q-timeline-entry>
    </q-timeline>
    
    <div
      v-if="sortedAllocations.length === 0"
      class="flex flex-center q-pa-xl text-grey-6"
    >
      <q-icon
        name="event_busy"
        size="lg"
        class="q-mb-sm"
      />
      <div>Không có dữ liệu phân bổ</div>
    </div>
  </div>
</template>

<style scoped>
.conflict-timeline {
  max-width: 100%;
}

.allocation-item {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
  padding: 8px;
}

.allocation-item:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.selected-allocation {
  background-color: var(--q-primary-opacity-10, rgba(25, 118, 210, 0.1));
  border: 1px solid var(--q-primary);
}

.border-red {
  border: 1px solid #ffcdd2;
}

.rounded-borders {
  border-radius: 4px;
}
</style>
