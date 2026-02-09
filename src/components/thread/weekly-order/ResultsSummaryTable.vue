<template>
  <AppCard
    flat
    bordered
  >
    <q-card-section>
      <div class="text-subtitle1 text-weight-medium q-mb-sm">
        Tổng hợp đặt hàng
      </div>

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
            <span
              v-else
              class="text-grey-5"
            >—</span>
          </q-td>
        </template>
        <template #body-cell-additional_order="props">
          <q-td :props="props">
            <span class="cursor-pointer text-primary">
              {{ (props.row.additional_order && props.row.additional_order > 0) ? props.row.additional_order.toLocaleString('vi-VN') : '—' }}
              <q-icon
                name="edit"
                size="xs"
                class="q-ml-xs"
              />
            </span>
            <q-popup-edit
              v-slot="scope"
              :model-value="props.row.additional_order || 0"
              buttons
              label-set="Lưu"
              label-cancel="Hủy"
              @save="(val: number) => emit('update:additional-order', props.row.thread_type_id, val)"
            >
              <q-input
                v-model.number="scope.value"
                type="number"
                :min="0"
                dense
                autofocus
                label="Số lượng đặt thêm"
              />
            </q-popup-edit>
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

const emit = defineEmits<{
  'update:additional-order': [threadTypeId: number, value: number]
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
    name: 'meters_per_cone',
    label: 'Mét/cuộn',
    field: 'meters_per_cone',
    align: 'right',
    format: (val: number | null) => val ? val.toLocaleString('vi-VN') : '—',
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
    name: 'inventory_cones',
    label: 'Tồn kho KD',
    field: 'inventory_cones',
    align: 'right',
    sortable: true,
    format: (val: number | undefined) => (val && val > 0) ? val.toLocaleString('vi-VN') : '—',
  },
  {
    name: 'sl_can_dat',
    label: 'SL cần đặt',
    field: 'sl_can_dat',
    align: 'right',
    sortable: true,
    format: (val: number | undefined) => (val && val > 0) ? val.toLocaleString('vi-VN') : '—',
  },
  {
    name: 'additional_order',
    label: 'Đặt thêm',
    field: 'additional_order',
    align: 'right',
    format: (val: number | undefined) => (val && val > 0) ? val.toLocaleString('vi-VN') : '—',
  },
  {
    name: 'total_final',
    label: 'Tổng chốt',
    field: 'total_final',
    align: 'right',
    sortable: true,
    format: (val: number | undefined) => (val && val > 0) ? val.toLocaleString('vi-VN') : '—',
  },
]
</script>
