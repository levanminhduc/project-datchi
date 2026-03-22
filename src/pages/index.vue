<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import PageHeader from '@/components/ui/layout/PageHeader.vue'
import StatCard from '@/components/ui/cards/StatCard.vue'
import { employeeService } from '@/services/employeeService'
import { useDashboard } from '@/composables'
import { date } from 'quasar'

const activeEmployeeCount = ref<number>(0)
const isLoadingEmployeeCount = ref(true)

const {
  summary,
  alerts,
  isLoading,
  hasCriticalAlerts,
  fetchAll,
  refreshDashboard,
} = useDashboard()

const lastUpdated = ref(date.formatDate(Date.now(), 'HH:mm:ss DD/MM/YYYY'))
const refreshInterval = ref<number | null>(null)

const formatNumber = (val: number | undefined | null) => {
  if (val === undefined || val === null) return '0'
  return val.toLocaleString('vi-VN')
}

const totalInventoryLabel = computed(() => {
  if (isLoading.value && !summary.value) return '...'
  const total = summary.value?.total_cones || 0
  const partial = summary.value?.partial_cones || 0
  const full = total - partial
  return `${formatNumber(full)} nguyên, ${formatNumber(partial)} lẻ`
})

const alertCount = computed(() => alerts.value.length)

const stats = computed(() => [
  {
    label: 'Tổng tồn kho',
    value: isLoading.value && !summary.value ? '...' : formatNumber(summary.value?.total_cones),
    icon: 'inventory_2',
    color: 'primary',
    trend: totalInventoryLabel.value,
    trendPositive: true,
  },
  {
    label: 'Cảnh báo tồn kho',
    value: isLoading.value && alerts.value.length === 0 ? '...' : alertCount.value,
    icon: 'warning',
    color: hasCriticalAlerts.value ? 'negative' : alertCount.value > 0 ? 'warning' : 'positive',
    trend: alertCount.value === 0 ? 'Ổn định' : `${alerts.value.filter(a => a.severity === 'critical').length} nguy cấp`,
    trendPositive: alertCount.value === 0,
  },
  {
    label: 'Nhân viên hoạt động',
    value: isLoadingEmployeeCount.value ? '...' : activeEmployeeCount.value,
    icon: 'people',
    color: 'info',
    trendPositive: true,
  },
])

onMounted(async () => {
  try {
    activeEmployeeCount.value = await employeeService.getActiveCount()
  } catch {
    activeEmployeeCount.value = 0
  } finally {
    isLoadingEmployeeCount.value = false
  }

  await fetchAll()
  lastUpdated.value = date.formatDate(Date.now(), 'HH:mm:ss DD/MM/YYYY')

  refreshInterval.value = window.setInterval(async () => {
    await fetchAll()
    lastUpdated.value = date.formatDate(Date.now(), 'HH:mm:ss DD/MM/YYYY')
  }, 60000)
})

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})

const handleRefresh = async () => {
  await refreshDashboard()
  lastUpdated.value = date.formatDate(Date.now(), 'HH:mm:ss DD/MM/YYYY')
}
</script>

<template>
  <q-page padding>
    <PageHeader
      title="Tổng Quan"
      subtitle="Bảng điều khiển hệ thống"
    >
      <template #actions>
        <div class="row items-center q-gutter-sm">
          <div class="text-caption text-grey-7">
            {{ lastUpdated }}
          </div>
          <q-btn
            flat
            round
            dense
            color="primary"
            icon="refresh"
            :loading="isLoading"
            @click="handleRefresh"
          >
            <q-tooltip>Làm mới dữ liệu</q-tooltip>
          </q-btn>
        </div>
      </template>
    </PageHeader>

    <!-- Stat Cards -->
    <div class="row q-col-gutter-md q-mt-md">
      <div
        v-for="(stat, index) in stats"
        :key="index"
        class="col-12 col-md-4"
      >
        <StatCard
          :label="stat.label"
          :value="stat.value"
          :icon="stat.icon"
          :trend="stat.trend"
          :icon-bg-color="stat.color"
          :trend-positive="stat.trendPositive"
        />
      </div>
    </div>

    <!-- Cảnh báo tồn kho -->
    <q-card class="q-mt-lg shadow-2">
      <q-card-section>
        <div class="row items-center justify-between">
          <div class="text-h6 row items-center">
            <q-icon
              name="warning"
              :color="hasCriticalAlerts ? 'negative' : 'warning'"
              class="q-mr-sm"
            />
            Cảnh Báo Tồn Kho
          </div>
          <q-badge
            v-if="alerts.length"
            :color="hasCriticalAlerts ? 'negative' : 'warning'"
            class="q-px-sm q-py-xs"
          >
            {{ alerts.length }} cảnh báo
          </q-badge>
        </div>
      </q-card-section>

      <q-separator />

      <q-list
        v-if="alerts.length"
        separator
      >
        <q-item
          v-for="alert in alerts"
          :key="alert.id"
        >
          <q-item-section avatar>
            <q-icon
              :name="alert.severity === 'critical' ? 'error' : 'warning'"
              :color="alert.severity === 'critical' ? 'negative' : 'warning'"
              size="28px"
            />
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-weight-bold">
              {{ alert.thread_type_code }} - {{ alert.thread_type_name }}
            </q-item-label>
            <q-item-label caption>
              Hiện tại: {{ formatNumber(alert.current_meters) }}m / Định mức:
              {{ formatNumber(alert.reorder_level) }}m
            </q-item-label>
            <q-linear-progress
              :value="alert.percentage / 100"
              :color="alert.severity === 'critical' ? 'negative' : 'warning'"
              class="q-mt-xs"
              style="height: 4px"
            />
          </q-item-section>

          <q-item-section side>
            <div class="column items-end">
              <q-badge :color="alert.severity === 'critical' ? 'negative' : 'warning'">
                {{ alert.percentage.toFixed(0) }}%
              </q-badge>
              <div class="text-caption text-grey-7 q-mt-xs">
                {{ alert.severity === 'critical' ? 'Nguy cấp' : 'Thấp' }}
              </div>
            </div>
          </q-item-section>
        </q-item>
      </q-list>

      <q-card-section
        v-else-if="!isLoading"
        class="text-center text-grey-6 q-pa-xl"
      >
        <q-icon
          name="check_circle"
          size="48px"
          color="positive"
          class="q-mb-sm"
        />
        <div class="text-subtitle1">
          Tồn kho ổn định
        </div>
        <div class="text-caption">
          Không có loại chỉ nào dưới mức định mức
        </div>
      </q-card-section>

      <q-inner-loading :showing="isLoading && alerts.length === 0">
        <q-spinner-oval
          color="primary"
          size="40px"
        />
      </q-inner-loading>
    </q-card>
  </q-page>
</template>
