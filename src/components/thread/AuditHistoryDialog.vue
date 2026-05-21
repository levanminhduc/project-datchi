<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card style="min-width: 480px; max-width: 90vw">
      <q-card-section class="row items-center">
        <div class="text-h6">
          {{ title || 'Lịch sử chỉnh sửa' }}
        </div>
        <q-space />
        <q-btn
          v-close-popup
          icon="close"
          flat
          round
          dense
        />
      </q-card-section>

      <q-separator />

      <q-card-section style="max-height: 70vh; overflow-y: auto;">
        <div
          v-if="loading"
          class="row justify-center q-py-lg"
        >
          <q-spinner
            size="md"
            color="primary"
          />
        </div>

        <div
          v-else-if="entries.length === 0"
          class="text-center q-py-lg text-grey-6"
        >
          <q-icon
            name="history_toggle_off"
            size="lg"
          />
          <p class="q-mt-sm">
            Chưa có lịch sử thay đổi
          </p>
        </div>

        <q-timeline
          v-else
          color="primary"
          layout="dense"
        >
          <q-timeline-entry
            v-for="entry in entries"
            :key="entry.id"
            :icon="iconFor(entry.action)"
            :color="colorFor(entry.action)"
            :title="titleFor(entry)"
            :subtitle="formatDate(entry.created_at)"
          >
            <div
              v-if="entry.action === 'UPDATE' && entry.changed_fields?.length"
              class="q-gutter-y-xs"
            >
              <div
                v-for="field in entry.changed_fields"
                :key="field"
                class="text-body2"
              >
                <span class="text-weight-medium">{{ labelFor(field) }}:</span>
                <span class="text-grey-7 q-ml-xs">
                  {{ formatValue(entry.old_values?.[field]) }}
                </span>
                <q-icon
                  name="arrow_forward"
                  size="xs"
                  class="q-mx-xs"
                />
                <span>{{ formatValue(entry.new_values?.[field]) }}</span>
              </div>
            </div>
          </q-timeline-entry>
        </q-timeline>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { styleThreadSpecService } from '@/services'
import { useSnackbar } from '@/composables/useSnackbar'
import type { AuditEntry } from '@/types/thread'

interface Props {
  modelValue: boolean
  tableName: 'style_thread_specs' | 'style_color_thread_specs'
  recordId: number | null
  title?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()

const snackbar = useSnackbar()
const loading = ref(false)
const entries = ref<AuditEntry[]>([])

const FIELD_LABELS: Record<string, string> = {
  process_name: 'Công đoạn',
  supplier_id: 'NCC',
  thread_type_id: 'Loại chỉ (Tex)',
  meters_per_unit: 'Mét/SP',
  notes: 'Ghi chú',
  display_order: 'Thứ tự',
  thread_color_id: 'Màu chỉ',
  style_color_id: 'Mã màu hàng',
  style_id: 'Mã hàng',
  color_id: 'Màu',
}

const labelFor = (field: string): string => FIELD_LABELS[field] ?? field

const iconFor = (action: AuditEntry['action']): string => {
  if (action === 'INSERT') return 'add_circle'
  if (action === 'DELETE') return 'delete'
  return 'edit'
}

const colorFor = (action: AuditEntry['action']): string => {
  if (action === 'INSERT') return 'positive'
  if (action === 'DELETE') return 'negative'
  return 'primary'
}

const titleFor = (entry: AuditEntry): string => {
  const who = entry.performed_by || 'Không rõ'
  if (entry.action === 'INSERT') return `${who} đã tạo`
  if (entry.action === 'DELETE') return `${who} đã xóa`
  return `${who} đã chỉnh sửa`
}

const formatDate = (iso: string): string => {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const formatValue = (v: unknown): string => {
  if (v === null || v === undefined || v === '') return '-'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

const load = async () => {
  if (props.recordId == null) {
    entries.value = []
    return
  }
  loading.value = true
  try {
    entries.value = await styleThreadSpecService.getAuditHistory(props.tableName, props.recordId)
  } catch (err) {
    snackbar.error(err instanceof Error ? err.message : 'Không tải được lịch sử')
    entries.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.modelValue, props.recordId, props.tableName] as const,
  ([open]) => {
    if (open) load()
  },
)
</script>
