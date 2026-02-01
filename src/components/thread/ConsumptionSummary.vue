<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  original: { weight: number, meters: number }
  returned: { weight: number, meters: number }
  expected?: number // Expected consumption in meters
}

const props = withDefaults(defineProps<Props>(), {
  expected: undefined
})

const consumed = computed(() => ({
  weight: Math.max(0, props.original.weight - props.returned.weight),
  meters: Math.max(0, props.original.meters - props.returned.meters)
}))

const percentageConsumed = computed(() => {
  if (!props.original.meters) return 0
  return (consumed.value.meters / props.original.meters) * 100
})

const percentageReturned = computed(() => 100 - percentageConsumed.value)

const isAbnormal = computed(() => {
  if (props.expected === undefined) return false
  // Flag if consumption is 20% more than expected
  return consumed.value.meters > props.expected * 1.2
})
</script>

<template>
  <div class="consumption-summary">
    <div class="row q-col-gutter-sm">
      <div class="col-6">
        <q-card
          flat
          bordered
          class="text-center q-pa-sm bg-grey-1"
        >
          <div class="text-caption text-grey-7">
            Ban đầu
          </div>
          <div class="text-h6">
            {{ original.meters.toLocaleString() }} m
          </div>
          <div class="text-caption text-grey-6">
            {{ original.weight }} g
          </div>
        </q-card>
      </div>
      <div class="col-6">
        <q-card
          flat
          bordered
          class="text-center q-pa-sm bg-grey-1"
        >
          <div class="text-caption text-grey-7">
            Trả lại
          </div>
          <div class="text-h6 text-primary">
            {{ returned.meters.toLocaleString() }} m
          </div>
          <div class="text-caption text-grey-6">
            {{ returned.weight }} g
          </div>
        </q-card>
      </div>
    </div>

    <q-card
      flat
      bordered
      class="q-mt-sm"
    >
      <q-card-section class="q-py-sm">
        <div class="row justify-between items-center q-mb-xs">
          <div class="text-subtitle2">
            Đã tiêu thụ
          </div>
          <div class="text-h6 text-orange-9">
            {{ consumed.meters.toLocaleString() }} m
          </div>
        </div>
        
        <q-linear-progress
          :value="percentageConsumed / 100"
          color="orange-9"
          track-color="green-2"
          size="12px"
          rounded
          class="q-mb-xs"
        />
        
        <div class="row justify-between text-caption text-grey-7">
          <span>Tiêu thụ: {{ percentageConsumed.toFixed(1) }}%</span>
          <span>Còn lại: {{ percentageReturned.toFixed(1) }}%</span>
        </div>
      </q-card-section>
    </q-card>

    <q-banner
      v-if="isAbnormal"
      dense
      class="bg-red-1 text-red-9 rounded-borders q-mt-sm"
    >
      <template #avatar>
        <q-icon
          name="warning"
          color="red-9"
        />
      </template>
      Tiêu thụ vượt định mức dự kiến ({{ expected?.toLocaleString() }}m). 
      Chênh lệch: {{ (consumed.meters - (expected || 0)).toLocaleString() }}m.
    </q-banner>
  </div>
</template>

<style scoped>
.consumption-summary {
  width: 100%;
}
</style>
