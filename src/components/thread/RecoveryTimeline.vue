<script setup lang="ts">
import { computed } from 'vue'
import { date } from 'quasar'
import { RecoveryStatus } from '@/types/thread/enums'
import type { Recovery } from '@/types/thread'

interface Props {
  recovery: Recovery
}

const props = defineProps<Props>()

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return ''
  return date.formatDate(dateStr, 'HH:mm DD/MM/YYYY')
}

const steps = [
  {
    status: RecoveryStatus.INITIATED,
    title: 'Khởi tạo',
    icon: 'input',
    userField: 'returned_by'
  },
  {
    status: RecoveryStatus.PENDING_WEIGH,
    title: 'Chờ cân',
    icon: 'hourglass_empty',
    userField: null
  },
  {
    status: RecoveryStatus.WEIGHED,
    title: 'Đã cân',
    icon: 'scale',
    userField: 'weighed_by'
  },
  {
    status: RecoveryStatus.CONFIRMED,
    title: 'Hoàn tất',
    icon: 'check_circle',
    userField: 'confirmed_by'
  }
]

const currentStepIndex = computed(() => {
  if (props.recovery.status === RecoveryStatus.WRITTEN_OFF) return 3
  if (props.recovery.status === RecoveryStatus.REJECTED) return 3
  
  const statusIndex = steps.findIndex(s => s.status === props.recovery.status)
  return statusIndex === -1 ? 0 : statusIndex
})

const getStepColor = (index: number) => {
  if (props.recovery.status === RecoveryStatus.REJECTED && index === currentStepIndex.value) {
    return 'negative'
  }
  if (props.recovery.status === RecoveryStatus.WRITTEN_OFF && index === currentStepIndex.value) {
    return 'amber-9'
  }
  if (index < currentStepIndex.value) return 'positive'
  if (index === currentStepIndex.value) return 'primary'
  return 'grey-5'
}

const getStepLabel = (step: typeof steps[0], index: number) => {
  if (index === 3) {
    if (props.recovery.status === RecoveryStatus.WRITTEN_OFF) return 'Đã hủy (Write-off)'
    if (props.recovery.status === RecoveryStatus.REJECTED) return 'Đã từ chối'
  }
  return step.title
}
</script>

<template>
  <div class="recovery-timeline q-pa-sm">
    <q-timeline color="primary" layout="dense">
      <q-timeline-entry
        v-for="(step, index) in steps"
        :key="step.status"
        :title="getStepLabel(step, index)"
        :icon="step.icon"
        :color="getStepColor(index)"
      >
        <template #default>
          <div v-if="index === 0" class="text-caption">
            Người trả: {{ recovery.returned_by || 'N/A' }}
            <div class="text-grey-6">{{ formatDate(recovery.created_at) }}</div>
          </div>
          
          <div v-else-if="index === 2 && recovery.weighed_by" class="text-caption">
            Người cân: {{ recovery.weighed_by }}
            <div class="text-grey-6">{{ formatDate(recovery.updated_at) }}</div>
          </div>
          
          <div v-else-if="index === 3 && recovery.confirmed_by" class="text-caption">
            Xác nhận: {{ recovery.confirmed_by }}
            <div class="text-grey-6">{{ formatDate(recovery.updated_at) }}</div>
          </div>

          <div v-if="index === currentStepIndex && recovery.notes" class="text-caption italic q-mt-xs">
            "{{ recovery.notes }}"
          </div>
        </template>
      </q-timeline-entry>
    </q-timeline>
  </div>
</template>

<style scoped>
.recovery-timeline :deep(.q-timeline__title) {
  font-size: 0.9rem;
  margin-bottom: 4px;
}
.italic {
  font-style: italic;
}
</style>
