<script setup lang="ts">
import PageHeader from '@/components/ui/layout/PageHeader.vue'
import StatCard from '@/components/ui/cards/StatCard.vue'

const stats = [
  {
    label: 'Tổng nhân viên',
    value: 156,
    icon: 'people',
    trend: '+12%',
    color: 'primary',
    trendPositive: true
  },
  {
    label: 'Dự án đang thực hiện',
    value: 23,
    icon: 'event_note',
    trend: '+5%',
    color: 'positive',
    trendPositive: true
  },
  {
    label: 'Yêu cầu bảo trì',
    value: 8,
    icon: 'engineering',
    trend: '-3%',
    color: 'warning',
    trendPositive: false
  },
  {
    label: 'Sản phẩm tồn kho',
    value: '1,234',
    icon: 'inventory_2',
    trend: '+2%',
    color: 'info',
    trendPositive: true
  }
]
</script>

<template>
  <q-page padding>
    <PageHeader
      title="Tổng Quan"
      subtitle="Bảng điều khiển hệ thống"
    />

    <div class="row q-col-gutter-md q-mt-md">
      <div
        v-for="(stat, index) in stats"
        :key="index"
        class="col-12 col-md-6 col-lg-3"
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
  </q-page>
</template>
