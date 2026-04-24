<script setup lang="ts">
import type { ReturnGroup, ReturnGroupThread } from '@/types/thread/issueV2'
import AppButton from '@/components/ui/buttons/AppButton.vue'

defineProps<{
  group: ReturnGroup
}>()

defineEmits<{
  select: [group: ReturnGroup]
}>()

function rowKey(t: ReturnGroupThread): string {
  return `${t.thread_type_id}_${t.thread_color_id ?? 'null'}`
}

function formatOutstandingSummary(t: ReturnGroupThread): string {
  const parts: string[] = []
  if (t.outstanding_full > 0) parts.push(`${t.outstanding_full} ng`)
  if (t.outstanding_partial > 0) parts.push(`${t.outstanding_partial} lẻ`)
  return parts.join(' + ') || 'Đã trả hết'
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
          :key="rowKey(t)"
          class="text-body2"
          :class="{ 'text-grey-5': t.outstanding_full + t.outstanding_partial <= 0 }"
        >
          <div>{{ t.thread_name }}</div>
          <div class="text-caption">
            {{ formatOutstandingSummary(t) }}
          </div>
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
