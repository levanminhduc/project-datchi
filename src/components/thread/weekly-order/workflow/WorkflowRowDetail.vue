<template>
  <div class="row q-col-gutter-md wf-row-detail">
    <div class="col-12 col-md-4">
      <div class="wf-detail-title">
        <q-icon
          name="o_local_shipping"
          size="16px"
        />
        Đợt giao NCC
      </div>
      <q-markup-table
        v-if="row.delivery_lines.length > 0"
        flat
        bordered
        dense
      >
        <thead>
          <tr>
            <th class="text-left">
              Trạng thái
            </th>
            <th class="text-right">
              Đặt
            </th>
            <th class="text-right">
              Đã giao
            </th>
            <th class="text-right">
              Đã nhập
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="line in row.delivery_lines"
            :key="line.id"
          >
            <td>
              <q-chip
                :color="getDeliveryLineStatusChip(line.status).color"
                text-color="white"
                dense
                size="sm"
                class="q-ma-none"
              >
                {{ getDeliveryLineStatusChip(line.status).label }}
              </q-chip>
            </td>
            <td class="text-right">
              {{ formatQty(line.quantity_cones) }}
            </td>
            <td class="text-right">
              {{ formatQty(line.delivered_cones) }}
            </td>
            <td class="text-right">
              {{ formatQty(line.received_quantity) }}
            </td>
          </tr>
        </tbody>
      </q-markup-table>
      <div
        v-else
        class="wf-detail-empty"
      >
        Không đặt NCC — đáp ứng từ tồn kho
      </div>
    </div>

    <div class="col-12 col-md-4">
      <div class="wf-detail-title">
        <q-icon
          name="o_description"
          size="16px"
        />
        PO sử dụng
      </div>
      <q-markup-table
        v-if="row.po_lines.length > 0"
        flat
        bordered
        dense
      >
        <thead>
          <tr>
            <th class="text-left">
              PO / Style
            </th>
            <th class="text-right">
              Nhu cầu
            </th>
            <th class="text-right">
              Đã xuất
            </th>
            <th class="text-right">
              Đã trả
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(line, index) in row.po_lines"
            :key="`${line.po_number}-${index}`"
          >
            <td>
              <div>{{ line.po_number }}</div>
              <div class="text-caption text-grey-7">
                {{ line.style_code }} – {{ line.style_color_name }}
              </div>
            </td>
            <td class="text-right">
              {{ formatQty(line.required_cones) }}
            </td>
            <td class="text-right">
              {{ formatQty(line.issued_gross_cones) }}
            </td>
            <td class="text-right">
              {{ formatQty(line.returned_cones) }}
            </td>
          </tr>
        </tbody>
      </q-markup-table>
      <div
        v-else
        class="wf-detail-empty"
      >
        Chưa gắn với PO nào
      </div>
    </div>

    <div class="col-12 col-md-4">
      <div class="wf-detail-title">
        <q-icon
          name="o_warehouse"
          size="16px"
        />
        Vị trí kho tuần
      </div>
      <q-markup-table
        v-if="row.warehouses.length > 0"
        flat
        bordered
        dense
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
              Vật lý
            </th>
            <th class="text-right">
              Nguyên / lẻ
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="warehouse in row.warehouses"
            :key="warehouse.warehouse_id"
          >
            <td>{{ warehouse.warehouse_name || warehouse.warehouse_code }}</td>
            <td class="text-right">
              {{ formatQty(warehouse.equivalent_cones) }}
            </td>
            <td class="text-right">
              {{ formatQty(warehouse.physical_cones) }}
            </td>
            <td class="text-right">
              {{ formatQty(warehouse.full_cones) }} / {{ formatQty(warehouse.partial_cones) }}
            </td>
          </tr>
        </tbody>
      </q-markup-table>
      <div
        v-else
        class="wf-detail-empty"
      >
        Chưa có cuộn nào trong kho tuần
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WeeklyOrderProcessTraceRow } from '@/types/thread'
import { formatQty, getDeliveryLineStatusChip } from './workflow-format'

defineProps<{
  row: WeeklyOrderProcessTraceRow
}>()
</script>

<style scoped lang="scss">
.wf-row-detail {
  padding: 4px 8px 8px;
}

.wf-detail-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: #616161;
  margin-bottom: 6px;
}

.wf-detail-empty {
  font-size: 12px;
  color: #9e9e9e;
  padding: 8px 4px;
}
</style>
