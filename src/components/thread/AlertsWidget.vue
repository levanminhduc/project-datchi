<template>
  <q-card v-bind="$attrs" bordered>
    <q-card-section>
      <div class="row items-center justify-between q-mb-md">
        <div class="row items-center q-gutter-sm">
          <q-icon name="notifications_active" color="warning" size="24px" />
          <span class="text-h6">Cảnh báo</span>
        </div>
        <q-badge
          v-if="alertCount > 0"
          :color="hasCritical ? 'negative' : 'warning'"
          :label="alertCount"
          rounded
        />
      </div>

      <!-- Empty State -->
      <div v-if="alertCount === 0" class="text-center q-py-md">
        <q-icon name="notifications_off" color="positive" size="48px" />
        <div class="text-subtitle2 text-grey q-mt-sm">
          Không có cảnh báo
        </div>
      </div>

      <!-- Alerts List -->
      <q-list v-else separator dense>
        <q-item
          v-for="alert in displayAlerts"
          :key="alert.id"
          :class="getAlertClass(alert.severity)"
        >
          <q-item-section avatar>
            <q-icon
              :name="getAlertIcon(alert.severity)"
              :color="getAlertColor(alert.severity)"
              size="24px"
            />
          </q-item-section>

          <q-item-section>
            <q-item-label :class="{ 'text-weight-bold': alert.severity === 'critical' }">
              {{ getAlertTitle(alert) }}
            </q-item-label>
            <q-item-label caption>
              {{ alert.thread_type_name || alert.thread_type_code }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <div class="row items-center q-gutter-xs">
              <q-badge
                :color="getAlertColor(alert.severity)"
                :label="getSeverityLabel(alert.severity)"
                outline
              />
              <q-btn
                flat
                round
                dense
                size="sm"
                icon="close"
                color="grey"
                @click.stop="dismissAlert(alert.id)"
              >
                <q-tooltip>Bỏ qua</q-tooltip>
              </q-btn>
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>

    <!-- View All Link -->
    <template v-if="alertCount > 5">
      <q-separator />
      <q-card-actions align="right">
        <q-btn
          flat
          dense
          color="primary"
          label="Xem tất cả"
          icon-right="arrow_forward"
          @click="$router.push('/thread/inventory?tab=alerts')"
        />
      </q-card-actions>
    </template>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDashboard } from '@/composables/thread/useDashboard'
import { useSnackbar } from '@/composables/useSnackbar'
import type { StockAlert } from '@/services/dashboardService'

// Props
interface Props {
  autoFetch?: boolean
  maxDisplay?: number
}

const props = withDefaults(defineProps<Props>(), {
  autoFetch: true,
  maxDisplay: 5,
})

// Composables
const { alerts, fetchAlerts, hasCriticalAlerts } = useDashboard()
const snackbar = useSnackbar()

// Local state
const dismissedAlerts = ref<Set<number>>(new Set())

// Computed
const filteredAlerts = computed(() => {
  return alerts.value.filter((alert) => !dismissedAlerts.value.has(alert.id))
})

const displayAlerts = computed(() => {
  return filteredAlerts.value.slice(0, props.maxDisplay)
})

const alertCount = computed(() => filteredAlerts.value.length)

const hasCritical = computed(() => hasCriticalAlerts.value)

// Methods
const getAlertColor = (severity: string): string => {
  switch (severity) {
    case 'critical':
      return 'negative'
    case 'warning':
      return 'warning'
    default:
      return 'info'
  }
}

const getAlertIcon = (severity: string): string => {
  switch (severity) {
    case 'critical':
      return 'error_outline'
    case 'warning':
      return 'inventory_2'
    default:
      return 'notifications'
  }
}

const getAlertClass = (severity: string): string => {
  if (severity === 'critical') {
    return 'bg-red-1'
  }
  return ''
}

const getAlertTitle = (alert: StockAlert): string => {
  const percentage = Math.round(alert.percentage)
  if (alert.severity === 'critical') {
    return `Sắp hết hàng (${percentage}%)`
  }
  return `Tồn kho thấp (${percentage}%)`
}

const getSeverityLabel = (severity: string): string => {
  switch (severity) {
    case 'critical':
      return 'Nghiêm trọng'
    case 'warning':
      return 'Cảnh báo'
    default:
      return 'Thông tin'
  }
}

const dismissAlert = (alertId: number) => {
  dismissedAlerts.value.add(alertId)
  snackbar.info('Đã bỏ qua cảnh báo')
}

// Lifecycle
onMounted(() => {
  if (props.autoFetch) {
    fetchAlerts()
  }
})
</script>

<style scoped>
.bg-red-1 {
  background-color: rgba(255, 0, 0, 0.05);
}
</style>
