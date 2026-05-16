<template>
  <q-card
    flat
    bordered
    class="q-mb-lg"
  >
    <q-card-section>
      <div class="row items-center q-mb-sm">
        <div class="text-subtitle2 text-weight-medium col">
          Tiến Độ Xuất Chỉ
        </div>
        <div class="row q-gutter-sm items-center">
          <AppSelect
            v-model="departmentFilter"
            :options="departmentOptions"
            label="Bộ Phận"
            dense
            clearable
            hide-bottom-space
            emit-value
            map-options
            style="min-width: 160px"
            @update:model-value="handleDeptChange"
          />
          <AppButton
            flat
            dense
            size="sm"
            icon="refresh"
            :loading="loading"
            @click="loadData"
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
          Chưa có tuần đặt hàng đã xác nhận
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
            :key="po.po_id"
            group="activity-po"
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
                  <span>Đã xuất: <strong class="text-positive">{{ po.summary.total_net_issued }}</strong></span>
                  <span class="text-grey-5">&middot;</span>
                  <span :class="po.summary.total_pending_cones > 0 ? 'text-warning' : 'text-positive'">
                    Còn lại: <strong>{{ po.summary.total_pending_cones }}</strong>
                  </span>
                  <span
                    v-if="po.last_issued_at"
                    class="text-grey-6"
                  >
                    &middot; {{ relativeTime(po.last_issued_at) }}
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
                <div
                  v-for="style in po.styles"
                  :key="style.style_id"
                  class="style-group"
                >
                  <div
                    class="style-header q-px-md q-py-sm cursor-pointer"
                    @click="handleStyleClick(po, style)"
                  >
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
                        <span class="text-caption text-grey-7 ellipsis">{{ style.style_colors.map(sc => sc.name).join(', ') }}</span>
                      </template>
                      <q-space />
                      <q-icon
                        v-if="canQuickFill"
                        name="arrow_forward"
                        size="16px"
                        color="primary"
                      />
                      <q-icon
                        v-else
                        name="lock"
                        size="14px"
                        color="grey-5"
                      />
                    </div>
                    <div class="text-caption text-grey-7 q-mt-xs">
                      Cần: <strong>{{ style.summary.total_quota_cones }}</strong>
                      <span class="text-grey-5 q-mx-xs">&middot;</span>
                      Xuất: <strong class="text-positive">{{ style.summary.total_net_issued }}</strong>
                      <span class="text-grey-5 q-mx-xs">&middot;</span>
                      <span :class="style.summary.total_pending_cones > 0 ? 'text-warning' : 'text-positive'">
                        Còn: <strong>{{ style.summary.total_pending_cones }}</strong>
                      </span>
                    </div>
                    <q-tooltip v-if="!canQuickFill">
                      Vui lòng hoàn thành Bước 1 trước
                    </q-tooltip>
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
                        <td
                          class="text-right"
                          :class="line.pending_cones > 0 ? 'text-warning text-weight-medium' : 'text-positive'"
                        >
                          <template v-if="line.net_issued > line.quota_cones">
                            <span class="text-negative text-weight-medium">+{{ roundTwo(line.net_issued - line.quota_cones) }}</span>
                          </template>
                          <template v-else>
                            {{ line.pending_cones }}
                          </template>
                        </td>
                      </tr>
                    </tbody>
                  </q-markup-table>
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </q-list>

        <div
          v-if="totalPages > 1"
          class="row justify-center q-mt-md items-center q-gutter-sm"
        >
          <q-pagination
            v-model="page"
            :max="totalPages"
            :max-pages="7"
            direction-links
            boundary-links
            @update:model-value="loadData"
          />
          <span class="text-caption text-grey-7">Tổng: {{ total }} PO</span>
        </div>
      </template>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import type { IssueActivityPo, IssueActivityStyle } from '@/types/thread/issueV2'
import { issueV2Service } from '@/services/issueV2Service'
import { employeeService } from '@/services/employeeService'
import { useSnackbar } from '@/composables/useSnackbar'
import { getProductionStatus } from '@/utils/production-status'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppTooltip from '@/components/ui/dialogs/AppTooltip.vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'

const props = defineProps<{
  canQuickFill: boolean
}>()

const emit = defineEmits<{
  (e: 'select', payload: { poId: number; styleId: number; colorIds: number[] }): void
}>()

const snackbar = useSnackbar()

const pos = ref<IssueActivityPo[]>([])
const loading = ref(false)
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const departmentFilter = ref<string | null>(null)
const departmentOptions = ref<{ value: string; label: string }[]>([])

const totalPages = computed(() => Math.ceil(total.value / limit.value))

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

function getPoStatus(po: IssueActivityPo) {
  return getProductionStatus(po.summary)
}

function roundTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Vừa xong'
  if (diffMin < 60) return `${diffMin} phút trước`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} giờ trước`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay} ngày trước`
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

function handleStyleClick(po: IssueActivityPo, style: IssueActivityStyle) {
  if (!props.canQuickFill) return
  const colorIds = style.style_colors.map(sc => sc.style_color_id)
  emit('select', { poId: po.po_id, styleId: style.style_id, colorIds })
}

function handleDeptChange() {
  page.value = 1
  loadData()
}

async function loadData() {
  loading.value = true
  try {
    const result = await issueV2Service.getIssueActivity(page.value, limit.value, departmentFilter.value ?? undefined)
    pos.value = result.pos
    total.value = result.total
    if (pos.value.length > 0) triggerAnimation()
  } catch (err) {
    console.error('[IssueActivityPanel] load failed:', err)
    snackbar.error('Không thể tải tiến độ xuất chỉ')
  } finally {
    loading.value = false
  }
}

async function loadDepartments() {
  try {
    const depts = await employeeService.getIssueDepartments()
    departmentOptions.value = depts.map(d => ({ value: d, label: d }))
  } catch {
    // silent
  }
}

onMounted(() => {
  loadData()
  loadDepartments()
})

watch(() => pos.value.length, (newLen, oldLen) => {
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
.style-group {
  &:not(:last-child) {
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }
}
.style-header {
  background: #fafafa;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  &:hover {
    background: #f0f0f0;
  }
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
