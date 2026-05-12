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
              <div
                v-if="po.summary.total_quota_cones > 0"
                class="row items-center q-mt-xs no-wrap"
              >
                <q-linear-progress
                  :value="(animationReady ? getPoStatus(po).progressPercent : 0) / 100"
                  :color="getPoStatus(po).progressColor"
                  track-color="grey-3"
                  :stripe="getPoStatus(po).status === 'IN_PROGRESS'"
                  size="7px"
                  rounded
                  class="col progress-load"
                  :class="getPoStatus(po).status === 'IN_PROGRESS' ? 'progress-animated' : ''"
                />
                <span
                  class="text-caption q-ml-sm"
                  :class="getPoStatus(po).status === 'OVER' ? 'text-negative text-weight-medium' : 'text-grey-7'"
                >
                  {{ getPoStatus(po).progressPercent }}%<template v-if="getPoStatus(po).overPercent > 0"> (+{{ getPoStatus(po).overPercent }}%)</template>
                </span>
              </div>
            </q-item-section>
            <q-item-section side>
              <q-badge
                :color="getPoStatus(po).color"
                :outline="getPoStatus(po).badgeOutline"
                class="status-badge"
              >
                <q-icon
                  :name="getPoStatus(po).icon"
                  size="12px"
                  class="q-mr-xs"
                />
                {{ getPoStatus(po).label }}
              </q-badge>
            </q-item-section>
          </template>

          <q-card flat>
            <q-card-section class="q-pa-none">
              <!-- View: By Style -->
              <template v-if="viewMode === 'by-style' && po.styles && po.styles.length > 0">
                <ProgressStyleGroup
                  v-for="style in po.styles"
                  :key="style.style_id"
                  :style="style"
                />
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
                        >({{ line.issued_cones }}-{{ line.returned_cones }})</span>
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
              </template>
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </q-list>

      <div class="q-mt-sm">
        <div class="row items-start text-caption text-grey-7">
          <q-icon
            name="info"
            size="14px"
            class="q-mr-xs q-mt-xs"
          />
          <span class="col">
            Đã xuất = (Đã xuất gross − Đã trả). Còn lại = (Cần − Đã xuất net). Vượt = (Đã xuất net − Cần). Dữ liệu lấy từ trang Xuất chỉ V2.
          </span>
        </div>
        <div class="row q-gutter-sm items-center text-caption text-grey-7 q-mt-xs">
          <span class="text-weight-medium">Trạng thái:</span>
          <q-badge
            v-for="status in statusList"
            :key="status.status"
            :color="status.color"
            :outline="status.badgeOutline"
            class="status-badge"
          >
            <q-icon
              :name="status.icon"
              size="12px"
              class="q-mr-xs"
            />
            {{ status.label }}
          </q-badge>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import type { WeeklyOrderProgressPo } from '@/types/thread'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppTooltip from '@/components/ui/dialogs/AppTooltip.vue'
import ButtonToggle from '@/components/ui/buttons/ButtonToggle.vue'
import ProgressStyleGroup from './ProgressStyleGroup.vue'
import {
  getProductionStatus,
  getProductionStatusMeta,
  PRODUCTION_STATUS_LIST,
} from '@/utils/production-status'

const props = defineProps<{
  pos: WeeklyOrderProgressPo[]
  loading: boolean
  expandedAll?: boolean
}>()

defineEmits<{
  (e: 'refresh'): void
}>()

const viewMode = ref<'by-style' | 'flat'>('by-style')

function getPoStatus(po: WeeklyOrderProgressPo) {
  return getProductionStatus(po.summary)
}

const statusList = computed(() =>
  PRODUCTION_STATUS_LIST.map(status => getProductionStatusMeta(status)),
)

const animationReady = ref(false)
let animationTriggered = false

function triggerAnimation() {
  if (animationTriggered) return
  animationTriggered = true
  animationReady.value = false
  nextTick(() => {
    requestAnimationFrame(() => {
      animationReady.value = true
    })
  })
}

onMounted(() => {
  if (props.pos.length > 0) triggerAnimation()
})

watch(() => props.pos.length, (newLen, oldLen) => {
  if ((oldLen ?? 0) === 0 && newLen > 0) triggerAnimation()
})
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
.status-badge {
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 500;
}
.progress-load :deep(.q-linear-progress__model) {
  transition: transform 1.6s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.progress-animated::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: inherit;
  background-image: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.55) 50%,
    transparent 100%
  );
  background-size: 50% 100%;
  background-repeat: no-repeat;
  animation: progress-shimmer 1.4s linear infinite;
  pointer-events: none;
  z-index: 1;
}
@keyframes progress-shimmer {
  0% { background-position: -50% 0; }
  100% { background-position: 150% 0; }
}
</style>
