<script setup lang="ts">
import type { ReturnGroup, ReturnGroupThread } from '@/types/thread/issueV2'
import AppButton from '@/components/ui/buttons/AppButton.vue'

defineProps<{
  group: ReturnGroup
}>()

defineEmits<{
  select: [group: ReturnGroup]
}>()

function formatThreadSummary(t: ReturnGroupThread): string {
  const outstanding = t.outstanding_full + t.outstanding_partial
  if (outstanding <= 0) return `${t.thread_name} — đã trả hết`
  return `${t.thread_name} — ${outstanding} cuộn`
}

function getTotalOutstanding(group: ReturnGroup): number {
  return group.threads.reduce(
    (sum, t) => sum + t.outstanding_full + t.outstanding_partial,
    0
  )
}
</script>

<template>
  <q-card
    flat
    bordered
    class="return-group-card q-mb-sm cursor-pointer"
    @click="$emit('select', group)"
  >
    <q-card-section>
      <div class="row items-center justify-between q-mb-xs">
        <div>
          <span class="text-weight-bold">{{ group.po_number }}</span>
          <span class="text-grey-7"> / {{ group.style_code }}</span>
          <span class="text-grey-7"> / {{ group.color_name }}</span>
        </div>
        <q-badge
          :color="getTotalOutstanding(group) > 0 ? 'orange' : 'positive'"
          outline
        >
          {{ group.issue_count }} phiếu
        </q-badge>
      </div>

      <div class="q-mt-sm">
        <div
          v-for="t in group.threads"
          :key="t.thread_type_id"
          class="text-body2"
          :class="{ 'text-grey-5': t.outstanding_full + t.outstanding_partial <= 0 }"
        >
          {{ formatThreadSummary(t) }}
        </div>
      </div>

      <div class="row justify-end q-mt-sm">
        <AppButton
          v-if="getTotalOutstanding(group) > 0"
          label="Trả kho"
          icon="keyboard_return"
          color="orange"
          size="sm"
          dense
          @click.stop="$emit('select', group)"
        />
        <q-badge
          v-else
          color="positive"
        >
          Đã trả hết
        </q-badge>
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>
.return-group-card:hover {
  background: rgba(0, 0, 0, 0.02);
}
</style>
