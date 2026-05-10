import { Hono } from 'hono'
import { supabaseAdmin } from '../../db/supabase'
import { requirePermission } from '../../middleware/auth'
import type { AppEnv } from '../../types/hono-env'
import {
  transferByCalculationQuerySchema,
  threadTransferHistoryQuerySchema,
} from '../../validation/transferByCalculationSchema'

type CalculationDataRow = {
  style_id: number
  calculations: Array<{
    thread_type_id: number
    tex_number: string
    supplier_id: number
    supplier_name: string
    color_breakdown: Array<{
      color_id: number
      color_name: string
      total_meters: number
      meters_per_cone: number
    }>
  }>
}

type ThreadOrderItem = {
  id: number
  po_id: number | null
  style_color_id: number
  style_id: number | null
}

type SpecRow = {
  style_color_id: number
  thread_type_id: number
  thread_color_id: number
}

type InventoryAggRow = {
  thread_type_id: number
  color_id: number | null
  count: number
}

async function fetchCalculationData(weekId: number) {
  const { data, error } = await supabaseAdmin
    .from('thread_order_results')
    .select('calculation_data, summary_data')
    .eq('week_id', weekId)
    .maybeSingle()
  if (error) throw error
  return {
    calculation_data: (data?.calculation_data ?? []) as CalculationDataRow[],
    summary_data: (data?.summary_data ?? []) as Array<{
      thread_type_id: number
      thread_color: string | null
      additional_order: number
      tex_number: string
      supplier_name: string
    }>,
  }
}

async function fetchOrderItems(weekId: number) {
  const { data, error } = await supabaseAdmin
    .from('thread_order_items')
    .select('id, po_id, style_color_id, style_id')
    .eq('week_id', weekId)
    .order('id', { ascending: true })
    .limit(10000)
  if (error) throw error
  return (data ?? []) as ThreadOrderItem[]
}

async function fetchSpecsByStyleColors(styleColorIds: number[]) {
  if (styleColorIds.length === 0) return []
  const { data, error } = await supabaseAdmin
    .from('style_color_thread_specs')
    .select('style_color_id, thread_type_id, thread_color_id')
    .in('style_color_id', styleColorIds)
    .limit(10000)
  if (error) throw error
  return (data ?? []) as SpecRow[]
}

async function fetchInventoryAgg(weekId: number, warehouseId: number) {
  const { data, error } = await supabaseAdmin
    .from('thread_inventory')
    .select('thread_type_id, color_id')
    .eq('reserved_week_id', weekId)
    .eq('warehouse_id', warehouseId)
    .eq('status', 'RESERVED_FOR_ORDER')
    .limit(500000)
  if (error) throw error
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

function buildPoQuotaMap(
  orderItems: ThreadOrderItem[],
  specs: SpecRow[],
  calcData: CalculationDataRow[],
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
      const matchCalc = calcRow.calculations.find(c => c.thread_type_id === spec.thread_type_id)
      if (!matchCalc) continue
      const matchColor = matchCalc.color_breakdown.find(cb => cb.color_id === spec.thread_color_id)
      if (!matchColor) continue

      const conesNeeded = Math.ceil(matchColor.total_meters / matchColor.meters_per_cone)
      const key: ThreadKey = `${spec.thread_type_id}_${spec.thread_color_id}`
      const quotaMap = poQuotaMap.get(poId)!
      const existing = quotaMap.get(key)
      if (existing) {
        existing.quota_cones += conesNeeded
      } else {
        quotaMap.set(key, {
          thread_type_id: spec.thread_type_id,
          thread_color_id: spec.thread_color_id,
          supplier_name: matchCalc.supplier_name,
          tex_number: matchCalc.tex_number,
          color_name: matchColor.color_name,
          quota_cones: conesNeeded,
        })
      }
    }
  }

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
    for (const po of poOrder) {
      const quotaEntry = poQuotaMap.get(po.po_id)?.get(key)
      if (!quotaEntry || quotaEntry.quota_cones === 0) continue
      const fulfilled = Math.min(remaining, quotaEntry.quota_cones)
      transferredByPoThread.set(`${po.po_id ?? 'null'}_${key}`, fulfilled)
      remaining -= fulfilled
      if (remaining === 0) break
    }
    if (remaining > 0) {
      overflowByThread.set(key, remaining)
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
  const { data, error } = await supabaseAdmin
    .from('batch_transactions')
    .select('id, created_at, performed_by, cone_ids')
    .eq('operation_type', 'TRANSFER')
    .like('notes', `%Tuần #${weekId}%`)
    .order('created_at', { ascending: false })
    .limit(2000)
  if (error) throw error

  if (!data || data.length === 0) return new Map<ThreadKey, LastTransferEntry>()

  // Collect all cone ids to batch-fetch thread_type_id / color_id / is_partial
  const allConeIds: number[] = []
  const txByConeId = new Map<
    number,
    { created_at: string; performed_by: string | null }
  >()
  for (const tx of data as Array<{
    id: number
    created_at: string
    performed_by: string | null
    cone_ids: number[]
  }>) {
    for (const coneId of tx.cone_ids ?? []) {
      if (!txByConeId.has(coneId)) {
        // newest-first order from query → first seen = most recent tx
        txByConeId.set(coneId, {
          created_at: tx.created_at,
          performed_by: tx.performed_by,
        })
        allConeIds.push(coneId)
      }
    }
  }

  if (allConeIds.length === 0) return new Map<ThreadKey, LastTransferEntry>()

  // Batch-fetch cone details (chunked to stay under PostgREST limits)
  const CHUNK = 1000
  const coneDetails: Array<{
    id: number
    thread_type_id: number
    color_id: number | null
    is_partial: boolean
  }> = []
  for (let i = 0; i < allConeIds.length; i += CHUNK) {
    const chunk = allConeIds.slice(i, i + CHUNK)
    const { data: rows, error: rowErr } = await supabaseAdmin
      .from('thread_inventory')
      .select('id, thread_type_id, color_id, is_partial')
      .in('id', chunk)
      .limit(CHUNK)
    if (rowErr) throw rowErr
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
  // Group cones by thread key, tracking the most-recent tx per key
  const keyTxMap = new Map<
    ThreadKey,
    { created_at: string; performed_by: string | null; full_cones: number; partial_cones: number }
  >()
  for (const cone of coneDetails) {
    const tx = txByConeId.get(cone.id)
    if (!tx) continue
    const key: ThreadKey = `${cone.thread_type_id}_${cone.color_id ?? ''}`
    const existing = keyTxMap.get(key)
    if (!existing || tx.created_at > existing.created_at) {
      keyTxMap.set(key, {
        created_at: tx.created_at,
        performed_by: tx.performed_by,
        full_cones: cone.is_partial ? 0 : 1,
        partial_cones: cone.is_partial ? 1 : 0,
      })
    } else if (tx.created_at === existing.created_at) {
      if (cone.is_partial) existing.partial_cones++
      else existing.full_cones++
    }
  }
  for (const [key, entry] of keyTxMap) {
    map.set(key, {
      transferred_at: entry.created_at,
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

const router = new Hono<AppEnv>()

router.get(
  '/:weekId/transfer-by-calculation',
  requirePermission('thread.batch.transfer'),
  async (c) => {
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

    void weekId
    void supabaseAdmin
    return c.json({ data: null, error: 'Not implemented' }, 501)
  },
)

router.get(
  '/:weekId/transfer-history-thread',
  requirePermission('thread.batch.transfer'),
  async (c) => {
    const weekIdRaw = c.req.param('weekId')
    if (!/^\d+$/.test(weekIdRaw)) {
      return c.json({ data: null, error: 'weekId không hợp lệ' }, 400)
    }
    const queryParse = threadTransferHistoryQuerySchema.safeParse({
      thread_type_id: c.req.query('thread_type_id'),
      thread_color_id: c.req.query('thread_color_id'),
    })
    if (!queryParse.success) {
      return c.json({ data: null, error: queryParse.error.issues[0]?.message ?? 'Tham số không hợp lệ' }, 400)
    }
    return c.json({ data: null, error: 'Not implemented' }, 501)
  },
)

export default router
