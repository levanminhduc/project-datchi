<template>
  <q-expansion-item
    default-opened
    expand-separator
    class="q-mb-sm bordered"
  >
    <template #header>
      <q-item-section>
        <div class="row items-center q-gutter-sm">
          <span class="text-weight-medium">{{ headerLabel }}</span>
          <q-chip
            dense
            color="grey-3"
            text-color="grey-9"
            :label="`${lines.length} loại chỉ`"
          />
        </div>
        <div
          v-if="summary"
          class="text-caption text-grey-8 q-mt-xs"
        >
          ĐM tổng: <b>{{ summary.total_needed }}</b> ·
          Đã chuyển: <b>{{ summary.total_transferred }}</b> ·
          Còn theo ĐM: <b>{{ summary.total_pending }}</b>
        </div>
      </q-item-section>
    </template>

    <q-card flat bordered>
      <q-table
        :rows="lines"
        :columns="columns"
        row-key="row_key"
        flat
        hide-pagination
        :rows-per-page-options="[0]"
      >
        <template #body-cell-pick="props">
          <q-td :props="props">
            <q-checkbox
              :model-value="isSelected(props.row.thread_type_id, props.row.thread_color_id)"
              :disable="isDisabledByOther(props.row)"
              @update:model-value="emit('toggle', poId, props.row)"
            />
          </q-td>
        </template>
        <template #body-cell-thread="props">
          <q-td :props="props">
            <div>{{ rowLabel(props.row) }}</div>
            <div
              v-if="props.row.shared_with_pos.length > 0"
              class="text-caption text-orange-9"
            >
              (share {{ sharedLabel(props.row) }})
            </div>
            <div
              v-if="isDisabledByOther(props.row)"
              class="text-caption text-grey-7"
            >
              (đã chọn ở PO {{ otherPoNumber(props.row) }})
            </div>
          </q-td>
        </template>
        <template #body-cell-quota="props">
          <q-td :props="props" class="text-right">
            ĐM <b>{{ props.row.quota_cones }}</b> ·
            Đã <b>{{ props.row.transferred_for_po }}</b> ·
            Còn <b>{{ props.row.pending_for_po }}</b>
          </q-td>
        </template>
        <template #body-cell-source="props">
          <q-td :props="props" class="text-right">
            {{ props.row.reserved_at_source }}
          </q-td>
        </template>
        <template #body-cell-full_qty="props">
          <q-td :props="props">
            <AppInput
              v-if="isSelected(props.row.thread_type_id, props.row.thread_color_id)"
              :model-value="getSelection(props.row.thread_type_id, props.row.thread_color_id)?.full_quantity"
              type="number"
              dense
              @update:model-value="
                emit(
                  'set-full-quantity',
                  props.row.thread_type_id,
                  props.row.thread_color_id,
                  Number($event) || 0,
                )
              "
            />
            <span v-else class="text-grey">—</span>
          </q-td>
        </template>
        <template #body-cell-history="props">
          <q-td :props="props" class="text-right">
            <div
              v-if="props.row.last_transfer"
              class="text-caption text-grey-8"
            >
              Lần cuối: {{ props.row.last_transfer.full_cones + props.row.last_transfer.partial_cones }} cuộn ·
              {{ formatDateTime(props.row.last_transfer.transferred_at) }} ·
              {{ props.row.last_transfer.by_user_name }}
            </div>
            <div
              v-else
              class="text-caption text-grey"
            >
              Chưa có lịch sử
            </div>
            <q-btn
              flat
              dense
              icon="history"
              size="sm"
              label="Lịch sử"
              @click="emit('open-history', props.row)"
            />
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-expansion-item>
</template>

<script setup lang="ts">
import AppInput from '@/components/ui/inputs/AppInput.vue'
import type { TransferThreadLine, TransferPoGroup } from '@/types/transferReserved'

const props = defineProps<{
  poId: number | null
  poNumber: string
  displayOrder: number
  lines: TransferThreadLine[]
  summary: TransferPoGroup['summary'] | null
  poNumberByPoId: Map<number, string>
  isSelected: (tt: number, cc: number) => boolean
  getSelection: (
    tt: number,
    cc: number,
  ) => { full_quantity: number; partial_quantity: number } | undefined
  selectedInOtherPo: (poId: number | null, tt: number, cc: number) => number | null
}>()

const emit = defineEmits<{
  (e: 'toggle', poId: number | null, line: TransferThreadLine): void
  (e: 'set-full-quantity', tt: number, cc: number, q: number): void
  (e: 'open-history', line: TransferThreadLine): void
}>()

const headerLabel = `PO ${props.poNumber} (#${props.displayOrder})`

const columns = [
  { name: 'pick', label: '', field: 'pick', align: 'center' as const },
  { name: 'thread', label: 'Loại chỉ', field: 'thread', align: 'left' as const },
  { name: 'quota', label: 'Định mức / Đã / Còn', field: 'quota', align: 'right' as const },
  { name: 'source', label: 'Kho nguồn', field: 'source', align: 'right' as const },
  { name: 'full_qty', label: 'Chuyển', field: 'full_qty', align: 'right' as const },
  { name: 'history', label: 'Lịch sử', field: 'history', align: 'left' as const },
]

function rowLabel(row: TransferThreadLine) {
  return `${row.supplier_name} - Tex ${row.tex_number} - ${row.color_name}`
}

function sharedLabel(row: TransferThreadLine) {
  return row.shared_with_pos
    .map(id => `PO ${props.poNumberByPoId.get(id) ?? id}`)
    .join(', ')
}

function isDisabledByOther(row: TransferThreadLine) {
  return props.selectedInOtherPo(props.poId, row.thread_type_id, row.thread_color_id) != null
}

function otherPoNumber(row: TransferThreadLine) {
  const otherId = props.selectedInOtherPo(props.poId, row.thread_type_id, row.thread_color_id)
  if (otherId == null) return ''
  return props.poNumberByPoId.get(otherId) ?? otherId
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}
</script>
