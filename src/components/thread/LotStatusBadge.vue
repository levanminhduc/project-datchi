<script setup lang="ts">
import { computed } from 'vue'
import type { LotStatus } from '@/types/thread/lot'

interface Props {
  status: LotStatus
  size?: 'sm' | 'md' | 'lg'
  outline?: boolean
  showIcon?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  outline: false,
  showIcon: true
})

const statusConfig: Record<LotStatus, { color: string; label: string; icon: string }> = {
  ACTIVE: { color: 'positive', label: 'Đang hoạt động', icon: 'check_circle' },
  DEPLETED: { color: 'grey', label: 'Đã hết', icon: 'remove_circle' },
  EXPIRED: { color: 'negative', label: 'Hết hạn', icon: 'event_busy' },
  QUARANTINE: { color: 'warning', label: 'Cách ly', icon: 'block' }
}

const config = computed(() => statusConfig[props.status] || { color: 'grey', label: props.status, icon: 'help' })

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'text-caption q-px-xs q-py-none'
    case 'lg':
      return 'text-body2 q-px-md q-py-xs'
    default:
      return 'q-px-sm q-py-none'
  }
})
</script>

<template>
  <q-badge
    :color="config.color"
    :outline="outline"
    :class="sizeClass"
    class="lot-status-badge"
  >
    <q-icon
      v-if="showIcon"
      :name="config.icon"
      size="xs"
      class="q-mr-xs"
    />
    {{ config.label }}
  </q-badge>
</template>

<style scoped>
.lot-status-badge {
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  border-radius: 4px;
}
</style>
