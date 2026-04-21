<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Chuyển kho cho chỉ đã gán theo Tuần</div>

    <q-card flat bordered class="q-pa-md q-mb-md">
      <div class="row q-col-gutter-md items-end">
        <div class="col-12 col-md-3">
          <AppSelect
            v-model="weekId"
            :options="weekOptions"
            label="Tuần đặt hàng"
            emit-value
            map-options
            @update:model-value="onWeekChange"
          />
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
          />
        </div>
        <div class="col-12 col-md-3 text-right">
          <AppButton
            :loading="loading"
            :disable="!weekId || !fromWarehouseId"
            label="Tải lại"
            @click="fetchData"
          />
        </div>
      </div>
    </q-card>

    <q-card v-if="data" flat bordered class="q-mb-md q-pa-sm">
      Tổng quan: {{ data.pos.length }} PO ·
      {{ totalLines }} loại chỉ ·
      {{ totalAvailableCones }} cuộn ở {{ data.source_warehouse.name }}
    </q-card>

    <PoSection
      v-for="po in data?.pos || []"
      :key="po.po_id"
      :title="po.po_number"
      :lines="po.thread_lines"
      :is-selected="isSelected"
      :get-selection="getSelection"
      @toggle="toggle"
      @set-quantity="setQuantity"
    />
    <PoSection
      v-if="data && data.unassigned.thread_lines.length"
      title="Không thuộc PO nào"
      :lines="data.unassigned.thread_lines"
      :is-selected="isSelected"
      :get-selection="getSelection"
      @toggle="toggle"
      @set-quantity="setQuantity"
    />

    <q-card
      v-if="selectedArray.length"
      flat
      bordered
      class="q-pa-md row items-center justify-between sticky-footer"
    >
      <div>
        Đã chọn: {{ selectedArray.length }} dòng · Tổng
        <b>{{ totalSelectedCones }}</b> cuộn
      </div>
      <div class="q-gutter-sm">
        <AppButton flat label="Hủy" @click="clearSelection" />
        <AppButton
          color="primary"
          :loading="submitting"
          :disable="!canSubmit"
          label="Chuyển"
          @click="onSubmit"
        />
      </div>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import { useTransferReserved } from '@/composables/thread/useTransferReserved'
import { useConfirm } from '@/composables/useConfirm'
import { useSnackbar } from '@/composables/useSnackbar'
import { weeklyOrderService } from '@/services/weeklyOrderService'
import { warehouseService } from '@/services/warehouseService'
import PoSection from '@/components/thread/transfer-reserved/PoSection.vue'

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
  setQuantity,
  submit,
  isSelected,
  getSelection,
  selected,
} = useTransferReserved()

const { confirm } = useConfirm()
const snackbar = useSnackbar()

const weekOptions = ref<Array<{ label: string; value: number }>>([])
const warehouseOptions = ref<Array<{ label: string; value: number }>>([])

async function loadWeeks() {
  try {
    const weeks = await weeklyOrderService.getAll()
    weekOptions.value = weeks.map((w) => ({ label: w.week_name, value: w.id }))
  } catch (e: unknown) {
    snackbar.error(e instanceof Error ? e.message : 'Lỗi tải danh sách tuần')
  }
}

async function loadWarehouses() {
  try {
    const warehouses = await warehouseService.getAll()
    warehouseOptions.value = warehouses.map((w) => ({ label: w.name, value: w.id }))
  } catch (e: unknown) {
    snackbar.error(e instanceof Error ? e.message : 'Lỗi tải danh sách kho')
  }
}

const totalLines = computed(
  () =>
    (data.value?.pos.reduce((s, p) => s + p.thread_lines.length, 0) || 0) +
    (data.value?.unassigned.thread_lines.length || 0)
)
const totalAvailableCones = computed(() => {
  const all = [
    ...(data.value?.pos.flatMap((p) => p.thread_lines) || []),
    ...(data.value?.unassigned.thread_lines || []),
  ]
  const seen = new Set<string>()
  let sum = 0
  for (const l of all) {
    const k = `${l.thread_type_id}-${l.color_id}`
    if (seen.has(k)) continue
    seen.add(k)
    sum += l.reserved_cones_at_source
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

function clearSelection() {
  selected.value = new Map()
}

async function onSubmit() {
  const fromName = warehouseOptions.value.find((w) => w.value === fromWarehouseId.value)?.label || ''
  const toName = warehouseOptions.value.find((w) => w.value === toWarehouseId.value)?.label || ''
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
</style>
