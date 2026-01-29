<template>
  <q-page padding>
    <!-- 1. Page Header -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h5 text-weight-bold">Dashboard Quản Lý Chỉ</div>
        <div class="text-caption text-grey-7">
          Cập nhật lần cuối: {{ lastUpdated }}
        </div>
      </div>
      <q-btn
        flat
        round
        color="primary"
        icon="refresh"
        :loading="isLoading"
        @click="refreshDashboard"
      >
        <q-tooltip>Làm mới dữ liệu</q-tooltip>
      </q-btn>
    </div>

    <!-- 2. Summary Cards Row -->
    <div class="row q-col-gutter-md q-mb-md">
      <!-- Card 1: Tổng tồn kho -->
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="stat-card border-left-primary">
          <q-card-section>
            <div class="text-overline text-grey-7">Tổng Tồn Kho</div>
            <div class="text-h4 text-weight-bold text-primary">
              {{ formatNumber(summary?.total_cones) }}
            </div>
            <div class="text-caption text-grey-8">
              {{ formatNumber(summary?.total_meters) }} mét
            </div>
          </q-card-section>
          <q-inner-loading :showing="isLoading && !summary">
            <q-spinner-dots color="primary" />
          </q-inner-loading>
        </q-card>
      </div>

      <!-- Card 2: Khả dụng -->
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="stat-card border-left-positive">
          <q-card-section>
            <div class="text-overline text-grey-7">Khả Dụng</div>
            <div class="text-h4 text-weight-bold text-positive">
              {{ formatNumber(summary?.available_cones) }}
            </div>
            <div class="text-caption text-grey-8">
              {{ formatNumber(summary?.available_meters) }} mét
            </div>
          </q-card-section>
          <q-inner-loading :showing="isLoading && !summary">
            <q-spinner-dots color="positive" />
          </q-inner-loading>
        </q-card>
      </div>

      <!-- Card 3: Đã phân bổ -->
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="stat-card border-left-info">
          <q-card-section>
            <div class="text-overline text-grey-7">Đã Phân Bổ</div>
            <div class="text-h4 text-weight-bold text-info">
              {{ formatNumber(summary?.allocated_cones) }}
            </div>
            <div class="text-caption text-grey-8">
              {{ formatNumber(summary?.allocated_meters) }} mét
            </div>
          </q-card-section>
          <q-inner-loading :showing="isLoading && !summary">
            <q-spinner-dots color="info" />
          </q-inner-loading>
        </q-card>
      </div>

      <!-- Card 4: Đang sản xuất -->
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="stat-card border-left-secondary">
          <q-card-section>
            <div class="text-overline text-grey-7">Đang Sản Xuất</div>
            <div class="text-h4 text-weight-bold text-secondary">
              {{ formatNumber(summary?.in_production_cones) }}
            </div>
            <div class="text-caption text-grey-8">
              Bao gồm {{ formatNumber(summary?.partial_cones) }} ống dở dang
            </div>
          </q-card-section>
          <q-inner-loading :showing="isLoading && !summary">
            <q-spinner-dots color="secondary" />
          </q-inner-loading>
        </q-card>
      </div>
    </div>

    <!-- 3. Alerts Section -->
    <q-card class="q-mb-md shadow-2">
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

      <q-list separator v-if="alerts.length">
        <q-item v-for="alert in alerts" :key="alert.id">
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

      <q-card-section v-else-if="!isLoading" class="text-center text-grey-6 q-pa-xl">
        <q-icon name="check_circle" size="48px" color="positive" class="q-mb-sm" />
        <div class="text-subtitle1">Tồn kho ổn định</div>
        <div class="text-caption">Không có loại chỉ nào dưới mức định mức</div>
      </q-card-section>

      <q-inner-loading :showing="isLoading && alerts.length === 0">
        <q-spinner-oval color="primary" size="40px" />
      </q-inner-loading>
    </q-card>

    <!-- 4. Two-Column Layout Below -->
    <div class="row q-col-gutter-md">
      <!-- Left Column: Pending Actions -->
      <div class="col-12 col-md-6">
        <q-card class="full-height shadow-2">
          <q-card-section>
            <div class="text-h6 row items-center">
              <q-icon name="pending_actions" color="primary" class="q-mr-sm" />
              Cần Xử Lý
            </div>
          </q-card-section>

          <q-separator />

          <q-list padding>
            <q-item clickable v-ripple to="/thread/allocations">
              <q-item-section avatar>
                <q-avatar color="blue-1" text-color="blue" icon="assignment" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Phân bổ chờ xử lý</q-item-label>
                <q-item-label caption>Yêu cầu mới cần xuất kho</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge color="primary" rounded>{{ pending?.pending_allocations || 0 }}</q-badge>
              </q-item-section>
            </q-item>

            <q-item clickable v-ripple to="/thread/recovery">
              <q-item-section avatar>
                <q-avatar color="green-1" text-color="green" icon="assignment_return" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Thu hồi chờ xử lý</q-item-label>
                <q-item-label caption>Chỉ dư từ sản xuất cần nhập lại kho</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge color="positive" rounded>{{ pending?.pending_recovery || 0 }}</q-badge>
              </q-item-section>
            </q-item>

            <q-item clickable v-ripple to="/thread/allocations">
              <q-item-section avatar>
                <q-avatar color="orange-1" text-color="orange" icon="hourglass_empty" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Danh sách chờ (Waitlist)</q-item-label>
                <q-item-label caption>Phân bổ đang đợi nhập thêm chỉ</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge color="warning" rounded>{{ pending?.waitlisted_allocations || 0 }}</q-badge>
              </q-item-section>
            </q-item>

            <q-item clickable v-ripple to="/thread/allocations">
              <q-item-section avatar>
                <q-avatar color="red-1" text-color="red" icon="event_busy" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Phân bổ quá hạn</q-item-label>
                <q-item-label caption>Đã quá thời gian dự kiến nhưng chưa xuất</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge color="negative" rounded>{{ pending?.overdue_allocations || 0 }}</q-badge>
              </q-item-section>
            </q-item>
          </q-list>

          <q-inner-loading :showing="isLoading && !pending">
            <q-spinner-dots color="primary" />
          </q-inner-loading>
        </q-card>
      </div>

      <!-- Right Column: Active Conflicts -->
      <div class="col-12 col-md-6">
        <q-card class="full-height shadow-2">
          <q-card-section>
            <div class="row items-center justify-between">
              <div class="text-h6 row items-center">
                <q-icon name="bolt" color="negative" class="q-mr-sm" />
                Xung Đột Cấp Phát
              </div>
              <q-badge v-if="conflicts.total_conflicts" color="negative">
                {{ conflicts.total_conflicts }} xung đột
              </q-badge>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section v-if="conflicts.total_conflicts > 0" class="q-pa-none">
            <q-list separator>
              <q-item v-for="(conflict, index) in conflicts.conflicts.slice(0, 5)" :key="index">
                <q-item-section>
                  <q-item-label class="text-weight-medium">
                    {{ conflict.thread_type_code }}
                  </q-item-label>
                  <q-item-label caption>
                    Thiếu {{ formatNumber(conflict.missing_meters) }}m cho {{ conflict.affected_orders }} đơn hàng
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn flat round dense icon="chevron_right" to="/thread/allocations" />
                </q-item-section>
              </q-item>
            </q-list>
            
            <q-card-actions align="center" v-if="conflicts.total_conflicts > 5">
              <q-btn flat color="primary" label="Xem tất cả xung đột" to="/thread/allocations" />
            </q-card-actions>
          </q-card-section>

          <q-card-section v-else-if="!isLoading" class="text-center text-grey-6 q-pa-xl">
            <q-icon name="verified" size="48px" color="info" class="q-mb-sm opacity-50" />
            <div class="text-subtitle1">Không có xung đột</div>
            <div class="text-caption">Tất cả các phân bổ hiện tại đều đủ tồn kho</div>
          </q-card-section>

          <q-inner-loading :showing="isLoading && conflicts.total_conflicts === 0">
            <q-spinner-dots color="negative" />
          </q-inner-loading>
        </q-card>
      </div>
    </div>

    <!-- 5. Recent Activity Section -->
    <div class="q-mt-lg">
      <q-card class="shadow-2">
        <q-card-section>
          <div class="text-h6 row items-center">
            <q-icon name="history" color="grey-7" class="q-mr-sm" />
            Hoạt Động Gần Đây
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-timeline color="primary" v-if="activity.length">
            <q-timeline-entry
              v-for="item in activity"
              :key="item.id"
              :title="item.description"
              :subtitle="formatDate(item.timestamp)"
              :icon="getActivityIcon(item.type)"
              :color="getActivityColor(item.type)"
            >
              <div v-if="item.metadata" class="text-caption text-grey-7">
                {{ formatMetadata(item) }}
              </div>
            </q-timeline-entry>
          </q-timeline>
          
          <div v-else-if="!isLoading" class="text-center text-grey-6 q-pa-lg">
            Không có hoạt động gần đây
          </div>
        </q-card-section>
        
        <q-inner-loading :showing="isLoading && activity.length === 0">
          <q-spinner-dots color="primary" />
        </q-inner-loading>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useDashboard } from '@/composables'
import { date } from 'quasar'

// Composables
const {
  summary,
  alerts,
  conflicts,
  pending,
  activity,
  isLoading,
  hasCriticalAlerts,
  fetchAll,
  refreshDashboard,
} = useDashboard()

// State
const lastUpdated = ref(date.formatDate(Date.now(), 'HH:mm:ss DD/MM/YYYY'))
const refreshInterval = ref<number | null>(null)

// Helpers
const formatNumber = (val: number | undefined | null) => {
  if (val === undefined || val === null) return '0'
  return val.toLocaleString('vi-VN')
}

const formatDate = (val: string) => {
  return date.formatDate(val, 'HH:mm DD/MM/YYYY')
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'RECEIVE': return 'add_shopping_cart'
    case 'ISSUE': return 'remove_shopping_cart'
    case 'RETURN': return 'assignment_return'
    case 'ALLOCATION': return 'assignment'
    case 'CONFLICT': return 'bolt'
    default: return 'history'
  }
}

const getActivityColor = (type: string) => {
  switch (type) {
    case 'RECEIVE': return 'positive'
    case 'ISSUE': return 'info'
    case 'RETURN': return 'orange'
    case 'ALLOCATION': return 'primary'
    case 'CONFLICT': return 'negative'
    default: return 'grey-7'
  }
}

const formatMetadata = (item: any) => {
  if (!item.metadata) return ''
  // Customize based on what metadata contains
  const meta = item.metadata
  if (meta.code) return `Loại chỉ: ${meta.code} - ${meta.name || ''}`
  if (meta.order_no) return `Đơn hàng: ${meta.order_no}`
  return JSON.stringify(meta)
}

// Lifecycle
onMounted(() => {
  fetchAll().then(() => {
    lastUpdated.value = date.formatDate(Date.now(), 'HH:mm:ss DD/MM/YYYY')
  })
  
  // Refresh every 60 seconds
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
</script>

<style scoped>
.stat-card {
  transition: transform 0.2s;
  border-radius: 8px;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.border-left-primary { border-left: 4px solid var(--q-primary); }
.border-left-positive { border-left: 4px solid var(--q-positive); }
.border-left-info { border-left: 4px solid var(--q-info); }
.border-left-secondary { border-left: 4px solid var(--q-secondary); }

.opacity-50 {
  opacity: 0.5;
}
</style>
