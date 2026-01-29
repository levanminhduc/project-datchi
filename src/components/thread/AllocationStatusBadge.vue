<script setup lang="ts">
import { computed } from 'vue'
import { AllocationStatus } from '@/types/thread/enums'

interface Props {
  status: AllocationStatus
  size?: 'sm' | 'md' | 'lg'
  outline?: boolean
  showIcon?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  outline: false,
  showIcon: true
})

const statusConfig: Record<AllocationStatus, { color: string; label: string; icon: string }> = {
  [AllocationStatus.PENDING]: { color: 'grey', label: 'Chờ xử lý', icon: 'schedule' },
  [AllocationStatus.SOFT]: { color: 'blue', label: 'Đã đặt mềm', icon: 'bookmark_border' },
  [AllocationStatus.HARD]: { color: 'purple', label: 'Đã đặt cứng', icon: 'bookmark' },
  [AllocationStatus.ISSUED]: { color: 'positive', label: 'Đã xuất', icon: 'check_circle' },
  [AllocationStatus.CANCELLED]: { color: 'negative', label: 'Đã hủy', icon: 'cancel' },
  [AllocationStatus.WAITLISTED]: { color: 'orange', label: 'Chờ hàng', icon: 'hourglass_empty' },
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
    class="allocation-status-badge"
  >
    <q-icon v-if="showIcon" :name="config.icon" size="xs" class="q-mr-xs" />
    {{ config.label }}
  </q-badge>
</template>

<style scoped>
.allocation-status-badge {
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  border-radius: 4px;
}
</style>
