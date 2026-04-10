<script setup lang="ts">
import { VChart } from '@/plugins/echarts'

defineProps<{
  option: Record<string, unknown>
  loading: boolean
  hasData: boolean
}>()

const emit = defineEmits<{
  granularityChange: [value: 'week' | 'month']
}>()

const granularity = defineModel<'week' | 'month'>('granularity', { default: 'week' })

function handleGranularity(val: 'week' | 'month') {
  granularity.value = val
  emit('granularityChange', val)
}
</script>

<template>
  <q-card
    flat
    bordered
    aria-label="Xu Hướng"
  >
    <q-card-section class="row items-center justify-between q-pb-none">
      <div class="text-subtitle1 text-weight-medium">
        Xu Hướng
      </div>
      <q-btn-toggle
        :model-value="granularity"
        toggle-color="primary"
        size="sm"
        dense
        :options="[
          { label: 'Tuần', value: 'week' },
          { label: 'Tháng', value: 'month' },
        ]"
        @update:model-value="handleGranularity"
      />
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
