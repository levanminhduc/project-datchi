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
          :disable="!hasResults || selectedWeek?.status === OrderWeekStatus.CONFIRMED"
          :loading="showConfirmDialog"
          @click="handleConfirmWeek"
        >
          <AppTooltip v-if="selectedWeek?.status === OrderWeekStatus.CONFIRMED">
            Đơn hàng đã được xác nhận
          </AppTooltip>
        </AppButton>
        <AppButton
          flat
          icon="file_download"
          label="Xuất Excel"
          @click="handleExport"
        />
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
import { useQuasar } from 'quasar'
import {
  useWeeklyOrder,
  useWeeklyOrderCalculation,
  usePurchaseOrders,
  useSnackbar,
  useConfirm,
} from '@/composables'
import { purchaseOrderService } from '@/services/purchaseOrderService'
import { weeklyOrderService } from '@/services/weeklyOrderService'
import type { PurchaseOrderWithItems, CalculationResult } from '@/types/thread'
import { OrderWeekStatus } from '@/types/thread/enums'
import { exportOrderResults } from '@/composables/thread/useWeeklyOrderExport'
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
} = useWeeklyOrderCalculation()

const {
  purchaseOrders: poList,
  isLoading: posLoading,
  fetchAllPurchaseOrders,
} = usePurchaseOrders()

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

watch(deliveryDate, (newDate) => {
  if (!newDate || !aggregatedResults.value.length) return
  let changed = false
  for (const row of aggregatedResults.value) {
    const key = `${row.thread_type_id}_${row.thread_color ?? ''}`
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
      if (err instanceof DOMException && err.name === 'AbortError') {
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

const handleUpdateAdditionalOrder = (threadTypeId: number, value: number, threadColor?: string | null) => {
  updateAdditionalOrder(threadTypeId, value, threadColor)
}

// Debounce timer for quota_cones updates
let quotaConesDebounceTimer: ReturnType<typeof setTimeout> | null = null

const handleUpdateQuotaCones = async (threadTypeId: number, value: number) => {
  // Update local state immediately
  updateQuotaCones(threadTypeId, value)

  // Debounce API call
  if (quotaConesDebounceTimer) {
    clearTimeout(quotaConesDebounceTimer)
  }

  quotaConesDebounceTimer = setTimeout(async () => {
    if (!selectedWeek.value?.id) {
      snackbar.warning('Vui long luu tuan dat hang truoc khi cap nhat dinh muc')
      return
    }

    try {
      await weeklyOrderService.updateQuotaCones(selectedWeek.value.id, threadTypeId, value)
      snackbar.success('Da cap nhat dinh muc cuon')
    } catch (err) {
      console.error('[weekly-order] update quota_cones error:', err)
      snackbar.error('Khong the cap nhat dinh muc. Vui long thu lai.')
    }
  }, 500)
}

const handleCalculate = async () => {
  const snapshot = new Map<string, { additional_order: number; quota_cones: number; delivery_date: string | null }>(
    aggregatedResults.value
      .filter((r) => r.additional_order || r.quota_cones)
      .map((r) => [
        `${r.thread_type_id}_${r.thread_color ?? ''}`,
        {
          additional_order: r.additional_order ?? 0,
          quota_cones: r.quota_cones ?? 0,
          delivery_date: r.delivery_date ?? null,
        },
      ])
  )

  resultsSaved.value = false
  manualDeliveryDateEdits.value.clear()
  await calculateAll(selectedWeek.value?.id)
  applyDeliveryDateToResults()

  for (const row of aggregatedResults.value) {
    const key = `${row.thread_type_id}_${row.thread_color ?? ''}`
    const saved = snapshot.get(key)
    if (!saved) continue

    row.additional_order = saved.additional_order
    row.total_final = (row.sl_can_dat || 0) + saved.additional_order
    if (saved.quota_cones) row.quota_cones = saved.quota_cones
    if (saved.delivery_date) {
      row.delivery_date = saved.delivery_date
      manualDeliveryDateEdits.value.add(key)
    }
  }
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

const handleUpdateSummaryDeliveryDate = (threadTypeId: number, date: string, threadColor: string | null) => {
  const key = `${threadTypeId}_${threadColor ?? ''}`
  manualDeliveryDateEdits.value.add(key)
  const row = aggregatedResults.value.find(
    (r) => r.thread_type_id === threadTypeId && (r.thread_color ?? null) === threadColor
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
      const savedMap = new Map<string, { additional_order: number; delivery_date: string | null; total_final: number }>(
        savedResults.summary_data.map((s) => [
          `${s.thread_type_id}_${s.thread_color ?? ''}`,
          {
            additional_order: s.additional_order ?? 0,
            delivery_date: s.delivery_date ?? null,
            total_final: s.total_final ?? 0,
          },
        ])
      )

      for (const row of aggregatedResults.value) {
        const key = `${row.thread_type_id}_${row.thread_color ?? ''}`
        const saved = savedMap.get(key)
        if (!saved) continue

        row.additional_order = saved.additional_order
        row.total_final = (row.sl_can_dat || 0) + saved.additional_order
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

  await fetchAllPurchaseOrders()

  nextTick(() => {
    weekInfoCardRef.value?.focusWeekName()
  })
}

const handleExport = () => exportOrderResults(aggregatedResults.value, weekName.value)

// Lifecycle
onMounted(async () => {
  await Promise.all([fetchAllPurchaseOrders(), fetchWeeks()])
})
</script>
