<template>
  <div class="wf-map-wrap">
    <div class="wf-gap-badge">
      Nguồn đáp ứng:
      <span class="text-warning wf-gap-part">
        Thiếu {{ formatQty(summary.shortage_cones) }}
        <AppTooltip max-width="420px">
          <div>{{ SHORTAGE_HINT }}</div>
          <div>Số dòng thiếu: {{ shortageRows.length }}</div>
          <div
            v-for="row in topShortageRows"
            :key="row.row_key"
          >
            • {{ formatTraceRowLabel(row) }}: {{ formatQty(row.assignment_gap_cones) }}
          </div>
        </AppTooltip>
      </span>
      ·
      <span class="text-negative wf-gap-part">
        Dư {{ formatQty(summary.surplus_cones) }}
        <AppTooltip max-width="420px">
          <div>{{ SURPLUS_HINT }}</div>
          <div>Số dòng dư: {{ surplusRows.length }}</div>
          <div
            v-for="row in topSurplusRows"
            :key="row.row_key"
          >
            • {{ formatTraceRowLabel(row) }}: {{ formatQty(-row.assignment_gap_cones) }}{{ row.unplanned ? ' ⚠' : '' }}
          </div>
          <div v-if="summary.unplanned_row_count > 0">
            Có {{ summary.unplanned_row_count }} dòng lệch màu (⚠): Dư của các dòng này bù cho Thiếu của dòng kế hoạch cùng loại chỉ.
          </div>
        </AppTooltip>
      </span>
      <span
        class="wf-gap-part"
        :class="getGapClass(summary.assignment_gap_cones)"
      >
        (ròng: {{ formatGapQty(summary.assignment_gap_cones) }})
        <AppTooltip max-width="420px">{{ NET_GAP_HINT }}</AppTooltip>
      </span>
      <q-icon
        name="o_info"
        size="14px"
      >
        <AppTooltip max-width="420px">
          <div
            v-for="line in GAP_HINT_LINES"
            :key="line"
          >
            {{ line }}
          </div>
        </AppTooltip>
      </q-icon>
    </div>
    <div
      v-if="summary.unplanned_row_count > 0"
      class="wf-gap-badge q-ml-sm text-warning"
    >
      <q-icon name="o_warning" />
      {{ summary.unplanned_row_count }} dòng lệch màu so với kế hoạch
      <AppTooltip>{{ UNPLANNED_ROW_HINT }}</AppTooltip>
    </div>
    <div
      ref="containerRef"
      class="wf-map"
    >
      <svg
        class="wf-edges"
        :width="svgWidth"
        :height="svgHeight"
      >
        <defs>
          <marker
            v-for="(color, state) in ARROW_COLORS"
            :id="`wf-arrow-${state}`"
            :key="state"
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
          >
            <path
              d="M 0 0 L 8 4 L 0 8 z"
              :fill="color"
            />
          </marker>
        </defs>
        <path
          v-for="(edge, index) in edgePaths"
          :key="index"
          :d="edge.d"
          class="wf-edge"
          :class="[`wf-edge--${edgeStateOf(edge)}`, { 'wf-edge--dim': isEdgeDimmed(edge) }]"
          :marker-end="`url(#wf-arrow-${edgeStateOf(edge)})`"
        />
        <text
          v-for="(edge, index) in labeledEdges"
          :key="`label-${index}`"
          :x="edge.labelX"
          :y="edge.labelY"
          class="wf-edge-label"
          :class="{ 'wf-edge-label--dim': isEdgeDimmed(edge) }"
        >
          {{ edge.label }}
        </text>
      </svg>
      <WorkflowNode
        v-for="node in nodes"
        :key="node.key"
        :ref="setNodeRef(node.key)"
        :style="{ gridArea: node.key }"
        :title="node.title"
        :icon="node.icon"
        :kind="node.kind"
        :hint="node.hint"
        :state="node.state"
        :value="node.value"
        :sub-lines="node.subLines"
        :status-chip="node.statusChip"
        :decision="node.decision"
        :selected="selectedNode === node.key"
        :clickable="node.clickable"
        :dimmed="isNodeDimmed(node.key)"
        :link-to="node.linkTo"
        @select="onSelect(node.key)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type ComponentPublicInstance } from 'vue'
import type { WeeklyOrderProcessTraceResponse } from '@/types/thread'
import WorkflowNode, { type WorkflowNodeSubLine } from './WorkflowNode.vue'
import AppTooltip from '@/components/ui/dialogs/AppTooltip.vue'
import { formatQty, formatGapQty, getGapClass, getWeekStatusChip, formatTraceRowLabel, WORKFLOW_NODE_META, UNPLANNED_ROW_HINT, GAP_HINT_LINES, SHORTAGE_HINT, SURPLUS_HINT, NET_GAP_HINT, type WorkflowNodeKind } from './workflow-format'

const props = defineProps<{
  trace: WeeklyOrderProcessTraceResponse
  selectedNode: string | null
}>()

const emit = defineEmits<{
  (e: 'select-node', key: string | null): void
}>()

interface MapNode {
  key: string
  title: string
  icon: string
  state: 'idle' | 'active' | 'done'
  value?: string
  subLines?: WorkflowNodeSubLine[]
  kind?: WorkflowNodeKind
  hint?: string
  statusChip?: { label: string; color: string } | null
  decision?: boolean
  clickable: boolean
  linkTo?: string
}

interface MapEdge {
  from: string
  to: string
  label?: string
}

const EDGES: MapEdge[] = [
  { from: 'order', to: 'check' },
  { from: 'check', to: 'supplier', label: 'Không đủ tồn' },
  { from: 'check', to: 'reserve', label: 'Có tồn' },
  { from: 'supplier', to: 'delivery' },
  { from: 'delivery', to: 'receiving' },
  { from: 'receiving', to: 'received' },
  { from: 'received', to: 'warehouse' },
  { from: 'reserve', to: 'warehouse' },
  { from: 'warehouse', to: 'issue' },
  { from: 'issue', to: 'return' },
]

const ARROW_COLORS: Record<'idle' | 'active' | 'done', string> = {
  idle: '#90a4ae',
  active: '#fb8c00',
  done: '#43a047',
}

const summary = computed(() => props.trace.summary)

const TOP_GAP_ROW_LIMIT = 5

const shortageRows = computed(() => props.trace.rows
  .filter(row => row.assignment_gap_cones > 0)
  .sort((a, b) => b.assignment_gap_cones - a.assignment_gap_cones))
const surplusRows = computed(() => props.trace.rows
  .filter(row => row.assignment_gap_cones < 0)
  .sort((a, b) => a.assignment_gap_cones - b.assignment_gap_cones))
const topShortageRows = computed(() => shortageRows.value.slice(0, TOP_GAP_ROW_LIMIT))
const topSurplusRows = computed(() => surplusRows.value.slice(0, TOP_GAP_ROW_LIMIT))

const warehouseCount = computed(() => {
  const ids = new Set<number>()
  for (const row of props.trace.rows) {
    for (const warehouse of row.warehouses) {
      if (warehouse.equivalent_cones > 0) ids.add(warehouse.warehouse_id)
    }
  }
  return ids.size
})

const nodes = computed<MapNode[]>(() => {
  const s = summary.value
  const weekStatus = props.trace.week.status
  const fromStock = s.reserved_by_source.from_stock_cones
  const supplierSubLines: WorkflowNodeSubLine[] = s.cancelled_ncc_cones > 0
    ? [{ label: 'Đã hủy', value: formatQty(s.cancelled_ncc_cones) }]
    : []
  const reserveSubLines: WorkflowNodeSubLine[] = s.stock_withdraw_logged_cones > 0
    ? [{ label: 'Rút tồn đã ghi nhận', value: formatQty(s.stock_withdraw_logged_cones) }]
    : []
  const warehouseSubLines: WorkflowNodeSubLine[] = [
    { label: 'Từ NCC nhập', value: formatQty(s.reserved_by_source.from_receive_cones) },
    { label: 'Từ tồn kho', value: formatQty(fromStock) },
    { label: 'Từ tuần khác', value: formatQty(s.reserved_by_source.from_other_week_cones) },
    { label: 'Cuộn vật lý', value: formatQty(s.reserved_physical_cones) },
    { label: 'Số kho', value: formatQty(warehouseCount.value) },
  ]
  if (s.lent_out_cones > 0) warehouseSubLines.push({ label: 'Cho tuần khác mượn', value: formatQty(s.lent_out_cones) })
  if (s.released_cones > 0) warehouseSubLines.push({ label: 'Đã nhả về tồn', value: formatQty(s.released_cones) })
  if (s.transferred_out_cones > 0) warehouseSubLines.push({ label: 'Chuyển sang tuần khác', value: formatQty(s.transferred_out_cones) })
  const issueSubLines: WorkflowNodeSubLine[] = [
    { label: 'Từ kho tuần', value: formatQty(s.issued_from_reserved_cones) },
    { label: 'Xuất chỉ khả dụng', value: formatQty(s.issued_from_available_cones) },
  ]
  if (s.issued_from_other_week_reserved_cones > 0) {
    issueSubLines.push({ label: 'Từ giữ tuần khác', value: formatQty(s.issued_from_other_week_reserved_cones) })
  }
  return withMeta([
    {
      key: 'order',
      title: 'Đơn Đặt Hàng',
      icon: 'o_shopping_cart',
      state: weekStatus === 'DRAFT' ? 'active' : weekStatus === 'CANCELLED' ? 'idle' : 'done',
      value: formatQty(s.required_cones),
      subLines: [
        { label: 'Đặt thêm', value: formatQty(s.additional_order_cones) },
        { label: 'Tổng cần', value: formatQty(s.assignment_target_cones) },
      ],
      statusChip: getWeekStatusChip(weekStatus),
      clickable: false,
      linkTo: `/thread/weekly-order/${props.trace.week.id}`,
    },
    {
      key: 'check',
      title: 'Kiểm Tồn Kho',
      icon: 'o_alt_route',
      state: s.assignment_target_cones > 0 ? 'done' : 'idle',
      subLines: [
        { label: 'Đặt NCC', value: formatQty(s.ordered_ncc_cones) },
        { label: 'Giữ từ tồn', value: formatQty(fromStock) },
      ],
      decision: true,
      clickable: false,
    },
    {
      key: 'supplier',
      title: 'Đặt NCC',
      icon: 'o_store',
      state: s.ordered_ncc_cones > 0 ? 'done' : 'idle',
      value: formatQty(s.ordered_ncc_cones),
      subLines: supplierSubLines,
      clickable: true,
    },
    {
      key: 'delivery',
      title: 'Chờ NCC Giao',
      icon: 'o_local_shipping',
      state: s.pending_delivery_cones > 0 ? 'active' : s.ordered_ncc_cones > 0 ? 'done' : 'idle',
      value: formatQty(s.pending_delivery_cones),
      clickable: true,
      linkTo: '/thread/weekly-order/deliveries',
    },
    {
      key: 'receiving',
      title: 'Đã Giao – Chờ Nhập',
      icon: 'o_move_to_inbox',
      state: s.pending_receive_cones > 0 ? 'active' : s.received_cones > 0 ? 'done' : 'idle',
      value: formatQty(s.pending_receive_cones),
      clickable: true,
      linkTo: '/thread/weekly-order/deliveries',
    },
    {
      key: 'received',
      title: 'Đã Nhập Kho',
      icon: 'o_inventory',
      state: s.received_cones > 0 ? 'done' : 'idle',
      value: formatQty(s.received_cones),
      clickable: true,
    },
    {
      key: 'reserve',
      title: 'Giữ Từ Tồn Kho',
      icon: 'o_unarchive',
      state: fromStock > 0 ? 'done' : 'idle',
      value: formatQty(fromStock),
      subLines: reserveSubLines,
      clickable: true,
    },
    {
      key: 'warehouse',
      title: 'Kho Tuần',
      icon: 'o_warehouse',
      state: s.reserved_cones > 0 ? 'done' : 'idle',
      value: formatQty(s.reserved_cones),
      subLines: warehouseSubLines,
      clickable: true,
      linkTo: '/thread/transfer-reserved',
    },
    {
      key: 'issue',
      title: 'Xuất Kho',
      icon: 'o_output',
      state: s.issued_gross_cones > 0 ? (s.reserved_cones > 0 ? 'active' : 'done') : 'idle',
      value: formatQty(s.issued_gross_cones),
      subLines: issueSubLines,
      clickable: true,
      linkTo: '/thread/issues/v2',
    },
    {
      key: 'return',
      title: 'Trả Kho',
      icon: 'o_assignment_return',
      state: s.returned_cones > 0 ? 'done' : 'idle',
      value: formatQty(s.returned_cones),
      clickable: true,
      linkTo: '/thread/return',
    },
  ])
})

function withMeta(list: MapNode[]): MapNode[] {
  return list.map(node => ({ ...node, ...WORKFLOW_NODE_META[node.key] }))
}

function onSelect(key: string) {
  emit('select-node', props.selectedNode === key ? null : key)
}

const nodeStates = computed(() => {
  const map = new Map<string, 'idle' | 'active' | 'done'>()
  for (const node of nodes.value) map.set(node.key, node.state)
  return map
})

function edgeClosure(start: string, direction: 'forward' | 'backward'): Set<string> {
  const keys = new Set<string>([start])
  let changed = true
  while (changed) {
    changed = false
    for (const edge of EDGES) {
      const [src, dst] = direction === 'forward' ? [edge.from, edge.to] : [edge.to, edge.from]
      if (keys.has(src) && !keys.has(dst)) {
        keys.add(dst)
        changed = true
      }
    }
  }
  return keys
}

const highlightKeys = computed(() => {
  if (!props.selectedNode) return null
  const keys = edgeClosure(props.selectedNode, 'forward')
  for (const key of edgeClosure(props.selectedNode, 'backward')) keys.add(key)
  return keys
})

function isNodeDimmed(key: string): boolean {
  return highlightKeys.value !== null && !highlightKeys.value.has(key)
}

function edgeStateOf(edge: { from: string; to: string }): 'idle' | 'active' | 'done' {
  return nodeStates.value.get(edge.to) ?? 'idle'
}

function isEdgeDimmed(edge: { from: string; to: string }): boolean {
  const keys = highlightKeys.value
  return keys !== null && !(keys.has(edge.from) && keys.has(edge.to))
}

const containerRef = ref<HTMLElement | null>(null)
const nodeEls = new Map<string, HTMLElement>()
const svgWidth = ref(0)
const svgHeight = ref(0)

interface EdgePath {
  d: string
  from: string
  to: string
  label?: string
  labelX: number
  labelY: number
}

const edgePaths = ref<EdgePath[]>([])
const labeledEdges = computed(() => edgePaths.value.filter(edge => edge.label))

function setNodeRef(key: string) {
  return (el: ComponentPublicInstance | Element | null) => {
    if (!el) {
      nodeEls.delete(key)
      return
    }
    const dom = (el as ComponentPublicInstance).$el ?? el
    nodeEls.set(key, dom as HTMLElement)
  }
}

function computePaths() {
  const container = containerRef.value
  if (!container) return
  const containerRect = container.getBoundingClientRect()
  svgWidth.value = container.scrollWidth
  svgHeight.value = container.scrollHeight
  const paths: EdgePath[] = []
  for (const edge of EDGES) {
    const fromEl = nodeEls.get(edge.from)
    const toEl = nodeEls.get(edge.to)
    if (!fromEl || !toEl) continue
    const from = fromEl.getBoundingClientRect()
    const to = toEl.getBoundingClientRect()
    const x1 = from.right - containerRect.left
    const y1 = from.top + from.height / 2 - containerRect.top
    const x2 = to.left - containerRect.left
    const y2 = to.top + to.height / 2 - containerRect.top
    const dx = Math.max(24, Math.min(60, (x2 - x1) / 2))
    paths.push({
      d: `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`,
      from: edge.from,
      to: edge.to,
      label: edge.label,
      labelX: x1 + 10,
      labelY: (y1 + y2) / 2 - 6,
    })
  }
  edgePaths.value = paths
}

function onWindowResize() {
  computePaths()
}

onMounted(() => {
  void nextTick(computePaths)
  window.addEventListener('resize', onWindowResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResize)
})

watch(() => props.trace, () => {
  void nextTick(computePaths)
})
</script>

<style scoped lang="scss">
.wf-map-wrap {
  position: relative;
  overflow-x: auto;
  padding-top: 4px;
}

.wf-gap-badge {
  position: sticky;
  left: 0;
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 4px 10px;
  background: #fff;
  margin-bottom: 8px;
}

.wf-gap-part {
  cursor: help;
  border-bottom: 1px dotted currentColor;
}

.wf-map {
  position: relative;
  display: grid;
  grid-template-columns: repeat(9, minmax(150px, 1fr));
  grid-template-areas:
    '.     .     supplier delivery receiving received .         .     .'
    'order check .        .        .         .        warehouse issue return'
    '.     .     reserve  .        .         .        .         .     .';
  column-gap: 44px;
  row-gap: 44px;
  align-items: center;
  justify-items: stretch;
  min-width: 1500px;
  padding: 8px 4px 12px;
}

.wf-edges {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.wf-edge {
  fill: none;
  stroke: #90a4ae;
  stroke-width: 2;
  transition: opacity 0.25s ease, stroke 0.25s ease;
}

.wf-edge--active {
  stroke: #fb8c00;
  stroke-dasharray: 7 5;
  animation: wf-flow 0.8s linear infinite;
}

.wf-edge--done {
  stroke: #43a047;
}

.wf-edge--dim {
  opacity: 0.15;
}

@keyframes wf-flow {
  to {
    stroke-dashoffset: -12;
  }
}

.wf-edge-label {
  font-size: 11px;
  font-weight: 600;
  fill: #607d8b;
  transition: opacity 0.25s ease;
}

.wf-edge-label--dim {
  opacity: 0.2;
}
</style>
