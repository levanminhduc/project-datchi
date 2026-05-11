<template>
  <div>
    <div class="row items-center q-mb-sm">
      <div class="text-subtitle2 text-weight-medium col">
        Tiến Độ Xuất Chỉ Theo PO
      </div>
      <AppButton
        flat
        dense
        size="sm"
        icon="refresh"
        :loading="loading"
        @click="$emit('refresh')"
      >
        <AppTooltip>Tải lại</AppTooltip>
      </AppButton>
    </div>

    <template v-if="loading && pos.length === 0">
      <div class="row justify-center q-py-md">
        <q-spinner-dots
          size="32px"
          color="primary"
        />
      </div>
    </template>

    <template v-else-if="pos.length === 0">
      <div class="text-center text-grey q-pa-md">
        Chưa có dữ liệu tính toán cho tuần này
      </div>
    </template>

    <template v-else>
      <q-list
        bordered
        separator
        class="rounded-borders"
      >
        <q-expansion-item
          v-for="po in pos"
          :key="po.po_id ?? 'null'"
          :model-value="expandedAll"
          group="progress-po"
          expand-separator
          dense-toggle
          header-class="q-py-sm"
        >
          <template #header>
            <q-item-section avatar>
              <q-icon
                name="receipt_long"
                color="primary"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-medium">
                {{ po.po_number }}
              </q-item-label>
              <q-item-label
                caption
                class="row q-gutter-sm items-center"
              >
                <span>Cần: <strong>{{ po.summary.total_quota_cones }}</strong> cuộn</span>
                <span class="text-grey-5">·</span>
                <span>Đã xuất: <strong class="text-positive">{{ po.summary.total_net_issued }}</strong> cuộn</span>
                <span
                  v-if="po.summary.total_returned_cones > 0"
                  class="text-grey-7"
                >
                  (trả {{ po.summary.total_returned_cones }})
                </span>
                <span class="text-grey-5">·</span>
                <span :class="po.summary.total_pending_cones > 0 ? 'text-warning' : 'text-positive'">
                  Còn lại: <strong>{{ po.summary.total_pending_cones }}</strong> cuộn
                </span>
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <AppBadge
                :label="po.summary.total_pending_cones === 0 ? 'Đã đủ' : 'Chưa đủ'"
                :color="po.summary.total_pending_cones === 0 ? 'positive' : 'warning'"
              />
            </q-item-section>
          </template>

          <q-card flat>
            <q-card-section class="q-pa-none">
              <q-markup-table
                flat
                dense
                separator="horizontal"
                class="progress-table"
              >
                <thead>
                  <tr>
                    <th class="text-left">
                      NCC
                    </th>
                    <th class="text-left">
                      Tex
                    </th>
                    <th class="text-left">
                      Màu
                    </th>
                    <th class="text-right">
                      Cần (cuộn)
                    </th>
                    <th class="text-right">
                      Đã xuất
                    </th>
                    <th class="text-right">
                      Đã trả
                    </th>
                    <th class="text-right">
                      Còn lại
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="line in po.thread_lines"
                    :key="`${line.thread_type_id}_${line.thread_color_id}`"
                  >
                    <td>{{ line.supplier_name || '-' }}</td>
                    <td>{{ line.tex_number || '-' }}</td>
                    <td>{{ line.color_name || '-' }}</td>
                    <td class="text-right">
                      {{ line.quota_cones }}
                    </td>
                    <td class="text-right text-positive">
                      {{ line.net_issued }}
                      <span
                        v-if="line.returned_cones > 0"
                        class="text-caption text-grey-7"
                      >
                        ({{ line.issued_cones }}-{{ line.returned_cones }})
                      </span>
                    </td>
                    <td class="text-right text-grey-7">
                      {{ line.returned_cones }}
                    </td>
                    <td
                      class="text-right"
                      :class="line.pending_cones > 0 ? 'text-warning text-weight-medium' : 'text-positive'"
                    >
                      {{ line.pending_cones }}
                    </td>
                  </tr>
                </tbody>
              </q-markup-table>
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </q-list>

      <div class="row q-mt-sm items-center text-caption text-grey-7">
        <q-icon
          name="info"
          size="14px"
          class="q-mr-xs"
        />
        <span>
          Đã xuất = (Đã xuất gross − Đã trả). Còn lại = (Cần − Đã xuất net). Dữ liệu lấy từ trang Xuất chỉ V2.
        </span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { WeeklyOrderProgressPo } from '@/types/thread'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppBadge from '@/components/ui/cards/AppBadge.vue'
import AppTooltip from '@/components/ui/dialogs/AppTooltip.vue'

defineProps<{
  pos: WeeklyOrderProgressPo[]
  loading: boolean
  expandedAll?: boolean
}>()

defineEmits<{
  (e: 'refresh'): void
}>()
</script>

<style scoped lang="scss">
.progress-table {
  th {
    background: #f5f5f5;
    font-weight: 500;
    font-size: 12px;
  }
  td {
    font-size: 13px;
  }
}
</style>
