<template>
  <div class="style-group">
    <div class="style-header q-px-md q-py-sm">
      <div class="row items-center q-gutter-xs no-wrap">
        <q-icon
          name="checkroom"
          size="16px"
          class="text-grey-7"
        />
        <span class="text-weight-medium text-body2">{{ style.style_code }}</span>
        <span
          v-if="style.style_name"
          class="text-grey-7 q-ml-xs text-caption"
        >{{ style.style_name }}</span>
        <template v-if="style.style_colors.length > 0">
          <span class="text-grey-5 q-mx-xs gt-xs">&middot;</span>
          <span class="text-caption text-grey-7 ellipsis">{{ style.style_colors.join(', ') }}</span>
        </template>
        <q-space />
        <q-badge
          :color="statusInfo.color"
          :outline="statusInfo.badgeOutline"
          class="status-badge"
        >
          <q-icon
            :name="statusInfo.icon"
            size="12px"
            class="q-mr-xs"
          />
          {{ statusInfo.label }}
        </q-badge>
        <span class="text-caption text-grey-8 q-ml-sm">
          {{ style.summary.total_net_issued }}/{{ style.summary.total_quota_cones }}
        </span>
      </div>

      <div
        v-if="style.summary.total_quota_cones > 0"
        class="row items-center q-mt-xs no-wrap"
      >
        <q-linear-progress
          :value="(animationReady ? statusInfo.progressPercent : 0) / 100"
          :color="statusInfo.progressColor"
          track-color="grey-3"
          :stripe="statusInfo.status === 'IN_PROGRESS'"
          size="7px"
          rounded
          class="col progress-load"
          :class="statusInfo.status === 'IN_PROGRESS' ? 'progress-animated' : ''"
        />
        <span
          class="text-caption q-ml-sm"
          :class="statusInfo.status === 'OVER' ? 'text-negative text-weight-medium' : 'text-grey-7'"
        >
          {{ statusInfo.progressPercent }}%<template v-if="statusInfo.overPercent > 0"> (+{{ statusInfo.overPercent }}%)</template>
        </span>
      </div>

      <div class="text-caption text-grey-7 q-mt-xs">
        Cần: <strong>{{ style.summary.total_quota_cones }}</strong>
        <span class="text-grey-5 q-mx-xs">&middot;</span>
        Xuất: <strong class="text-positive">{{ style.summary.total_net_issued }}</strong>
        <span class="text-grey-5 q-mx-xs">&middot;</span>
        <template v-if="style.summary.over_quota_cones > 0">
          <span class="text-negative text-weight-medium">Vượt: +{{ style.summary.over_quota_cones }}</span>
        </template>
        <template v-else>
          <span :class="style.summary.total_pending_cones > 0 ? 'text-warning' : 'text-positive'">
            Còn: <strong>{{ style.summary.total_pending_cones }}</strong>
          </span>
        </template>
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
          v-for="line in style.thread_lines"
          :key="`${line.thread_type_id}_${line.thread_color_id}`"
          :class="line.net_issued > line.quota_cones ? 'over-quota-row' : ''"
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

<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from 'vue'
import type { WeeklyOrderProgressStyle } from '@/types/thread'
import { getProductionStatus } from '@/utils/production-status'

const props = defineProps<{
  style: WeeklyOrderProgressStyle
}>()

const statusInfo = computed(() => getProductionStatus(props.style.summary))

const animationReady = ref(false)
onMounted(() => {
  nextTick(() => {
    requestAnimationFrame(() => {
      animationReady.value = true
    })
  })
})

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
.over-quota-row {
  background: rgba(193, 0, 21, 0.04);
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
