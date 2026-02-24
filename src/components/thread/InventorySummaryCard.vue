<template>
  <q-card
    v-bind="$attrs"
    bordered
  >
    <q-card-section>
      <div class="row items-center justify-between q-mb-md">
        <div class="text-h6">
          Tổng quan tồn kho
        </div>
        <q-btn
          flat
          round
          dense
          icon="refresh"
          :loading="isLoading"
          @click="refresh"
        >
          <q-tooltip>Làm mới</q-tooltip>
        </q-btn>
      </div>

      <!-- Total Value -->
      <div class="text-h4 text-weight-bold text-primary q-mb-sm">
        {{ formatNumber(totalMeters) }}
        <span class="text-caption text-grey">mét</span>
      </div>
      <div class="text-caption text-grey q-mb-md">
        {{ formatNumber(totalCones) }} cuộn
      </div>

      <!-- Status Distribution Bar -->
      <div class="distribution-bar q-mb-md">
        <div
          v-for="status in statusDistribution"
          :key="status.key"
          :class="['bar-segment', status.colorClass]"
          :style="{ width: status.percentage + '%' }"
        >
          <q-tooltip>
            {{ status.label }}: {{ status.percentage }}%
          </q-tooltip>
        </div>
      </div>

      <!-- Legend -->
      <div class="row q-gutter-md">
        <div
          v-for="status in statusDistribution"
          :key="status.key"
          class="col-auto cursor-pointer"
          @click="emitFilter(status.key)"
        >
          <div class="row items-center no-wrap q-gutter-xs">
            <q-badge
              :color="status.color"
              rounded
              class="q-pa-xs"
            />
            <span class="text-caption">{{ status.label }}</span>
            <span class="text-caption text-weight-bold">
              {{ formatNumber(status.meters) }}m
            </span>
          </div>
        </div>
      </div>
    </q-card-section>

    <!-- Quick Actions -->
    <q-separator />
    <q-card-actions align="right">
      <q-btn
        flat
        dense
        color="primary"
        label="Xem chi tiết"
        icon-right="arrow_forward"
        @click="$router.push('/thread/inventory')"
      />
    </q-card-actions>
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

// Emits
const emit = defineEmits<{
  filter: [status: string]
}>()

// Composables
const { summary, isLoading, fetchSummary } = useDashboard()

// Computed values
const totalMeters = computed(() => summary.value?.total_meters || 0)
const totalCones = computed(() => summary.value?.total_cones || 0)

const statusDistribution = computed(() => {
  if (!summary.value) {
    return [
      { key: 'available', label: 'Có sẵn', meters: 0, percentage: 0, color: 'positive', colorClass: 'bg-positive' },
      { key: 'allocated', label: 'Đã cấp', meters: 0, percentage: 0, color: 'warning', colorClass: 'bg-warning' },
      { key: 'in_production', label: 'Đang sản xuất', meters: 0, percentage: 0, color: 'info', colorClass: 'bg-info' },
    ]
  }

  const total = summary.value.total_meters || 1
  const available = summary.value.available_meters || 0
  const allocated = summary.value.allocated_meters || 0
  const inProduction = total - available - allocated

  return [
    {
      key: 'available',
      label: 'Có sẵn',
      meters: available,
      percentage: Math.round((available / total) * 100),
      color: 'positive',
      colorClass: 'bg-positive',
    },
    {
      key: 'allocated',
      label: 'Đã cấp',
      meters: allocated,
      percentage: Math.round((allocated / total) * 100),
      color: 'warning',
      colorClass: 'bg-warning',
    },
    {
      key: 'in_production',
      label: 'Đang sản xuất',
      meters: inProduction > 0 ? inProduction : 0,
      percentage: Math.round((Math.max(0, inProduction) / total) * 100),
      color: 'info',
      colorClass: 'bg-info',
    },
  ]
})

// Methods
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('vi-VN').format(num)
}

const refresh = async () => {
  await fetchSummary()
}

const emitFilter = (status: string) => {
  emit('filter', status)
  router.push({ path: '/thread/inventory', query: { status } })
}

// Lifecycle
onMounted(() => {
  if (props.autoFetch && !summary.value) {
    fetchSummary()
  }
})
</script>

<style scoped>
.distribution-bar {
  display: flex;
  height: 12px;
  border-radius: 6px;
  overflow: hidden;
  background-color: var(--q-grey-3);
}

.bar-segment {
  height: 100%;
  min-width: 2px;
  transition: width 0.3s ease;
}

.bar-segment:first-child {
  border-radius: 6px 0 0 6px;
}

.bar-segment:last-child {
  border-radius: 0 6px 6px 0;
}
</style>
