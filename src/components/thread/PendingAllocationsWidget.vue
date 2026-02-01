<template>
  <q-card
    v-bind="$attrs"
    bordered
  >
    <q-card-section>
      <div class="row items-center justify-between q-mb-md">
        <div class="row items-center q-gutter-sm">
          <q-icon
            name="pending_actions"
            color="primary"
            size="24px"
          />
          <span class="text-h6">Đang chờ cấp phát</span>
        </div>
        <q-badge
          v-if="totalPending > 0"
          color="primary"
          :label="totalPending"
          rounded
        />
      </div>

      <!-- Empty State -->
      <div
        v-if="totalPending === 0"
        class="text-center q-py-md"
      >
        <q-icon
          name="done_all"
          color="positive"
          size="48px"
        />
        <div class="text-subtitle2 text-grey q-mt-sm">
          Không có yêu cầu chờ xử lý
        </div>
      </div>

      <!-- Priority Groups -->
      <div
        v-else
        class="column q-gutter-sm"
      >
        <!-- High Priority -->
        <div
          v-if="priorityGroups.high > 0"
          class="priority-row row items-center justify-between q-pa-sm rounded-borders bg-red-1"
        >
          <div class="row items-center q-gutter-sm">
            <q-icon
              name="keyboard_double_arrow_up"
              color="negative"
            />
            <span class="text-body2">Ưu tiên cao</span>
          </div>
          <q-badge
            color="negative"
            :label="priorityGroups.high"
          />
        </div>

        <!-- Medium Priority -->
        <div
          v-if="priorityGroups.medium > 0"
          class="priority-row row items-center justify-between q-pa-sm rounded-borders bg-orange-1"
        >
          <div class="row items-center q-gutter-sm">
            <q-icon
              name="remove"
              color="warning"
            />
            <span class="text-body2">Ưu tiên trung bình</span>
          </div>
          <q-badge
            color="warning"
            :label="priorityGroups.medium"
          />
        </div>

        <!-- Low Priority -->
        <div
          v-if="priorityGroups.low > 0"
          class="priority-row row items-center justify-between q-pa-sm rounded-borders bg-blue-1"
        >
          <div class="row items-center q-gutter-sm">
            <q-icon
              name="keyboard_double_arrow_down"
              color="info"
            />
            <span class="text-body2">Ưu tiên thấp</span>
          </div>
          <q-badge
            color="info"
            :label="priorityGroups.low"
          />
        </div>

        <!-- Oldest Pending -->
        <div
          v-if="oldestPendingDate"
          class="q-mt-sm"
        >
          <q-separator class="q-mb-sm" />
          <div class="row items-center q-gutter-xs text-caption text-grey">
            <q-icon
              name="schedule"
              size="16px"
            />
            <span>Yêu cầu cũ nhất: {{ formatDate(oldestPendingDate) }}</span>
          </div>
        </div>
      </div>
    </q-card-section>

    <!-- Actions -->
    <template v-if="totalPending > 0">
      <q-separator />
      <q-card-actions align="right">
        <q-btn
          flat
          dense
          color="primary"
          label="Xử lý cấp phát"
          icon-right="arrow_forward"
          @click="$router.push('/thread/allocations')"
        />
      </q-card-actions>
    </template>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDashboard } from '@/composables/thread/useDashboard'

// Props
interface Props {
  autoFetch?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoFetch: true,
})

// Composables
const { pending, fetchPending } = useDashboard()

// Local state for priority groups (simulated - would come from API)
const priorityGroups = ref({
  high: 0,
  medium: 0,
  low: 0,
})

const oldestPendingDate = ref<string | null>(null)

// Computed
const totalPending = computed(() => pending.value?.pending_allocations || 0)

// Methods
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Hôm nay'
  if (diffDays === 1) return 'Hôm qua'
  if (diffDays < 7) return `${diffDays} ngày trước`

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

const simulatePriorityData = () => {
  const total = totalPending.value
  if (total === 0) {
    priorityGroups.value = { high: 0, medium: 0, low: 0 }
    oldestPendingDate.value = null
    return
  }

  // Simulate distribution (in real app, this would come from API)
  priorityGroups.value = {
    high: Math.floor(total * 0.2),
    medium: Math.floor(total * 0.5),
    low: total - Math.floor(total * 0.2) - Math.floor(total * 0.5),
  }

  // Simulate oldest date (3 days ago)
  const oldestDate = new Date()
  oldestDate.setDate(oldestDate.getDate() - 3)
  oldestPendingDate.value = oldestDate.toISOString()
}

// Lifecycle
onMounted(async () => {
  if (props.autoFetch) {
    await fetchPending()
    simulatePriorityData()
  }
})
</script>

<style scoped>
.priority-row {
  transition: background-color 0.2s ease;
}

.priority-row:hover {
  filter: brightness(0.98);
}
</style>
