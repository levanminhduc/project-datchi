<template>
  <q-page
    padding
    class="relative-position"
  >
    <!-- Page Header -->
    <PageHeader
      title="Đặt Hàng Chỉ Tuần"
      subtitle="Quản lý đặt hàng chỉ theo tuần - Chọn PO → Mã hàng → Màu → Số lượng"
    >
      <template #actions>
        <AppButton
          flat
          icon="assignment_turned_in"
          label="Kiểm soát chỉ đã gán"
          @click="showAssignmentControl = true"
        />
        <AppButton
          flat
          icon="history"
          label="Lịch sử"
          @click="showHistory = true"
        />
      </template>
    </PageHeader>

    <!-- Week Info -->
    <WeekInfoCard
      ref="weekInfoCardRef"
      v-model="weekName"
      :delivery-date="deliveryDate"
      :notes="notes"
      class="q-mb-md"
      @update:delivery-date="deliveryDate = $event"
      @update:notes="notes = $event"
      @blur:week-name="handleWeekNameBlur"
    />

    <!-- PO Selection Section -->
    <AppCard
      flat
      bordered
      class="q-mb-md"
    >
      <q-card-section>
        <div class="row items-center q-mb-md">
          <div class="col">
            <div class="text-subtitle1 text-weight-medium">
              Đơn hàng (PO)
            </div>
            <div class="text-caption text-grey">
              Chọn PO để thêm mã hàng và màu sắc
            </div>
          </div>
        </div>

        <!-- Add PO selector -->
        <div class="row q-col-gutter-sm q-mb-md items-end">
          <div class="col-12 col-sm-6 col-md-4">
            <AppSelect
              v-model="selectedPOId"
              :options="poOptions"
              label="Chọn PO"
              dense
              use-input
              fill-input
              hide-selected
              hide-bottom-space
              clearable
              :loading="posLoading"
            >
              <template #no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    Không có PO nào
                  </q-item-section>
                </q-item>
              </template>
            </AppSelect>
          </div>
          <div class="col-auto">
            <AppButton
              color="primary"
              icon="add"
              label="Thêm PO"
              :disable="!selectedPOId"
              :loading="loadingPOId !== null && loadingPOId === selectedPOId"
              @click="handleAddPO"
            />
          </div>
        </div>

        <!-- PO Cards -->
        <POOrderCard
          v-for="po in loadedPOs"
          :key="po.id"
          :po="po"
          :entries="orderEntries"
          :ordered-quantities="orderedQuantities"
          :sub-art-required="subArtRequired"
          @remove-po="handleRemovePO"
          @add-style="handleAddStyleFromPO"
          @remove-style="(styleId, poId, subArtId) => removeStyle(styleId, poId, subArtId)"
          @add-color="(styleId, color, poId, subArtId) => addColorToStyle(styleId, color, poId, subArtId)"
          @remove-color="(styleId, colorId, poId, subArtId) => removeColorFromStyle(styleId, colorId, poId, subArtId)"
          @update-quantity="(styleId, colorId, qty, poId, subArtId) => updateColorQuantity(styleId, colorId, qty, poId, subArtId)"
          @update-sub-art="(styleId, poId, subArtId, subArtCode, oldSubArtId) => updateSubArt(styleId, poId, subArtId, subArtCode, oldSubArtId)"
        />

        <EmptyState
          v-if="loadedPOs.length === 0"
          icon="assignment"
          title="Chưa có PO nào"
          subtitle="Chọn PO từ danh sách để bắt đầu"
          icon-color="grey-4"
        />
      </q-card-section>
    </AppCard>

    <!-- Over Limit Warning -->
    <q-banner
      v-if="hasOverLimitEntries"
      dense
      rounded
      class="bg-red-1 text-negative q-mb-md"
    >
      <template #avatar>
        <q-icon
          name="error"
          color="negative"
        />
      </template>
      <span class="text-weight-medium">Số lượng màu vượt quá SL cho phép trong PO.</span>
      Vui lòng điều chỉnh trước khi tính toán hoặc lưu.
    </q-banner>

    <!-- Calculate Button -->
    <div class="row items-center q-mb-md q-gutter-sm">
      <AppButton
        color="primary"
        icon="calculate"
        label="Tính toán"
        :loading="isCalculating"
        :disable="!canCalculate || hasOverLimitEntries"
        @click="handleCalculate"
      >
        <AppTooltip v-if="!canCalculate && canCalculateReason">
          {{ canCalculateReason }}
        </AppTooltip>
      </AppButton>
      <span
        v-if="isResultsStale"
        class="text-caption text-warning"
      >
        Dữ liệu đã thay đổi, cần tính lại
      </span>
      <q-space />
      <div class="col-12 col-sm-4 col-md-3">
        <AppSelect
          v-model="selectedWarehouseIds"
          :options="warehouseFilterOptions"
          label="Kho rút tồn (áp dụng khi xác nhận)"
          dense
          outlined
          multiple
          clearable
          use-chips
          emit-value
          map-options
          use-input
          fill-input
          hide-selected
          hide-bottom-space
          :loading="warehousesLoading"
          @update:model-value="handleWarehouseFilterChange"
        >
          <template #before-options>
            <q-item dense>
              <q-item-section class="text-caption text-grey">
                Trống = sẽ rút từ tất cả kho khi xác nhận đơn hàng
              </q-item-section>
            </q-item>
            <q-separator />
          </template>
          <template #option="{ itemProps, opt, selected, toggleOption }">
            <q-item
              v-bind="itemProps"
              @click="toggleOption(opt)"
            >
              <q-item-section side>
                <q-checkbox
                  :model-value="selected"
                  @update:model-value="toggleOption(opt)"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ opt.label.split(' (')[0] }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </AppSelect>
        <div
          v-if="selectedWarehouseIds.length > 0"
          class="text-caption text-primary q-mt-xs q-px-xs"
        >
          <q-icon
            name="warehouse"
            size="xs"
            class="q-mr-xs"
          />
          <strong>Đang chọn:</strong> {{ selectedWarehouseNames }}
        </div>
      </div>
      <span
        v-if="isCalculating"
        class="text-caption text-grey"
      >
        {{ calculationProgress.current }}/{{ calculationProgress.total }} mã hàng
      </span>
    </div>

    <!-- Calculation Errors -->
    <AppBanner
      v-if="calculationErrors.length > 0"
      class="bg-negative text-white q-mb-md"
      rounded
    >
      <template #avatar>
        <q-icon name="warning" />
      </template>
      <div class="text-weight-medium">
        Lỗi tính toán:
      </div>
      <div
        v-for="err in calculationErrors"
        :key="err.style_id"
        class="text-caption"
      >
        {{ err.style_code }}: {{ err.error }}
      </div>
    </AppBanner>

    <!-- Calculation Warnings -->
    <q-banner
      v-if="calculationWarnings.length > 0"
      rounded
      class="bg-amber-1 q-mb-md"
    >
      <template #avatar>
        <q-icon
          name="warning"
          color="warning"
        />
      </template>
      <div class="text-subtitle2 q-mb-xs text-warning">
        Cảnh báo định mức chỉ
      </div>
      <ul class="q-ma-none q-pl-md">
        <li
          v-for="(w, i) in calculationWarnings"
          :key="i"
          class="text-body2"
        >
          {{ w }}
        </li>
      </ul>
    </q-banner>

    <!-- Warehouse Changed Warning -->
    <q-banner
      v-if="isWarehouseChangedSinceCalc"
      rounded
      class="bg-warning text-white q-mb-md"
    >
      <template #avatar>
        <q-icon
          name="warehouse"
          color="white"
        />
      </template>
      Bạn đã thay đổi lọc kho. Vui lòng nhấn <strong>Tính toán</strong> lại trước khi xác nhận.
    </q-banner>

    <!-- Results Section -->
    <template v-if="hasResults">
      <!-- Result View Toggle -->
      <div class="row items-center q-mb-md">
        <div class="text-subtitle1 text-weight-medium q-mr-md">
          Kết quả tính toán
        </div>
        <ButtonToggle
          v-model="resultView"
          :options="[
            { label: 'Chi tiết', value: 'detail' },
            { label: 'Tổng hợp', value: 'summary' }
          ]"
          color="grey-4"
          toggle-color="primary"
          dense
        />
      </div>

      <!-- Detail View -->
      <ResultsDetailView
        v-if="resultView === 'detail'"
        :results="perStyleResults"
        :order-entries="orderEntries"
        :is-saved="resultsSaved"
        :is-reordering="isReordering"
        @update:delivery-date="handleUpdateDeliveryDate"
        @reorder="handleReorder"
      />

      <!-- Summary View -->
      <ResultsSummaryTable
        v-if="resultView === 'summary'"
        :rows="aggregatedResults"
        :readonly="resultsSaved"
        @update:additional-order="handleUpdateAdditionalOrder"
        @update:quota-cones="handleUpdateQuotaCones"
        @update:delivery-date="handleUpdateSummaryDeliveryDate"
      />

      <!-- Result Actions -->
      <div class="row q-gutter-sm q-mt-md">
        <AppButton
          color="primary"
          icon="save"
          label="Lưu Đơn Hàng"
          :loading="weekLoading"
          :disable="!hasResults"
          @click="handleSave()"
        />
        <AppButton
          color="positive"
          icon="check_circle"
          label="Xác Nhận Đặt Hàng"
          :disable="!hasResults || selectedWeek?.status === OrderWeekStatus.CONFIRMED || isWarehouseChangedSinceCalc"
          :loading="showConfirmDialog"
          @click="handleConfirmWeek"
        >
          <AppTooltip v-if="isWarehouseChangedSinceCalc">
            Vui lòng tính toán lại sau khi thay đổi kho.
          </AppTooltip>
          <AppTooltip v-else-if="selectedWeek?.status === OrderWeekStatus.CONFIRMED">
            Đơn hàng đã được xác nhận
          </AppTooltip>
        </AppButton>
      </div>
    </template>

    <!-- Week History Dialog -->
    <WeekHistoryDialog
      v-model="showHistory"
      :weeks="weeks"
      :loading="weekLoading"
      @load="handleLoadWeek"
    />

    <!-- Assignment Control Dialog -->
    <AssignmentControlDialog
      v-model="showAssignmentControl"
    />
    <ConfirmProgressDialog
      v-model="showConfirmDialog"
      :steps="confirmSteps"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import {
  useWeeklyOrder,
  useWeeklyOrderCalculation,
  usePurchaseOrders,
  useSnackbar,
  useConfirm,
  useWarehouses,
} from '@/composables'
import { purchaseOrderService } from '@/services/purchaseOrderService'
import { weeklyOrderService, type InventoryDiffRow } from '@/services/weeklyOrderService'
import { ApiError } from '@/services/api'
import type { PurchaseOrderWithItems, CalculationResult } from '@/types/thread'
import { OrderWeekStatus } from '@/types/thread/enums'
import POOrderCard from '@/components/thread/weekly-order/POOrderCard.vue'
import AssignmentControlDialog from '@/components/thread/weekly-order/AssignmentControlDialog.vue'
import ConfirmProgressDialog from '@/components/thread/weekly-order/ConfirmProgressDialog.vue'
import type { ConfirmStep } from '@/components/thread/weekly-order/ConfirmProgressDialog.vue'

definePage({
  meta: {
    requiresAuth: true,
    permissions: ['thread.weekly-order.view'],
  },
})

// Composables
const $q = useQuasar()
const snackbar = useSnackbar()
const confirm = useConfirm()
const {
  weeks,
  selectedWeek,
  loading: weekLoading,
  fetchWeeks,
  createWeek,
  updateWeek,
  loadWeek,
  saveResults,
  loadResults,
} = useWeeklyOrder()

const {
  orderEntries,
  perStyleResults,
  aggregatedResults,
  isCalculating,
  isReordering,
  calculationProgress,
  calculationErrors,
  calculationWarnings,
  canCalculate,
  canCalculateReason,
  hasResults,
  isResultsStale,
  hasOverLimitEntries,
  orderedQuantities,
  subArtRequired,
  addStyle,
  removeStyle,
  removePO,
  addColorToStyle,
  removeColorFromStyle,
  updateColorQuantity,
  updateSubArt,
  calculateAll,
  clearAll,
  setFromWeekItems,
  updateAdditionalOrder,
  updateQuotaCones,
  updateDeliveryDate,
  mergeDeliveryDateOverrides,
  reorderResults,
  fetchOrderedQuantities,
  lastModifiedAt,
} = useWeeklyOrderCalculation()

const {
  purchaseOrders: poList,
  isLoading: posLoading,
  fetchAllPurchaseOrders,
} = usePurchaseOrders()

const {
  storageOptions: warehouseFilterOptions,
  fetchWarehouses,
  loading: warehousesLoading,
} = useWarehouses()

// Default delivery date = today + 7 days
function getDefaultDeliveryDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().slice(0, 10)
}

// Local state
const weekInfoCardRef = ref<{ focusWeekName: () => void } | null>(null)
const weekName = ref('')
const deliveryDate = ref(getDefaultDeliveryDate())
const notes = ref('')
const selectedPOId = ref<number | null>(null)
const loadingPOId = ref<number | null>(null)
const loadedPOs = ref<PurchaseOrderWithItems[]>([])
const resultView = ref<'detail' | 'summary'>('summary')
const showHistory = ref(false)
const showAssignmentControl = ref(false)
const showConfirmDialog = ref(false)
const confirmSteps = reactive<ConfirmStep[]>([
  { label: 'Lưu đơn hàng', status: 'pending' },
  { label: 'Xác nhận & đặt trước chỉ', status: 'pending' },
  { label: 'Đồng bộ giao hàng', status: 'pending' },
  { label: 'Gửi thông báo', status: 'pending' },
])
const resultsSaved = ref(false)
const manualDeliveryDateEdits = ref(new Set<string>())
const selectedWarehouseIds = ref<number[]>([])
const lastCalculatedWarehouseIds = ref<number[] | null>(null)

const selectedWarehouseNames = computed(() => {
  if (!selectedWarehouseIds.value.length) return ''
  return selectedWarehouseIds.value
    .map(id => {
      const w = warehouseFilterOptions.value.find(opt => opt.value === id)
      // Display only the name part from the label "Name (CODE)" or from service data if available
      // Since storageOptions uses `${w.name} (${w.code})`, we split by ' (' to get name
      return w ? (w.label.split(' (')[0]?.trim() ?? '') : ''
    })
    .filter(Boolean)
    .join(', ')
})

watch(deliveryDate, (newDate) => {
  if (!newDate || !aggregatedResults.value.length) return
  let changed = false
  for (const row of aggregatedResults.value) {
    const key = `${row.thread_type_id}_${row.thread_color_id ?? ''}`
    if (row.sl_can_dat && row.sl_can_dat > 0 && !manualDeliveryDateEdits.value.has(key)) {
      row.delivery_date = newDate
      changed = true
    }
  }
  if (changed) {
    aggregatedResults.value = [...aggregatedResults.value]
  }
})

// Computed
const poOptions = computed(() =>
  poList.value
    .filter((po) => !loadedPOs.value.some((loaded) => loaded.id === po.id))
    .map((po) => ({
      label: `${po.po_number}${po.customer_name ? ` - ${po.customer_name}` : ''}`,
      value: po.id,
    }))
)

const _canSave = computed(() => {
  return orderEntries.value.length > 0
})

const isWarehouseChangedSinceCalc = computed(() => {
  if (lastCalculatedWarehouseIds.value === null) return false
  if (selectedWeek.value?.status === 'CONFIRMED') return false
  const a = [...lastCalculatedWarehouseIds.value].sort((x, y) => x - y).join(',')
  const b = [...selectedWarehouseIds.value].sort((x, y) => x - y).join(',')
  return a !== b
})

// Handlers
const handleAddPO = async () => {
  if (!selectedPOId.value) return

  loadingPOId.value = selectedPOId.value
  try {
    const poWithItems = await purchaseOrderService.getWithItems(selectedPOId.value)
    loadedPOs.value.push(poWithItems)

    if (poWithItems.items && poWithItems.items.length > 0) {
      const pairs = poWithItems.items.map((item) => ({
        po_id: poWithItems.id,
        style_id: item.style_id,
      }))
      await fetchOrderedQuantities(pairs, selectedWeek.value?.id).catch(() => {})
    }

    selectedPOId.value = null
  } catch (err) {
    snackbar.error('Không thể tải dữ liệu PO')
    console.error('[weekly-order] load PO error:', err)
  } finally {
    loadingPOId.value = null
  }
}

const handleRemovePO = async (poId: number) => {
  const po = loadedPOs.value.find((p) => p.id === poId)
  const poName = po?.po_number || `#${poId}`

  if (selectedWeek.value?.id) {
    const isConfirmed = selectedWeek.value.status === 'CONFIRMED'

    const message = isConfirmed
      ? `Xóa <b>${poName}</b> khỏi tuần đã xác nhận?<br>Hệ thống sẽ tự động cập nhật tính toán và đặt trước chỉ lại.`
      : `Xóa <b>${poName}</b> khỏi đơn đặt hàng?`

    const confirmed = await confirm.confirm({
      title: 'Xác nhận xóa PO',
      message,
      type: isConfirmed ? 'warning' : 'info',
      confirmText: 'Xóa',
      color: 'negative',
      html: true,
    })

    if (!confirmed) return

    $q.loading.show({ message: 'Đang xóa PO và cập nhật dữ liệu...' })

    try {
      await weeklyOrderService.removePOFromWeek(selectedWeek.value.id, poId)

      if (isConfirmed) {
        await handleLoadWeek(selectedWeek.value.id)
        snackbar.success('Đã xóa PO. Dữ liệu đã được cập nhật tự động.')
      } else {
        loadedPOs.value = loadedPOs.value.filter((p) => p.id !== poId)
        removePO(poId)
        perStyleResults.value = perStyleResults.value.filter(
          (r) => orderEntries.value.some((e) => e.style_id === r.style_id),
        )
        aggregatedResults.value = []
        snackbar.success('Đã xóa PO và loại chỉ liên quan. Vui lòng tính toán lại.')
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        snackbar.error('Quá thời gian xử lý. Vui lòng kiểm tra lại dữ liệu.')
      } else {
        snackbar.error(err instanceof Error ? err.message : 'Không thể xóa PO')
      }
    } finally {
      $q.loading.hide()
    }
  } else {
    loadedPOs.value = loadedPOs.value.filter((p) => p.id !== poId)
    removePO(poId)
  }
}

const handleAddStyleFromPO = (
  style: { id: number; style_code: string; style_name: string; po_id: number; po_number: string; sub_art_id?: number; sub_art_code?: string },
) => {
  addStyle({
    id: style.id,
    style_code: style.style_code,
    style_name: style.style_name,
    po_id: style.po_id,
    po_number: style.po_number,
    sub_art_id: style.sub_art_id,
    sub_art_code: style.sub_art_code,
  })
}

const handleUpdateAdditionalOrder = (threadTypeId: number, value: number, threadColorId?: number | null) => {
  updateAdditionalOrder(threadTypeId, value, threadColorId)
}

const handleUpdateQuotaCones = (threadTypeId: number, value: number | null, threadColorId: number | null, demandNote: string | null) => {
  updateQuotaCones(threadTypeId, value, threadColorId, demandNote)
}

const handleWarehouseFilterChange = (ids: number[] | null) => {
  if (ids === null) {
    selectedWarehouseIds.value = []
  }
  if (hasResults.value) {
    lastModifiedAt.value = Date.now()
  }
}

const handleCalculate = async () => {
  if (selectedWeek.value?.id && selectedWarehouseIds.value.length > 0) {
    try {
      await weeklyOrderService.saveWarehouseFilter(selectedWeek.value.id, selectedWarehouseIds.value)
    } catch (err) {
      snackbar.error('Lưu bộ lọc kho thất bại')
      console.warn('Failed to save warehouse filter:', err)
      throw err
    }
  }

  const snapshot = new Map<string, { additional_order: number; quota_cones: number | null; demand_note: string | null; delivery_date: string | null }>(
    aggregatedResults.value
      .filter((r) => r.additional_order || r.quota_cones != null || r.delivery_date)
      .map((r) => [
        `${r.thread_type_id}_${r.thread_color_id ?? ''}`,
        {
          additional_order: r.additional_order ?? 0,
          quota_cones: r.quota_cones != null ? r.quota_cones : null,
          demand_note: r.demand_note ?? null,
          delivery_date: r.delivery_date ?? null,
        },
      ])
  )

  resultsSaved.value = false
  manualDeliveryDateEdits.value.clear()
  await calculateAll(
    selectedWeek.value?.id,
    selectedWarehouseIds.value.length > 0 ? selectedWarehouseIds.value : undefined,
  )
  applyDeliveryDateToResults()

  for (const row of aggregatedResults.value) {
    const key = `${row.thread_type_id}_${row.thread_color_id ?? ''}`
    const saved = snapshot.get(key)
    if (!saved) continue

    row.additional_order = saved.additional_order
    if (saved.quota_cones != null) {
      row.quota_cones = saved.quota_cones
      row.demand_note = saved.demand_note
      const effectiveCones = row.quota_cones != null ? row.quota_cones : row.total_cones
      row.sl_can_dat = Math.max(0, Math.ceil(effectiveCones - (row.equivalent_cones || 0)))
    }
    row.total_final = (row.sl_can_dat || 0) + saved.additional_order
    if (saved.delivery_date) {
      row.delivery_date = saved.delivery_date
      manualDeliveryDateEdits.value.add(key)
    }
  }

  lastCalculatedWarehouseIds.value = [...selectedWarehouseIds.value]
}

function applyDeliveryDateToResults() {
  if (!deliveryDate.value || !aggregatedResults.value.length) return
  let changed = false
  for (const row of aggregatedResults.value) {
    if (row.sl_can_dat && row.sl_can_dat > 0) {
      row.delivery_date = deliveryDate.value
      changed = true
    }
  }
  if (changed) {
    aggregatedResults.value = [...aggregatedResults.value]
  }
}

const handleUpdateDeliveryDate = (specId: number, date: string) => {
  updateDeliveryDate(specId, date)
  for (const result of perStyleResults.value) {
    const calc = result.calculations.find((c) => c.spec_id === specId)
    if (calc) {
      calc.delivery_date = date
      break
    }
  }
}

const handleUpdateSummaryDeliveryDate = (threadTypeId: number, date: string, threadColorId: number | null) => {
  const key = `${threadTypeId}_${threadColorId ?? ''}`
  manualDeliveryDateEdits.value.add(key)
  const row = aggregatedResults.value.find(
    (r) => r.thread_type_id === threadTypeId && (r.thread_color_id ?? null) === threadColorId
  )
  if (row) {
    row.delivery_date = date
  }
}

const handleReorder = async (newOrder: CalculationResult[]) => {
  await reorderResults(newOrder)
}

const handleSave = async (options?: { skipReset?: boolean }) => {
  if (!weekName.value) {
    snackbar.error('Vui lòng nhập thông tin Đơn đặt chỉ')
    return
  }

  mergeDeliveryDateOverrides()

  const items = orderEntries.value.flatMap((entry) =>
    entry.colors
      .filter((c) => c.quantity > 0)
      .map((c) => ({
        po_id: entry.po_id,
        style_id: entry.style_id,
        color_id: c.color_id,
        quantity: c.quantity,
        sub_art_id: entry.sub_art_id ?? null,
        style_color_id: c.style_color_id,
      }))
  )

  if (selectedWeek.value) {
    const updated = await updateWeek(selectedWeek.value.id, {
      week_name: weekName.value,
      start_date: deliveryDate.value || undefined,
      notes: notes.value || undefined,
      items,
    })

    if (!updated) return

    try {
      await weeklyOrderService.saveWarehouseFilter(selectedWeek.value.id, selectedWarehouseIds.value)
    } catch (err) {
      snackbar.error('Lưu bộ lọc kho thất bại')
      console.warn('Failed to save warehouse filter:', err)
      return
    }

    if (hasResults.value) {
      await saveResults(selectedWeek.value.id, perStyleResults.value, aggregatedResults.value)
    }
    resultsSaved.value = true
  } else {
    const created = await createWeek({
      week_name: weekName.value,
      start_date: deliveryDate.value || undefined,
      notes: notes.value || undefined,
      items,
    })

    if (!created) return

    selectedWeek.value = created

    try {
      await weeklyOrderService.saveWarehouseFilter(created.id, selectedWarehouseIds.value)
    } catch (err) {
      snackbar.error('Lưu bộ lọc kho thất bại')
      console.warn('Failed to save warehouse filter:', err)
      return
    }

    if (hasResults.value) {
      await saveResults(created.id, perStyleResults.value, aggregatedResults.value)
    }
    resultsSaved.value = true
  }

  if (!options?.skipReset) {
    clearAll()
    weekName.value = ''
    deliveryDate.value = getDefaultDeliveryDate()
    notes.value = ''
    selectedPOId.value = null
    loadedPOs.value = []
    resultsSaved.value = false
    manualDeliveryDateEdits.value = new Set()
    selectedWeek.value = null
    selectedWarehouseIds.value = []
    lastCalculatedWarehouseIds.value = null

    await Promise.all([fetchAllPurchaseOrders(), fetchWeeks()])

    nextTick(() => {
      weekInfoCardRef.value?.focusWeekName()
    })
  }
}

const handleLoadWeek = async (weekId: number) => {
  const week = await loadWeek(weekId)
  if (!week) return

  showHistory.value = false
  weekName.value = week.week_name
  deliveryDate.value = week.start_date || getDefaultDeliveryDate()
  notes.value = week.notes || ''

  if (selectedWeek.value?.id) {
    try {
      selectedWarehouseIds.value = await weeklyOrderService.getWarehouseFilter(selectedWeek.value.id)
    } catch {
      selectedWarehouseIds.value = []
    }
  }

  if (week.items && week.items.length > 0) {
    setFromWeekItems(week.items)

    // Rebuild loadedPOs from the items that have po_id
    const poIds = new Set(
      week.items.filter((item) => item.po_id).map((item) => item.po_id!)
    )
    loadedPOs.value = []
    for (const poId of poIds) {
      try {
        const poWithItems = await purchaseOrderService.getWithItems(poId)
        loadedPOs.value.push(poWithItems)
      } catch {
        // PO may have been deleted, entries still show from setFromWeekItems
      }
    }

    // Fetch ordered quantities for all PO/style pairs (exclude current week)
    const pairs = week.items
      .filter((item) => item.po_id)
      .map((item) => ({ po_id: item.po_id!, style_id: item.style_id }))
    const uniquePairs = [...new Map(pairs.map((p) => [`${p.po_id}_${p.style_id}`, p])).values()]
    if (uniquePairs.length > 0) {
      await fetchOrderedQuantities(uniquePairs, weekId).catch(() => {})
    }
  } else {
    clearAll()
    loadedPOs.value = []
  }

  if (canCalculate.value) {
    await handleCalculate()

    const savedResults = await loadResults(weekId).catch(() => null)
    if (savedResults?.summary_data?.length) {
      const savedMap = new Map<string, { additional_order: number; delivery_date: string | null; total_final: number; quota_cones: number | null; demand_note: string | null }>(
        savedResults.summary_data.map((s) => [
          `${s.thread_type_id}_${s.thread_color_id ?? ''}`,
          {
            additional_order: s.additional_order ?? 0,
            delivery_date: s.delivery_date ?? null,
            total_final: s.total_final ?? 0,
            quota_cones: (s.quota_cones as number | null | undefined) ?? null,
            demand_note: (s.demand_note as string | null | undefined) ?? null,
          },
        ])
      )

      for (const row of aggregatedResults.value) {
        const key = `${row.thread_type_id}_${row.thread_color_id ?? ''}`
        const saved = savedMap.get(key)
        if (!saved) continue

        row.additional_order = saved.additional_order
        row.quota_cones = saved.quota_cones
        row.demand_note = saved.demand_note
        const effectiveCones = row.quota_cones != null ? row.quota_cones : row.total_cones
        row.sl_can_dat = Math.max(0, Math.ceil(effectiveCones - (row.equivalent_cones || 0)))
        row.total_final = row.sl_can_dat + saved.additional_order
        if (saved.delivery_date) {
          row.delivery_date = saved.delivery_date
          manualDeliveryDateEdits.value.add(key)
        }
      }

      resultsSaved.value = true
    }
  }
}

const handleWeekNameBlur = async () => {
  const trimmedName = weekName.value.trim()
  if (!trimmedName) return

  try {
    const result = await weeklyOrderService.checkWeekNameExists(trimmedName)
    if (!result.exists || !result.week) return

    if (selectedWeek.value && result.week.id === selectedWeek.value.id) return

    $q.dialog({
      title: 'Tuần đã tồn tại',
      message: `Tuần "${result.week.week_name}" đã tồn tại. Bạn muốn làm gì?`,
      persistent: true,
      options: {
        type: 'radio',
        model: 'load',
        items: [
          { label: 'Tải và cập nhật tuần này', value: 'load' },
          { label: 'Đổi tên mới', value: 'rename' },
        ],
      },
    }).onOk(async (action: string) => {
      if (action === 'load' && result.week) {
        await handleLoadWeek(result.week.id)
      } else if (action === 'rename') {
        weekInfoCardRef.value?.focusWeekName()
      }
    })
  } catch {
    // Graceful degradation: silently continue, save-time validation will catch duplicates
  }
}

const resetConfirmSteps = () => {
  for (const step of confirmSteps) {
    step.status = 'pending'
    step.errorMessage = undefined
  }
}

function escapeHtmlEntity(s: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return s.replace(/[&<>"']/g, (c) => map[c]!)
}

function showInventoryDiffDialog(diff: InventoryDiffRow[]): Promise<void> {
  return new Promise((resolve) => {
    const rowsHtml = diff
      .map((d) => {
        const label = `${escapeHtmlEntity(d.supplier_name || '-')} · Tex ${escapeHtmlEntity(d.tex_number || '-')} · ${escapeHtmlEntity(d.thread_color || '-')}`
        const newStyle =
          d.new_inventory_cones < d.old_inventory_cones
            ? 'color:#c10015; font-weight:600'
            : 'color:#21ba45; font-weight:600'
        return `<tr>
          <td style="padding:4px 8px;border-bottom:1px solid #eee">${label}</td>
          <td style="padding:4px 8px;text-align:right;color:#888;border-bottom:1px solid #eee">${d.old_inventory_cones}</td>
          <td style="padding:4px 8px;text-align:right;border-bottom:1px solid #eee;${newStyle}">${d.new_inventory_cones}</td>
          <td style="padding:4px 8px;text-align:right;border-bottom:1px solid #eee">${d.new_sl_can_dat}</td>
        </tr>`
      })
      .join('')

    $q.dialog({
      title: 'Tồn kho đã thay đổi',
      message: `<div style="margin-bottom:12px">Tồn kho thực tế đã thay đổi so với lúc lưu nháp cho các loại chỉ sau. Vui lòng tính toán lại đơn hàng trước khi xác nhận:</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr style="background:#f5f5f5">
            <th style="padding:6px 8px;text-align:left">Loại chỉ</th>
            <th style="padding:6px 8px;text-align:right">Tồn cũ</th>
            <th style="padding:6px 8px;text-align:right">Tồn mới</th>
            <th style="padding:6px 8px;text-align:right">Cần đặt</th>
          </tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>`,
      html: true,
      persistent: true,
      ok: { label: 'Tính toán lại và lưu', color: 'primary', unelevated: true },
      cancel: { label: 'Đóng', flat: true },
    })
      .onOk(async () => {
        try {
          await handleCalculate()
          await handleSave({ skipReset: true })
          snackbar.info('Đã tính toán lại với tồn kho mới. Vui lòng kiểm tra và xác nhận đơn hàng lại.')
        } catch (err) {
          snackbar.error(err instanceof Error ? err.message : 'Lỗi khi tính toán lại')
        } finally {
          resolve()
        }
      })
      .onCancel(() => resolve())
      .onDismiss(() => resolve())
  })
}

const handleConfirmWeek = async () => {
  if (!hasResults.value) return

  if (!weekName.value) {
    snackbar.error('Vui lòng nhập thông tin Đơn đặt chỉ')
    return
  }

  resetConfirmSteps()
  showConfirmDialog.value = true

  const setStepStatus = (index: number, status: ConfirmStep['status'], errorMessage?: string) => {
    const step = confirmSteps[index]
    if (!step) return
    step.status = status
    if (errorMessage) step.errorMessage = errorMessage
  }

  try {
    setStepStatus(0, 'loading')
    await handleSave({ skipReset: true })

    if (!selectedWeek.value) {
      setStepStatus(0, 'error', 'Không thể lưu đơn hàng')
      return
    }
    setStepStatus(0, 'success')
  } catch (err) {
    setStepStatus(0, 'error', err instanceof Error ? err.message : 'Lỗi lưu đơn hàng')
    return
  }

  if (selectedWeek.value.status !== OrderWeekStatus.CONFIRMED) {
    try {
      const diffResp = await weeklyOrderService.getInventoryDiff(selectedWeek.value.id)
      if (diffResp.has_changed) {
        setStepStatus(1, 'error', 'Tồn kho đã thay đổi. Vui lòng tính toán lại đơn hàng.')
        showConfirmDialog.value = false
        await showInventoryDiffDialog(diffResp.diff)
        return
      }
    } catch (err) {
      console.warn('[handleConfirmWeek] inventory diff pre-check failed:', err)
    }
  }

  if (selectedWeek.value.status === OrderWeekStatus.CONFIRMED) {
    setStepStatus(1, 'success')
    setStepStatus(2, 'loading')
  } else {
    try {
      setStepStatus(1, 'loading')
      await weeklyOrderService.updateStatus(
        selectedWeek.value.id,
        OrderWeekStatus.CONFIRMED,
        { timeout: 60000 },
      )
      selectedWeek.value.status = OrderWeekStatus.CONFIRMED
      setStepStatus(1, 'success')
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setStepStatus(1, 'error', err.message)
        showConfirmDialog.value = false
        try {
          const diffResp = await weeklyOrderService.getInventoryDiff(selectedWeek.value!.id)
          if (diffResp.has_changed) {
            await showInventoryDiffDialog(diffResp.diff)
            return
          }
        } catch {
          // fall through
        }
        snackbar.error(err.message)
        return
      }
      try {
        const week = await weeklyOrderService.getById(selectedWeek.value!.id)
        if (week.status === OrderWeekStatus.CONFIRMED) {
          selectedWeek.value!.status = OrderWeekStatus.CONFIRMED
          setStepStatus(1, 'success')
        } else {
          setStepStatus(1, 'error', err instanceof Error ? err.message : 'Lỗi xác nhận')
          return
        }
      } catch {
        setStepStatus(1, 'error', err instanceof Error ? err.message : 'Lỗi xác nhận')
        return
      }
    }
  }

  try {
    setStepStatus(2, 'loading')
    await weeklyOrderService.syncDeliveries(selectedWeek.value!.id)
    setStepStatus(2, 'success')
  } catch (err) {
    setStepStatus(2, 'error', err instanceof Error ? err.message : 'Lỗi đồng bộ giao hàng')
    return
  }

  try {
    setStepStatus(3, 'loading')
    await weeklyOrderService.notifyConfirmation(selectedWeek.value!.id)
    setStepStatus(3, 'success')
  } catch (err) {
    setStepStatus(3, 'error', err instanceof Error ? err.message : 'Lỗi gửi thông báo')
    return
  }

  snackbar.success('Đã xác nhận đặt hàng thành công')
  await fetchWeeks()

  clearAll()
  weekName.value = ''
  deliveryDate.value = getDefaultDeliveryDate()
  notes.value = ''
  selectedPOId.value = null
  loadedPOs.value = []
  resultsSaved.value = false
  manualDeliveryDateEdits.value = new Set()
  selectedWeek.value = null
  selectedWarehouseIds.value = []

  await fetchAllPurchaseOrders()

  nextTick(() => {
    weekInfoCardRef.value?.focusWeekName()
  })
}

const route = useRoute()
const router = useRouter()

// Lifecycle
onMounted(async () => {
  await Promise.all([fetchAllPurchaseOrders(), fetchWeeks(), fetchWarehouses()])

  const loadParam = route.query.load
  const loadIdStr = Array.isArray(loadParam) ? loadParam[0] : loadParam
  const loadId = loadIdStr ? Number(loadIdStr) : NaN
  if (Number.isFinite(loadId) && loadId > 0) {
    await handleLoadWeek(loadId).catch(() => {})
    router.replace({ query: {} })
  }
})
</script>
