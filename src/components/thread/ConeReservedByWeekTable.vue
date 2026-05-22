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
          <template v-if="props.row.weeks.length > 0">
            <q-tr
              :key="`title-weeks-${props.row.warehouse_id}`"
              :props="props"
              class="bg-blue-2"
            >
              <q-td
                colspan="6"
                class="text-weight-bold text-blue-10 q-py-xs"
              >
                <q-icon
                  name="event_available"
                  class="q-mr-xs"
                />
                Tuần đã gán (Reserve)
              </q-td>
            </q-tr>
            <q-tr
              :key="`header-weeks-${props.row.warehouse_id}`"
              :props="props"
              class="bg-blue-grey-1 text-weight-medium"
            >
              <q-td />
              <q-td>Tuần</q-td>
              <q-td class="text-center">
                Trạng thái
              </q-td>
              <q-td class="text-center">
                Cuộn nguyên gán
              </q-td>
              <q-td class="text-center">
                Cuộn lẻ gán
              </q-td>
              <q-td class="text-center">
                Liên kết
              </q-td>
            </q-tr>
            <template
              v-for="week in props.row.weeks"
              :key="`w-${props.row.warehouse_id}-${week.week_id}`"
            >
              <q-tr
                :props="props"
                class="bg-grey-2"
              >
                <q-td>
                  <q-btn
                    size="sm"
                    flat
                    dense
                    round
                    :icon="isWeekExpanded(props.row.warehouse_id, week.week_id) ? 'remove' : 'add'"
                    :disable="componentColorId == null"
                    @click="() => toggleWeek(props.row.warehouse_id, week.week_id)"
                  >
                    <q-tooltip v-if="componentColorId == null">
                      Cần chọn loại chỉ + màu để xem chi tiết PO
                    </q-tooltip>
                  </q-btn>
                </q-td>
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
                <q-td class="text-center">
                  <q-btn
                    flat
                    dense
                    round
                    size="sm"
                    color="primary"
                    icon="open_in_new"
                    @click="openWeekOrder(week.week_id)"
                  >
                    <q-tooltip>Mở tuần đặt hàng (tab mới)</q-tooltip>
                  </q-btn>
                </q-td>
              </q-tr>

              <template v-if="isWeekExpanded(props.row.warehouse_id, week.week_id)">
                <q-tr
                  :props="props"
                  class="bg-blue-grey-1"
                >
                  <q-td
                    colspan="6"
                    class="q-pa-none"
                  >
                    <div class="q-pa-sm bg-grey-1">
                      <div class="text-caption text-weight-medium text-blue-10 q-mb-xs">
                        <q-icon
                          name="receipt_long"
                          class="q-mr-xs"
                        />
                        Chi tiết PO / Mã hàng
                      </div>

                      <div
                        v-if="poBreakdownLoading(week.week_id)"
                        class="text-center text-grey q-py-sm"
                      >
                        <q-spinner size="sm" />
                        Đang tải chi tiết PO...
                      </div>

                      <div
                        v-else-if="poBreakdownError(week.week_id)"
                        class="text-negative q-py-sm"
                      >
                        {{ poBreakdownError(week.week_id) }}
                      </div>

                      <div
                        v-else-if="poBreakdownRows(week.week_id).length === 0"
                        class="text-grey text-italic q-py-sm"
                      >
                        Không có PO/mã hàng nào khớp loại chỉ + màu này
                      </div>

                      <q-markup-table
                        v-else
                        flat
                        dense
                        bordered
                        class="bg-white"
                      >
                        <thead>
                          <tr class="bg-blue-grey-2 text-weight-medium">
                            <th class="text-left">
                              PO
                            </th>
                            <th class="text-left">
                              Mã hàng
                            </th>
                            <th class="text-left">
                              Màu SP
                            </th>
                            <th class="text-center">
                              SL SP
                            </th>
                            <th class="text-center">
                              ĐM cone
                            </th>
                            <th class="text-center">
                              Đã xuất
                            </th>
                            <th class="text-center">
                              Đã trả
                            </th>
                            <th class="text-center">
                              Còn lại
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="row in poBreakdownRows(week.week_id)"
                            :key="`po-${props.row.warehouse_id}-${week.week_id}-${row.po_id}-${row.style_id}-${row.style_color_id}`"
                          >
                            <td>
                              {{ row.po_number }}
                            </td>
                            <td>
                              <div class="text-weight-medium">
                                {{ row.style_code }}
                              </div>
                              <div class="text-caption text-grey">
                                {{ row.style_name }}
                              </div>
                            </td>
                            <td>
                              {{ row.style_color_name }}
                            </td>
                            <td class="text-center">
                              {{ formatNumber(row.product_quantity) }}
                            </td>
                            <td class="text-center">
                              {{ formatNumber(row.quota_cones) }}
                            </td>
                            <td class="text-center">
                              {{ formatNumber(row.issued_cones) }}
                            </td>
                            <td class="text-center">
                              <span v-if="row.returned_cones > 0">
                                {{ formatNumber(row.returned_cones) }}
                              </span>
                              <span
                                v-else
                                class="text-grey"
                              >-</span>
                            </td>
                            <td class="text-center">
                              <q-badge
                                :color="row.pending_cones > 0 ? 'warning' : 'positive'"
                                :label="formatNumber(row.pending_cones)"
                              />
                            </td>
                          </tr>
                        </tbody>
                      </q-markup-table>
                    </div>
                  </q-td>
                </q-tr>
              </template>
            </template>
          </template>

          <template v-if="hasOtherReserved(props.row.other_reserved)">
            <q-tr
              :key="`title-other-${props.row.warehouse_id}`"
              :props="props"
              class="bg-orange-2"
            >
              <q-td
                colspan="6"
                class="text-weight-bold text-orange-10 q-py-xs"
              >
                <q-icon
                  name="info"
                  class="q-mr-xs"
                />
                Reserve khác (không thuộc tuần CONFIRMED)
              </q-td>
            </q-tr>
            <q-tr
              :key="`other-${props.row.warehouse_id}`"
              :props="props"
              class="bg-orange-1"
            >
              <q-td />
              <q-td colspan="2">
                <span class="q-ml-md text-italic text-grey-8">Tổng reserve khác</span>
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
              <q-td class="text-center text-grey">
                —
              </q-td>
            </q-tr>
          </template>
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
import type {
  ConeReservedAggregate,
  ConeReservedWarehouseEntry,
  ConeReservedPoBreakdownRow,
} from '@/types/thread'

interface Props {
  threadTypeId: number
  colorId?: number | null
  warehouseId?: number | null
}

const props = withDefaults(defineProps<Props>(), {
  colorId: null,
  warehouseId: null,
})

const {
  fetchReservedByWeek,
  reservedByWeekData,
  reservedByWeekError,
  reservedByWeekLoading,
  fetchPoBreakdown,
  clearPoBreakdown,
  poBreakdownByKey,
  poBreakdownLoadingByKey,
  poBreakdownErrorByKey,
  poBreakdownKey,
} = useConeSummary()

const expandedIds = ref<Set<number>>(new Set())

const expandedWeekKeys = ref<Set<string>>(new Set())

const weekKey = (warehouseId: number, weekId: number): string => `${warehouseId}_${weekId}`

const isWeekExpanded = (warehouseId: number, weekId: number): boolean =>
  expandedWeekKeys.value.has(weekKey(warehouseId, weekId))

const toggleWeek = async (warehouseId: number, weekId: number): Promise<void> => {
  const key = weekKey(warehouseId, weekId)
  if (expandedWeekKeys.value.has(key)) {
    expandedWeekKeys.value.delete(key)
  } else {
    expandedWeekKeys.value.add(key)
    if (props.colorId != null) {
      await fetchPoBreakdown(weekId, props.threadTypeId, props.colorId)
    }
  }
  expandedWeekKeys.value = new Set(expandedWeekKeys.value)
}

const poBreakdownRows = (weekId: number): ConeReservedPoBreakdownRow[] => {
  if (props.colorId == null) return []
  const key = poBreakdownKey(weekId, props.threadTypeId, props.colorId)
  return poBreakdownByKey.value.get(key) ?? []
}

const poBreakdownLoading = (weekId: number): boolean => {
  if (props.colorId == null) return false
  const key = poBreakdownKey(weekId, props.threadTypeId, props.colorId)
  return poBreakdownLoadingByKey.value.get(key) ?? false
}

const poBreakdownError = (weekId: number): string | null => {
  if (props.colorId == null) return null
  const key = poBreakdownKey(weekId, props.threadTypeId, props.colorId)
  return poBreakdownErrorByKey.value.get(key) ?? null
}

const componentColorId = computed(() => props.colorId)

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

const openWeekOrder = (weekId: number): void => {
  window.open(`/thread/weekly-order/${weekId}`, '_blank')
}

const reload = async (): Promise<void> => {
  await fetchReservedByWeek(props.threadTypeId, props.colorId, props.warehouseId)
}

onMounted(() => {
  void reload()
})

watch(
  () => [props.threadTypeId, props.colorId, props.warehouseId] as const,
  () => {
    clearPoBreakdown()
    expandedWeekKeys.value = new Set()
    void reload()
  },
)
</script>
