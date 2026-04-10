<script setup lang="ts">
import { VChart } from '@/plugins/echarts'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'

defineProps<{
  option: Record<string, unknown>
  loading: boolean
  hasData: boolean
}>()

const emit = defineEmits<{
  barClick: [styleId: number]
  'update:topN': [value: number]
}>()

const topN = defineModel<number>('topN', { default: 10 })

const topNOptions = [
  { value: 5, label: 'Top 5' },
  { value: 10, label: 'Top 10' },
  { value: 20, label: 'Top 20' },
]

function handleChartClick(params: { data?: { styleId?: number } }) {
  const styleId = params.data?.styleId
  if (styleId !== undefined) {
    emit('barClick', styleId)
  }
}
</script>

<template>
  <q-card
    flat
    bordered
    aria-label="Top Mã Hàng Vượt Định Mức"
  >
    <q-card-section class="row items-center justify-between q-pb-none">
      <div class="text-subtitle1 text-weight-medium">
        Top Mã Hàng Vượt Định Mức
      </div>
      <AppSelect
        v-model="topN"
        :options="topNOptions"
        dense
        style="width: 100px"
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
        style="height: 320px"
        @click="handleChartClick as any"
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
