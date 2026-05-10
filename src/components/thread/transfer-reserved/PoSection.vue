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
          <q-btn
            v-if="poId != null"
            flat
            dense
            icon="history"
            size="sm"
            label="Lịch sử PO"
            class="q-ml-sm"
            @click.stop="emit('open-po-history')"
          />
        </div>
        <div
          v-if="summary"
          class="text-caption text-grey-8 q-mt-xs"
        >
          ĐM tổng: <b>{{ summary.total_needed }}</b> ·
          Đã chuyển: <b>{{ summary.total_transferred }}</b> ·
          <template v-if="summary.total_transferred > summary.total_needed">
            <span class="text-red">Vượt: +{{ summary.total_transferred - summary.total_needed }}</span>
          </template>
          <template v-else>
            Còn theo ĐM: <b>{{ summary.total_pending }}</b>
          </template>
        </div>
      </q-item-section>
    </template>

    <q-card
      flat
      bordered
    >
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
          <q-td
            :props="props"
            class="text-right"
          >
            ĐM <b>{{ props.row.quota_cones }}</b> ·
            Đã <b>{{ props.row.transferred_for_po }}</b> ·
            <template v-if="props.row.transferred_for_po > props.row.quota_cones">
              <span class="text-red">(+{{ props.row.transferred_for_po - props.row.quota_cones }} dư)</span>
            </template>
            <template v-else>
              Còn <b>{{ props.row.pending_for_po }}</b>
            </template>
          </q-td>
        </template>
        <template #body-cell-source="props">
          <q-td
            :props="props"
            class="text-right"
          >
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
import { computed } from 'vue'
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
  (e: 'open-po-history'): void
}>()

const headerLabel = computed(() => `PO ${props.poNumber} (#${props.displayOrder})`)

const columns = [
  { name: 'pick', label: '', field: 'pick', align: 'center' as const },
  { name: 'thread', label: 'Loại chỉ', field: 'thread', align: 'left' as const },
  { name: 'quota', label: 'Định mức / Đã / Còn', field: 'quota', align: 'right' as const },
  { name: 'source', label: 'Kho nguồn', field: 'source', align: 'right' as const },
  { name: 'full_qty', label: 'Chuyển', field: 'full_qty', align: 'right' as const },
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
</script>
