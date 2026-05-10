<template>
  <AppDialog
    v-model="show"
    full-width
    :card-style="{ maxWidth: '720px' }"
  >
    <template #header>
      Lịch sử chuyển — {{ threadLabel }}
    </template>
    <template #default>
      <div
        v-if="loading"
        class="q-pa-md text-center"
      >
        <q-spinner size="32px" />
      </div>
      <div
        v-else-if="!entries.length"
        class="q-pa-md text-grey"
      >
        Chưa có lịch sử chuyển kho cho loại chỉ này.
      </div>
      <q-list
        v-else
        separator
      >
        <q-item
          v-for="e in entries"
          :key="e.transaction_id"
        >
          <q-item-section>
            <q-item-label>
              {{ e.full_cones + e.partial_cones }} cuộn
              ({{ e.full_cones }} nguyên + {{ e.partial_cones }} lẻ)
            </q-item-label>
            <q-item-label caption>
              {{ formatDateTime(e.transferred_at) }} · {{ e.by_user_name }}
            </q-item-label>
            <q-item-label caption>
              {{ e.source_warehouse_name }} → {{ e.destination_warehouse_name }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppDialog from '@/components/ui/dialogs/AppDialog.vue'
import { transferReservedService } from '@/services/transferReservedService'
import { useSnackbar } from '@/composables/useSnackbar'
import type { ThreadTransferHistoryEntry } from '@/types/transferReserved'

const props = defineProps<{
  modelValue: boolean
  weekId: number | null
  threadTypeId: number | null
  threadColorId: number | null
  threadLabel: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

const show = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
})

const entries = ref<ThreadTransferHistoryEntry[]>([])
const loading = ref(false)
const snackbar = useSnackbar()

watch(
  () => [props.modelValue, props.weekId, props.threadTypeId, props.threadColorId],
  async ([visible]) => {
    if (!visible || !props.weekId || !props.threadTypeId || !props.threadColorId) return
    loading.value = true
    try {
      const res = await transferReservedService.getThreadTransferHistory(
        props.weekId,
        props.threadTypeId,
        props.threadColorId,
      )
      if (res.error) {
        snackbar.error(res.error)
        entries.value = []
      } else {
        entries.value = res.data ?? []
      }
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('vi-VN')
}
</script>
