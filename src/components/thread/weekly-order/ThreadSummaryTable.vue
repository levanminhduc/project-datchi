<template>
  <div>
    <q-table
      v-if="rows.length > 0 || loading"
      :rows="rows"
      :columns="columns"
      row-key="thread_type_id"
      dense
      flat
      bordered
      hide-pagination
      :rows-per-page-options="[0]"
      :loading="loading"
    >
      <template #body-cell-thread_type_name="props">
        <q-td :props="props">
          <div class="text-weight-medium">{{ props.row.thread_type_name }}</div>
          <div class="text-caption text-grey-7">
            {{ [props.row.supplier_name, props.row.tex_number, props.row.thread_color].filter(Boolean).join(' · ') }}
          </div>
        </q-td>
      </template>
      <template #body-cell-shortage="props">
        <q-td :props="props">
          <span
            :class="props.row.shortage > 0 ? 'text-negative text-weight-bold' : 'text-positive'"
          >
            {{ props.row.shortage.toLocaleString('vi-VN') }}
          </span>
        </q-td>
      </template>
    </q-table>

    <div
      v-else-if="!loading"
      class="text-caption text-grey-6 q-pa-sm"
    >
      Chưa có kết quả tính toán
    </div>
  </div>
</template>

<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import type { ThreadSummaryRow } from '@/types/thread'

defineProps<{
  rows: ThreadSummaryRow[]
  loading: boolean
}>()

const columns: QTableColumn[] = [
  { name: 'thread_type_name', label: 'Loại chỉ', field: 'thread_type_name', align: 'left', sortable: true },
  { name: 'total_cones', label: 'Cần đặt', field: 'total_cones', align: 'right', format: (v: number) => v.toLocaleString('vi-VN') },
  { name: 'equivalent_cones', label: 'Sẵn kho', field: 'equivalent_cones', align: 'right', format: (v: number) => v.toLocaleString('vi-VN') },
  { name: 'pending_cones', label: 'Chờ về', field: 'pending_cones', align: 'right', format: (v: number) => v.toLocaleString('vi-VN') },
  { name: 'shortage', label: 'Thiếu', field: 'shortage', align: 'right', sortable: true },
]
</script>
