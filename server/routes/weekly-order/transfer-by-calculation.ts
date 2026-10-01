import { Hono } from 'hono'
import { query, queryOne } from '../../db/query'
import { requirePermission } from '../../middleware/auth'
import type { AppEnv } from '../../types/hono-env'
import {
  transferByCalculationQuerySchema,
  threadTransferHistoryQuerySchema,
  poTransferHistoryQuerySchema,
} from '../../validation/transferByCalculationSchema'
import { type QuotaMeterGroup, addQuotaMeters, applyQuotaMeterGroups } from './progress-helpers'

type CalculationDataRow = {
  style_id: number
  calculations: Array<{
    spec_id?: number
    thread_type_id: number
    tex_number: string
    supplier_id: number
    supplier_name: string
    color_breakdown: Array<{
      color_id: number
      color_name: string
      thread_color: string | null
      thread_color_id?: number | null
      thread_type_id: number
      supplier_name: string
      tex_number: string
      total_meters: number
      meters_per_cone: number
      meters_per_unit: number
    }>
  }>
}

type ThreadOrderItem = {
  id: number
  po_id: number | null
  style_color_id: number
  style_id: number | null
  quantity: number
}

type SpecRow = {
  style_color_id: number
  style_thread_spec_id: number
  thread_type_id: number
  thread_color_id: number
}

type InventoryAggRow = {
  thread_type_id: number
  color_id: number | null
  count: number
}

export async function fetchCalculationData(weekId: number) {
  const data = await queryOne<{ calculation_data: unknown; summary_data: unknown }>(
    `SELECT calculation_data, summary_data FROM thread_order_results
     WHERE week_id = $1 LIMIT 1`,
    [weekId],
  )
  const rawCalc = data?.calculation_data
  const rawSummary = data?.summary_data
  return {
    calculation_data: (Array.isArray(rawCalc) ? rawCalc : []) as CalculationDataRow[],
    summary_data: (Array.isArray(rawSummary) ? rawSummary : []) as Array<{
      thread_type_id: number
      thread_color: string | null
      thread_color_id?: number | null
      total_meters?: number | null
      meters_per_cone?: number | null
      total_cones?: number | null
      quota_cones?: number | null
      additional_order?: number | null
      total_final?: number | null
      tex_number: string
      supplier_name: string
    }>,
  }
}

export async function fetchOrderItems(weekId: number) {
  const data = await query<ThreadOrderItem>(
    `SELECT id, po_id, style_color_id, style_id, quantity FROM thread_order_items
     WHERE week_id = $1 ORDER BY id ASC LIMIT 10000`,
    [weekId],
  )
  return (data ?? []) as ThreadOrderItem[]
}

export async function fetchColorNameToIdMap(threadColorIds: number[]) {
  if (threadColorIds.length === 0) return new Map<string, number>()
  const data = await query<{ id: number; name: string }>(
    `SELECT id, name FROM colors WHERE id = ANY($1) LIMIT $2`,
    [threadColorIds, threadColorIds.length],
  )
  const map = new Map<string, number>()
  for (const row of (data ?? []) as Array<{ id: number; name: string }>) {
    map.set(row.name, row.id)
  }
  return map
}

export async function fetchSpecsByStyleColors(styleColorIds: number[]) {
  if (styleColorIds.length === 0) return []
  const data = await query<SpecRow>(
    `SELECT style_color_id, style_thread_spec_id, thread_type_id, thread_color_id
     FROM style_color_thread_specs WHERE style_color_id = ANY($1) LIMIT 10000`,
    [styleColorIds],
  )
  return (data ?? []) as SpecRow[]
}

async function fetchInventoryAgg(weekId: number, warehouseId: number) {
  const data = await query<{ thread_type_id: number; color_id: number | null }>(
    `SELECT thread_type_id, color_id FROM thread_inventory
     WHERE reserved_week_id = $1 AND warehouse_id = $2 AND status = 'RESERVED_FOR_ORDER'
     LIMIT 500000`,
    [weekId, warehouseId],
  )
  const map = new Map<string, InventoryAggRow>()
  for (const row of (data ?? []) as Array<{ thread_type_id: number; color_id: number | null }>) {
    const key = `${row.thread_type_id}_${row.color_id ?? ''}`
    const existing = map.get(key)
    if (existing) {
      existing.count++
    } else {
      map.set(key, { thread_type_id: row.thread_type_id, color_id: row.color_id, count: 1 })
    }
  }
  return map
}

type ThreadKey = string

type AggregatedThread = {
  thread_type_id: number
  thread_color_id: number
  supplier_name: string
  tex_number: string
  color_name: string
  quota_cones: number
}

export function buildPoQuotaMap(
  orderItems: ThreadOrderItem[],
  specs: SpecRow[],
  calcData: CalculationDataRow[],
  colorByName: Map<string, number>,
  colorById: Map<number, string>,
): {
  poOrder: Array<{ po_id: number | null; po_number: null; display_order: number }>
  poStyleMap: Map<number | null, Set<number>>
  poStyleColorMap: Map<number | null, Set<number>>
  poQuotaMap: Map<number | null, Map<ThreadKey, AggregatedThread>>
} {
  const specByStyleColor = new Map<number, SpecRow[]>()
  for (const s of specs) {
    const arr = specByStyleColor.get(s.style_color_id) ?? []
    arr.push(s)
    specByStyleColor.set(s.style_color_id, arr)
  }

  const calcByStyle = new Map<number, CalculationDataRow>()
  for (const c of calcData) calcByStyle.set(c.style_id, c)

  const poStyleMap = new Map<number | null, Set<number>>()
  const poStyleColorMap = new Map<number | null, Set<number>>()
  const poQuotaMap = new Map<number | null, Map<ThreadKey, AggregatedThread>>()
  const poDisplayOrder = new Map<number | null, number>()
  const quotaMeterGroups = new Map<string, QuotaMeterGroup>()

  for (const item of orderItems) {
    const poId = item.po_id ?? null
    if (!poDisplayOrder.has(poId)) {
      poDisplayOrder.set(poId, poDisplayOrder.size + 1)
    }
    if (!poStyleMap.has(poId)) poStyleMap.set(poId, new Set())
    if (!poStyleColorMap.has(poId)) poStyleColorMap.set(poId, new Set())
    if (!poQuotaMap.has(poId)) poQuotaMap.set(poId, new Map())

    if (item.style_id != null) poStyleMap.get(poId)!.add(item.style_id)
    poStyleColorMap.get(poId)!.add(item.style_color_id)

    const itemSpecs = specByStyleColor.get(item.style_color_id) ?? []
    const calcRow = item.style_id != null ? calcByStyle.get(item.style_id) : undefined
    if (!calcRow) continue

    for (const spec of itemSpecs) {
      const calcEntry = calcRow.calculations.find(c => c.spec_id === spec.style_thread_spec_id)
      const matchColor = calcEntry?.color_breakdown.find(cb =>
        cb.color_id === item.style_color_id &&
        cb.thread_type_id === spec.thread_type_id &&
        (
          cb.thread_color_id === spec.thread_color_id ||
          (
            cb.thread_color_id == null &&
            cb.thread_color != null &&
            colorByName.get(cb.thread_color) === spec.thread_color_id
          )
        ),
      )
      if (!matchColor) continue

      const meters = (matchColor.meters_per_unit ?? 0) * (item.quantity ?? 0)
      if (meters <= 0 || matchColor.meters_per_cone <= 0) continue
      const supplierName = matchColor.supplier_name || calcEntry?.supplier_name || ''
      const texNumber = matchColor.tex_number || calcEntry?.tex_number || ''

      const key: ThreadKey = `${spec.thread_type_id}_${spec.thread_color_id}`
      const quotaMap = poQuotaMap.get(poId)!
      let thread = quotaMap.get(key)
      if (!thread) {
        thread = {
          thread_type_id: spec.thread_type_id,
          thread_color_id: spec.thread_color_id,
          supplier_name: supplierName,
          tex_number: texNumber,
          color_name: colorById.get(spec.thread_color_id) ?? '',
          quota_cones: 0,
        }
        quotaMap.set(key, thread)
      }
      addQuotaMeters(
        quotaMeterGroups,
        `${poId ?? 'null'}_${item.style_color_id}_${key}`,
        thread,
        meters,
        matchColor.meters_per_cone,
      )
    }
  }

  applyQuotaMeterGroups(quotaMeterGroups)

  const poOrder = Array.from(poDisplayOrder.entries())
    .sort((a, b) => a[1] - b[1])
    .map(([po_id, display_order]) => ({ po_id, po_number: null, display_order }))

  return { poOrder, poStyleMap, poStyleColorMap, poQuotaMap }
}

function applySequentialAllocation(
  poOrder: Array<{ po_id: number | null; display_order: number }>,
  poQuotaMap: Map<number | null, Map<ThreadKey, AggregatedThread>>,
  inventoryAtDest: Map<string, InventoryAggRow>,
): {
  transferredByPoThread: Map<string, number>
  overflowByThread: Map<ThreadKey, number>
} {
  const transferredByPoThread = new Map<string, number>()
  const overflowByThread = new Map<ThreadKey, number>()

  const allKeys = new Set<ThreadKey>()
  for (const map of poQuotaMap.values()) for (const k of map.keys()) allKeys.add(k)

  for (const key of allKeys) {
    const destEntry = inventoryAtDest.get(key)
    let remaining = destEntry?.count ?? 0
    const posWithThread = poOrder.filter(po => {
      const entry = poQuotaMap.get(po.po_id)?.get(key)
      return entry != null && entry.quota_cones > 0
    })
    for (let i = 0; i < posWithThread.length; i++) {
      const po = posWithThread[i]
      const quotaEntry = poQuotaMap.get(po.po_id)!.get(key)!
      const isLast = i === posWithThread.length - 1
      const fulfilled = isLast ? remaining : Math.min(remaining, quotaEntry.quota_cones)
      transferredByPoThread.set(`${po.po_id ?? 'null'}_${key}`, fulfilled)
      remaining -= fulfilled
      if (!isLast && remaining === 0) break
    }
  }

  for (const [key, destEntry] of inventoryAtDest) {
    if (!allKeys.has(key)) {
      overflowByThread.set(key, destEntry.count)
    }
  }
  return { transferredByPoThread, overflowByThread }
}

type LastTransferEntry = {
  transferred_at: string
  by_user_name: string
  full_cones: number
  partial_cones: number
}

async function fetchLastTransferMap(weekId: number) {
  // batch_transactions stores cone_ids[] — no per-thread table.
  // We join thread_inventory via unnest to get thread_type_id/color_id per cone.
  const data = await query<{
    id: number
    performed_at: string
    performed_by: string | null
    cone_ids: number[]
  }>(
    `SELECT id, performed_at, performed_by, cone_ids FROM batch_transactions
     WHERE operation_type = 'TRANSFER' AND notes LIKE $1
     ORDER BY performed_at DESC LIMIT 2000`,
    [`%Tuần #${weekId}%`],
  )

  if (!data || data.length === 0) return new Map<ThreadKey, LastTransferEntry>()

  const allConeIds: number[] = []
  const txByConeId = new Map<
    number,
    { performed_at: string; performed_by: string | null }
  >()
  for (const tx of data as Array<{
    id: number
    performed_at: string
    performed_by: string | null
    cone_ids: number[]
  }>) {
    for (const coneId of tx.cone_ids ?? []) {
      if (!txByConeId.has(coneId)) {
        txByConeId.set(coneId, {
          performed_at: tx.performed_at,
          performed_by: tx.performed_by,
        })
        allConeIds.push(coneId)
      }
    }
  }

  if (allConeIds.length === 0) return new Map<ThreadKey, LastTransferEntry>()

  // Keep the .in() URL below PostgREST URI limits for weeks with many transfers.
  const CHUNK = 500
  const coneDetails: Array<{
    id: number
    thread_type_id: number
    color_id: number | null
    is_partial: boolean
  }> = []
  for (let i = 0; i < allConeIds.length; i += CHUNK) {
    const chunk = allConeIds.slice(i, i + CHUNK)
    const rows = await query<{
      id: number
      thread_type_id: number
      color_id: number | null
      is_partial: boolean
    }>(
      `SELECT id, thread_type_id, color_id, is_partial FROM thread_inventory
       WHERE id = ANY($1) LIMIT $2`,
      [chunk, CHUNK],
    )
    coneDetails.push(
      ...((rows ?? []) as Array<{
        id: number
        thread_type_id: number
        color_id: number | null
        is_partial: boolean
      }>),
    )
  }

  const map = new Map<ThreadKey, LastTransferEntry>()
  const keyTxMap = new Map<
    ThreadKey,
    { performed_at: string; performed_by: string | null; full_cones: number; partial_cones: number }
  >()
  for (const cone of coneDetails) {
    const tx = txByConeId.get(cone.id)
    if (!tx) continue
    const key: ThreadKey = `${cone.thread_type_id}_${cone.color_id ?? ''}`
    const existing = keyTxMap.get(key)
    if (!existing || tx.performed_at > existing.performed_at) {
      keyTxMap.set(key, {
        performed_at: tx.performed_at,
        performed_by: tx.performed_by,
        full_cones: cone.is_partial ? 0 : 1,
        partial_cones: cone.is_partial ? 1 : 0,
      })
    } else if (tx.performed_at === existing.performed_at) {
      if (cone.is_partial) existing.partial_cones++
      else existing.full_cones++
    }
  }
  for (const [key, entry] of keyTxMap) {
    map.set(key, {
      transferred_at: entry.performed_at,
      by_user_name: entry.performed_by ?? '',
      full_cones: entry.full_cones,
      partial_cones: entry.partial_cones,
    })
  }
  return map
}

function buildSharedWithPosMap(
  poQuotaMap: Map<number | null, Map<ThreadKey, AggregatedThread>>,
): Map<ThreadKey, number[]> {
  const map = new Map<ThreadKey, number[]>()
  for (const [poId, quotaMap] of poQuotaMap) {
    if (poId == null) continue
    for (const key of quotaMap.keys()) {
      const arr = map.get(key) ?? []
      arr.push(poId)
      map.set(key, arr)
    }
  }
  return map
}

async function fetchPoAttributionMap(weekId: number, toWarehouseId: number | null) {
  if (toWarehouseId == null) return { map: new Map<string, number>(), threadKeys: new Set<string>() }

  const data = await query<{ po_attribution: unknown }>(
    `SELECT po_attribution FROM batch_transactions
     WHERE operation_type = 'TRANSFER' AND to_warehouse_id = $1 AND notes LIKE $2
       AND po_attribution IS NOT NULL
     LIMIT 2000`,
    [toWarehouseId, `%Tuần #${weekId}%`],
  )

  const map = new Map<string, number>()
  const threadKeys = new Set<string>()
  for (const tx of data ?? []) {
    if (!Array.isArray(tx.po_attribution)) continue
    const items = tx.po_attribution as Array<{
      po_id: number | null
      thread_type_id: number
      color_id: number
      cones: number
    }>
    for (const item of items) {
      if (typeof item.thread_type_id !== 'number' || typeof item.color_id !== 'number' || typeof item.cones !== 'number') continue
      const key = `${item.po_id ?? 'null'}_${item.thread_type_id}_${item.color_id}`
      map.set(key, (map.get(key) ?? 0) + item.cones)
      threadKeys.add(`${item.thread_type_id}_${item.color_id}`)
    }
  }
  return { map, threadKeys }
}

const router = new Hono<AppEnv>()

router.get(
  '/:weekId/transfer-by-calculation',
  requirePermission('thread.batch.transfer'),
  async (c) => {
    try {
      const weekIdRaw = c.req.param('weekId')
      if (!/^\d+$/.test(weekIdRaw)) {
        return c.json({ data: null, error: 'weekId không hợp lệ' }, 400)
      }
      const weekId = Number(weekIdRaw)

      const queryParse = transferByCalculationQuerySchema.safeParse({
        warehouse_id: c.req.query('warehouse_id'),
        to_warehouse_id: c.req.query('to_warehouse_id'),
      })
      if (!queryParse.success) {
        return c.json({ data: null, error: queryParse.error.issues[0]?.message ?? 'Tham số không hợp lệ' }, 400)
      }
      const { warehouse_id, to_warehouse_id } = queryParse.data

      if (to_warehouse_id != null && to_warehouse_id === warehouse_id) {
        return c.json({ data: null, error: 'Kho nguồn và kho đích phải khác nhau' }, 400)
      }

      const weekRow = await queryOne<{ id: number; week_name: string; status: string }>(
        `SELECT id, week_name, status FROM thread_order_weeks WHERE id = $1 LIMIT 1`,
        [weekId],
      )
      if (!weekRow) return c.json({ data: null, error: 'Tuần không tồn tại' }, 404)

      const warehouseIds = [warehouse_id]
      if (to_warehouse_id != null) warehouseIds.push(to_warehouse_id)
      const warehouses = await query<{ id: number; code: string; name: string }>(
        `SELECT id, code, name FROM warehouses WHERE id = ANY($1) LIMIT 2`,
        [warehouseIds],
      )
      const sourceWh = warehouses?.find(w => w.id === warehouse_id)
      const destWh = to_warehouse_id != null ? warehouses?.find(w => w.id === to_warehouse_id) : null
      if (!sourceWh) return c.json({ data: null, error: 'Kho nguồn không tồn tại' }, 404)
      if (to_warehouse_id != null && !destWh) return c.json({ data: null, error: 'Kho đích không tồn tại' }, 404)

      const [{ calculation_data, summary_data }, orderItems] = await Promise.all([
        fetchCalculationData(weekId),
        fetchOrderItems(weekId),
      ])

      if (calculation_data.length === 0) {
        return c.json({
          data: {
            week: weekRow,
            source_warehouse: sourceWh,
            destination_warehouse: destWh ?? null,
            pos: [],
            additional: [],
          },
          error: null,
          message: 'Tuần chưa được tính chỉ',
        })
      }

      const styleColorIds = Array.from(new Set(orderItems.map(it => it.style_color_id)))
      const specs = await fetchSpecsByStyleColors(styleColorIds)

      const threadColorIds = Array.from(new Set(specs.map(s => s.thread_color_id).filter((v): v is number => v != null)))
      const colorByName = await fetchColorNameToIdMap(threadColorIds)
      const colorById = new Map<number, string>()
      for (const [name, id] of colorByName) colorById.set(id, name)

      const { poOrder, poQuotaMap } = buildPoQuotaMap(
        orderItems,
        specs,
        calculation_data,
        colorByName,
        colorById,
      )

      const [inventoryAtSource, inventoryAtDest] = await Promise.all([
        fetchInventoryAgg(weekId, warehouse_id),
        to_warehouse_id != null ? fetchInventoryAgg(weekId, to_warehouse_id) : Promise.resolve(new Map<string, InventoryAggRow>()),
      ])

      const { transferredByPoThread, overflowByThread } = applySequentialAllocation(
        poOrder,
        poQuotaMap,
        inventoryAtDest,
      )

      const sharedMap = buildSharedWithPosMap(poQuotaMap)

      const [lastTransferMap, poAttr] = await Promise.all([
        fetchLastTransferMap(weekId),
        fetchPoAttributionMap(weekId, to_warehouse_id ?? null),
      ])

      const poNumbersMap = new Map<number, string>()
      const poIdsToFetch = poOrder.map(p => p.po_id).filter((id): id is number => id != null)
      if (poIdsToFetch.length > 0) {
        const pos = await query<{ id: number; po_number: string }>(
          `SELECT id, po_number FROM purchase_orders WHERE id = ANY($1) LIMIT $2`,
          [poIdsToFetch, poIdsToFetch.length],
        )
        for (const p of (pos ?? []) as Array<{ id: number; po_number: string }>) {
          poNumbersMap.set(p.id, p.po_number)
        }
      }

      const posResp = poOrder.map(po => {
        const quotaMap = poQuotaMap.get(po.po_id) ?? new Map()
        const thread_lines = Array.from(quotaMap.values()).map(t => {
          const key: ThreadKey = `${t.thread_type_id}_${t.thread_color_id}`
          const attrKey = `${po.po_id ?? 'null'}_${key}`
          const threadHasAttr = poAttr.threadKeys.has(key)
          const transferred_for_po = threadHasAttr
            ? (poAttr.map.get(attrKey) ?? 0)
            : (transferredByPoThread.get(attrKey) ?? 0)
          const reserved_at_source = inventoryAtSource.get(key)?.count ?? 0
          const reserved_at_destination = inventoryAtDest.get(key)?.count ?? 0
          const shared_with_pos = (sharedMap.get(key) ?? []).filter(pid => pid !== po.po_id)
          const last = lastTransferMap.get(key) ?? null
          return {
            thread_type_id: t.thread_type_id,
            thread_color_id: t.thread_color_id,
            supplier_name: t.supplier_name,
            tex_number: t.tex_number,
            color_name: t.color_name,
            quota_cones: t.quota_cones,
            shared_with_pos,
            reserved_at_source,
            reserved_at_destination,
            transferred_for_po,
            pending_for_po: Math.max(0, t.quota_cones - transferred_for_po),
            last_transfer: last,
          }
        })
        const total_needed = thread_lines.reduce((s, l) => s + l.quota_cones, 0)
        const total_transferred = thread_lines.reduce((s, l) => s + l.transferred_for_po, 0)
        return {
          po_id: po.po_id,
          po_number: po.po_id != null ? (poNumbersMap.get(po.po_id) ?? '') : '(Không có PO)',
          display_order: po.display_order,
          summary: {
            total_needed,
            total_transferred,
            total_pending: Math.max(0, total_needed - total_transferred),
          },
          thread_lines,
        }
      })

      const additional = (summary_data ?? [])
        .filter(s => (s.additional_order ?? 0) > 0)
        .map(s => {
          const colorIdLookup = orderItems
            .map(it => specs.find(sp => sp.style_color_id === it.style_color_id && sp.thread_type_id === s.thread_type_id))
            .find(Boolean)
          const thread_color_id = colorIdLookup?.thread_color_id ?? 0
          const key: ThreadKey = `${s.thread_type_id}_${thread_color_id}`
          return {
            thread_type_id: s.thread_type_id,
            thread_color_id,
            supplier_name: s.supplier_name,
            tex_number: s.tex_number,
            color_name: s.thread_color ?? '',
            additional_quantity: s.additional_order,
            reserved_at_source: inventoryAtSource.get(key)?.count ?? 0,
            reserved_at_destination: inventoryAtDest.get(key)?.count ?? 0,
            is_overflow: false,
          }
        })

      for (const [key, overflow] of overflowByThread) {
        const [ttRaw, ccRaw] = key.split('_')
        const tt = Number(ttRaw)
        const cc = Number(ccRaw)
        const sample = Array.from(poQuotaMap.values())
          .map(m => m.get(key))
          .find(Boolean)
        if (!sample) continue
        const existing = additional.find(a => a.thread_type_id === tt && a.thread_color_id === cc)
        if (existing) {
          existing.reserved_at_destination += overflow
          existing.is_overflow = true
        } else {
          additional.push({
            thread_type_id: tt,
            thread_color_id: cc,
            supplier_name: sample.supplier_name,
            tex_number: sample.tex_number,
            color_name: sample.color_name,
            additional_quantity: 0,
            reserved_at_source: 0,
            reserved_at_destination: overflow,
            is_overflow: true,
          })
        }
      }

      return c.json({
        data: {
          week: weekRow,
          source_warehouse: sourceWh,
          destination_warehouse: destWh ?? null,
          pos: posResp,
          additional,
        },
        error: null,
      })
    } catch (err) {
      console.error('[transfer-by-calculation] failed:', err)
      const message = err instanceof Error ? err.message : 'Lỗi truy vấn dữ liệu'
      return c.json({ data: null, error: message }, 500)
    }
  },
)

router.get(
  '/:weekId/transfer-history-thread',
  requirePermission('thread.batch.transfer'),
  async (c) => {
    try {
      const weekIdRaw = c.req.param('weekId')
      if (!/^\d+$/.test(weekIdRaw)) {
        return c.json({ data: null, error: 'weekId không hợp lệ' }, 400)
      }
      const weekId = Number(weekIdRaw)

      const queryParse = threadTransferHistoryQuerySchema.safeParse({
        thread_type_id: c.req.query('thread_type_id'),
        thread_color_id: c.req.query('thread_color_id'),
      })
      if (!queryParse.success) {
        return c.json({ data: null, error: queryParse.error.issues[0]?.message ?? 'Tham số không hợp lệ' }, 400)
      }
      const { thread_type_id, thread_color_id } = queryParse.data

      // Step A: Fetch all TRANSFER transactions for this week
      const txs = await query<{
        id: number
        performed_at: string
        performed_by: string | null
        cone_ids: number[]
        from_warehouse_id: number | null
        to_warehouse_id: number | null
      }>(
        `SELECT id, performed_at, performed_by, cone_ids, from_warehouse_id, to_warehouse_id
         FROM batch_transactions
         WHERE operation_type = 'TRANSFER' AND notes LIKE $1
         ORDER BY performed_at DESC LIMIT 200`,
        [`%Tuần #${weekId}%`],
      )

      if (!txs || txs.length === 0) {
        return c.json({ data: [], error: null })
      }

      // Step B: Collect all warehouse IDs and batch-fetch warehouse details
      const warehouseIdSet = new Set<number>()
      for (const tx of txs as Array<{ from_warehouse_id: number | null; to_warehouse_id: number | null }>) {
        if (tx.from_warehouse_id != null) warehouseIdSet.add(tx.from_warehouse_id)
        if (tx.to_warehouse_id != null) warehouseIdSet.add(tx.to_warehouse_id)
      }
      const warehouseIds = Array.from(warehouseIdSet)
      const warehouseMap = new Map<number, { id: number; code: string; name: string }>()
      if (warehouseIds.length > 0) {
        const whs = await query<{ id: number; code: string; name: string }>(
          `SELECT id, code, name FROM warehouses WHERE id = ANY($1) LIMIT $2`,
          [warehouseIds, warehouseIds.length],
        )
        for (const wh of (whs ?? []) as Array<{ id: number; code: string; name: string }>) {
          warehouseMap.set(wh.id, wh)
        }
      }

      // Step C: Collect all cone_ids and batch-fetch thread_inventory filtered by thread_type_id + color_id
      const allConeIds: number[] = []
      for (const tx of txs as Array<{ cone_ids: number[] }>) {
        for (const id of tx.cone_ids ?? []) allConeIds.push(id)
      }
      const uniqueConeIds = Array.from(new Set(allConeIds))

      const CHUNK = 1000
      const coneMap = new Map<number, { is_partial: boolean }>()
      for (let i = 0; i < uniqueConeIds.length; i += CHUNK) {
        const chunk = uniqueConeIds.slice(i, i + CHUNK)
        const rows = await query<{ id: number; is_partial: boolean }>(
          `SELECT id, is_partial FROM thread_inventory
           WHERE id = ANY($1) AND thread_type_id = $2 AND color_id = $3 LIMIT $4`,
          [chunk, thread_type_id, thread_color_id, CHUNK],
        )
        for (const row of (rows ?? []) as Array<{ id: number; is_partial: boolean }>) {
          coneMap.set(row.id, { is_partial: row.is_partial })
        }
      }

      // Step D: For each transaction, count matching cones
      const entries: Array<{
        transaction_id: number
        transferred_at: string
        by_user_name: string
        source_warehouse_name: string
        destination_warehouse_name: string
        full_cones: number
        partial_cones: number
        total_cones: number
      }> = []

      for (const tx of txs as Array<{
        id: number
        performed_at: string
        performed_by: string | null
        cone_ids: number[]
        from_warehouse_id: number | null
        to_warehouse_id: number | null
      }>) {
        let full_cones = 0
        let partial_cones = 0
        for (const coneId of tx.cone_ids ?? []) {
          const cone = coneMap.get(coneId)
          if (!cone) continue
          if (cone.is_partial) partial_cones++
          else full_cones++
        }
        if (full_cones === 0 && partial_cones === 0) continue
        entries.push({
          transaction_id: tx.id,
          transferred_at: tx.performed_at,
          by_user_name: tx.performed_by ?? '',
          source_warehouse_name: tx.from_warehouse_id != null ? (warehouseMap.get(tx.from_warehouse_id)?.name ?? '') : '',
          destination_warehouse_name: tx.to_warehouse_id != null ? (warehouseMap.get(tx.to_warehouse_id)?.name ?? '') : '',
          full_cones,
          partial_cones,
          total_cones: full_cones + partial_cones,
        })
      }

      return c.json({ data: entries, error: null })
    } catch (err) {
      console.error('[transfer-history-thread] failed:', err)
      return c.json({ data: null, error: err instanceof Error ? err.message : 'Lỗi truy vấn' }, 500)
    }
  },
)

router.get(
  '/:weekId/transfer-history-po',
  requirePermission('thread.batch.transfer'),
  async (c) => {
    try {
      const weekIdRaw = c.req.param('weekId')
      if (!/^\d+$/.test(weekIdRaw)) {
        return c.json({ data: null, error: 'weekId không hợp lệ' }, 400)
      }
      const weekId = Number(weekIdRaw)

      const queryParse = poTransferHistoryQuerySchema.safeParse({
        po_id: c.req.query('po_id'),
        to_warehouse_id: c.req.query('to_warehouse_id'),
      })
      if (!queryParse.success) {
        return c.json({ data: null, error: queryParse.error.issues[0]?.message ?? 'Tham số không hợp lệ' }, 400)
      }
      const { po_id, to_warehouse_id } = queryParse.data

      const txParams: unknown[] = [`%Tuần #${weekId}%`]
      let txWhere = `operation_type = 'TRANSFER' AND notes LIKE $1 AND po_attribution IS NOT NULL`
      if (to_warehouse_id != null) {
        txParams.push(to_warehouse_id)
        txWhere += ` AND to_warehouse_id = $${txParams.length}`
      }

      const txs = await query<{
        id: number
        performed_at: string
        performed_by: string | null
        from_warehouse_id: number | null
        to_warehouse_id: number | null
        po_attribution: Array<{ po_id: number; thread_type_id: number; color_id: number; cones: number }> | null
      }>(
        `SELECT id, performed_at, performed_by, from_warehouse_id, to_warehouse_id, po_attribution
         FROM batch_transactions
         WHERE ${txWhere}
         ORDER BY performed_at DESC LIMIT 500`,
        txParams,
      )

      if (!txs || txs.length === 0) {
        return c.json({ data: [], error: null })
      }

      type PoAttrItem = { po_id: number; thread_type_id: number; color_id: number; cones: number }
      const relevantTxs: typeof txs = []
      const txPoAttrMap = new Map<number, PoAttrItem[]>()

      for (const tx of txs as Array<{
        id: number
        performed_at: string
        performed_by: string | null
        from_warehouse_id: number | null
        to_warehouse_id: number | null
        po_attribution: PoAttrItem[] | null
      }>) {
        if (!tx.po_attribution || !Array.isArray(tx.po_attribution)) continue
        const forThisPo = tx.po_attribution.filter(a => a.po_id === po_id)
        if (forThisPo.length > 0) {
          relevantTxs.push(tx)
          txPoAttrMap.set(tx.id, forThisPo)
        }
      }

      if (relevantTxs.length === 0) {
        return c.json({ data: [], error: null })
      }

      const warehouseIdSet = new Set<number>()
      for (const tx of relevantTxs as Array<{ from_warehouse_id: number | null; to_warehouse_id: number | null }>) {
        if (tx.from_warehouse_id != null) warehouseIdSet.add(tx.from_warehouse_id)
        if (tx.to_warehouse_id != null) warehouseIdSet.add(tx.to_warehouse_id)
      }
      const warehouseIds = Array.from(warehouseIdSet)
      const warehouseMap = new Map<number, { id: number; code: string; name: string }>()
      if (warehouseIds.length > 0) {
        const whs = await query<{ id: number; code: string; name: string }>(
          `SELECT id, code, name FROM warehouses WHERE id = ANY($1) LIMIT $2`,
          [warehouseIds, warehouseIds.length],
        )
        for (const wh of (whs ?? []) as Array<{ id: number; code: string; name: string }>) {
          warehouseMap.set(wh.id, wh)
        }
      }

      const threadTypeIdSet = new Set<number>()
      const colorIdSet = new Set<number>()
      for (const attrs of txPoAttrMap.values()) {
        for (const a of attrs) {
          threadTypeIdSet.add(a.thread_type_id)
          colorIdSet.add(a.color_id)
        }
      }

      const threadTypeMap = new Map<number, { supplier_name: string; tex_number: string }>()
      if (threadTypeIdSet.size > 0) {
        const tts = await query<{ id: number; tex_number: string; supplier_name: string | null }>(
          `SELECT tt.id, tt.tex_number, sup.name AS supplier_name
           FROM thread_types tt
           LEFT JOIN suppliers sup ON sup.id = tt.supplier_id
           WHERE tt.id = ANY($1) LIMIT $2`,
          [Array.from(threadTypeIdSet), threadTypeIdSet.size],
        )
        for (const tt of (tts ?? []) as Array<{ id: number; tex_number: string; supplier_name: string | null }>) {
          threadTypeMap.set(tt.id, {
            supplier_name: tt.supplier_name ?? '',
            tex_number: tt.tex_number,
          })
        }
      }

      const colorMap = new Map<number, string>()
      if (colorIdSet.size > 0) {
        const cols = await query<{ id: number; name: string }>(
          `SELECT id, name FROM colors WHERE id = ANY($1) LIMIT $2`,
          [Array.from(colorIdSet), colorIdSet.size],
        )
        for (const col of (cols ?? []) as Array<{ id: number; name: string }>) {
          colorMap.set(col.id, col.name)
        }
      }

      const transactions: Array<{
        transaction_id: number
        performed_at: string
        by_user_name: string
        source_warehouse_name: string
        destination_warehouse_name: string
        total_cones: number
        lines: Array<{
          thread_type_id: number
          thread_color_id: number
          supplier_name: string
          tex_number: string
          color_name: string
          cones: number
        }>
      }> = []

      for (const tx of relevantTxs as Array<{
        id: number
        performed_at: string
        performed_by: string | null
        from_warehouse_id: number | null
        to_warehouse_id: number | null
      }>) {
        const attrs = txPoAttrMap.get(tx.id) ?? []
        const lines = attrs.map(a => {
          const tt = threadTypeMap.get(a.thread_type_id)
          return {
            thread_type_id: a.thread_type_id,
            thread_color_id: a.color_id,
            supplier_name: tt?.supplier_name ?? '',
            tex_number: tt?.tex_number ?? '',
            color_name: colorMap.get(a.color_id) ?? '',
            cones: a.cones,
          }
        })
        const total_cones = lines.reduce((sum, l) => sum + l.cones, 0)
        if (total_cones === 0) continue

        transactions.push({
          transaction_id: tx.id,
          performed_at: tx.performed_at,
          by_user_name: tx.performed_by ?? '',
          source_warehouse_name: tx.from_warehouse_id != null ? (warehouseMap.get(tx.from_warehouse_id)?.name ?? '') : '',
          destination_warehouse_name: tx.to_warehouse_id != null ? (warehouseMap.get(tx.to_warehouse_id)?.name ?? '') : '',
          total_cones,
          lines,
        })
      }

      return c.json({ data: transactions, error: null })
    } catch (err) {
      console.error('[transfer-history-po] failed:', err)
      return c.json({ data: null, error: err instanceof Error ? err.message : 'Lỗi truy vấn' }, 500)
    }
  },
)

export default router
