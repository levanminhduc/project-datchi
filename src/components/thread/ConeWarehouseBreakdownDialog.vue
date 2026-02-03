<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card class="column">
      <!-- Header -->
      <q-card-section class="row items-center q-pb-none">
        <div class="column">
          <div class="text-h6">
            Phân bố kho: {{ threadType?.thread_name }}
          </div>
          <div class="text-caption text-grey">
            {{ threadType?.thread_code }}
            <template v-if="threadType?.color">
              • {{ threadType.color }}
            </template>
            <template v-if="threadType?.tex_number">
              • Tex {{ threadType.tex_number }}
            </template>
          </div>
        </div>
        <q-space />
        <q-btn
          v-close-popup
          flat
          round
          dense
          icon="close"
        />
      </q-card-section>

      <!-- Summary cards -->
      <q-card-section class="row q-gutter-md q-py-sm">
        <q-card
          flat
          bordered
          class="col"
        >
          <q-card-section class="q-pa-sm text-center">
            <div class="text-h5 text-positive">
              {{ formatNumber(threadType?.full_cones || 0) }}
            </div>
            <div class="text-caption text-grey">
              Cuộn nguyên
            </div>
          </q-card-section>
        </q-card>

        <q-card
          flat
          bordered
          class="col"
        >
          <q-card-section class="q-pa-sm text-center">
            <div class="text-h5 text-warning">
              {{ formatNumber(threadType?.partial_cones || 0) }}
            </div>
            <div class="text-caption text-grey">
              Cuộn lẻ
            </div>
          </q-card-section>
        </q-card>

        <q-card
          flat
          bordered
          class="col"
        >
          <q-card-section class="q-pa-sm text-center">
            <div class="text-h5 text-primary">
              {{ formatNumber(Math.round(threadType?.partial_meters || 0)) }}
            </div>
            <div class="text-caption text-grey">
              Mét lẻ
            </div>
          </q-card-section>
        </q-card>

        <q-card
          flat
          bordered
          class="col"
        >
          <q-card-section class="q-pa-sm text-center">
            <div class="text-h5 text-secondary">
              {{ formatNumber(warehouseCount) }}
            </div>
            <div class="text-caption text-grey">
              Kho chứa
            </div>
          </q-card-section>
        </q-card>
      </q-card-section>

      <!-- Warehouse breakdown table -->
      <q-card-section class="col q-pt-none">
        <q-table
          :rows="breakdown"
          :columns="columns"
          :loading="loading"
          row-key="warehouse_id"
          flat
          bordered
          dense
          :pagination="{ rowsPerPage: 0 }"
          hide-pagination
          class="full-height"
        >
          <!-- Warehouse name with icon -->
          <template #body-cell-warehouse_name="props">
            <q-td :props="props">
              <div class="row items-center no-wrap q-gutter-sm">
                <q-icon
                  name="warehouse"
                  size="sm"
                  color="grey"
                />
                <div class="column">
                  <span class="text-weight-medium">
                    {{ props.row.warehouse_name }}
                  </span>
                  <span
                    v-if="props.row.location"
                    class="text-caption text-grey"
                  >
                    {{ props.row.location }}
                  </span>
                </div>
              </div>
            </q-td>
          </template>

          <!-- Full cones with badge -->
          <template #body-cell-full_cones="props">
            <q-td
              :props="props"
              class="text-center"
            >
              <q-badge
                :color="props.value > 0 ? 'positive' : 'grey'"
                :label="formatNumber(props.value)"
              />
            </q-td>
          </template>

          <!-- Partial cones with badge -->
          <template #body-cell-partial_cones="props">
            <q-td
              :props="props"
              class="text-center"
            >
              <q-badge
                v-if="props.value > 0"
                color="warning"
                :label="formatNumber(props.value)"
              />
              <span
                v-else
                class="text-grey"
              >-</span>
            </q-td>
          </template>

          <!-- Partial meters -->
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

          <!-- No data -->
          <template #no-data>
            <div class="full-width column items-center q-pa-lg text-grey">
              <q-icon
                name="inventory_2"
                size="48px"
                class="q-mb-md"
              />
              <span>Không có dữ liệu phân bố kho</span>
            </div>
          </template>

          <!-- Loading -->
          <template #loading>
            <q-inner-loading
              showing
              color="primary"
            />
          </template>
        </q-table>
      </q-card-section>

      <!-- Actions -->
      <q-card-actions
        align="right"
        class="q-pt-none"
      >
        <q-btn
          v-close-popup
          flat
          label="Đóng"
          color="primary"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { QTableColumn } from 'quasar'
import type { ConeSummaryRow, ConeWarehouseBreakdown } from '@/types/thread'

// Props
interface Props {
  modelValue: boolean
  threadType: ConeSummaryRow | null
  breakdown: ConeWarehouseBreakdown[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

// Emits
defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// Columns
const columns: QTableColumn[] = [
  {
    name: 'warehouse_code',
    label: 'Mã kho',
    field: 'warehouse_code',
    align: 'left',
    sortable: true,
    style: 'width: 100px',
  },
  {
    name: 'warehouse_name',
    label: 'Tên kho',
    field: 'warehouse_name',
    align: 'left',
    sortable: true,
  },
  {
    name: 'full_cones',
    label: 'Cuộn nguyên',
    field: 'full_cones',
    align: 'center',
    sortable: true,
    style: 'width: 120px',
  },
  {
    name: 'partial_cones',
    label: 'Cuộn lẻ',
    field: 'partial_cones',
    align: 'center',
    sortable: true,
    style: 'width: 100px',
  },
  {
    name: 'partial_meters',
    label: 'Mét lẻ',
    field: 'partial_meters',
    align: 'right',
    sortable: true,
    style: 'width: 120px',
  },
]

// Computed
const warehouseCount = computed(() => props.breakdown.length)

// Methods
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('vi-VN').format(num)
}
</script>

<style scoped>
.q-card {
  max-height: 100vh;
}
</style>
