<template>
  <q-page padding>
    <!-- Page Header -->
    <div class="row q-col-gutter-md q-mb-lg items-center">
      <div class="col-12 col-md-6">
        <h1 class="text-h5 q-my-none text-weight-bold text-primary">
          Tính Toán Định Mức Chỉ
        </h1>
        <p class="text-caption text-grey-7 q-mb-none">
          Tính toán nhu cầu chỉ theo mã hàng hoặc đơn hàng
        </p>
      </div>
    </div>

    <!-- Calculation Form Card -->
    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="row q-col-gutter-md items-end">
          <!-- Mode Toggle -->
          <div class="col-12 col-sm-6 col-md-3">
            <div class="text-caption text-grey-7 q-mb-xs">Phương thức tính</div>
            <q-btn-toggle
              v-model="calculationMode"
              spread
              no-caps
              unelevated
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
              <q-select
                v-model="selectedStyleId"
                :options="styleOptions"
                label="Mã hàng"
                outlined
                dense
                emit-value
                map-options
                :loading="stylesLoading"
                clearable
              >
                <template #no-option>
                  <q-item>
                    <q-item-section class="text-grey">Không có dữ liệu</q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
            <div class="col-12 col-sm-6 col-md-2">
              <q-input
                v-model.number="quantity"
                type="number"
                label="Số lượng"
                outlined
                dense
                :min="1"
              />
            </div>
          </template>

          <!-- PO Mode Input -->
          <template v-else>
            <div class="col-12 col-sm-6 col-md-4">
              <q-select
                v-model="selectedPOId"
                :options="poOptions"
                label="Đơn hàng (PO)"
                outlined
                dense
                emit-value
                map-options
                :loading="poLoading"
                clearable
              >
                <template #no-option>
                  <q-item>
                    <q-item-section class="text-grey">Không có dữ liệu</q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
          </template>

          <!-- Calculate Button -->
          <div class="col-12 col-sm-auto">
            <q-btn
              unelevated
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
    </q-card>

    <!-- Results Section for Style Mode -->
    <q-card v-if="calculationMode === 'style' && calculationResult" flat bordered class="q-mb-md">
      <q-card-section>
        <div class="row items-center q-mb-md">
          <div class="col">
            <div class="text-h6">{{ calculationResult.style_code }} - {{ calculationResult.style_name }}</div>
            <div class="text-caption text-grey-7">Số lượng: {{ calculationResult.total_quantity }} SP</div>
          </div>
        </div>

        <q-table
          flat
          bordered
          :rows="calculationResult.calculations"
          :columns="resultColumns"
          row-key="spec_id"
          hide-bottom
          :rows-per-page-options="[0]"
        />
      </q-card-section>

      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn
          unelevated
          color="primary"
          icon="add_circle"
          label="Tạo phiếu phân bổ"
          disable
        >
          <q-tooltip>Tính năng đang phát triển</q-tooltip>
        </q-btn>
      </q-card-actions>
    </q-card>

    <!-- Results Section for PO Mode -->
    <template v-if="calculationMode === 'po' && poCalculationResults.length > 0">
      <q-card
        v-for="poResult in poCalculationResults"
        :key="poResult.po_item_id"
        flat
        bordered
        class="q-mb-md"
      >
        <q-card-section>
          <div class="row items-center q-mb-md">
            <div class="col">
              <div class="text-h6">{{ poResult.style_code }} - {{ poResult.style_name }}</div>
              <div class="text-caption text-grey-7">Số lượng: {{ poResult.quantity }} SP</div>
            </div>
          </div>

          <q-table
            flat
            bordered
            :rows="poResult.calculations"
            :columns="resultColumns"
            row-key="spec_id"
            hide-bottom
            :rows-per-page-options="[0]"
          />
        </q-card-section>
      </q-card>

      <q-card flat bordered>
        <q-card-actions align="right" class="q-px-md q-py-md">
          <q-btn
            unelevated
            color="primary"
            icon="add_circle"
            label="Tạo phiếu phân bổ"
            disable
          >
            <q-tooltip>Tính năng đang phát triển</q-tooltip>
          </q-btn>
        </q-card-actions>
      </q-card>
    </template>

    <!-- Empty State -->
    <q-card v-if="!hasResults && !isLoading" flat bordered>
      <q-card-section class="text-center q-py-xl">
        <q-icon name="calculate" size="64px" color="grey-4" />
        <div class="text-h6 text-grey-6 q-mt-md">Chưa có kết quả</div>
        <div class="text-caption text-grey-5">
          Chọn mã hàng hoặc đơn hàng và nhấn "Tính toán"
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useStyles, usePurchaseOrders, useThreadCalculation } from '@/composables'
import type { QTableColumn } from 'quasar'

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

// Table columns
const resultColumns: QTableColumn[] = [
  { name: 'process_name', label: 'Công đoạn', field: 'process_name', align: 'left' },
  { name: 'supplier_name', label: 'NCC', field: 'supplier_name', align: 'left' },
  { name: 'tex_number', label: 'Tex', field: 'tex_number', align: 'left' },
  { name: 'meters_per_unit', label: 'Mét/SP', field: 'meters_per_unit', align: 'right', format: (val: number) => val.toFixed(2) },
  { name: 'total_meters', label: 'Tổng mét', field: 'total_meters', align: 'right', format: (val: number) => val.toFixed(2) },
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

// Lifecycle
onMounted(async () => {
  await Promise.all([fetchStyles(), fetchPurchaseOrders()])
})
</script>
