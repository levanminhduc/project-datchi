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
