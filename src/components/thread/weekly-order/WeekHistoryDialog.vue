<template>
  <AppDialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #header>
      Lịch sử tuần đặt hàng
    </template>

    <q-table
      :rows="weeks"
      :columns="columns"
      row-key="id"
      flat
      bordered
      dense
      :loading="loading"
      :rows-per-page-options="[10, 20]"
    >
      <template #body-cell-status="props">
        <q-td :props="props">
          <AppBadge
            :label="statusLabel(props.value)"
            :color="statusColor(props.value)"
          />
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props">
          <AppButton
            flat
            dense
            icon="file_open"
            color="primary"
            size="sm"
            @click="$emit('load', props.row.id)"
          >
            <AppTooltip>Tải tuần này</AppTooltip>
          </AppButton>
        </q-td>
      </template>
      <template #no-data>
        <div class="text-center text-grey q-pa-md">
          Chưa có tuần đặt hàng nào
        </div>
      </template>
    </q-table>

    <template #actions>
      <AppButton
        flat
        label="Đóng"
        v-close-popup
      />
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import type { ThreadOrderWeek } from '@/types/thread'

defineProps<{
  modelValue: boolean
  weeks: ThreadOrderWeek[]
  loading: boolean
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
  load: [weekId: number]
}>()

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: 'Nháp',
    confirmed: 'Đã xác nhận',
    cancelled: 'Đã hủy',
  }
  return map[status] || status
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    draft: 'grey',
    confirmed: 'positive',
    cancelled: 'negative',
  }
  return map[status] || 'grey'
}

const columns: QTableColumn[] = [
  { name: 'week_name', label: 'Tên tuần', field: 'week_name', align: 'left', sortable: true },
  {
    name: 'start_date',
    label: 'Từ ngày',
    field: 'start_date',
    align: 'left',
    format: (val: string | null) => val || '—',
  },
  {
    name: 'end_date',
    label: 'Đến ngày',
    field: 'end_date',
    align: 'left',
    format: (val: string | null) => val || '—',
  },
  { name: 'status', label: 'Trạng thái', field: 'status', align: 'center' },
  {
    name: 'item_count',
    label: 'Số items',
    field: 'item_count',
    align: 'right',
    format: (val: number | undefined) => val?.toString() || '0',
  },
  { name: 'actions', label: '', field: 'id', align: 'center' },
]
</script>
