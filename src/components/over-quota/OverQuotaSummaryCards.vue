<script setup lang="ts">
import type { OverQuotaSummary } from '@/types/thread/overQuota'
import StatCard from '@/components/ui/cards/StatCard.vue'

defineProps<{
  data: OverQuotaSummary | null
  loading: boolean
}>()

function rateColor(pct: number): string {
  if (pct >= 10) return 'negative'
  if (pct >= 5) return 'warning'
  return 'positive'
}
</script>

<template>
  <div class="row q-col-gutter-md q-mb-md">
    <div class="col-6 col-sm-4 col-md">
      <q-skeleton
        v-if="loading && !data"
        type="rect"
        height="80px"
      />
      <StatCard
        v-else
        label="Tổng lượt vượt ĐM"
        :value="data?.total_over_events ?? '---'"
        icon="warning"
        icon-bg-color="negative"
        flat
        bordered
      />
    </div>

    <div class="col-6 col-sm-4 col-md">
      <q-skeleton
        v-if="loading && !data"
        type="rect"
        height="80px"
      />
      <StatCard
        v-else
        label="Tổng cuộn vượt"
        :value="data?.total_excess_cones?.toFixed(1) ?? '---'"
        icon="inventory_2"
        icon-bg-color="negative"
        flat
        bordered
      />
    </div>

    <div class="col-6 col-sm-4 col-md">
      <q-skeleton
        v-if="loading && !data"
        type="rect"
        height="80px"
      />
      <StatCard
        v-else
        label="Tỷ lệ % vượt ĐM"
        :value="data ? `${data.over_rate_pct.toFixed(1)}%` : '---'"
        icon="percent"
        :icon-bg-color="data ? rateColor(data.over_rate_pct) : 'grey'"
        flat
        bordered
      />
    </div>

    <div class="col-6 col-sm-4 col-md">
      <q-skeleton
        v-if="loading && !data"
        type="rect"
        height="80px"
      />
      <StatCard
        v-else
        label="Mã hàng vượt nhất"
        :value="data?.top_style?.code ?? '---'"
        icon="style"
        icon-bg-color="primary"
        flat
        bordered
      />
    </div>

    <div class="col-6 col-sm-4 col-md">
      <q-skeleton
        v-if="loading && !data"
        type="rect"
        height="80px"
      />
      <StatCard
        v-else
        label="Phòng ban nhiều nhất"
        :value="data?.top_dept?.name ?? '---'"
        icon="groups"
        icon-bg-color="warning"
        flat
        bordered
      />
    </div>
  </div>
</template>
