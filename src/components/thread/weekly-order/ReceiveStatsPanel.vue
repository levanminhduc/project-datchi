<template>
  <div>
    <div class="row q-col-gutter-sm items-start q-mb-md">
      <div
        v-for="field in dateFields"
        :key="field.key"
        class="col-12 col-sm-3"
      >
        <AppInput
          v-model="dates[field.key]"
          :label="field.label"
          placeholder="DD/MM/YYYY"
          :rules="[dateRules.date]"
          dense
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
                <DatePicker v-model="dates[field.key]" />
              </q-popup-proxy>
            </q-icon>
          </template>
        </AppInput>
      </div>
      <div class="col-12 col-sm-6 row q-gutter-sm items-center">
        <q-btn
          color="primary"
          icon="query_stats"
          label="Thống kê"
          outline
          :loading="loading"
          @click="loadStats"
        />
        <q-btn
          color="primary"
          icon="download"
          label="Xuất Excel"
          :loading="exporting"
          @click="onExport"
        />
      </div>
    </div>

    <!-- <div class="text-caption text-grey-7 q-mb-md">
      Tính theo ngày của từng đợt nhập kho, không tính các lần nhập đã hoàn tác. Thành tiền = số cuộn × đơn giá hiện tại của NCC.
    </div> -->

    <template v-if="stats">
      <div class="row q-col-gutter-sm q-mb-md">
        <div
          v-for="card in summaryCards"
          :key="card.label"
          class="col-6 col-md-3"
        >
          <q-card
            flat
            bordered
          >
            <q-card-section class="q-py-sm">
              <div class="text-caption text-grey-7">
                {{ card.label }}
              </div>
              <div :class="['text-h6 text-weight-bold', card.color]">
                {{ card.value }}
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <div class="row items-center q-mb-sm">
        <AppSelect
          v-model="groupBy"
          :options="groupOptions"
          label="Gom nhóm theo"
          emit-value
          map-options
          dense
          style="min-width: 220px"
        />
      </div>

      <q-table
        :rows="tableRows"
        :columns="tableColumns"
        row-key="key"
        flat
        bordered
        dense
        :pagination="{ rowsPerPage: 25 }"
        :rows-per-page-options="[25, 50, 100, 0]"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import type { QTableColumn } from 'quasar'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import DatePicker from '@/components/ui/pickers/DatePicker.vue'
import { deliveryService } from '@/services/deliveryService'
import { useSnackbar } from '@/composables/useSnackbar'
import { useReceiveStatsExport, formatIsoDate } from '@/composables/thread/useReceiveStatsExport'
import type { ReceiveStats, ReceiveStatsGroup, ReceiveStatsThreadGroup } from '@/types/thread'
import { formatTexWithLabel } from '@/utils/thread-format'
import { dateRules } from '@/utils'

type GroupKey = 'by_thread' | 'by_supplier' | 'by_warehouse' | 'by_date' | 'by_week'

const snackbar = useSnackbar()
const { exporting, exportStats } = useReceiveStatsExport()

const pad = (n: number) => String(n).padStart(2, '0')
const today = new Date()
const dates = reactive({
  from: `01/${pad(today.getMonth() + 1)}/${today.getFullYear()}`,
  to: `${pad(today.getDate())}/${pad(today.getMonth() + 1)}/${today.getFullYear()}`,
})
const dateFields = [
  { key: 'from' as const, label: 'Từ ngày *' },
  { key: 'to' as const, label: 'Đến ngày *' },
]

const loading = ref(false)
const stats = ref<ReceiveStats | null>(null)
const groupBy = ref<GroupKey>('by_thread')
const groupOptions = [
  { label: 'NCC + Tex + Màu', value: 'by_thread' },
  { label: 'Nhà cung cấp', value: 'by_supplier' },
  { label: 'Kho nhập', value: 'by_warehouse' },
  { label: 'Ngày nhập', value: 'by_date' },
  { label: 'Tuần đặt hàng', value: 'by_week' },
]

const vnd = (n: number) => n.toLocaleString('vi-VN')

const summaryCards = computed(() => {
  const s = stats.value?.summary
  if (!s) return []
  return [
    { label: 'Số lần nhập', value: vnd(s.receive_count), color: '' },
    { label: 'Tổng cuộn nhập', value: vnd(s.total_cones), color: 'text-primary' },
    { label: 'Thành tiền (VND)', value: vnd(s.total_amount), color: 'text-green-8' },
    { label: 'Cuộn chưa có giá', value: vnd(s.unpriced_cones), color: s.unpriced_cones > 0 ? 'text-orange-8' : '' },
  ]
})

const tableRows = computed<ReceiveStatsGroup[]>(() => stats.value?.[groupBy.value] ?? [])

const baseColumns: QTableColumn[] = [
  { name: 'receive_count', label: 'Số lần nhập', field: 'receive_count', align: 'center', sortable: true },
  { name: 'received_cones', label: 'Nhập trong kỳ', field: 'received_cones', align: 'center', sortable: true },
  { name: 'unpriced_cones', label: 'Cuộn chưa có giá', field: 'unpriced_cones', align: 'center', sortable: true },
  { name: 'amount', label: 'Thành tiền (VND)', field: 'amount', align: 'right', sortable: true, format: (v: number) => vnd(v) },
]

const tableColumns = computed<QTableColumn[]>(() => {
  if (groupBy.value !== 'by_thread') {
    const label = groupOptions.find(o => o.value === groupBy.value)?.label ?? ''
    const format = groupBy.value === 'by_date' ? (v: string) => formatIsoDate(v) : undefined
    return [{ name: 'label', label, field: 'label', align: 'left', sortable: true, format }, ...baseColumns]
  }
  return [
    { name: 'supplier_name', label: 'NCC', field: 'supplier_name', align: 'left', sortable: true },
    { name: 'tex', label: 'Tex', field: (r: ReceiveStatsThreadGroup) => formatTexWithLabel(r.tex_number, r.tex_label), align: 'center' },
    { name: 'color_name', label: 'Màu', field: 'color_name', align: 'left', sortable: true },
    ...baseColumns.filter(c => c.name !== 'unpriced_cones'),
    { name: 'unit_price', label: 'Đơn giá', field: 'unit_price', align: 'right', format: (v: number | null) => (v === null ? 'Chưa có giá' : vnd(v)) },
    { name: 'ordered_cones', label: 'Số đặt', field: 'ordered_cones', align: 'center' },
    { name: 'total_received', label: 'Tổng đã nhập', field: 'total_received', align: 'center' },
    { name: 'remaining_cones', label: 'Còn thiếu', field: 'remaining_cones', align: 'center', sortable: true },
  ]
})

function toIso(value: string): string | null {
  const [day, month, year] = (value || '').split('/')
  return day && month && year?.length === 4 ? `${year}-${month}-${day}` : null
}

function getRange(): { from: string; to: string } | null {
  const from = toIso(dates.from)
  const to = toIso(dates.to)
  if (!from || !to) {
    snackbar.error('Vui lòng chọn từ ngày và đến ngày')
    return null
  }
  if (from > to) {
    snackbar.error('Từ ngày phải nhỏ hơn hoặc bằng đến ngày')
    return null
  }
  return { from, to }
}

async function loadStats() {
  const range = getRange()
  if (!range) return
  loading.value = true
  try {
    stats.value = await deliveryService.getReceiveStats({ date_from: range.from, date_to: range.to })
  } catch (err) {
    snackbar.error('Lỗi tải thống kê: ' + (err instanceof Error ? err.message : 'Không xác định'))
  } finally {
    loading.value = false
  }
}

async function onExport() {
  const range = getRange()
  if (range) await exportStats(range.from, range.to)
}

onMounted(loadStats)
</script>
