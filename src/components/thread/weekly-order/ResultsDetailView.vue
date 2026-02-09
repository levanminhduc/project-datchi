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
import type { QTableColumn } from 'quasar'
import type { CalculationResult, CalculationItem } from '@/types/thread'
import type { StyleOrderEntry } from '@/types/thread/weeklyOrder'

const props = defineProps<{
  results: CalculationResult[]
  orderEntries?: StyleOrderEntry[]
}>()

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
]
</script>
