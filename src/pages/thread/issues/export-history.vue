<template>
  <q-page padding>
    <div class="row q-mb-md">
      <div class="col">
        <h1 class="text-h5 q-my-none">
          Lịch Sử Xuất Chỉ
        </h1>
      </div>
    </div>

    <q-card
      flat
      bordered
    >
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-4">
            <AppInput
              v-model="filters.from_date_display"
              label="Từ ngày *"
              placeholder="DD/MM/YYYY"
              :rules="[dateRules.date]"
              dense
              clearable
              hide-bottom-space
            >
              <template #append>
                <q-icon
                  name="event"
                  class="cursor-pointer"
                >
                  <q-popup-proxy
                    cover
                    transition-show="scale"
                    transition-hide="scale"
                  >
                    <DatePicker v-model="filters.from_date_display" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </AppInput>
          </div>

          <div class="col-12 col-sm-4">
            <AppInput
              v-model="filters.to_date_display"
              label="Đến ngày *"
              placeholder="DD/MM/YYYY"
              :rules="[dateRules.date]"
              dense
              clearable
              hide-bottom-space
            >
              <template #append>
                <q-icon
                  name="event"
                  class="cursor-pointer"
                >
                  <q-popup-proxy
                    cover
                    transition-show="scale"
                    transition-hide="scale"
                  >
                    <DatePicker v-model="filters.to_date_display" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </AppInput>
          </div>

          <div class="col-12 col-sm-4">
            <AppWarehouseSelect
              v-model="filters.warehouse_id"
              label="Kho"
              clearable
              dense
              hint="Bỏ trống = tất cả kho"
            />
          </div>
        </div>

        <div class="row q-mt-md">
          <div class="col-12">
            <AppToggle
              v-model="filters.mode"
              true-value="detailed"
              false-value="summary"
              label="Chi tiết theo Bộ phận & Mã hàng"
            />
          </div>
        </div>

        <div class="row q-mt-md">
          <div class="col text-right">
            <AppButton
              color="primary"
              icon="download"
              label="Xuất Excel"
              :loading="isLoading || isExporting"
              :disable="!canExport"
              @click="onExport"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { format } from 'date-fns'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppToggle from '@/components/ui/inputs/AppToggle.vue'
import AppWarehouseSelect from '@/components/ui/inputs/AppWarehouseSelect.vue'
import DatePicker from '@/components/ui/pickers/DatePicker.vue'
import { useAuth } from '@/composables/useAuth'
import { useSnackbar } from '@/composables/useSnackbar'
import { useIssueExportHistory } from '@/composables/thread/useIssueExportHistory'
import { useIssueExportHistoryExport } from '@/composables/thread/useIssueExportHistoryExport'
import { warehouseService } from '@/services/warehouseService'
import type { IssueExportHistoryMeta } from '@/types/thread/issueExportHistory'
import { getErrorMessage } from '@/utils/errorMessages'
import { dateRules } from '@/utils'

definePage({
  meta: {
    requiresAuth: true,
    permissions: ['thread.issues.export-history'],
  },
})

const { filters, isLoading, fetchHistory, toApiFilters } = useIssueExportHistory()
const { exportFile } = useIssueExportHistoryExport()
const { employee } = useAuth()
const snackbar = useSnackbar()

const isExporting = ref(false)
const warehouseNameCache = ref<Map<number, string>>(new Map())

const canExport = computed(() => {
  const apiFilters = toApiFilters()
  return (
    !!apiFilters.from_date &&
    !!apiFilters.to_date &&
    apiFilters.from_date <= apiFilters.to_date
  )
})

async function ensureWarehouseCache() {
  if (warehouseNameCache.value.size > 0) return

  const warehouses = await warehouseService.getAll()
  warehouseNameCache.value = new Map(
    warehouses.map((warehouse) => [warehouse.id, warehouse.name]),
  )
}

function generateReportNumber(): string {
  return `LSXC-${format(new Date(), 'yyyyMMdd-HHmm')}`
}

async function getWarehouseName(): Promise<string> {
  if (!filters.warehouse_id) return 'Tất cả'

  await ensureWarehouseCache()
  return warehouseNameCache.value.get(filters.warehouse_id) || 'Không xác định'
}

async function onExport() {
  const apiFilters = toApiFilters()

  if (!apiFilters.from_date || !apiFilters.to_date) {
    snackbar.error('Vui lòng chọn từ ngày và đến ngày')
    return
  }

  if (apiFilters.from_date > apiFilters.to_date) {
    snackbar.error('Từ ngày phải nhỏ hơn hoặc bằng đến ngày')
    return
  }

  if (!employee.value) {
    snackbar.error('Không lấy được thông tin người dùng')
    return
  }

  isExporting.value = true
  try {
    const rows = await fetchHistory()
    if (rows.length === 0) {
      snackbar.warning('Không có dữ liệu trong khoảng thời gian này')
      return
    }

    const meta: IssueExportHistoryMeta = {
      from_date: apiFilters.from_date,
      to_date: apiFilters.to_date,
      warehouse_name: await getWarehouseName(),
      report_number: generateReportNumber(),
      full_name: employee.value.fullName,
      mode: filters.mode,
    }

    await exportFile(rows, meta)
    snackbar.success('Đã xuất báo cáo')
  } catch (error) {
    snackbar.error(getErrorMessage(error, 'Không thể xuất báo cáo'))
  } finally {
    isExporting.value = false
  }
}
</script>
