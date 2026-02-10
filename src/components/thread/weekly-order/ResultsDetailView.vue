<template>
  <div>
    <AppCard
      v-for="result in results"
      :key="result.style_id"
      flat
      bordered
      class="q-mb-sm"
    >
      <q-card-section>
        <!-- Header: PO - Mã Hàng - Màu Hàng -->
        <div class="row items-center q-mb-sm">
          <div class="col">
            <span
              v-if="getPoNumbers(result.style_id)"
              class="text-caption text-primary q-mr-sm"
            >{{ getPoNumbers(result.style_id) }} —</span>
            <span class="text-weight-medium">{{ result.style_code }}</span>
            <span class="text-grey-7 q-ml-sm">{{ result.style_name }}</span>
            <template v-if="getColorNames(result.style_id).length > 0">
              <span class="text-grey-5 q-mx-xs">|</span>
              <template
                v-for="(color, idx) in getColorNames(result.style_id)"
                :key="color.color_id"
              >
                <span
                  v-if="idx > 0"
                  class="text-grey-5 q-mx-xs"
                >-</span>
                <AppBadge
                  :style="{ backgroundColor: color.hex_code || '#999' }"
                  :class="color.hex_code && isLightColor(color.hex_code) ? 'text-dark' : 'text-white'"
                  :label="color.color_name"
                />
              </template>
            </template>
          </div>
          <AppChip
            color="primary"
            text-color="white"
            dense
            :label="`${result.total_quantity} SP`"
          />
        </div>

        <q-table
          :rows="result.calculations"
          :columns="columns"
          row-key="spec_id"
          flat
          bordered
          dense
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
          <template #body-cell-delivery_date="props">
            <q-td :props="props">
              <!-- No delivery date -->
              <span
                v-if="!getEffectiveDate(props.row)"
                class="text-grey-5"
              >—</span>

              <!-- Editable: before save OR admin/root after save -->
              <template v-else-if="canEditDeliveryDate">
                <span class="cursor-pointer text-primary">
                  {{ formatDateDisplay(getEffectiveDate(props.row)!) }}
                  <q-icon
                    name="edit_calendar"
                    size="xs"
                    class="q-ml-xs"
                  />
                  <q-popup-proxy
                    cover
                    transition-show="scale"
                    transition-hide="scale"
                  >
                    <DatePicker
                      :model-value="formatDateDisplay(getEffectiveDate(props.row)!)"
                      @update:model-value="(val: string | null) => onDeliveryDateChange(props.row.spec_id, val)"
                    />
                  </q-popup-proxy>
                </span>
              </template>

              <!-- Read-only countdown: after save, regular user -->
              <template v-else>
                <span :class="countdownClass(getEffectiveDate(props.row)!)">
                  {{ formatCountdown(getEffectiveDate(props.row)!) }}
                </span>
                <AppTooltip>
                  {{ formatDateDisplay(getEffectiveDate(props.row)!) }}
                </AppTooltip>
              </template>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </AppCard>

    <EmptyState
      v-if="results.length === 0"
      icon="info"
      title="Chưa có kết quả"
      subtitle="Nhấn 'Tính toán' để xem chi tiết theo mã hàng"
      icon-color="grey-4"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { QTableColumn } from 'quasar'
import type { CalculationResult, CalculationItem } from '@/types/thread'
import type { StyleOrderEntry } from '@/types/thread/weeklyOrder'
import DatePicker from '@/components/ui/pickers/DatePicker.vue'
import { useAuth } from '@/composables/useAuth'

const props = defineProps<{
  results: CalculationResult[]
  orderEntries?: StyleOrderEntry[]
  isSaved?: boolean
}>()

const emit = defineEmits<{
  'update:delivery-date': [specId: number, date: string]
}>()

const { isAdmin, checkIsRoot } = useAuth()

const canEditDeliveryDate = computed(() => {
  if (!props.isSaved) return true
  return checkIsRoot() || isAdmin()
})

// Date conversion: YYYY-MM-DD ↔ DD/MM/YYYY
function formatDateDisplay(isoDate: string): string {
  if (!isoDate) return ''
  const [y, m, d] = isoDate.split('-')
  return `${d}/${m}/${y}`
}

function toIso(displayDate: string): string {
  if (!displayDate) return ''
  const [d, m, y] = displayDate.split('/')
  return `${y}-${m}-${d}`
}

function getEffectiveDate(row: CalculationItem): string | null {
  return row.delivery_date ?? null
}

function onDeliveryDateChange(specId: number, val: string | null) {
  if (!val) return
  const isoDate = toIso(val)
  emit('update:delivery-date', specId, isoDate)
}

// Countdown logic
function formatCountdown(isoDate: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const delivery = new Date(isoDate)
  delivery.setHours(0, 0, 0, 0)
  const diffMs = delivery.getTime() - today.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays > 0) return `còn ${diffDays} Ngày`
  return 'Đã đến hạn Giao'
}

function countdownClass(isoDate: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const delivery = new Date(isoDate)
  delivery.setHours(0, 0, 0, 0)
  const diffMs = delivery.getTime() - today.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return 'text-negative text-weight-bold'
  if (diffDays <= 3) return 'text-warning text-weight-medium'
  return 'text-positive'
}

function isLightColor(hex: string): boolean {
  const color = hex.replace('#', '')
  const r = parseInt(color.substring(0, 2), 16)
  const g = parseInt(color.substring(2, 4), 16)
  const b = parseInt(color.substring(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 155
}

function getPoNumbers(styleId: number): string {
  if (!props.orderEntries) return ''
  const entries = props.orderEntries.filter((e) => e.style_id === styleId && e.po_number)
  const uniquePos = [...new Set(entries.map((e) => e.po_number))].filter(Boolean)
  return uniquePos.join(', ')
}

function getColorNames(styleId: number): Array<{ color_id: number; color_name: string; hex_code: string }> {
  if (!props.orderEntries) return []
  const entries = props.orderEntries.filter((e) => e.style_id === styleId)
  const colorMap = new Map<number, { color_id: number; color_name: string; hex_code: string }>()
  for (const entry of entries) {
    for (const c of entry.colors) {
      if (!colorMap.has(c.color_id)) {
        colorMap.set(c.color_id, { color_id: c.color_id, color_name: c.color_name, hex_code: c.hex_code })
      }
    }
  }
  return Array.from(colorMap.values())
}

const columns: QTableColumn[] = [
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
  {
    name: 'delivery_date',
    label: 'Ngày giao',
    field: 'delivery_date',
    align: 'center',
  },
]
</script>
