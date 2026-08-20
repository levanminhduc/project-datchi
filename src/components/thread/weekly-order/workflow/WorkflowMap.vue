<template>
  <div class="wf-map-wrap">
    <div
      class="wf-gap-badge"
      :class="getGapClass(summary.assignment_gap_cones)"
    >
      Nguồn đáp ứng: {{ formatGapQty(summary.assignment_gap_cones) }}
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
import { formatQty, formatGapQty, getGapClass, getWeekStatusChip } from './workflow-format'

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

const orderedFromNcc = computed(() =>
  props.trace.rows.reduce((sum, row) =>
    sum + row.delivery_lines.reduce((lineSum, line) =>
      line.status === 'CANCELLED' ? lineSum : lineSum + line.quantity_cones, 0), 0))

const stockWithdraw = computed(() =>
  Math.max(0, summary.value.assignment_target_cones - orderedFromNcc.value))

const warehouseBreakdown = computed(() => {
  const byId = new Map<number, { name: string; cones: number }>()
  for (const row of props.trace.rows) {
    for (const warehouse of row.warehouses) {
      const entry = byId.get(warehouse.warehouse_id)
      if (entry) {
        entry.cones += warehouse.equivalent_cones
      } else {
        byId.set(warehouse.warehouse_id, {
          name: warehouse.warehouse_name || warehouse.warehouse_code || `Kho ${warehouse.warehouse_id}`,
          cones: warehouse.equivalent_cones,
        })
      }
    }
  }
  return Array.from(byId.values())
    .filter(entry => entry.cones > 0)
    .sort((a, b) => b.cones - a.cones)
})

const warehouseSubLines = computed<WorkflowNodeSubLine[]>(() => {
  const list = warehouseBreakdown.value
  const lines = list.slice(0, 3).map(entry => ({ label: entry.name, value: formatQty(entry.cones) }))
  if (list.length > 3) {
    const rest = list.slice(3).reduce((sum, entry) => sum + entry.cones, 0)
    lines.push({ label: `+${list.length - 3} kho khác`, value: formatQty(rest) })
  }
  return lines
})

const nodes = computed<MapNode[]>(() => {
  const s = summary.value
  const weekStatus = props.trace.week.status
  return [
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
        { label: 'Đặt NCC', value: formatQty(orderedFromNcc.value) },
        { label: 'Rút tồn', value: formatQty(stockWithdraw.value) },
      ],
      decision: true,
      clickable: false,
    },
    {
      key: 'supplier',
      title: 'Đặt NCC',
      icon: 'o_store',
      state: orderedFromNcc.value > 0 ? 'done' : 'idle',
      value: formatQty(orderedFromNcc.value),
      clickable: true,
    },
    {
      key: 'delivery',
      title: 'Chờ NCC Giao',
      icon: 'o_local_shipping',
      state: s.pending_delivery_cones > 0 ? 'active' : orderedFromNcc.value > 0 ? 'done' : 'idle',
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
      title: 'Rút Tồn Kho',
      icon: 'o_unarchive',
      state: stockWithdraw.value > 0 ? 'done' : 'idle',
      value: formatQty(stockWithdraw.value),
      clickable: true,
    },
    {
      key: 'warehouse',
      title: 'Kho Tuần',
      icon: 'o_warehouse',
      state: s.reserved_cones > 0 ? 'done' : 'idle',
      value: formatQty(s.reserved_cones),
      subLines: [
        ...warehouseSubLines.value,
        { label: 'Cuộn vật lý', value: formatQty(s.reserved_physical_cones) },
      ],
      clickable: true,
      linkTo: '/thread/transfer-reserved',
    },
    {
      key: 'issue',
      title: 'Xuất Kho',
      icon: 'o_output',
      state: s.issued_gross_cones > 0 ? (s.reserved_cones > 0 ? 'active' : 'done') : 'idle',
      value: formatQty(s.issued_gross_cones),
      subLines: [
        { label: 'Từ kho tuần', value: formatQty(s.issued_from_reserved_cones) },
        { label: 'Xuất chỉ khả dụng', value: formatQty(s.issued_from_available_cones) },
      ],
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
  ]
})

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
