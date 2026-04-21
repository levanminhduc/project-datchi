<script setup lang="ts">
import type { GroupedReturnLog } from '@/types/thread/issueV2'
import DataTable from '@/components/ui/tables/DataTable.vue'
import type { QTableColumn } from 'quasar'

defineProps<{
  modelValue: boolean
  logs: GroupedReturnLog[]
  loading?: boolean
  groupLabel?: string
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const columns: QTableColumn[] = [
  { name: 'created_at', label: 'Ngày trả', field: 'created_at', align: 'left', sortable: true },
  { name: 'thread_name', label: 'Loại chỉ', field: 'thread_name', align: 'left' },
  { name: 'issue_code', label: 'Mã phiếu', field: 'issue_code', align: 'left' },
  { name: 'returned_full', label: 'Nguyên', field: 'returned_full', align: 'center' },
  { name: 'returned_partial', label: 'Lẻ', field: 'returned_partial', align: 'center' },
  { name: 'created_by', label: 'Người trả', field: 'created_by', align: 'left' },
]

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('vi-VN')
}
</script>

<template>
  <q-dialog
    :model-value="modelValue"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card>
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          Lịch sử trả kho
        </div>
        <div
          v-if="groupLabel"
          class="text-subtitle2 text-grey-7 q-ml-md"
        >
          {{ groupLabel }}
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

      <q-card-section>
        <div
          v-if="loading"
          class="row justify-center q-py-xl"
        >
          <q-spinner-dots
            size="40px"
            color="primary"
          />
        </div>

        <DataTable
          v-else
          :rows="logs"
          :columns="columns"
          row-key="id"
          empty-icon="history"
          empty-title="Chưa có lịch sử trả kho"
          empty-subtitle="Nhóm này chưa có lần trả nào"
        >
          <template #body-cell-created_at="{ row }">
            <q-td>
              {{ formatDateTime(row.created_at) }}
            </q-td>
          </template>

          <template #body-cell-thread_name="{ row }">
            <q-td>
              <div class="text-weight-medium">
                {{ row.thread_code }}
              </div>
              <div
                v-if="row.thread_name"
                class="text-caption text-grey-7"
              >
                {{ row.thread_name }}
              </div>
            </q-td>
          </template>

          <template #body-cell-returned_full="{ row }">
            <q-td class="text-center">
              {{ row.returned_full || '-' }}
            </q-td>
          </template>

          <template #body-cell-returned_partial="{ row }">
            <q-td class="text-center">
              {{ row.returned_partial || '-' }}
            </q-td>
          </template>

          <template #body-cell-created_by="{ row }">
            <q-td>
              {{ row.created_by || '-' }}
            </q-td>
          </template>
        </DataTable>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
