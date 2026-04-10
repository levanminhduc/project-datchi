<script setup lang="ts">
import { VChart } from '@/plugins/echarts'

defineProps<{
  option: Record<string, unknown>
  loading: boolean
  hasData: boolean
}>()
</script>

<template>
  <q-card
    flat
    bordered
    aria-label="Quota vs Thực Cấp"
  >
    <q-card-section class="q-pb-none">
      <div class="text-subtitle1 text-weight-medium">
        Quota vs Thực Cấp
      </div>
    </q-card-section>

    <q-card-section>
      <div
        v-if="!hasData && !loading"
        class="text-center text-grey-5 q-py-xl"
      >
        <q-icon
          name="bar_chart"
          size="48px"
        />
        <div class="q-mt-sm">
          Không có dữ liệu
        </div>
      </div>
      <VChart
        v-else
        :option="option"
        autoresize
        style="height: 280px"
      />
      <q-inner-loading :showing="loading">
        <q-spinner-dots
          size="40px"
          color="primary"
        />
      </q-inner-loading>
    </q-card-section>
  </q-card>
</template>
