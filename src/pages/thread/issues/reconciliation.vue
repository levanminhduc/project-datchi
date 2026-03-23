<script setup lang="ts">
/**
 * Reconciliation Report Page
 * Báo cáo đối chiếu tiêu hao chỉ
 *
 * Shows consumption reconciliation with filtering and Excel export
 */
import { ref, onMounted } from 'vue'
import { useReconciliation } from '@/composables/thread/useReconciliation'
import { purchaseOrderService } from '@/services/purchaseOrderService'
import { styleService } from '@/services/styleService'
import ReconciliationTable from '@/components/thread/ReconciliationTable.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import DatePicker from '@/components/ui/pickers/DatePicker.vue'

const {
  rows,
  summary,
  isLoading,
  filters,
  hasData,
  fetchReport,
  exportExcel,
  updateFilters,
  clearFilters,
} = useReconciliation()

// Filter options
const poOptions = ref<{ value: number | ''; label: string }[]>([{ value: '', label: 'Tất cả' }])
const styleOptions = ref<{ value: number | ''; label: string }[]>([{ value: '', label: 'Tất cả' }])

// Load filter options
async function loadFilterOptions() {
  try {
    // Load POs
    const pos = await purchaseOrderService.getAll()
    poOptions.value = [
      { value: '', label: 'Tất cả' },
      ...pos.map((po: { id: number; po_number: string }) => ({
        value: po.id,
        label: po.po_number,
      })),
    ]

    // Load styles
    const styles = await styleService.getAll()
    styleOptions.value = [
      { value: '', label: 'Tất cả' },
      ...styles.map((s: { id: number; style_code: string }) => ({
        value: s.id,
        label: s.style_code,
      })),
    ]
  } catch (err) {
    console.error('Failed to load filter options:', err)
  }
}

// Handle filter changes
function handlePoChange(value: number | '') {
  updateFilters({ po_id: value || undefined })
}

function handleStyleChange(value: number | '') {
  updateFilters({ style_id: value || undefined })
}

function handleDateFromChange(value: string | null) {
  updateFilters({ date_from: value || undefined })
}

function handleDateToChange(value: string | null) {
  updateFilters({ date_to: value || undefined })
}

function handleClearFilters() {
  clearFilters()
}

onMounted(() => {
  loadFilterOptions()
  fetchReport()
})
</script>

<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <h5 class="q-ma-none">
        Đối Chiếu Tiêu Hao
      </h5>
      <div class="row q-gutter-sm">
        <AppButton
          label="Làm mới"
          icon="refresh"
          color="primary"
          outline
          :loading="isLoading"
          @click="fetchReport()"
        />
        <AppButton
          label="Xuất Excel"
          icon="download"
          color="primary"
          :disable="!hasData"
          :loading="isLoading"
          @click="exportExcel"
        />
      </div>
    </div>

    <!-- Filters -->
    <q-card
      flat
      bordered
      class="q-mb-md"
    >
      <q-card-section>
        <div class="row q-col-gutter-md items-end">
          <div class="col-12 col-sm-6 col-md-3">
            <AppSelect
              :model-value="filters.po_id || ''"
              :options="poOptions"
              label="PO"
              emit-value
              map-options
              use-input
              fill-input
              hide-selected
              @update:model-value="handlePoChange"
            />
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <AppSelect
              :model-value="filters.style_id || ''"
              :options="styleOptions"
              label="Mã hàng"
              emit-value
              map-options
              use-input
              fill-input
              hide-selected
              @update:model-value="handleStyleChange"
            />
          </div>
          <div class="col-12 col-sm-6 col-md-2">
            <DatePicker
              :model-value="filters.date_from || null"
              label="Từ ngày"
              clearable
              @update:model-value="handleDateFromChange"
            />
          </div>
          <div class="col-12 col-sm-6 col-md-2">
            <DatePicker
              :model-value="filters.date_to || null"
              label="Đến ngày"
              clearable
              @update:model-value="handleDateToChange"
            />
          </div>
          <div class="col-12 col-md-2">
            <AppButton
              label="Xóa bộ lọc"
              icon="clear"
              color="grey"
              outline
              class="full-width"
              @click="handleClearFilters"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Summary Cards -->
    <div
      v-if="summary"
      class="row q-col-gutter-md q-mb-md"
    >
      <div class="col-6 col-sm-4 col-md-2">
        <q-card
          flat
          bordered
        >
          <q-card-section class="text-center">
            <div class="text-caption text-grey-6">
              Tổng Định Mức
            </div>
            <div class="text-h6 text-primary">
              {{ summary.total_quota?.toLocaleString() }}
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-sm-4 col-md-2">
        <q-card
          flat
          bordered
        >
          <q-card-section class="text-center">
            <div class="text-caption text-grey-6">
              Tổng Đã Xuất
            </div>
            <div class="text-h6">
              {{ summary.total_issued?.toLocaleString() }}
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-sm-4 col-md-2">
        <q-card
          flat
          bordered
        >
          <q-card-section class="text-center">
            <div class="text-caption text-grey-6">
              Tổng Nhập Lại
            </div>
            <div class="text-h6">
              {{ summary.total_returned?.toLocaleString() }}
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-sm-4 col-md-2">
        <q-card
          flat
          bordered
        >
          <q-card-section class="text-center">
            <div class="text-caption text-grey-6">
              Tổng Tiêu Thụ
            </div>
            <div class="text-h6 text-negative">
              {{ summary.total_consumed?.toLocaleString() }}
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-sm-4 col-md-2">
        <q-card
          flat
          bordered
        >
          <q-card-section class="text-center">
            <div class="text-caption text-grey-6">
              Tỉ Lệ Tiêu Thụ
            </div>
            <div
              class="text-h6"
              :class="summary.overall_consumption_percentage > 100 ? 'text-negative' : 'text-positive'"
            >
              {{ summary.overall_consumption_percentage?.toFixed(1) }}%
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-sm-4 col-md-2">
        <q-card
          flat
          bordered
        >
          <q-card-section class="text-center">
            <div class="text-caption text-grey-6">
              Vượt Định Mức
            </div>
            <div
              class="text-h6"
              :class="summary.total_over_limit_count > 0 ? 'text-warning' : 'text-positive'"
            >
              {{ summary.total_over_limit_count }}
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Data Table -->
    <ReconciliationTable
      :rows="rows"
      :summary="summary"
      :loading="isLoading"
    />
  </q-page>
</template>
