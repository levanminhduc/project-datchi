<template>
  <div>
    <div class="row items-center q-mb-sm">
      <div class="text-subtitle2 text-weight-medium col">
        Truy Xuất Chỉ Theo Tuần
      </div>
      <AppButton
        variant="flat"
        dense
        size="sm"
        icon="refresh"
        :loading="loading"
        @click="$emit('refresh')"
      >
        <AppTooltip>Tải lại</AppTooltip>
      </AppButton>
    </div>

    <template v-if="loading && !trace">
      <div class="row justify-center q-py-md">
        <q-spinner-dots
          size="32px"
          color="primary"
        />
      </div>
    </template>

    <template v-else-if="!trace || trace.rows.length === 0">
      <div class="text-center text-grey q-pa-md">
        Chưa có dữ liệu truy xuất cho tuần này
      </div>
    </template>

    <template v-else>
      <div class="trace-stats q-mb-md">
        <div class="trace-stat">
          <span>Nhu cầu</span>
          <strong>{{ formatQty(trace.summary.required_cones) }}</strong>
        </div>
        <div class="trace-stat">
          <span>Đặt thêm</span>
          <strong>{{ formatQty(trace.summary.additional_order_cones) }}</strong>
        </div>
        <div class="trace-stat">
          <span>Tổng cần</span>
          <strong>{{ formatQty(trace.summary.assignment_target_cones) }}</strong>
        </div>
        <div class="trace-stat">
          <span>Chờ NCC</span>
          <strong class="text-warning">{{ formatQty(trace.summary.pending_delivery_cones) }}</strong>
        </div>
        <div class="trace-stat">
          <span>Giao chưa nhập</span>
          <strong class="text-orange">{{ formatQty(trace.summary.pending_receive_cones) }}</strong>
        </div>
        <div class="trace-stat">
          <span>Đã nhập</span>
          <strong class="text-info">{{ formatQty(trace.summary.received_cones) }}</strong>
        </div>
        <div class="trace-stat">
          <span>Đang ở kho</span>
          <strong class="text-primary">{{ formatQty(trace.summary.reserved_cones) }}</strong>
        </div>
        <div class="trace-stat">
          <span>Xuất từ reserved</span>
          <strong class="text-positive">{{ formatQty(trace.summary.issued_from_reserved_cones) }}</strong>
        </div>
        <div class="trace-stat">
          <span>Xuất khả dụng</span>
          <strong class="text-deep-purple">{{ formatQty(trace.summary.issued_from_available_cones) }}</strong>
        </div>
        <div class="trace-stat">
          <span
            class="trace-stat-label-help"
            tabindex="0"
          >
            Nguồn đáp ứng
            <AppTooltip max-width="360px">
              Tổng QĐ đã bố trí cho tuần: Chờ NCC + Giao chưa nhập + Đang ở kho + Xuất từ reserved.
            </AppTooltip>
          </span>
          <strong class="text-primary">{{ formatQty(trace.summary.assigned_week_cones) }}</strong>
        </div>
        <div class="trace-stat">
          <span>Thiếu / dư nguồn</span>
          <strong :class="getGapClass(trace.summary.assignment_gap_cones)">
            {{ formatGapQty(trace.summary.assignment_gap_cones) }}
          </strong>
        </div>
      </div>

      <div class="trace-table-wrap">
        <q-markup-table
          flat
          bordered
          dense
          separator="horizontal"
          class="trace-table"
        >
          <thead>
            <tr>
              <th class="trace-expand" />
              <th class="text-left">
                NCC
              </th>
              <th class="text-left">
                Tex
              </th>
              <th class="text-left">
                Màu chỉ
              </th>
              <th class="text-right">
                Nhu cầu
              </th>
              <th class="text-right">
                Đặt thêm
              </th>
              <th class="text-right">
                Tổng cần
              </th>
              <th class="text-right">
                Chờ NCC giao
              </th>
              <th class="text-right">
                NCC giao chưa nhập
              </th>
              <th class="text-right">
                Đã nhập kho
              </th>
              <th class="text-right">
                Đang ở kho
              </th>
              <th class="text-right">
                Xuất từ reserved
              </th>
              <th class="text-right">
                Xuất khả dụng
              </th>
              <th class="text-right">
                Thiếu / dư
              </th>
              <th class="text-left">
                Tồn theo kho
              </th>
            </tr>
          </thead>
          <tbody>
            <template
              v-for="row in trace.rows"
              :key="row.row_key"
            >
              <tr>
                <td class="trace-expand">
                  <AppButton
                    variant="flat"
                    dense
                    round
                    size="sm"
                    :icon="isExpanded(row.row_key) ? 'expand_less' : 'expand_more'"
                    @click="toggleRow(row.row_key)"
                  >
                    <AppTooltip>Chi tiết</AppTooltip>
                  </AppButton>
                </td>
                <td>{{ row.supplier_name || '-' }}</td>
                <td>{{ row.tex_number || '-' }}</td>
                <td>{{ row.color_name || '-' }}</td>
                <td class="text-right">
                  {{ formatQty(row.required_cones) }}
                </td>
                <td class="text-right">
                  {{ formatQty(row.additional_order_cones) }}
                </td>
                <td class="text-right text-weight-medium">
                  {{ formatQty(row.assignment_target_cones) }}
                </td>
                <td class="text-right text-warning text-weight-medium">
                  {{ formatQty(row.pending_delivery_cones) }}
                </td>
                <td class="text-right text-orange text-weight-medium">
                  {{ formatQty(row.pending_receive_cones) }}
                </td>
                <td class="text-right text-info text-weight-medium">
                  {{ formatQty(row.received_cones) }}
                </td>
                <td class="text-right text-primary text-weight-medium">
                  {{ formatQty(row.reserved_cones) }}
                </td>
                <td class="text-right text-positive text-weight-medium">
                  {{ formatQty(row.issued_from_reserved_cones) }}
                </td>
                <td class="text-right text-deep-purple text-weight-medium">
                  {{ formatQty(row.issued_from_available_cones) }}
                </td>
                <td
                  class="text-right text-weight-medium"
                  :class="getGapClass(row.assignment_gap_cones)"
                >
                  {{ formatGapQty(row.assignment_gap_cones) }}
                </td>
                <td class="warehouse-cell">
                  {{ formatWarehouseSummary(row.warehouses) }}
                </td>
              </tr>
              <tr v-if="isExpanded(row.row_key)">
                <td
                  colspan="15"
                  class="trace-detail-cell"
                >
                  <div class="trace-detail-grid">
                    <section class="trace-detail-panel">
                      <div class="detail-title">
                        Tồn Theo Kho
                      </div>
                      <q-markup-table
                        flat
                        dense
                        separator="horizontal"
                        class="detail-table"
                      >
                        <thead>
                          <tr>
                            <th class="text-left">
                              Kho
                            </th>
                            <th class="text-right">
                              Quy đổi
                            </th>
                            <th class="text-right">
                              Cuộn
                            </th>
                            <th class="text-right">
                              Nguyên
                            </th>
                            <th class="text-right">
                              Lẻ
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-if="row.warehouses.length === 0">
                            <td
                              colspan="5"
                              class="text-center text-grey-6"
                            >
                              Chưa còn cuộn reserved trong kho
                            </td>
                          </tr>
                          <tr
                            v-for="warehouse in row.warehouses"
                            :key="warehouse.warehouse_id"
                          >
                            <td>{{ warehouse.warehouse_name || warehouse.warehouse_code || '-' }}</td>
                            <td class="text-right">
                              {{ formatQty(warehouse.equivalent_cones) }}
                            </td>
                            <td class="text-right">
                              {{ warehouse.physical_cones }}
                            </td>
                            <td class="text-right">
                              {{ warehouse.full_cones }}
                            </td>
                            <td class="text-right">
                              {{ warehouse.partial_cones }}
                            </td>
                          </tr>
                        </tbody>
                      </q-markup-table>
                    </section>

                    <section class="trace-detail-panel">
                      <div class="detail-title">
                        PO - Style - Màu Hàng
                      </div>
                      <q-markup-table
                        flat
                        dense
                        separator="horizontal"
                        class="detail-table po-detail-table"
                      >
                        <thead>
                          <tr>
                            <th class="text-left">
                              PO
                            </th>
                            <th class="text-left">
                              Style
                            </th>
                            <th class="text-left">
                              Màu hàng
                            </th>
                            <th class="text-right">
                              Cần
                            </th>
                            <th class="text-right">
                              Đã xuất gross
                            </th>
                            <th class="text-right">
                              Xuất reserved
                            </th>
                            <th class="text-right">
                              Xuất khả dụng
                            </th>
                            <th class="text-right">
                              Đã trả
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-if="row.po_lines.length === 0">
                            <td
                              colspan="8"
                              class="text-center text-grey-6"
                            >
                              Chưa có dòng PO - Style
                            </td>
                          </tr>
                          <tr
                            v-for="line in row.po_lines"
                            :key="`${line.po_id ?? 'null'}_${line.style_id ?? 'null'}_${line.style_color_id ?? 'null'}_${line.thread_type_id}_${line.thread_color_id ?? 'null'}`"
                          >
                            <td>{{ line.po_number || '-' }}</td>
                            <td>
                              <span>{{ line.style_code || '-' }}</span>
                              <span
                                v-if="line.style_name"
                                class="text-grey-6"
                              >
                                - {{ line.style_name }}
                              </span>
                            </td>
                            <td>{{ line.style_color_name || '-' }}</td>
                            <td class="text-right">
                              {{ formatQty(line.required_cones) }}
                            </td>
                            <td class="text-right text-positive">
                              {{ formatQty(line.issued_gross_cones) }}
                            </td>
                            <td class="text-right text-positive">
                              {{ formatQty(line.issued_from_reserved_cones) }}
                            </td>
                            <td class="text-right text-deep-purple">
                              {{ formatQty(line.issued_from_available_cones) }}
                            </td>
                            <td class="text-right text-grey-7">
                              {{ formatQty(line.returned_cones) }}
                            </td>
                          </tr>
                        </tbody>
                      </q-markup-table>
                    </section>
                  </div>

                  <section class="trace-detail-panel q-mt-md">
                    <div class="detail-title">
                      Giao / Nhập Kho
                    </div>
                    <q-markup-table
                      flat
                      dense
                      separator="horizontal"
                      class="detail-table"
                    >
                      <thead>
                        <tr>
                          <th class="text-left">
                            Trạng thái
                          </th>
                          <th class="text-right">
                            Đặt NCC
                          </th>
                          <th class="text-right">
                            NCC đã giao
                          </th>
                          <th class="text-right">
                            Chờ nhập
                          </th>
                          <th class="text-right">
                            Đã nhập
                          </th>
                          <th class="text-right">
                            Chờ giao
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-if="row.delivery_lines.length === 0">
                          <td
                            colspan="6"
                            class="text-center text-grey-6"
                          >
                            Chưa có dòng giao hàng
                          </td>
                        </tr>
                        <tr
                          v-for="delivery in row.delivery_lines"
                          :key="delivery.id"
                        >
                          <td>{{ getDeliveryStatusLabel(delivery.status) }}</td>
                          <td class="text-right">
                            {{ formatQty(delivery.quantity_cones) }}
                          </td>
                          <td class="text-right">
                            {{ formatQty(delivery.delivered_cones) }}
                          </td>
                          <td class="text-right text-orange">
                            {{ formatQty(delivery.pending_receive) }}
                          </td>
                          <td class="text-right text-info">
                            {{ formatQty(delivery.received_quantity) }}
                          </td>
                          <td class="text-right text-warning">
                            {{ formatQty(delivery.pending_delivery) }}
                          </td>
                        </tr>
                      </tbody>
                    </q-markup-table>
                  </section>
                </td>
              </tr>
            </template>
          </tbody>
        </q-markup-table>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { WeeklyOrderProcessTraceResponse, WeeklyOrderProcessTraceWarehouse } from '@/types/thread'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppTooltip from '@/components/ui/dialogs/AppTooltip.vue'

defineProps<{
  trace: WeeklyOrderProcessTraceResponse | null
  loading: boolean
}>()

defineEmits<{
  (e: 'refresh'): void
}>()

const expandedRows = ref<Set<string>>(new Set())

function toggleRow(key: string) {
  const next = new Set(expandedRows.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  expandedRows.value = next
}

function isExpanded(key: string) {
  return expandedRows.value.has(key)
}

function formatQty(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 2,
  }).format(value || 0)
}

function formatGapQty(value: number) {
  const rounded = Math.round((value || 0) * 100) / 100
  if (rounded > 0) return `Thiếu ${formatQty(rounded)}`
  if (rounded < 0) return `Dư ${formatQty(Math.abs(rounded))}`
  return 'Đủ'
}

function getGapClass(value: number) {
  if (value > 0) return 'text-warning'
  if (value < 0) return 'text-negative'
  return 'text-positive'
}

function formatWarehouseSummary(warehouses: WeeklyOrderProcessTraceWarehouse[]) {
  if (warehouses.length === 0) return '-'
  return warehouses
    .map(warehouse => `${warehouse.warehouse_name || warehouse.warehouse_code || '-'}: ${formatQty(warehouse.equivalent_cones)}`)
    .join(', ')
}

function getDeliveryStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: 'Chờ NCC',
    DELIVERED: 'NCC đã giao',
    CANCELLED: 'Đã hủy',
  }
  return labels[status] ?? status
}
</script>

<style scoped lang="scss">
.trace-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
  gap: 8px;
}

.trace-stat {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 10px 12px;
  background: #fff;

  span {
    display: block;
    color: #757575;
    font-size: 12px;
    line-height: 1.2;
  }

  .trace-stat-label-help {
    cursor: help;
    text-decoration: underline dotted;
    text-underline-offset: 3px;
    width: fit-content;
  }

  strong {
    display: block;
    margin-top: 4px;
    font-size: 20px;
    line-height: 1.2;
  }
}

.trace-table-wrap {
  overflow-x: auto;
}

.trace-table {
  min-width: 1480px;

  th {
    background: #f5f5f5;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
  }

  td {
    font-size: 13px;
    vertical-align: top;
  }
}

.trace-expand {
  width: 44px;
  text-align: center;
}

.warehouse-cell {
  max-width: 260px;
  white-space: normal;
}

.trace-detail-cell {
  background: #fafafa;
  padding: 12px;
}

.trace-detail-grid {
  display: grid;
  grid-template-columns: minmax(280px, 0.8fr) minmax(420px, 1.2fr);
  gap: 12px;
}

.trace-detail-panel {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: #fff;
  overflow: hidden;
}

.detail-title {
  padding: 8px 10px;
  background: #f5f5f5;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: #616161;
}

.detail-table {
  th {
    background: #fafafa;
    font-size: 12px;
    font-weight: 600;
  }

  td {
    font-size: 12px;
  }
}

.po-detail-table {
  min-width: 620px;
}

@media (max-width: 900px) {
  .trace-detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
