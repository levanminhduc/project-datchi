<template>
  <AppDialog
    v-model="show"
    full-width
    :card-style="{ maxWidth: '900px' }"
  >
    <template #header>
      Lịch sử chuyển kho — {{ poNumber }}
    </template>
    <template #default>
      <q-tabs
        v-model="tab"
        dense
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="left"
        narrow-indicator
      >
        <q-tab
          name="overview"
          label="Tổng quan"
        />
        <q-tab
          name="details"
          label="Chi tiết lần chuyển"
        />
      </q-tabs>

      <q-separator />

      <q-tab-panels
        v-model="tab"
        animated
      >
        <q-tab-panel name="overview">
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-4">
              <q-card
                flat
                bordered
                class="text-center q-pa-sm"
              >
                <div class="text-caption text-grey">
                  Định mức
                </div>
                <div class="text-h6">
                  {{ summary?.total_needed ?? 0 }}
                </div>
              </q-card>
            </div>
            <div class="col-4">
              <q-card
                flat
                bordered
                class="text-center q-pa-sm"
              >
                <div class="text-caption text-grey">
                  Đã chuyển
                </div>
                <div class="text-h6 text-positive">
                  {{ summary?.total_transferred ?? 0 }}
                </div>
              </q-card>
            </div>
            <div class="col-4">
              <q-card
                flat
                bordered
                class="text-center q-pa-sm"
              >
                <div class="text-caption text-grey">
                  Còn thiếu
                </div>
                <div class="text-h6 text-negative">
                  {{ summary?.total_pending ?? 0 }}
                </div>
              </q-card>
            </div>
          </div>

          <DataTable
            :rows="linesWithKey"
            :columns="overviewColumns"
            row-key="row_key"
            flat
            bordered
            hide-pagination
            :rows-per-page-options="[0]"
          >
            <template #body-cell-thread="props">
              <q-td :props="props">
                {{ props.row.supplier_name }} - Tex {{ props.row.tex_number }} - {{ props.row.color_name }}
              </q-td>
            </template>
            <template #body-cell-status="props">
              <q-td :props="props">
                <q-badge
                  v-if="props.row.transferred_for_po >= props.row.quota_cones"
                  color="positive"
                  label="Đủ"
                />
                <q-badge
                  v-else-if="props.row.transferred_for_po > 0"
                  color="warning"
                  label="Thiếu"
                />
                <q-badge
                  v-else
                  color="grey"
                  label="Chưa"
                />
              </q-td>
            </template>
          </DataTable>
        </q-tab-panel>

        <q-tab-panel name="details">
          <div
            v-if="detailsLoading"
            class="text-center q-pa-md"
          >
            <q-spinner size="32px" />
          </div>
          <div
            v-else-if="transactions.length === 0"
            class="text-grey q-pa-md"
          >
            <div>Chưa có chi tiết lần chuyển nào cho PO này.</div>
            <div class="text-caption q-mt-sm">
              Lưu ý: Chi tiết chỉ có từ dữ liệu mới (sau khi hệ thống cập nhật tính năng PO attribution).
              Các lần chuyển trước đó được tính trong "Đã chuyển" ở tab Tổng quan nhưng không có chi tiết theo PO.
            </div>
          </div>
          <q-list
            v-else
            separator
          >
            <q-expansion-item
              v-for="(tx, idx) in transactions"
              :key="tx.transaction_id"
              :label="`Lần ${transactions.length - idx}`"
              :caption="`${formatDateTime(tx.performed_at)} · ${tx.by_user_name} · ${tx.total_cones} cuộn`"
              expand-separator
              default-opened
            >
              <DataTable
                :rows="tx.lines.map(l => ({ ...l, row_key: `${l.thread_type_id}_${l.thread_color_id}` }))"
                :columns="detailColumns"
                row-key="row_key"
                flat
                dense
                hide-pagination
                :rows-per-page-options="[0]"
              >
                <template #body-cell-thread="props">
                  <q-td :props="props">
                    {{ props.row.supplier_name }} - Tex {{ props.row.tex_number }} - {{ props.row.color_name }}
                  </q-td>
                </template>
              </DataTable>
            </q-expansion-item>
          </q-list>
        </q-tab-panel>
      </q-tab-panels>
    </template>
    <template #actions>
      <AppButton
        variant="flat"
        label="Đóng"
        color="primary"
        @click="show = false"
      />
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AppDialog from '@/components/ui/dialogs/AppDialog.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import DataTable from '@/components/ui/tables/DataTable.vue'
import { transferReservedService } from '@/services/transferReservedService'
import { useSnackbar } from '@/composables/useSnackbar'
import type { TransferThreadLine, TransferPoGroup, PoTransferTransaction } from '@/types/transferReserved'
import type { QTableColumn } from 'quasar'

const props = defineProps<{
  modelValue: boolean
  weekId: number | null
  poId: number | null
  poNumber: string
  toWarehouseId: number | null
  lines: TransferThreadLine[]
  summary: TransferPoGroup['summary'] | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

const show = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
})

const tab = ref('overview')
const transactions = ref<PoTransferTransaction[]>([])
const detailsLoading = ref(false)
const snackbar = useSnackbar()

const overviewColumns: QTableColumn[] = [
  { name: 'thread', label: 'Loại chỉ', field: 'thread', align: 'left' },
  { name: 'quota_cones', label: 'Định mức', field: 'quota_cones', align: 'center' },
  { name: 'transferred_for_po', label: 'Đã chuyển', field: 'transferred_for_po', align: 'center' },
  { name: 'pending_for_po', label: 'Còn', field: 'pending_for_po', align: 'center' },
  { name: 'status', label: 'Trạng thái', field: 'status', align: 'center' },
]

const detailColumns: QTableColumn[] = [
  { name: 'thread', label: 'Loại chỉ', field: 'thread', align: 'left' },
  { name: 'cones', label: 'Số cuộn', field: 'cones', align: 'center' },
]

const linesWithKey = computed(() =>
  props.lines.map(l => ({ ...l, row_key: `${l.thread_type_id}_${l.thread_color_id}` }))
)

watch(
  () => [props.modelValue, props.weekId, props.poId],
  async ([visible]) => {
    if (!visible || !props.weekId || !props.poId) return
    tab.value = 'overview'
    await loadTransactions()
  },
  { immediate: true },
)

async function loadTransactions() {
  if (!props.weekId || !props.poId) return
  detailsLoading.value = true
  try {
    const res = await transferReservedService.getPoTransferHistory(
      props.weekId,
      props.poId,
      props.toWarehouseId,
    )
    if (res.error) {
      snackbar.error(res.error)
      transactions.value = []
    } else {
      transactions.value = res.data ?? []
    }
  } finally {
    detailsLoading.value = false
  }
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}
</script>
