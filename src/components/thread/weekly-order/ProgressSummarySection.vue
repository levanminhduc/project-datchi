<template>
  <div>
    <div class="row items-center q-mb-sm">
      <div class="text-subtitle2 text-weight-medium col">
        Tiến Độ Xuất Chỉ Theo PO
      </div>
      <div class="row q-gutter-sm items-center">
        <ButtonToggle
          v-model="viewMode"
          :options="[
            { label: 'Theo mã hàng', value: 'by-style' },
            { label: 'Tổng hợp', value: 'flat' }
          ]"
          color="grey-4"
          toggle-color="primary"
          dense
          size="sm"
        />
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
                <span class="text-grey-5">&middot;</span>
                <span>Đã xuất: <strong class="text-positive">{{ po.summary.total_net_issued }}</strong> cuộn</span>
                <span
                  v-if="po.summary.total_returned_cones > 0"
                  class="text-grey-7"
                >
                  (trả {{ po.summary.total_returned_cones }})
                </span>
                <span class="text-grey-5">&middot;</span>
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
              <!-- View: By Style -->
              <template v-if="viewMode === 'by-style' && po.styles && po.styles.length > 0">
                <div
                  v-for="style in po.styles"
                  :key="style.style_id"
                  class="style-group"
                >
                  <div class="style-header row items-center q-px-md q-py-sm">
                    <q-icon
                      name="checkroom"
                      size="16px"
                      class="q-mr-sm text-grey-7"
                    />
                    <span class="text-weight-medium text-body2">{{ style.style_code }}</span>
                    <span
                      v-if="style.style_name"
                      class="text-grey-7 q-ml-xs text-caption"
                    >{{ style.style_name }}</span>
                    <template v-if="style.style_colors.length > 0">
                      <span class="text-grey-5 q-mx-xs">&middot;</span>
                      <span class="text-caption text-grey-7">{{ style.style_colors.join(', ') }}</span>
                    </template>
                    <q-space />
                    <div class="row q-gutter-sm items-center text-caption">
                      <span>Cần: <strong>{{ style.summary.total_quota_cones }}</strong></span>
                      <span class="text-grey-5">&middot;</span>
                      <span>Xuất: <strong class="text-positive">{{ style.summary.total_net_issued }}</strong></span>
                      <span class="text-grey-5">&middot;</span>
                      <span
                        v-if="style.summary.over_quota_cones > 0"
                        class="text-negative text-weight-medium"
                      >
                        Vượt: +{{ style.summary.over_quota_cones }}
                      </span>
                      <span
                        v-else
                        :class="style.summary.total_pending_cones > 0 ? 'text-warning' : 'text-positive'"
                      >
                        Còn: {{ style.summary.total_pending_cones }}
                      </span>
                    </div>
                  </div>

                  <q-markup-table
                    flat
                    dense
                    separator="horizontal"
                    class="progress-table"
                  >
                    <thead>
                      <tr>
                        <th class="text-left">NCC</th>
                        <th class="text-left">Tex</th>
                        <th class="text-left">Màu chỉ</th>
                        <th class="text-right">Cần (cuộn)</th>
                        <th class="text-right">Đã xuất</th>
                        <th class="text-right">Đã trả</th>
                        <th class="text-right">Còn lại</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="line in style.thread_lines"
                        :key="`${line.thread_type_id}_${line.thread_color_id}`"
                      >
                        <td>{{ line.supplier_name || '-' }}</td>
                        <td>{{ line.tex_number || '-' }}</td>
                        <td>{{ line.color_name || '-' }}</td>
                        <td class="text-right">{{ line.quota_cones }}</td>
                        <td class="text-right text-positive">
                          {{ line.net_issued }}
                          <span
                            v-if="line.returned_cones > 0"
                            class="text-caption text-grey-7"
                          >({{ line.issued_cones }}-{{ line.returned_cones }})</span>
                        </td>
                        <td class="text-right text-grey-7">{{ line.returned_cones }}</td>
                        <td
                          class="text-right"
                          :class="line.pending_cones > 0 ? 'text-warning text-weight-medium' : (line.pending_cones === 0 && line.net_issued > line.quota_cones ? 'text-negative text-weight-medium' : 'text-positive')"
                        >
                          <template v-if="line.net_issued > line.quota_cones">
                            +{{ roundTwo(line.net_issued - line.quota_cones) }}
                          </template>
                          <template v-else>
                            {{ line.pending_cones }}
                          </template>
                        </td>
                      </tr>
                    </tbody>
                  </q-markup-table>
                </div>
              </template>

              <!-- View: Flat (original) -->
              <template v-else>
                <q-markup-table
                  flat
                  dense
                  separator="horizontal"
                  class="progress-table"
                >
                  <thead>
                    <tr>
                      <th class="text-left">NCC</th>
                      <th class="text-left">Tex</th>
                      <th class="text-left">Màu chỉ</th>
                      <th class="text-right">Cần (cuộn)</th>
                      <th class="text-right">Đã xuất</th>
                      <th class="text-right">Đã trả</th>
                      <th class="text-right">Còn lại</th>
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
                      <td class="text-right">{{ line.quota_cones }}</td>
                      <td class="text-right text-positive">
                        {{ line.net_issued }}
                        <span
                          v-if="line.returned_cones > 0"
                          class="text-caption text-grey-7"
                        >({{ line.issued_cones }}-{{ line.returned_cones }})</span>
                      </td>
                      <td class="text-right text-grey-7">{{ line.returned_cones }}</td>
                      <td
                        class="text-right"
                        :class="line.pending_cones > 0 ? 'text-warning text-weight-medium' : 'text-positive'"
                      >
                        {{ line.pending_cones }}
                      </td>
                    </tr>
                  </tbody>
                </q-markup-table>
              </template>
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
          Đã xuất = (Đã xuất gross − Đã trả). Còn lại = (Cần − Đã xuất net). Vượt = (Đã xuất net − Cần). Dữ liệu lấy từ trang Xuất chỉ V2.
        </span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { WeeklyOrderProgressPo } from '@/types/thread'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppBadge from '@/components/ui/cards/AppBadge.vue'
import AppTooltip from '@/components/ui/dialogs/AppTooltip.vue'
import ButtonToggle from '@/components/ui/buttons/ButtonToggle.vue'

defineProps<{
  pos: WeeklyOrderProgressPo[]
  loading: boolean
  expandedAll?: boolean
}>()

defineEmits<{
  (e: 'refresh'): void
}>()

const viewMode = ref<'by-style' | 'flat'>('by-style')

function roundTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}
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
.style-group {
  &:not(:last-child) {
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }
}
.style-header {
  background: #fafafa;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
</style>
