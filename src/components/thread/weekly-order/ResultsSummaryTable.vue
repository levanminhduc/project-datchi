<template>
  <AppCard flat bordered>
    <q-card-section>
      <div class="text-subtitle1 text-weight-medium q-mb-sm">Tổng hợp đặt hàng</div>

      <q-table
        :rows="rows"
        :columns="columns"
        row-key="thread_type_id"
        flat
        bordered
        dense
        hide-bottom
        :rows-per-page-options="[0]"
      >
        <template #body-cell-thread_color="props">
          <q-td :props="props">
            <span
              v-if="props.row.thread_color_code"
              class="q-mr-xs"
              :style="{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: props.row.thread_color_code,
                border: '1px solid #ccc'
              }"
            />
            <span v-if="props.row.thread_color">{{ props.row.thread_color }}</span>
            <span v-else class="text-grey-5">—</span>
          </q-td>
        </template>
        <template #no-data>
          <div class="text-center text-grey q-pa-md">
            Chưa có dữ liệu tổng hợp
          </div>
        </template>
      </q-table>
    </q-card-section>
  </AppCard>
</template>

<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import type { AggregatedRow } from '@/types/thread'

defineProps<{
  rows: AggregatedRow[]
}>()

const columns: QTableColumn[] = [
  { name: 'thread_type_name', label: 'Loại chỉ', field: 'thread_type_name', align: 'left', sortable: true },
  { name: 'supplier_name', label: 'NCC', field: 'supplier_name', align: 'left' },
  { name: 'tex_number', label: 'Tex', field: 'tex_number', align: 'left' },
  { name: 'thread_color', label: 'Màu chỉ', field: 'thread_color', align: 'left' },
  {
    name: 'total_meters',
    label: 'Tổng mét',
    field: 'total_meters',
    align: 'right',
    sortable: true,
    format: (val: number) => val.toLocaleString('vi-VN', { maximumFractionDigits: 2 }),
  },
  {
    name: 'total_cones',
    label: 'Tổng cuộn',
    field: 'total_cones',
    align: 'right',
    sortable: true,
    format: (val: number) => val > 0 ? val.toLocaleString('vi-VN') : '—',
  },
  {
    name: 'meters_per_cone',
    label: 'Mét/cuộn',
    field: 'meters_per_cone',
    align: 'right',
    format: (val: number | null) => val ? val.toLocaleString('vi-VN') : '—',
  },
]
</script>
