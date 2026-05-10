<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">
      Chuyển kho cho chỉ đã gán theo Tuần
    </div>

    <q-card
      flat
      bordered
      class="q-pa-md q-mb-md"
    >
      <div class="row q-col-gutter-md items-center">
        <div class="col-12 col-md-3">
          <AppSelect
            v-model="weekId"
            :options="weekOptions"
            label="Tuần đặt hàng"
            emit-value
            map-options
            clearable
            use-input
            fill-input
            hide-selected
            @update:model-value="onWeekChange"
          />
        </div>
        <div class="col-12 col-md-3">
          <PoSearchPopup @select-week="onPoSearchSelect" />
        </div>
        <div class="col-12 col-md-3">
          <AppSelect
            v-model="fromWarehouseId"
            :options="warehouseOptions"
            label="Kho nguồn"
            emit-value
            map-options
            @update:model-value="onSourceChange"
          />
        </div>
        <div class="col-12 col-md-3">
          <AppSelect
            v-model="toWarehouseId"
            :options="warehouseOptions"
            label="Kho đích"
            emit-value
            map-options
            @update:model-value="onDestChange"
          />
        </div>
        <div class="col-12 text-right q-gutter-sm">
          <AppButton
            :loading="loading"
            :disable="!weekId || !fromWarehouseId"
            label="Tải lại"
            @click="fetchData"
          />
        </div>
      </div>
    </q-card>

    <q-card
      v-if="data"
      flat
      bordered
      class="q-mb-md q-pa-sm"
    >
      Tổng quan tuần: {{ data.pos.length }} PO ·
      {{ totalLines }} loại chỉ ·
      Kho nguồn {{ totalAtSource }} ·
      Kho đích {{ totalAtDest }}
    </q-card>

    <PoSection
      v-for="po in data?.pos || []"
      :ref="(el) => collectPoRef(el, po.po_number)"
      :key="po.po_id ?? 'null'"
      :po-id="po.po_id"
      :po-number="po.po_number"
      :display-order="po.display_order"
      :lines="po.thread_lines"
      :summary="po.summary"
      :po-number-by-po-id="poNumberByPoId"
      :is-selected="isSelected"
      :get-selection="getSelection"
      :selected-in-other-po="selectedInOtherPo"
      @toggle="toggle"
      @set-full-quantity="setFullQuantity"
      @open-po-history="openPoHistory(po.po_id, po.po_number, po.thread_lines, po.summary)"
    />

    <q-card
      v-if="data && data.additional.length > 0"
      flat
      bordered
      class="q-pa-md q-mb-md"
    >
      <div class="text-subtitle1 q-mb-sm">
        Đặt thêm ngoài định mức
      </div>
      <div
        v-for="line in data.additional"
        :key="`${line.thread_type_id}_${line.thread_color_id}`"
        class="q-py-xs"
      >
        <span>{{ line.supplier_name }} - Tex {{ line.tex_number }} - {{ line.color_name }}</span>
        <span class="text-caption q-ml-md">
          <span
            v-if="line.is_overflow"
            class="text-red"
          >Vượt: +{{ line.reserved_at_destination }}</span>
          <span v-else>Đặt thêm: {{ line.additional_quantity }}</span>
          · Kho nguồn: {{ line.reserved_at_source }} · Kho đích: {{ line.reserved_at_destination }}
        </span>
      </div>
    </q-card>

    <q-card
      v-if="selectedArray.length"
      flat
      bordered
      class="q-pa-md row items-center justify-between sticky-footer"
    >
      <div>
        Đã chọn: {{ selectedArray.length }} dòng · Tổng <b>{{ totalSelectedCones }}</b> cuộn
      </div>
      <div class="q-gutter-sm">
        <AppButton
          flat
          label="Hủy"
          @click="clearSelection"
        />
        <span class="transfer-submit-tooltip-target">
          <AppButton
            color="primary"
            :loading="submitting"
            :disable="!canSubmit"
            label="Chuyển"
            @click="onSubmit"
          />
          <q-tooltip
            v-if="!toWarehouseId"
            anchor="top middle"
            self="bottom middle"
            :offset="[0, 24]"
            class="transfer-submit-tooltip"
          >
            Hãy chọn Kho muốn chuyển đến
          </q-tooltip>
        </span>
      </div>
    </q-card>

    <PoHistoryDialog
      v-model="showPoHistory"
      :week-id="weekId"
      :po-id="poHistoryPoId"
      :po-number="poHistoryPoNumber"
      :to-warehouse-id="toWarehouseId"
      :lines="poHistoryLines"
      :summary="poHistorySummary"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import { useTransferReserved } from '@/composables/thread/useTransferReserved'
import { useConfirm } from '@/composables/useConfirm'
import { useSnackbar } from '@/composables/useSnackbar'
import { weeklyOrderService } from '@/services/weeklyOrderService'
import { warehouseService } from '@/services/warehouseService'
import PoSection from '@/components/thread/transfer-reserved/PoSection.vue'
import PoHistoryDialog from '@/components/thread/transfer-reserved/PoHistoryDialog.vue'
import PoSearchPopup from '@/components/thread/transfer-reserved/PoSearchPopup.vue'
import type { TransferThreadLine, TransferPoGroup } from '@/types/transferReserved'

const {
  weekId,
  fromWarehouseId,
  toWarehouseId,
  data,
  loading,
  submitting,
  selectedArray,
  totalSelectedCones,
  canSubmit,
  fetchData,
  toggle,
  setFullQuantity,
  setPartialQuantity,
  submit,
  isSelected,
  getSelection,
  selectedInOtherPo,
  selected,
} = useTransferReserved()

void setPartialQuantity

const { confirm } = useConfirm()
const snackbar = useSnackbar()

const weekOptions = ref<Array<{ label: string; value: number }>>([])
const warehouseOptions = ref<Array<{ label: string; value: number }>>([])

const showPoHistory = ref(false)
const poHistoryPoId = ref<number | null>(null)
const poHistoryPoNumber = ref('')
const poHistoryLines = ref<TransferThreadLine[]>([])
const poHistorySummary = ref<TransferPoGroup['summary'] | null>(null)

const poSectionRefsMap = ref<Map<string, InstanceType<typeof PoSection>>>(new Map())

function collectPoRef(el: unknown, poNumber: string) {
  if (el) {
    poSectionRefsMap.value.set(poNumber, el as InstanceType<typeof PoSection>)
  } else {
    poSectionRefsMap.value.delete(poNumber)
  }
}

const poNumberByPoId = computed(() => {
  const map = new Map<number, string>()
  for (const p of data.value?.pos ?? []) {
    if (p.po_id != null) map.set(p.po_id, p.po_number)
  }
  return map
})

async function onPoSearchSelect(payload: { weekId: number; poNumber: string }) {
  weekId.value = payload.weekId
  selected.value = new Map()
  if (fromWarehouseId.value) {
    await fetchData()
    await nextTick()
    const section = poSectionRefsMap.value.get(payload.poNumber)
    if (section?.$el) {
      ;(section.$el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
}

function openPoHistory(poId: number | null, poNumber: string, lines: TransferThreadLine[], summary: TransferPoGroup['summary'] | null) {
  poHistoryPoId.value = poId
  poHistoryPoNumber.value = poNumber
  poHistoryLines.value = lines
  poHistorySummary.value = summary
  showPoHistory.value = true
}

async function loadWeeks() {
  try {
    const weeks = await weeklyOrderService.getAll({ status: 'CONFIRMED' })
    weekOptions.value = weeks.map(w => ({ label: w.week_name, value: w.id }))
  } catch (e: unknown) {
    snackbar.error(e instanceof Error ? e.message : 'Lỗi tải danh sách tuần')
  }
}

async function loadWarehouses() {
  try {
    const warehouses = await warehouseService.getAll()
    warehouseOptions.value = warehouses
      .filter(w => w.type === 'STORAGE' && w.is_active)
      .map(w => ({ label: w.name, value: w.id }))
  } catch (e: unknown) {
    snackbar.error(e instanceof Error ? e.message : 'Lỗi tải danh sách kho')
  }
}

const totalLines = computed(() => data.value?.pos.reduce((s, p) => s + p.thread_lines.length, 0) ?? 0)
const totalAtSource = computed(() => {
  const seen = new Set<string>()
  let sum = 0
  for (const po of data.value?.pos ?? []) {
    for (const line of po.thread_lines) {
      const k = `${line.thread_type_id}_${line.thread_color_id}`
      if (seen.has(k)) continue
      seen.add(k)
      sum += line.reserved_at_source
    }
  }
  return sum
})
const totalAtDest = computed(() => {
  const seen = new Set<string>()
  let sum = 0
  for (const po of data.value?.pos ?? []) {
    for (const line of po.thread_lines) {
      const k = `${line.thread_type_id}_${line.thread_color_id}`
      if (seen.has(k)) continue
      seen.add(k)
      sum += line.reserved_at_destination
    }
  }
  return sum
})

function onWeekChange() {
  selected.value = new Map()
  if (weekId.value && fromWarehouseId.value) fetchData()
}
function onSourceChange() {
  selected.value = new Map()
  if (weekId.value && fromWarehouseId.value) fetchData()
}
function onDestChange() {
  if (weekId.value && fromWarehouseId.value) fetchData()
}

function clearSelection() {
  selected.value = new Map()
}

async function onSubmit() {
  const fromName = warehouseOptions.value.find(w => w.value === fromWarehouseId.value)?.label || ''
  const toName = warehouseOptions.value.find(w => w.value === toWarehouseId.value)?.label || ''
  const ok = await confirm({
    title: 'Xác nhận chuyển kho',
    message: `Chuyển ${totalSelectedCones.value} cuộn của ${selectedArray.value.length} loại chỉ từ [${fromName}] sang [${toName}]?`,
    confirmText: 'Chuyển',
    cancelText: 'Hủy',
  })
  if (!ok) return
  await submit()
}

onMounted(() => {
  loadWeeks()
  loadWarehouses()
})
</script>

<style scoped>
.sticky-footer {
  position: sticky;
  bottom: 0;
  z-index: 10;
  background: white;
}

.transfer-submit-tooltip-target {
  display: inline-block;
}

:global(.transfer-submit-tooltip) {
  z-index: 3000;
  padding: 8px 12px;
  font-size: 14px;
  line-height: 1.4;
  font-weight: 500;
}
</style>
