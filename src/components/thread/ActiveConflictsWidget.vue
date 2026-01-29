<template>
  <q-card v-bind="$attrs" bordered>
    <q-card-section>
      <div class="row items-center justify-between q-mb-md">
        <div class="row items-center q-gutter-sm">
          <q-icon name="warning" color="warning" size="24px" />
          <span class="text-h6">Xung đột cấp phát</span>
        </div>
        <q-badge
          v-if="conflictCount > 0"
          color="negative"
          :label="conflictCount"
          rounded
        />
      </div>

      <!-- Empty State -->
      <div v-if="conflictCount === 0" class="text-center q-py-md">
        <q-icon name="check_circle" color="positive" size="48px" />
        <div class="text-subtitle2 text-grey q-mt-sm">
          Không có xung đột
        </div>
      </div>

      <!-- Conflicts List -->
      <q-list v-else separator dense>
        <q-item
          v-for="conflict in topConflicts"
          :key="conflict.id"
          clickable
          @click="viewConflict(conflict)"
        >
          <q-item-section avatar>
            <q-avatar color="negative" text-color="white" size="32px">
              <q-icon name="priority_high" size="18px" />
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label>{{ conflict.thread_type_name || conflict.thread_type_code }}</q-item-label>
            <q-item-label caption class="text-negative">
              Thiếu {{ formatNumber(conflict.shortage) }}m
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-badge
              :color="getPriorityColor(conflict.priority)"
              :label="getPriorityLabel(conflict.priority)"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>

    <!-- View All Link -->
    <template v-if="conflictCount > 3">
      <q-separator />
      <q-card-actions align="right">
        <q-btn
          flat
          dense
          color="primary"
          label="Xem tất cả"
          icon-right="arrow_forward"
          @click="viewAllConflicts"
        />
      </q-card-actions>
    </template>
  </q-card>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDashboard } from '@/composables/thread/useDashboard'

const router = useRouter()

// Props
interface Props {
  autoFetch?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoFetch: true,
})

// Types
interface Conflict {
  id: number
  thread_type_id: number
  thread_type_code?: string
  thread_type_name?: string
  shortage: number
  priority?: 'high' | 'medium' | 'low'
}

// Composables
const { conflicts, fetchConflicts } = useDashboard()

// Computed
const conflictCount = computed(() => conflicts.value?.total_conflicts || 0)

const topConflicts = computed((): Conflict[] => {
  const conflictList = conflicts.value?.conflicts || []
  return conflictList.slice(0, 3)
})

// Methods
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('vi-VN').format(num)
}

const getPriorityColor = (priority?: string): string => {
  switch (priority) {
    case 'high':
      return 'negative'
    case 'medium':
      return 'warning'
    case 'low':
      return 'info'
    default:
      return 'grey'
  }
}

const getPriorityLabel = (priority?: string): string => {
  switch (priority) {
    case 'high':
      return 'Cao'
    case 'medium':
      return 'Trung bình'
    case 'low':
      return 'Thấp'
    default:
      return 'N/A'
  }
}

const viewConflict = (conflict: Conflict) => {
  router.push({
    path: '/thread/allocations',
    query: { conflict_id: conflict.id.toString() },
  })
}

const viewAllConflicts = () => {
  router.push('/thread/allocations?tab=conflicts')
}

// Lifecycle
onMounted(() => {
  if (props.autoFetch) {
    fetchConflicts()
  }
})
</script>
