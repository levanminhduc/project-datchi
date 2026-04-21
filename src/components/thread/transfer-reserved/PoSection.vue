<template>
  <q-expansion-item
    default-opened
    expand-separator
    :label="`${title} (${lines.length} loại chỉ)`"
    class="q-mb-sm bordered"
  >
    <q-card flat bordered>
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
                  props.row.reserved_cones_at_source,
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
        <template #body-cell-quantity="props">
          <q-td :props="props">
            <AppInput
              v-if="isSelected(props.row.thread_type_id, props.row.color_id)"
              :model-value="getSelection(props.row.thread_type_id, props.row.color_id)?.quantity"
              type="number"
              dense
              :error="
                isInvalid(
                  getSelection(props.row.thread_type_id, props.row.color_id)?.quantity,
                  props.row.reserved_cones_at_source
                )
              "
              @update:model-value="
                emit('set-quantity', props.row.thread_type_id, props.row.color_id, Number($event) || 0)
              "
            />
            <span v-else class="text-grey">—</span>
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
  getSelection: (tt: number, c: number) => { quantity: number } | undefined
}>()

void props

const emit = defineEmits<{
  (e: 'toggle', tt: number, c: number, available: number, label: string): void
  (e: 'set-quantity', tt: number, c: number, q: number): void
}>()

const columns = [
  { name: 'pick', label: '', field: 'pick', align: 'center' as const },
  { name: 'thread', label: 'Loại chỉ (NCC - Tex - Màu)', field: 'thread', align: 'left' as const },
  {
    name: 'available',
    label: 'Có sẵn',
    field: 'reserved_cones_at_source',
    align: 'right' as const,
  },
  {
    name: 'meters',
    label: 'Mét',
    field: 'reserved_meters_at_source',
    align: 'right' as const,
    format: (v: number) => v.toLocaleString('vi-VN'),
  },
  { name: 'quantity', label: 'Số cuộn chuyển', field: 'quantity', align: 'right' as const },
]

function rowLabel(row: ReservedThreadLine) {
  return `${row.supplier_name} - Tex ${row.tex_number} - ${row.color_name}`
}

function isInvalid(q: number | undefined, max: number) {
  if (q === undefined || q === null) return false
  return !Number.isFinite(q) || q <= 0 || q > max
}
</script>
