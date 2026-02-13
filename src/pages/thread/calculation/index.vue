<template>
  <q-page padding>
    <!-- Page Header -->
    <PageHeader
      title="Tính Toán Định Mức Chỉ"
      subtitle="Tính toán nhu cầu chỉ theo mã hàng hoặc đơn hàng"
    />

    <!-- Calculation Form Card -->
    <AppCard
      flat
      bordered
      class="q-mb-lg"
    >
      <q-card-section>
        <div class="row q-col-gutter-md items-end">
          <!-- Mode Toggle -->
          <div class="col-12 col-sm-6 col-md-3">
            <div class="text-caption text-grey-7 q-mb-xs">
              Phương thức tính
            </div>
            <ButtonToggle
              v-model="calculationMode"
              spread
              color="grey-4"
              toggle-color="primary"
              :options="[
                { label: 'Theo mã hàng', value: 'style' },
                { label: 'Theo đơn hàng', value: 'po' }
              ]"
              @update:model-value="clearResults"
            />
          </div>

          <!-- Style Mode Inputs -->
          <template v-if="calculationMode === 'style'">
            <div class="col-12 col-sm-6 col-md-4">
              <AppSelect
                v-model="selectedStyleId"
                :options="styleOptions"
                label="Mã hàng"
                dense
                hide-bottom-space
                :loading="stylesLoading"
                clearable
                use-input
                fill-input
                hide-selected
              >
                <template #no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      Không có dữ liệu
                    </q-item-section>
                  </q-item>
                </template>
              </AppSelect>
            </div>
            <div class="col-12 col-sm-6 col-md-2">
              <AppInput
                v-model.number="quantity"
                type="number"
                label="Số lượng"
                dense
                hide-bottom-space
                :min="1"
              />
            </div>
          </template>

          <!-- PO Mode Input -->
          <template v-else>
            <div class="col-12 col-sm-6 col-md-4">
              <AppSelect
                v-model="selectedPOId"
                :options="poOptions"
                label="Đơn hàng (PO)"
                dense
                hide-bottom-space
                :loading="poLoading"
                clearable
                use-input
                fill-input
                hide-selected
              >
                <template #no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      Không có dữ liệu
                    </q-item-section>
                  </q-item>
                </template>
              </AppSelect>
            </div>
          </template>

          <!-- Calculate Button -->
          <div class="col-12 col-sm-auto">
            <AppButton
              color="primary"
              icon="calculate"
              label="Tính toán"
              :loading="isLoading"
              :disable="!canCalculate"
              @click="handleCalculate"
            />
          </div>
        </div>
      </q-card-section>
    </AppCard>

    <!-- Results Section for Style Mode -->
    <AppCard
      v-if="calculationMode === 'style' && calculationResult"
      flat
      bordered
      class="q-mb-md"
    >
      <q-card-section>
        <div class="row items-center q-mb-md">
          <div class="col">
            <div class="text-h6">
              {{ calculationResult.style_code }} - {{ calculationResult.style_name }}
            </div>
            <div class="text-caption text-grey-7">
              Số lượng: {{ calculationResult.total_quantity }} SP
            </div>
          </div>
        </div>

        <DataTable
          :rows="calculationResult.calculations"
          :columns="resultColumns"
          row-key="spec_id"
          hide-bottom
          :rows-per-page-options="[0]"
        >
          <template #body-cell-total_cones="props">
            <q-td :props="props">
              <span>{{ props.value }}</span>
              <AppTooltip v-if="props.row.meters_per_cone">
                {{ props.row.total_meters.toFixed(2) }} mét ÷ {{ props.row.meters_per_cone }} m/cuộn
              </AppTooltip>
            </q-td>
          </template>
          <template #body-cell-thread_color="props">
            <q-td :props="props">
              <AppBadge
                v-if="props.row.thread_color"
                :style="{ backgroundColor: props.row.thread_color_code || '#999' }"
                :class="props.row.thread_color_code && isLightColor(props.row.thread_color_code) ? 'text-dark' : 'text-white'"
                :label="props.row.thread_color"
              />
              <span
                v-else
                class="text-grey-5"
              >—</span>
            </q-td>
          </template>
        </DataTable>
      </q-card-section>

      <q-card-actions
        align="right"
        class="q-px-md q-pb-md"
      >
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
      </q-card-actions>
    </AppCard>

    <!-- Results Section for PO Mode -->
    <template v-if="calculationMode === 'po' && poCalculationResults.length > 0">
      <AppCard
        v-for="poResult in poCalculationResults"
        :key="poResult.po_item_id"
        flat
        bordered
        class="q-mb-md"
      >
        <q-card-section>
          <div class="row items-center q-mb-md">
            <div class="col">
              <div class="text-h6">
                {{ poResult.style_code }} - {{ poResult.style_name }}
              </div>
              <div class="text-caption text-grey-7">
                Số lượng: {{ poResult.quantity }} SP
              </div>
            </div>
          </div>

          <DataTable
            :rows="poResult.calculations"
            :columns="resultColumns"
            row-key="spec_id"
            hide-bottom
            :rows-per-page-options="[0]"
          >
            <template #body-cell-total_cones="props">
              <q-td :props="props">
                <span>{{ props.value }}</span>
                <AppTooltip v-if="props.row.meters_per_cone">
                  {{ props.row.total_meters.toFixed(2) }} mét ÷ {{ props.row.meters_per_cone }} m/cuộn
                </AppTooltip>
              </q-td>
            </template>
            <template #body-cell-thread_color="props">
              <q-td :props="props">
                <AppBadge
                  v-if="props.row.thread_color"
                  :style="{ backgroundColor: props.row.thread_color_code || '#999' }"
                  :class="props.row.thread_color_code && isLightColor(props.row.thread_color_code) ? 'text-dark' : 'text-white'"
                  :label="props.row.thread_color"
                />
                <span
                  v-else
                  class="text-grey-5"
                >—</span>
              </q-td>
            </template>
          </DataTable>
        </q-card-section>
      </AppCard>

      <AppCard
        flat
        bordered
      >
        <q-card-actions
          align="right"
          class="q-px-md q-py-md"
        >
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
        </q-card-actions>
      </AppCard>
    </template>

    <!-- Empty State -->
    <AppCard
      v-if="!hasResults && !isLoading"
      flat
      bordered
    >
      <EmptyState
        icon="calculate"
        title="Chưa có kết quả"
        subtitle="Chọn mã hàng hoặc đơn hàng và nhấn &quot;Tính toán&quot;"
        icon-color="grey-4"
      />
    </AppCard>

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
        :columns="summaryColumns"
        row-key="thread_type_id"
        hide-bottom
        :rows-per-page-options="[0]"
      />

      <template #actions>
        <AppButton
          v-close-popup
          variant="flat"
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
import { useStyles, usePurchaseOrders, useThreadCalculation } from '@/composables'
import type { QTableColumn } from 'quasar'
import { useRouter } from 'vue-router'
import { useSnackbar } from '@/composables'
import { allocationService } from '@/services/allocationService'
import { AllocationPriority } from '@/types/thread/enums'
import type { CreateAllocationDTO, CalculationItem } from '@/types/thread'

definePage({
  meta: {
    requiresAuth: true,
  }
})

// Composables
const { styles, isLoading: stylesLoading, fetchStyles } = useStyles()
const { purchaseOrders, isLoading: poLoading, fetchPurchaseOrders } = usePurchaseOrders()
const {
  calculationResult,
  poCalculationResults,
  isLoading,
  hasResults,
  calculate,
  calculateByPO,
  clearResults
} = useThreadCalculation()

// State
const calculationMode = ref<'style' | 'po'>('style')
const selectedStyleId = ref<number | null>(null)
const quantity = ref<number>(100)
const selectedPOId = ref<number | null>(null)
const router = useRouter()
const snackbar = useSnackbar()
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

// Helper: determine if a hex color is light (for text contrast)
function isLightColor(hex: string): boolean {
  const color = hex.replace('#', '')
  const r = parseInt(color.substring(0, 2), 16)
  const g = parseInt(color.substring(2, 4), 16)
  const b = parseInt(color.substring(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 155
}

// Computed options
const styleOptions = computed(() =>
  styles.value.map(s => ({ label: `${s.style_code} - ${s.style_name}`, value: s.id }))
)
const poOptions = computed(() =>
  purchaseOrders.value.map(po => ({ label: po.po_number, value: po.id }))
)

// Validation
const canCalculate = computed(() => {
  if (calculationMode.value === 'style') {
    return selectedStyleId.value !== null && quantity.value > 0
  }
  return selectedPOId.value !== null
})

const hasColorBreakdown = computed(() => {
  if (calculationMode.value === 'style' && calculationResult.value) {
    return calculationResult.value.calculations.some(c => c.color_breakdown && c.color_breakdown.length > 0)
  }
  if (calculationMode.value === 'po') {
    return poCalculationResults.value.some(r => r.calculations.some(c => c.color_breakdown && c.color_breakdown.length > 0))
  }
  return false
})

// Table columns
const resultColumns: QTableColumn[] = [
  { name: 'process_name', label: 'Công đoạn', field: 'process_name', align: 'left' },
  { name: 'supplier_name', label: 'NCC', field: 'supplier_name', align: 'left' },
  { name: 'tex_number', label: 'Tex', field: 'tex_number', align: 'left' },
  { name: 'meters_per_unit', label: 'Mét/SP', field: 'meters_per_unit', align: 'right', format: (val: number) => val.toFixed(2) },
  {
    name: 'total_cones',
    label: 'Tổng cuộn',
    field: (row) => {
      const r = row as CalculationItem
      if (!r.meters_per_cone || r.meters_per_cone <= 0) return null
      return Math.ceil(r.total_meters / r.meters_per_cone)
    },
    align: 'right',
    format: (val) => (val !== null && val !== undefined) ? Number(val).toLocaleString('vi-VN') : '—',
  },
  { name: 'thread_color', label: 'Màu chỉ', field: 'thread_color', align: 'center' },
]

const summaryColumns: QTableColumn[] = [
  { name: 'order_id', label: 'Mã đơn', field: 'order_id', align: 'left' },
  { name: 'process_name', label: 'Công đoạn', field: 'process_name', align: 'left' },
  { name: 'color_name', label: 'Màu', field: 'color_name', align: 'left' },
  { name: 'thread_type_name', label: 'Loại chỉ', field: 'thread_type_name', align: 'left' },
  { name: 'requested_meters', label: 'Số mét', field: 'requested_meters', align: 'right', format: (val: number) => val.toFixed(2) },
]

// Handlers
const handleCalculate = async () => {
  clearResults()
  if (calculationMode.value === 'style') {
    if (!selectedStyleId.value || quantity.value <= 0) return
    await calculate({ style_id: selectedStyleId.value, quantity: quantity.value })
  } else {
    if (!selectedPOId.value) return
    await calculateByPO({ po_id: selectedPOId.value })
  }
}

const handleCreateAllocations = () => {
  const candidates: AllocationCandidate[] = []

  if (calculationMode.value === 'style' && calculationResult.value) {
    const result = calculationResult.value
    for (const calc of result.calculations) {
      if (calc.color_breakdown) {
        for (const cb of calc.color_breakdown) {
          candidates.push({
            order_id: result.style_code,
            order_reference: result.style_name,
            thread_type_id: cb.thread_type_id,
            thread_type_name: cb.thread_type_name,
            requested_meters: cb.total_meters,
            process_name: calc.process_name,
            color_name: cb.color_name,
          })
        }
      }
    }
  } else if (calculationMode.value === 'po') {
    const selectedPO = purchaseOrders.value.find(po => po.id === selectedPOId.value)
    for (const poResult of poCalculationResults.value) {
      for (const calc of poResult.calculations) {
        if (calc.color_breakdown) {
          for (const cb of calc.color_breakdown) {
            candidates.push({
              order_id: poResult.style_code,
              order_reference: `${selectedPO?.po_number || ''} - ${poResult.style_name}`,
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
          notes: `Tạo từ tính toán định mức - ${candidate.process_name} - ${candidate.color_name}`,
        }
        await allocationService.create(dto)
        successCount++
      } catch {
        errorCount++
      }
    }

    if (successCount > 0) {
      snackbar.success(`Đã tạo ${successCount} phiếu phân bổ thành công${errorCount > 0 ? `, ${errorCount} lỗi` : ''}`)
      showAllocationSummary.value = false
      router.push('/thread/allocations')
    } else {
      snackbar.error('Không thể tạo phiếu phân bổ. Vui lòng thử lại.')
    }
  } finally {
    creatingAllocations.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await Promise.all([fetchStyles(), fetchPurchaseOrders()])
})
</script>
