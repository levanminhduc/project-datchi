<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import type { ReconciliationRow, ReconciliationSummary } from '@/types/thread/reconciliation'

interface Props {
  rows: ReconciliationRow[]
  summary: ReconciliationSummary | null
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  loading: false
})

const formatNumber = (value: unknown): string => {
  const numberValue = Number(value ?? 0)
  if (!Number.isFinite(numberValue)) return '0'
  return numberValue.toLocaleString()
}

const formatPercent = (value: unknown): string => {
  const numberValue = Number(value ?? 0)
  if (!Number.isFinite(numberValue)) return '0.0%'
  return `${numberValue.toFixed(1)}%`
}

const columns: QTableColumn[] = [
  { name: 'po_number', label: 'PO', field: 'po_number', align: 'left', sortable: true },
  { name: 'style_code', label: 'Mã Hàng', field: 'style_code', align: 'left', sortable: true },
  { name: 'color_name', label: 'Màu', field: 'color_name', align: 'left', sortable: true },
  { name: 'thread_name', label: 'Loại Chỉ', field: 'thread_name', align: 'left', sortable: true },
  { name: 'quota_meters', label: 'Định Mức', field: 'quota_meters', align: 'right', sortable: true, format: formatNumber },
  { name: 'total_issued_meters', label: 'Đã Xuất', field: 'total_issued_meters', align: 'right', sortable: true, format: formatNumber },
  { name: 'total_returned_meters', label: 'Đã Nhập', field: 'total_returned_meters', align: 'right', sortable: true, format: formatNumber },
  { name: 'consumed_meters', label: 'Tiêu Thụ', field: 'consumed_meters', align: 'right', sortable: true, format: formatNumber },
  { name: 'consumption_percentage', label: '%', field: 'consumption_percentage', align: 'right', sortable: true, format: formatPercent },
  { name: 'over_limit_count', label: 'Vượt ĐM', field: 'over_limit_count', align: 'center', sortable: true },
]

const varianceColor = (row: ReconciliationRow) => {
  const variance = row.quota_meters - row.consumed_meters
  if (variance >= 0) return 'positive'
  return 'negative'
}
</script>

<template>
  <div class="reconciliation-table">
    <q-table
      :rows="rows"
      :columns="columns"
      row-key="po_id"
      :loading="loading"
      flat
      bordered
      :pagination="{ rowsPerPage: 20 }"
    >
      <template #body-cell-consumption_percentage="props">
        <q-td :props="props">
          <q-badge :color="varianceColor(props.row)">
            {{ props.value }}
          </q-badge>
        </q-td>
      </template>

      <template #body-cell-over_limit_count="props">
        <q-td :props="props">
          <q-badge
            v-if="props.value > 0"
            color="warning"
            text-color="dark"
          >
            {{ props.value }}
          </q-badge>
          <span v-else>-</span>
        </q-td>
      </template>

      <template
        v-if="summary"
        #bottom-row
      >
        <q-tr class="bg-grey-2 text-weight-bold">
          <q-td colspan="4">
            TỔNG CỘNG
          </q-td>
          <q-td class="text-right">
            {{ formatNumber(summary.total_quota) }}
          </q-td>
          <q-td class="text-right">
            {{ formatNumber(summary.total_issued) }}
          </q-td>
          <q-td class="text-right">
            {{ formatNumber(summary.total_returned) }}
          </q-td>
          <q-td class="text-right">
            {{ formatNumber(summary.total_consumed) }}
          </q-td>
          <q-td class="text-right">
            {{ formatPercent(summary.overall_consumption_percentage) }}
          </q-td>
          <q-td class="text-center">
            {{ summary.total_over_limit_count }}
          </q-td>
        </q-tr>
      </template>

      <template #no-data>
        <div class="text-center q-pa-lg text-grey">
          Không có dữ liệu
        </div>
      </template>
    </q-table>
  </div>
</template>
