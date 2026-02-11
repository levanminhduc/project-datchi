<script setup lang="ts">
import { computed } from 'vue'
import type { QuotaCheck } from '@/types/thread/issue'

interface Props {
  quota: QuotaCheck | null
  requestedMeters?: number
}

const props = defineProps<Props>()

const willExceed = computed(() => {
  if (!props.quota || !props.requestedMeters) return false
  return props.requestedMeters > props.quota.remaining_meters
})

const overAmount = computed(() => {
  if (!willExceed.value || !props.quota || !props.requestedMeters) return 0
  return props.requestedMeters - props.quota.remaining_meters
})
</script>

<template>
  <q-banner
    v-if="quota?.is_over_quota || willExceed"
    class="bg-warning text-dark q-mb-md"
    rounded
  >
    <template #avatar>
      <q-icon
        name="warning"
        color="dark"
      />
    </template>
    <div class="text-weight-medium">
      Cảnh báo vượt định mức
    </div>
    <div class="text-caption">
      <div>Định mức: {{ quota?.quota_meters?.toLocaleString() }} mét</div>
      <div>Đã xuất: {{ quota?.issued_meters?.toLocaleString() }} mét</div>
      <div>Còn lại: {{ quota?.remaining_meters?.toLocaleString() }} mét</div>
      <div
        v-if="overAmount > 0"
        class="text-negative text-weight-bold"
      >
        Sẽ vượt: {{ overAmount.toLocaleString() }} mét
      </div>
    </div>
    <div class="text-caption q-mt-sm text-italic">
      Vui lòng ghi chú lý do xuất vượt định mức
    </div>
  </q-banner>
</template>
