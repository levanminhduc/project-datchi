<template>
  <q-expansion-item
    default-opened
    expand-separator
    :label="`${title} (${lines.length} loại chỉ)`"
    class="q-mb-sm bordered"
  >
    <q-card
      flat
      bordered
    >
      <q-table
        :rows="lines"
        :columns="columns"
        row-key="key"
        flat
        hide-pagination
        :rows-per-page-options="[0]"
      >
        <template #body-cell-pick="props">
          <q-td :props="props">
            <q-checkbox
              :model-value="isSelected(props.row.thread_type_id, props.row.color_id)"
              @update:model-value="
                emit(
                  'toggle',
                  props.row.thread_type_id,
                  props.row.color_id,
                  props.row.reserved_full_cones_at_source,
                  props.row.reserved_partial_cones_at_source,
                  rowLabel(props.row)
                )
              "
            />
          </q-td>
        </template>
        <template #body-cell-thread="props">
          <q-td :props="props">
            {{ rowLabel(props.row) }}
          </q-td>
        </template>
        <template #body-cell-full_qty="props">
          <q-td :props="props">
            <AppInput
              v-if="isSelected(props.row.thread_type_id, props.row.color_id)"
              :model-value="
                getSelection(props.row.thread_type_id, props.row.color_id)?.full_quantity
              "
              type="number"
              dense
              :error="
                isInvalid(
                  getSelection(props.row.thread_type_id, props.row.color_id)?.full_quantity,
                  props.row.reserved_full_cones_at_source
                )
              "
              @update:model-value="
                emit(
                  'set-full-quantity',
                  props.row.thread_type_id,
                  props.row.color_id,
                  Number($event) || 0
                )
              "
            />
            <span
              v-else
              class="text-grey"
            >—</span>
          </q-td>
        </template>
        <template #body-cell-partial_qty="props">
          <q-td :props="props">
            <AppInput
              v-if="isSelected(props.row.thread_type_id, props.row.color_id)"
              :model-value="
                getSelection(props.row.thread_type_id, props.row.color_id)?.partial_quantity
              "
              type="number"
              dense
              :error="
                isInvalid(
                  getSelection(props.row.thread_type_id, props.row.color_id)?.partial_quantity,
                  props.row.reserved_partial_cones_at_source
                )
              "
              @update:model-value="
                emit(
                  'set-partial-quantity',
                  props.row.thread_type_id,
                  props.row.color_id,
                  Number($event) || 0
                )
              "
            />
            <span
              v-else
              class="text-grey"
            >—</span>
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-expansion-item>
</template>

<script setup lang="ts">
import AppInput from '@/components/ui/inputs/AppInput.vue'
import type { ReservedThreadLine } from '@/types/transferReserved'

const props = defineProps<{
  title: string
  lines: ReservedThreadLine[]
  isSelected: (tt: number, c: number) => boolean
  getSelection: (
    tt: number,
    c: number
  ) => { full_quantity: number; partial_quantity: number } | undefined
}>()

void props

const emit = defineEmits<{
  (
    e: 'toggle',
    tt: number,
    c: number,
    availableFull: number,
    availablePartial: number,
    label: string
  ): void
  (e: 'set-full-quantity', tt: number, c: number, q: number): void
  (e: 'set-partial-quantity', tt: number, c: number, q: number): void
}>()

const columns = [
  { name: 'pick', label: '', field: 'pick', align: 'center' as const },
  { name: 'thread', label: 'Loại chỉ (NCC - Tex - Màu)', field: 'thread', align: 'left' as const },
  {
    name: 'available',
    label: 'Tổng cuộn',
    field: 'reserved_cones_at_source',
    align: 'right' as const,
  },
  {
    name: 'full',
    label: 'Có sẵn (nguyên)',
    field: 'reserved_full_cones_at_source',
    align: 'right' as const,
  },
  {
    name: 'partial',
    label: 'Có sẵn (lẻ)',
    field: 'reserved_partial_cones_at_source',
    align: 'right' as const,
  },
  {
    name: 'meters',
    label: 'Mét',
    field: 'reserved_meters_at_source',
    align: 'right' as const,
    format: (v: number) => v.toLocaleString('vi-VN'),
  },
  { name: 'full_qty', label: 'Cuộn nguyên chuyển', field: 'full_qty', align: 'right' as const },
  { name: 'partial_qty', label: 'Cuộn lẻ chuyển', field: 'partial_qty', align: 'right' as const },
]

function rowLabel(row: ReservedThreadLine) {
  return `${row.supplier_name} - Tex ${row.tex_number} - ${row.color_name}`
}

function isInvalid(q: number | undefined, max: number) {
  if (q === undefined || q === null) return false
  if (!Number.isFinite(q) || q < 0 || q > max) return true
  return false
}
</script>
