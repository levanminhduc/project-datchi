<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import StatCard from '@/components/ui/cards/StatCard.vue'
import { useDashboard, useSidebar } from '@/composables'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'
import { date } from 'quasar'

const router = useRouter()

const {
  summary,
  fetchSummary,
} = useDashboard()

const { hubNavGroups } = useSidebar()
const { employee } = useAuth()

const isLoading = ref(false)
const now = ref(new Date())
const lastUpdated = ref(date.formatDate(Date.now(), 'HH:mm:ss DD/MM/YYYY'))
const refreshInterval = ref<number | null>(null)

const DAY_NAMES = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']

const greeting = computed(() => {
  const hour = now.value.getHours()
  if (hour < 11) return 'Chào buổi sáng'
  if (hour < 13) return 'Chào buổi trưa'
  if (hour < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
})

const firstName = computed(() => {
  const fullName = employee.value?.fullName?.trim()
  if (!fullName) return ''
  return fullName.split(/\s+/).pop() ?? ''
})

const todayLabel = computed(() => {
  const d = now.value
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} tháng ${d.getMonth() + 1}, ${d.getFullYear()}`
})

const formatNumber = (val: number | undefined | null) => {
  if (val === undefined || val === null) return '0'
  return val.toLocaleString('vi-VN')
}

const formatCurrency = (val: number | undefined | null) => {
  if (val === undefined || val === null || val === 0) return '0'
  return new Intl.NumberFormat('vi-VN').format(Math.round(val))
}

const stats = computed(() => [
  {
    label: 'Tổng Tồn Kho',
    value: isLoading.value && !summary.value ? '...' : formatNumber(summary.value?.total_cones),
    icon: 'inventory_2',
    color: 'primary',
    caption: `${formatNumber(summary.value?.total_meters)} mét`,
  },
  {
    label: 'Khả Dụng',
    value: isLoading.value && !summary.value ? '...' : formatNumber(summary.value?.available_cones),
    icon: 'check_circle',
    color: 'positive',
    caption: `${formatNumber(summary.value?.available_meters)} mét`,
  },
  {
    label: 'Giá Trị Tồn Kho',
    value: isLoading.value && !summary.value
      ? '...'
      : formatCurrency(summary.value?.total_inventory_value),
    unit: isLoading.value && !summary.value ? undefined : 'VND',
    icon: 'payments',
    color: 'info',
    caption: 'Cuộn nguyên × đơn giá',
  },
])

const loadSummary = async () => {
  isLoading.value = true
  try {
    await fetchSummary()
    now.value = new Date()
    lastUpdated.value = date.formatDate(Date.now(), 'HH:mm:ss DD/MM/YYYY')
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await loadSummary()

  refreshInterval.value = window.setInterval(async () => {
    await loadSummary()
  }, 60000)
})

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})

const handleRefresh = async () => {
  await loadSummary()
}
</script>

<template>
  <q-page padding>
    <div class="row items-end justify-between">
      <div>
        <div class="text-h5 text-weight-bold text-primary">
          {{ greeting }}<template v-if="firstName">
            , {{ firstName }}
          </template>
        </div>
        <div class="text-body2 text-grey-7 q-mt-xs">
          {{ todayLabel }}
        </div>
      </div>
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
    </div>

    <div class="row q-col-gutter-md q-mt-md">
      <div
        v-for="(stat, index) in stats"
        :key="index"
        class="col-12 col-md-4 stat-value-primary"
      >
        <StatCard
          :label="stat.label"
          :value="stat.value"
          :unit="stat.unit"
          :icon="stat.icon"
          :caption="stat.caption"
          :icon-bg-color="stat.color"
        />
      </div>
    </div>

    <div class="row items-center q-mt-lg q-mb-md">
      <q-icon
        name="o_apps"
        color="primary"
        size="22px"
      />
      <span class="text-h6 text-weight-bold text-primary q-ml-sm">Điều Hướng Nhanh</span>
      <q-separator class="col q-ml-md" />
    </div>

    <div
      v-for="group in hubNavGroups"
      :key="group.label"
      class="q-mb-lg"
    >
      <div
        class="hub-group-label row items-center q-mb-sm"
        :style="{ color: group.color }"
      >
        <q-icon
          :name="group.icon"
          size="19px"
        />
        <span class="q-ml-xs">{{ group.label }}</span>
      </div>
      <div class="row q-col-gutter-md">
        <div
          v-for="item in group.items"
          :key="item.to"
          class="col-12 col-sm-6 col-md-4 col-lg-3"
        >
          <q-card
            v-ripple
            bordered
            class="hub-card cursor-pointer full-height"
            :style="{ '--hub-icon-color': item.color }"
            @click="router.push(item.to)"
          >
            <q-card-section class="row items-center no-wrap">
              <q-icon
                :name="item.icon"
                size="28px"
              />
              <div class="q-ml-md col">
                <div class="text-subtitle2 text-weight-bold">
                  {{ item.title }}
                </div>
                <div
                  v-if="item.caption"
                  class="text-caption hub-caption"
                >
                  {{ item.caption }}
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<style scoped lang="scss">
.stat-value-primary :deep(.text-h4) {
  color: var(--q-primary);
}

.hub-card {
  border-color: var(--q-primary);
  transition: background-color 0.2s ease, color 0.2s ease;
}

.hub-card .q-icon {
  color: var(--hub-icon-color);
}

.hub-caption {
  color: #616161;
}

.hub-card:hover {
  background-color: var(--q-primary);
  color: #fff;
}

.hub-card:hover .q-icon,
.hub-card:hover .hub-caption {
  color: #fff;
}

.hub-group-label {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}
</style>
