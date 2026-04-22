<!--
  ConeReservedByWeekTable.vue
  Hiển thị tồn cuộn theo Kho × Tuần đặt hàng (chỉ tuần CONFIRMED).
  Note: dùng q-table thẳng (không qua DataTable wrapper) vì cần expand row pattern lồng nhau.
-->
<template>
  <div class="cone-reserved-by-week-table">
    <div class="text-subtitle1 q-mb-sm">
      <q-icon
        name="event_available"
        class="q-mr-xs"
      />
      Reserve theo tuần đặt hàng
    </div>

    <q-banner
      v-if="errorMessage"
      class="bg-red-1 text-red-9 q-mb-sm"
      rounded
      dense
    >
      <template #avatar>
        <q-icon
          name="error"
          color="negative"
        />
      </template>
      {{ errorMessage }}
      <template #action>
        <q-btn
          flat
          dense
          color="negative"
          label="Thử lại"
          :loading="loading"
          @click="reload"
        />
      </template>
    </q-banner>

    <q-table
      v-if="!errorMessage"
      :rows="warehouses"
      :columns="parentColumns"
      :loading="loading"
      row-key="warehouse_id"
      flat
      bordered
      dense
      :pagination="{ rowsPerPage: 0 }"
      hide-pagination
    >
      <template #body="props">
        <q-tr :props="props">
          <q-td auto-width>
            <q-btn
              size="sm"
              flat
              dense
              round
              :icon="isExpanded(props.row.warehouse_id) ? 'remove' : 'add'"
              @click="toggle(props.row.warehouse_id)"
            />
          </q-td>
          <q-td>
            <div class="row items-center no-wrap q-gutter-sm">
              <q-icon
                name="warehouse"
                size="sm"
                color="grey"
              />
              <div class="column">
                <span class="text-weight-medium">{{ props.row.warehouse_name }}</span>
                <span class="text-caption text-grey">{{ props.row.warehouse_code }}</span>
              </div>
            </div>
          </q-td>
          <q-td class="text-center">
            <q-badge
              color="positive"
              :label="formatNumber(props.row.available.full_cones)"
            />
          </q-td>
          <q-td class="text-center">
            <q-badge
              v-if="props.row.available.partial_cones > 0"
              color="warning"
              :label="formatNumber(props.row.available.partial_cones)"
            />
            <span
              v-else
              class="text-grey"
            >-</span>
          </q-td>
          <q-td class="text-right">
            <span v-if="props.row.available.partial_meters > 0">
              {{ formatNumber(Math.round(props.row.available.partial_meters)) }} m
            </span>
            <span
              v-else
              class="text-grey"
            >-</span>
          </q-td>
          <q-td class="text-center">
            <q-chip
              dense
              :color="props.row.weeks.length > 0 ? 'primary' : 'grey-4'"
              :text-color="props.row.weeks.length > 0 ? 'white' : 'grey-8'"
              :label="`${props.row.weeks.length} tuần`"
            />
          </q-td>
        </q-tr>

        <template v-if="isExpanded(props.row.warehouse_id)">
          <q-tr
            v-for="week in props.row.weeks"
            :key="`w-${props.row.warehouse_id}-${week.week_id}`"
            :props="props"
            class="bg-grey-2"
          >
            <q-td />
            <q-td>
              <span class="q-ml-md">{{ week.week_name }}</span>
            </q-td>
            <q-td class="text-center">
              <q-badge
                color="primary"
                label="CONFIRMED"
              />
            </q-td>
            <q-td class="text-center">
              {{ formatNumber(week.full_cones) }}
            </q-td>
            <q-td class="text-center">
              <span v-if="week.partial_cones > 0">{{ formatNumber(week.partial_cones) }}</span>
              <span
                v-else
                class="text-grey"
              >-</span>
            </q-td>
            <q-td class="text-right">
              <span v-if="week.partial_meters > 0">
                {{ formatNumber(Math.round(week.partial_meters)) }} m
              </span>
              <span
                v-else
                class="text-grey"
              >-</span>
            </q-td>
          </q-tr>

          <q-tr
            v-if="hasOtherReserved(props.row.other_reserved)"
            :props="props"
            class="bg-orange-1"
          >
            <q-td />
            <q-td colspan="2">
              <span class="q-ml-md text-italic text-orange-9">
                Reserve khác (không thuộc tuần CONFIRMED)
              </span>
            </q-td>
            <q-td class="text-center">
              {{ formatNumber(props.row.other_reserved.full_cones) }}
            </q-td>
            <q-td class="text-center">
              <span v-if="props.row.other_reserved.partial_cones > 0">
                {{ formatNumber(props.row.other_reserved.partial_cones) }}
              </span>
              <span
                v-else
                class="text-grey"
              >-</span>
            </q-td>
            <q-td class="text-right">
              <span v-if="props.row.other_reserved.partial_meters > 0">
                {{ formatNumber(Math.round(props.row.other_reserved.partial_meters)) }} m
              </span>
              <span
                v-else
                class="text-grey"
              >-</span>
            </q-td>
          </q-tr>
        </template>
      </template>

      <template #no-data>
        <div class="full-width column items-center q-pa-md text-grey">
          <q-icon
            name="inventory_2"
            size="36px"
            class="q-mb-sm"
          />
          <span>Không có dữ liệu reserve</span>
        </div>
      </template>

      <template #loading>
        <q-inner-loading
          showing
          color="primary"
        />
      </template>
    </q-table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { QTableColumn } from 'quasar'
import { useConeSummary } from '@/composables/thread/useConeSummary'
import type { ConeReservedAggregate, ConeReservedWarehouseEntry } from '@/types/thread'

interface Props {
  threadTypeId: number
  colorId?: number | null
  warehouseId?: number | null
}

const props = withDefaults(defineProps<Props>(), {
  colorId: null,
  warehouseId: null,
})

const { fetchReservedByWeek, reservedByWeekData, reservedByWeekError, reservedByWeekLoading } = useConeSummary()

const expandedIds = ref<Set<number>>(new Set())

const warehouses = computed<ConeReservedWarehouseEntry[]>(
  () => reservedByWeekData.value?.warehouses ?? []
)
const loading = computed(() => reservedByWeekLoading.value)
const errorMessage = computed(() => reservedByWeekError.value)

const parentColumns: QTableColumn[] = [
  { name: 'expand', label: '', field: () => '', align: 'left' },
  { name: 'warehouse', label: 'Kho', field: 'warehouse_name', align: 'left' },
  { name: 'available_full', label: 'Cuộn nguyên KD', field: () => '', align: 'center' },
  { name: 'available_partial', label: 'Cuộn lẻ KD', field: () => '', align: 'center' },
  { name: 'available_meters', label: 'Mét lẻ KD', field: () => '', align: 'right' },
  { name: 'weeks_count', label: 'Reserve', field: () => '', align: 'center' },
]

const isExpanded = (id: number) => expandedIds.value.has(id)

const toggle = (id: number) => {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id)
  } else {
    expandedIds.value.add(id)
  }
  expandedIds.value = new Set(expandedIds.value)
}

const hasOtherReserved = (a: ConeReservedAggregate): boolean =>
  a.full_cones > 0 || a.partial_cones > 0 || a.partial_meters > 0

const formatNumber = (n: number): string => new Intl.NumberFormat('vi-VN').format(n)

const reload = async (): Promise<void> => {
  await fetchReservedByWeek(props.threadTypeId, props.colorId, props.warehouseId)
}

onMounted(() => {
  void reload()
})

watch(
  () => [props.threadTypeId, props.colorId, props.warehouseId] as const,
  () => {
    void reload()
  }
)
</script>
