<script setup lang="ts">
import { computed } from 'vue'
import { IssueV2Status } from '@/types/thread/issueV2'

interface Props {
  status: IssueV2Status
  size?: 'sm' | 'md' | 'lg'
  outline?: boolean
  showIcon?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  outline: false,
  showIcon: true
})

const statusConfig: Record<IssueV2Status, { color: string; label: string; icon: string }> = {
  [IssueV2Status.DRAFT]: { color: 'grey', label: 'Nháp', icon: 'edit_note' },
  [IssueV2Status.CONFIRMED]: { color: 'positive', label: 'Đã xác nhận', icon: 'check_circle' },
  [IssueV2Status.RETURNED]: { color: 'info', label: 'Đã nhập lại', icon: 'replay' }
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
    class="issue-v2-status-badge"
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
.issue-v2-status-badge {
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  border-radius: 4px;
}
</style>
