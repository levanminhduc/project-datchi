<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ReturnGroup, ReturnGroupThread } from '@/types/thread/issueV2'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'

const props = defineProps<{
  group: ReturnGroup
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [lines: { thread_type_id: number; returned_full: number; returned_partial: number }[]]
  cancel: []
}>()

interface ReturnInput {
  thread_type_id: number
  returned_full: number
  returned_partial: number
}

const inputs = ref<ReturnInput[]>([])

function resetInputs() {
  inputs.value = props.group.threads.map((t) => ({
    thread_type_id: t.thread_type_id,
    returned_full: 0,
    returned_partial: 0,
  }))
}

watch(() => props.group, resetInputs, { immediate: true })

const hasInput = computed(() =>
  inputs.value.some((i) => i.returned_full > 0 || i.returned_partial > 0)
)

function fillAll() {
  for (const input of inputs.value) {
    const thread = props.group.threads.find((t) => t.thread_type_id === input.thread_type_id)
    if (!thread) continue
    const totalOutstanding = thread.outstanding_full + thread.outstanding_partial
    if (totalOutstanding <= 0) continue
    input.returned_full = thread.outstanding_full
    input.returned_partial = totalOutstanding - thread.outstanding_full
  }
}

function getThread(threadTypeId: number): ReturnGroupThread | undefined {
  return props.group.threads.find((t) => t.thread_type_id === threadTypeId)
}

function isFullyReturned(threadTypeId: number): boolean {
  const t = getThread(threadTypeId)
  if (!t) return true
  return t.outstanding_full + t.outstanding_partial <= 0
}

function getMaxFullReturn(threadTypeId: number): number {
  const t = getThread(threadTypeId)
  if (!t) return 0
  const total = t.outstanding_full + t.outstanding_partial
  const input = inputs.value.find(i => i.thread_type_id === threadTypeId)
  const partialInput = input?.returned_partial || 0
  return Math.min(t.outstanding_full, Math.max(0, total - partialInput))
}

function getMaxPartialReturn(threadTypeId: number): number {
  const t = getThread(threadTypeId)
  if (!t) return 0
  const total = t.outstanding_full + t.outstanding_partial
  const input = inputs.value.find(i => i.thread_type_id === threadTypeId)
  const fullInput = input?.returned_full || 0
  return Math.max(0, total - fullInput)
}

function formatIssued(t: ReturnGroupThread): string {
  const parts: string[] = []
  if (t.total_issued_full > 0) parts.push(`${t.total_issued_full} ng`)
  if (t.total_issued_partial > 0) parts.push(`${t.total_issued_partial} lẻ`)
  return parts.join(' + ') || '0'
}

function formatReturned(t: ReturnGroupThread): string {
  const parts: string[] = []
  if (t.total_returned_full > 0) parts.push(`${t.total_returned_full} ng`)
  if (t.total_returned_partial > 0) parts.push(`${t.total_returned_partial} lẻ`)
  return parts.join(' + ') || '0'
}

function formatOutstanding(t: ReturnGroupThread): string {
  const parts: string[] = []
  if (t.outstanding_full > 0) parts.push(`${t.outstanding_full} ng`)
  if (t.outstanding_partial > 0) parts.push(`${t.outstanding_partial} lẻ`)
  return parts.join(' + ') || 'Đã trả hết'
}

function handleSubmit() {
  const lines = inputs.value.filter((i) => i.returned_full > 0 || i.returned_partial > 0)
  emit('submit', lines)
}
</script>

<template>
  <q-card
    flat
    bordered
  >
    <q-card-section>
      <div class="row items-center justify-between q-mb-md">
        <div>
          <div class="text-subtitle1 text-weight-bold">
            {{ group.po_number }} / {{ group.style_code }} / {{ group.color_name }}
          </div>
          <div class="text-caption text-grey-7">
            {{ group.issue_count }} phiếu — {{ group.threads.length }} loại chỉ
          </div>
        </div>
        <div class="q-gutter-sm">
          <AppButton
            label="Trả tất cả"
            icon="select_all"
            color="blue"
            size="sm"
            outline
            @click="fillAll"
          />
        </div>
      </div>

      <div class="text-caption text-blue-grey-6 q-mb-sm">
        Cuộn nguyên có thể trả lẻ nếu sản xuất chưa dùng hết
      </div>

      <q-table
        :rows="group.threads"
        :columns="[
          { name: 'thread_name', label: 'Màu chỉ', field: 'thread_name', align: 'left' },
          { name: 'issued', label: 'Đã xuất', field: 'total_issued_full', align: 'center' },
          { name: 'returned', label: 'Đã trả', field: 'total_returned_full', align: 'center' },
          { name: 'outstanding', label: 'Còn trả', field: 'outstanding_full', align: 'center' },
          { name: 'return_full', label: 'Trả nguyên', field: 'thread_type_id', align: 'center' },
          { name: 'return_partial', label: 'Trả lẻ', field: 'thread_type_id', align: 'center' },
        ]"
        row-key="thread_type_id"
        flat
        bordered
        :pagination="{ rowsPerPage: 0 }"
        hide-bottom
      >
        <template #body-cell-thread_name="{ row }">
          <q-td :class="{ 'text-grey-5': isFullyReturned(row.thread_type_id) }">
            <div class="text-weight-medium">
              {{ row.thread_code }}
            </div>
            <div
              v-if="row.thread_name"
              class="text-caption"
            >
              {{ row.thread_name }}
            </div>
          </q-td>
        </template>

        <template #body-cell-issued="{ row }">
          <q-td
            class="text-center"
            :class="{ 'text-grey-5': isFullyReturned(row.thread_type_id) }"
          >
            {{ formatIssued(row) }}
          </q-td>
        </template>

        <template #body-cell-returned="{ row }">
          <q-td
            class="text-center"
            :class="{ 'text-grey-5': isFullyReturned(row.thread_type_id) }"
          >
            {{ formatReturned(row) }}
          </q-td>
        </template>

        <template #body-cell-outstanding="{ row }">
          <q-td
            class="text-center"
            :class="{
              'text-grey-5': isFullyReturned(row.thread_type_id),
              'text-weight-bold text-orange': !isFullyReturned(row.thread_type_id),
            }"
          >
            {{ formatOutstanding(row) }}
          </q-td>
        </template>

        <template #body-cell-return_full="{ row }">
          <q-td class="text-center">
            <AppInput
              v-if="!isFullyReturned(row.thread_type_id)"
              :model-value="inputs.find(i => i.thread_type_id === row.thread_type_id)?.returned_full || null"
              type="number"
              dense
              :min="0"
              :max="getMaxFullReturn(row.thread_type_id)"
              style="width: 80px; display: inline-block"
              hide-bottom-space
              @update:model-value="(v: string | number | null) => {
                const input = inputs.find(i => i.thread_type_id === row.thread_type_id)
                if (input) input.returned_full = Number(v) || 0
              }"
            />
            <span
              v-else
              class="text-grey-5"
            >-</span>
          </q-td>
        </template>

        <template #body-cell-return_partial="{ row }">
          <q-td class="text-center">
            <AppInput
              v-if="!isFullyReturned(row.thread_type_id)"
              :model-value="inputs.find(i => i.thread_type_id === row.thread_type_id)?.returned_partial || null"
              type="number"
              dense
              :min="0"
              :max="getMaxPartialReturn(row.thread_type_id)"
              style="width: 80px; display: inline-block"
              hide-bottom-space
              @update:model-value="(v: string | number | null) => {
                const input = inputs.find(i => i.thread_type_id === row.thread_type_id)
                if (input) input.returned_partial = Number(v) || 0
              }"
            />
            <span
              v-else
              class="text-grey-5"
            >-</span>
          </q-td>
        </template>
      </q-table>

      <div class="row justify-end q-mt-md q-gutter-sm">
        <AppButton
          label="Đóng"
          color="grey"
          outline
          @click="$emit('cancel')"
        />
        <AppButton
          label="Xác nhận trả kho"
          color="orange"
          icon="check"
          :loading="loading"
          :disable="!hasInput"
          @click="handleSubmit"
        />
      </div>
    </q-card-section>
  </q-card>
</template>
