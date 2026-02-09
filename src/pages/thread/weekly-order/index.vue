<template>
  <q-page padding>
    <!-- Page Header -->
    <PageHeader
      title="Đặt Hàng Chỉ Tuần"
      subtitle="Quản lý đặt hàng chỉ theo tuần - Chọn PO → Mã hàng → Màu → Số lượng"
    >
      <template #actions>
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
      v-model="weekName"
      :start-date="startDate"
      :end-date="endDate"
      :notes="notes"
      class="q-mb-md"
      @update:start-date="startDate = $event"
      @update:end-date="endDate = $event"
      @update:notes="notes = $event"
    >
      <template #actions>
        <AppButton
          color="primary"
          icon="save"
          label="Lưu"
          :loading="weekLoading"
          :disable="!weekName || !canSave"
          @click="handleSave"
        />
      </template>
    </WeekInfoCard>

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
          @remove-po="handleRemovePO"
          @add-style="handleAddStyleFromPO"
          @remove-style="(styleId, poId) => removeStyle(styleId, poId)"
          @add-color="(styleId, color, poId) => addColorToStyle(styleId, color, poId)"
          @remove-color="(styleId, colorId, poId) => removeColorFromStyle(styleId, colorId, poId)"
          @update-quantity="(styleId, colorId, qty, poId) => updateColorQuantity(styleId, colorId, qty, poId)"
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

    <!-- Calculate Button -->
    <div class="row items-center q-mb-md q-gutter-sm">
      <AppButton
        color="primary"
        icon="calculate"
        label="Tính toán"
        :loading="isCalculating"
        :disable="!canCalculate"
        @click="calculateAll"
      />
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
      />

      <!-- Summary View -->
      <ResultsSummaryTable
        v-if="resultView === 'summary'"
        :rows="aggregatedResults"
      />

      <!-- Result Actions -->
      <div class="row q-gutter-sm q-mt-md">
        <AppButton
          color="primary"
          icon="add_circle"
          label="Tạo phiếu phân bổ"
          :disable="!hasColorBreakdown"
          @click="handleCreateAllocations"
        >
          <AppTooltip v-if="!hasColorBreakdown">
            Cần có dữ liệu định mức màu chỉ
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

    <!-- Allocation Summary Dialog -->
    <AppDialog
      v-model="showAllocationSummary"
      persistent
      maximized
    >
      <template #header>
        Xác nhận tạo phiếu phân bổ
      </template>

      <div class="text-body2 text-grey-7 q-mb-md">
        Sẽ tạo {{ allocationCandidates.length }} phiếu phân bổ từ kết quả tính toán:
      </div>

      <DataTable
        :rows="allocationCandidates"
        :columns="allocationColumns"
        row-key="thread_type_id"
        dense
        hide-bottom
        :rows-per-page-options="[0]"
      />

      <template #actions>
        <AppButton
          v-close-popup
          flat
          label="Hủy"
          :disable="creatingAllocations"
        />
        <AppButton
          color="primary"
          icon="check"
          label="Xác nhận tạo"
          :loading="creatingAllocations"
          @click="confirmCreateAllocations"
        />
      </template>
    </AppDialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  useWeeklyOrder,
  useWeeklyOrderCalculation,
  usePurchaseOrders,
  useSnackbar,
} from '@/composables'
import { purchaseOrderService } from '@/services/purchaseOrderService'
import { allocationService } from '@/services/allocationService'
import { AllocationPriority } from '@/types/thread/enums'
import type { QTableColumn } from 'quasar'
import type { CreateAllocationDTO, PurchaseOrderWithItems } from '@/types/thread'
import POOrderCard from '@/components/thread/weekly-order/POOrderCard.vue'

definePage({
  meta: {
    requiresAuth: true,
    permissions: ['thread.view'],
  },
})

// Composables
const router = useRouter()
const snackbar = useSnackbar()
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
  calculationProgress,
  calculationErrors,
  canCalculate,
  hasResults,
  isResultsStale,
  addStyle,
  removeStyle,
  removePO,
  addColorToStyle,
  removeColorFromStyle,
  updateColorQuantity,
  calculateAll,
  clearAll,
  setFromWeekItems,
} = useWeeklyOrderCalculation()

const {
  purchaseOrders: poList,
  isLoading: posLoading,
  fetchPurchaseOrders,
} = usePurchaseOrders()

// Local state
const weekName = ref('')
const startDate = ref('')
const endDate = ref('')
const notes = ref('')
const selectedPOId = ref<number | null>(null)
const loadingPOId = ref<number | null>(null)
const loadedPOs = ref<PurchaseOrderWithItems[]>([])
const resultView = ref<'detail' | 'summary'>('summary')
const showHistory = ref(false)
const showAllocationSummary = ref(false)
const creatingAllocations = ref(false)

interface AllocationCandidate {
  order_id: string
  order_reference: string
  thread_type_id: number
  thread_type_name: string
  requested_meters: number
  process_name: string
  color_name: string
}
const allocationCandidates = ref<AllocationCandidate[]>([])

// Computed
const poOptions = computed(() =>
  poList.value
    .filter((po) => !loadedPOs.value.some((loaded) => loaded.id === po.id))
    .map((po) => ({
      label: `${po.po_number}${po.customer_name ? ` - ${po.customer_name}` : ''}`,
      value: po.id,
    }))
)

const canSave = computed(() => {
  return orderEntries.value.length > 0
})

const hasColorBreakdown = computed(() => {
  return perStyleResults.value.some((r) =>
    r.calculations.some((c) => c.color_breakdown && c.color_breakdown.length > 0)
  )
})

// Allocation columns
const allocationColumns: QTableColumn[] = [
  { name: 'order_id', label: 'Mã hàng', field: 'order_id', align: 'left' },
  { name: 'process_name', label: 'Công đoạn', field: 'process_name', align: 'left' },
  { name: 'color_name', label: 'Màu', field: 'color_name', align: 'left' },
  { name: 'thread_type_name', label: 'Loại chỉ', field: 'thread_type_name', align: 'left' },
  {
    name: 'requested_meters',
    label: 'Số mét',
    field: 'requested_meters',
    align: 'right',
    format: (val: number) => val.toFixed(2),
  },
]

// Handlers
const handleAddPO = async () => {
  if (!selectedPOId.value) return

  loadingPOId.value = selectedPOId.value
  try {
    const poWithItems = await purchaseOrderService.getWithItems(selectedPOId.value)
    loadedPOs.value.push(poWithItems)
    selectedPOId.value = null
  } catch (err) {
    snackbar.error('Không thể tải dữ liệu PO')
    console.error('[weekly-order] load PO error:', err)
  } finally {
    loadingPOId.value = null
  }
}

const handleRemovePO = (poId: number) => {
  loadedPOs.value = loadedPOs.value.filter((po) => po.id !== poId)
  removePO(poId)
}

const handleAddStyleFromPO = (
  style: { id: number; style_code: string; style_name: string; po_id: number; po_number: string },
) => {
  addStyle({
    id: style.id,
    style_code: style.style_code,
    style_name: style.style_name,
    po_id: style.po_id,
    po_number: style.po_number,
  })
}

const handleSave = async () => {
  if (!weekName.value) return

  const items = orderEntries.value.flatMap((entry) =>
    entry.colors
      .filter((c) => c.quantity > 0)
      .map((c) => ({
        po_id: entry.po_id,
        style_id: entry.style_id,
        color_id: c.color_id,
        quantity: c.quantity,
      }))
  )

  if (selectedWeek.value) {
    await updateWeek(selectedWeek.value.id, {
      week_name: weekName.value,
      start_date: startDate.value || undefined,
      end_date: endDate.value || undefined,
      notes: notes.value || undefined,
      items,
    })

    if (hasResults.value) {
      await saveResults(selectedWeek.value.id, perStyleResults.value, aggregatedResults.value)
    }
  } else {
    const created = await createWeek({
      week_name: weekName.value,
      start_date: startDate.value || undefined,
      end_date: endDate.value || undefined,
      notes: notes.value || undefined,
      items,
    })

    if (created && hasResults.value) {
      await saveResults(created.id, perStyleResults.value, aggregatedResults.value)
    }
  }
}

const handleLoadWeek = async (weekId: number) => {
  const week = await loadWeek(weekId)
  if (!week) return

  showHistory.value = false
  weekName.value = week.week_name
  startDate.value = week.start_date || ''
  endDate.value = week.end_date || ''
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
  } else {
    clearAll()
    loadedPOs.value = []
  }

  const savedResults = await loadResults(weekId)
  if (savedResults) {
    snackbar.info('Đã tải kết quả tính toán đã lưu')
  }
}

const handleCreateAllocations = () => {
  const candidates: AllocationCandidate[] = []

  for (const result of perStyleResults.value) {
    for (const calc of result.calculations) {
      if (calc.color_breakdown) {
        for (const cb of calc.color_breakdown) {
          candidates.push({
            order_id: result.style_code,
            order_reference: `${weekName.value} - ${result.style_name}`,
            thread_type_id: cb.thread_type_id,
            thread_type_name: cb.thread_type_name,
            requested_meters: cb.total_meters,
            process_name: calc.process_name,
            color_name: cb.color_name,
          })
        }
      }
    }
  }

  if (candidates.length === 0) {
    snackbar.warning('Không có dữ liệu màu chỉ để tạo phiếu phân bổ')
    return
  }

  allocationCandidates.value = candidates
  showAllocationSummary.value = true
}

const confirmCreateAllocations = async () => {
  creatingAllocations.value = true
  let successCount = 0
  let errorCount = 0

  try {
    for (const candidate of allocationCandidates.value) {
      try {
        const dto: CreateAllocationDTO = {
          order_id: candidate.order_id,
          order_reference: candidate.order_reference,
          thread_type_id: candidate.thread_type_id,
          requested_meters: candidate.requested_meters,
          priority: AllocationPriority.NORMAL,
          notes: `Đặt hàng tuần: ${weekName.value} - ${candidate.process_name} - ${candidate.color_name}`,
        }
        await allocationService.create(dto)
        successCount++
      } catch {
        errorCount++
      }
    }

    if (successCount > 0) {
      snackbar.success(
        `Đã tạo ${successCount} phiếu phân bổ thành công${errorCount > 0 ? `, ${errorCount} lỗi` : ''}`
      )
      showAllocationSummary.value = false
      router.push('/thread/allocations')
    } else {
      snackbar.error('Không thể tạo phiếu phân bổ. Vui lòng thử lại.')
    }
  } finally {
    creatingAllocations.value = false
  }
}

const handleExport = async () => {
  if (aggregatedResults.value.length === 0) {
    snackbar.warning('Chưa có dữ liệu để xuất')
    return
  }

  try {
    const ExcelJS = await import('exceljs')
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Đặt Hàng Chỉ')

    worksheet.columns = [
      { header: 'Loại chỉ', key: 'thread_type_name', width: 25 },
      { header: 'NCC', key: 'supplier_name', width: 20 },
      { header: 'Tex', key: 'tex_number', width: 10 },
      { header: 'Màu chỉ', key: 'thread_color', width: 15 },
      { header: 'Tổng mét', key: 'total_meters', width: 15 },
      { header: 'Tổng cuộn', key: 'total_cones', width: 12 },
      { header: 'Mét/cuộn', key: 'meters_per_cone', width: 12 },
    ]

    // Style header row
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1976D2' },
    }
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

    aggregatedResults.value.forEach((r) => {
      worksheet.addRow({
        thread_type_name: r.thread_type_name,
        supplier_name: r.supplier_name,
        tex_number: r.tex_number,
        thread_color: r.thread_color || '',
        total_meters: Number(r.total_meters.toFixed(2)),
        total_cones: r.total_cones,
        meters_per_cone: r.meters_per_cone || '',
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `dat-hang-chi-${weekName.value || 'tuan'}.xlsx`
    link.click()
    URL.revokeObjectURL(url)

    snackbar.success('Đã xuất file Excel')
  } catch (err) {
    snackbar.error('Không thể xuất file Excel')
    console.error('[weekly-order] export error:', err)
  }
}

// Lifecycle
onMounted(async () => {
  await Promise.all([fetchPurchaseOrders(), fetchWeeks()])
})
</script>
