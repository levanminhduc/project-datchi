<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  percentage: number // Remaining percentage
  showLabel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showLabel: true
})

const color = computed(() => {
  if (props.percentage > 50) return 'positive'
  if (props.percentage > 25) return 'amber'
  return 'negative'
})

const icon = computed(() => {
  if (props.percentage > 50) return 'battery_full'
  if (props.percentage > 25) return 'battery_3_bar'
  return 'battery_alert'
})

const label = computed(() => `${Math.round(props.percentage)}%`)
</script>

<template>
  <q-badge
    :color="color"
    class="partial-cone-indicator q-pa-xs"
    :outline="percentage < 10"
  >
    <div class="row items-center no-wrap">
      <q-icon
        :name="icon"
        size="14px"
        class="q-mr-xs"
      />
      <span
        v-if="showLabel"
        class="text-weight-bold"
      >{{ label }}</span>
      <q-tooltip>
        Còn lại khoảng {{ label }} (cuộn dở)
      </q-tooltip>
    </div>
  </q-badge>
</template>

<style scoped>
.partial-cone-indicator {
  min-width: 45px;
  justify-content: center;
}
</style>
