<template>
  <q-table
    v-bind="$attrs"
    :rows="rows"
    :columns="columns"
    :loading="loading"
    :filter="filter"
    :row-key="(row: any) => `${row.thread_type_id}-${row.color_id ?? 'no-color'}`"
    :rows-per-page-options="[10, 25, 50, 0]"
    :pagination="{ rowsPerPage: 25 }"
    bordered
    flat
    dense
    class="cone-summary-table"
    @row-click="handleRowClick"
  >
    <!-- Header -->
    <template #top>
      <div class="row full-width items-center q-gutter-md">
        <div class="text-h6">
          Tổng hợp theo cuộn
        </div>

        <q-space />

        <!-- Search -->
        <q-input
          v-model="filter"
          dense
          outlined
          debounce="300"
          placeholder="Tìm kiếm..."
          class="col-auto"
          style="min-width: 200px"
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
          <template
            v-if="filter"
            #append
          >
            <q-icon
              name="close"
              class="cursor-pointer"
              @click="filter = ''"
            />
          </template>
        </q-input>

        <!-- Refresh -->
        <q-btn
          flat
          round
          dense
          icon="refresh"
          :loading="loading"
          @click="$emit('refresh')"
        >
          <q-tooltip>Làm mới</q-tooltip>
        </q-btn>
      </div>
    </template>

    <!-- Color column with color swatch -->
    <template #body-cell-color="props">
      <q-td :props="props">
        <div class="row items-center no-wrap q-gutter-sm">
          <div
            v-if="props.row.color_data?.hex_code"
            class="color-swatch"
            :style="{ backgroundColor: props.row.color_data.hex_code }"
          />
          <span>{{ props.row.color_data?.name || '-' }}</span>
        </div>
      </q-td>
    </template>

    <!-- Full cones column with badge -->
    <template #body-cell-full_cones="props">
      <q-td
        :props="props"
        class="text-center"
      >
        <q-badge
          :color="props.value > 0 ? 'positive' : 'grey'"
          :label="formatNumber(props.value)"
          class="q-pa-xs"
        />
      </q-td>
    </template>

    <!-- Partial cones column with badge -->
    <template #body-cell-partial_cones="props">
      <q-td
        :props="props"
        class="text-center"
      >
        <q-badge
          v-if="props.value > 0"
          color="warning"
          :label="formatNumber(props.value)"
          class="q-pa-xs"
        />
        <span
          v-else
          class="text-grey"
        >-</span>
      </q-td>
    </template>

    <!-- Total full cones column with badge -->
    <template #body-cell-total_full_cones="props">
      <q-td
        :props="props"
        class="text-center"
      >
        <q-badge
          :color="props.value > 0 ? 'blue-grey' : 'grey'"
          :label="formatNumber(props.value)"
          class="q-pa-xs"
        />
      </q-td>
    </template>

    <!-- Total partial cones column with badge -->
    <template #body-cell-total_partial_cones="props">
      <q-td
        :props="props"
        class="text-center"
      >
        <q-badge
          v-if="props.value > 0"
          color="blue-grey-4"
          :label="formatNumber(props.value)"
          class="q-pa-xs"
        />
        <span
          v-else
          class="text-grey"
        >-</span>
      </q-td>
    </template>

    <!-- Partial meters column -->
    <template #body-cell-partial_meters="props">
      <q-td
        :props="props"
        class="text-right"
      >
        <span v-if="props.value > 0">
          {{ formatNumber(Math.round(props.value)) }} m
        </span>
        <span
          v-else
          class="text-grey"
        >-</span>
      </q-td>
    </template>

    <!-- Partial weight column -->
    <template #body-cell-partial_weight_grams="props">
      <q-td
        :props="props"
        class="text-right"
      >
        <span v-if="props.value > 0">
          {{ formatNumber(Math.round(props.value)) }} g
        </span>
        <span
          v-else
          class="text-grey"
        >-</span>
      </q-td>
    </template>

    <!-- Action column -->
    <template #body-cell-actions="props">
      <q-td
        :props="props"
        auto-width
      >
        <q-btn
          flat
          round
          dense
          icon="visibility"
          color="primary"
          size="sm"
          @click.stop="$emit('show-breakdown', props.row)"
        >
          <q-tooltip>Xem phân bố kho</q-tooltip>
        </q-btn>
      </q-td>
    </template>

    <!-- Summary row at bottom -->
    <template #bottom-row>
      <q-tr class="bg-grey-2 text-weight-bold">
        <q-td
          colspan="3"
          class="text-right"
        >
          Tổng cộng:
        </q-td>
        <q-td class="text-center">
          <q-badge
            color="positive"
            :label="formatNumber(totalFullCones)"
          />
        </q-td>
        <q-td class="text-center">
          <q-badge
            v-if="totalPartialCones > 0"
            color="warning"
            :label="formatNumber(totalPartialCones)"
          />
          <span v-else>-</span>
        </q-td>
        <q-td class="text-center">
          <q-badge
            color="blue-grey"
            :label="formatNumber(grandTotalFullCones)"
          />
        </q-td>
        <q-td class="text-center">
          <q-badge
            v-if="grandTotalPartialCones > 0"
            color="blue-grey-4"
            :label="formatNumber(grandTotalPartialCones)"
          />
          <span v-else>-</span>
        </q-td>
        <q-td class="text-right">
          {{ formatNumber(Math.round(totalPartialMeters)) }} m
        </q-td>
        <q-td class="text-right">
          {{ formatNumber(Math.round(totalPartialWeight)) }} g
        </q-td>
        <q-td />
      </q-tr>
      <q-tr
        v-if="totalInventoryValue > 0"
        class="bg-blue-1 text-weight-bold"
      >
        <q-td
          colspan="10"
          class="text-right text-subtitle2"
        >
          <q-icon
            name="payments"
            size="xs"
            class="q-mr-xs"
          />
          Giá trị tồn kho (cuộn nguyên):
          <span class="text-primary q-ml-sm">
            {{ formatCurrency(totalInventoryValue) }} VND
          </span>
        </q-td>
      </q-tr>
    </template>

    <!-- No data -->
    <template #no-data>
      <div class="full-width column items-center q-pa-lg text-grey">
        <q-icon
          name="inventory_2"
          size="48px"
          class="q-mb-md"
        />
        <span>Không có dữ liệu tồn kho</span>
      </div>
    </template>
  </q-table>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { QTableColumn } from 'quasar'
import type { ConeSummaryRow } from '@/types/thread'

// Props
interface Props {
  rows: ConeSummaryRow[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

// Emits
const emit = defineEmits<{
  refresh: []
  'show-breakdown': [row: ConeSummaryRow]
  'row-click': [row: ConeSummaryRow]
}>()

// Local state
const filter = ref('')
const getTexDisplay = (row: ConeSummaryRow): string => row.tex_label || row.tex_number || '-'

const getDisplayName = (row: ConeSummaryRow): string => {
  const parts = [
    row.supplier_name || null,
    getTexDisplay(row) !== '-' ? `TEX ${getTexDisplay(row)}` : null,
    row.color_data?.name || null,
  ].filter(Boolean)
  return parts.join(' - ')
}

// Columns definition
const columns: QTableColumn[] = [
  {
    name: 'thread_name',
    label: 'Tên chỉ',
    field: (row: ConeSummaryRow) => getDisplayName(row),
    align: 'left',
    sortable: true,
  },
  {
    name: 'tex_number',
    label: 'Tex',
    field: (row: ConeSummaryRow) => getTexDisplay(row),
    align: 'center',
    sortable: true,
  },
  {
    name: 'color',
    label: 'Màu',
    field: (row: any) => row.color_data?.name || '-',
    align: 'left',
    sortable: true,
  },
  {
    name: 'full_cones',
    label: 'Cuộn nguyên',
    field: 'full_cones',
    align: 'center',
    sortable: true,
  },
  {
    name: 'partial_cones',
    label: 'Cuộn lẻ',
    field: 'partial_cones',
    align: 'center',
    sortable: true,
  },
  {
    name: 'total_full_cones',
    label: 'Tổng nguyên',
    field: 'total_full_cones',
    align: 'center',
    sortable: true,
  },
  {
    name: 'total_partial_cones',
    label: 'Tổng lẻ',
    field: 'total_partial_cones',
    align: 'center',
    sortable: true,
  },
  {
    name: 'partial_meters',
    label: 'Mét lẻ',
    field: 'partial_meters',
    align: 'right',
    sortable: true,
  },
  {
    name: 'partial_weight_grams',
    label: 'KL lẻ (g)',
    field: 'partial_weight_grams',
    align: 'right',
    sortable: true,
  },
  {
    name: 'actions',
    label: '',
    field: 'actions',
    align: 'center',
  },
]

// Computed totals
const totalFullCones = computed(() =>
  props.rows.reduce((sum, row) => sum + row.full_cones, 0)
)
const totalPartialCones = computed(() =>
  props.rows.reduce((sum, row) => sum + row.partial_cones, 0)
)
const totalPartialMeters = computed(() =>
  props.rows.reduce((sum, row) => sum + row.partial_meters, 0)
)
const totalPartialWeight = computed(() =>
  props.rows.reduce((sum, row) => sum + row.partial_weight_grams, 0)
)
const grandTotalFullCones = computed(() =>
  props.rows.reduce((sum, row) => sum + (row.total_full_cones ?? row.full_cones), 0)
)
const grandTotalPartialCones = computed(() =>
  props.rows.reduce((sum, row) => sum + (row.total_partial_cones ?? row.partial_cones), 0)
)
const totalInventoryValue = computed(() =>
  props.rows.reduce((sum, row) => {
    if (row.unit_price && row.full_cones > 0) {
      return sum + row.full_cones * row.unit_price
    }
    return sum
  }, 0)
)

// Methods
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('vi-VN').format(num)
}

const formatCurrency = (num: number): string => {
  return new Intl.NumberFormat('vi-VN').format(Math.round(num))
}

const handleRowClick = (_evt: Event, row: ConeSummaryRow) => {
  emit('row-click', row)
  emit('show-breakdown', row)
}
</script>

<style scoped>
.cone-summary-table :deep(tbody tr) {
  cursor: pointer;
}

.cone-summary-table :deep(tbody tr:hover) {
  background-color: rgba(0, 0, 0, 0.03);
}

.color-swatch {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.12);
}
</style>
