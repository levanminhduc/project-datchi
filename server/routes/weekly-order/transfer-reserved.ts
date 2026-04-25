import { Hono } from 'hono'
import { supabaseAdmin } from '../../db/supabase'
import { requirePermission } from '../../middleware/auth'
import type { AppEnv } from '../../types/hono-env'
import { transferReservedBodySchema } from '../../validation/transferReservedSchema'
import { getPerformerName } from './helpers'

const router = new Hono<AppEnv>()

router.get(
  '/:weekId/reserved-by-po',
  requirePermission('thread.batch.transfer'),
  async (c) => {
    const weekId = Number(c.req.param('weekId'))
    const warehouseId = Number(c.req.query('warehouse_id'))

    if (!Number.isFinite(weekId) || !Number.isFinite(warehouseId)) {
      return c.json({ data: null, error: 'Tham số không hợp lệ' }, 400)
    }

    const { data: week, error: weekErr } = await supabaseAdmin
      .from('thread_order_weeks')
      .select('id, week_name, status')
      .eq('id', weekId)
      .maybeSingle()
    if (weekErr) return c.json({ data: null, error: weekErr.message }, 500)
    if (!week) return c.json({ data: null, error: 'Tuần không tồn tại' }, 404)

    const { data: warehouse, error: whErr } = await supabaseAdmin
      .from('warehouses')
      .select('id, code, name')
      .eq('id', warehouseId)
      .maybeSingle()
    if (whErr) return c.json({ data: null, error: whErr.message }, 500)
    if (!warehouse) return c.json({ data: null, error: 'Kho không tồn tại' }, 404)

    const { data: cones, error: coneErr } = await supabaseAdmin
      .from('thread_inventory')
      .select('thread_type_id, color_id, quantity_meters, is_partial')
      .eq('reserved_week_id', weekId)
      .eq('warehouse_id', warehouseId)
      .eq('status', 'RESERVED_FOR_ORDER')
      .limit(50000)
    if (coneErr) return c.json({ data: null, error: coneErr.message }, 500)

    const poolMap = new Map<
      string,
      { cones: number; meters: number; full_cones: number; partial_cones: number }
    >()
    for (const row of cones || []) {
      if (!row.thread_type_id || !row.color_id) continue
      const key = `${row.thread_type_id}-${row.color_id}`
      const cur = poolMap.get(key) || { cones: 0, meters: 0, full_cones: 0, partial_cones: 0 }
      cur.cones += 1
      cur.meters += Number(row.quantity_meters || 0)
      if (row.is_partial) cur.partial_cones += 1
      else cur.full_cones += 1
      poolMap.set(key, cur)
    }

    const threadTypeIds = Array.from(
      new Set((cones || []).map((r) => r.thread_type_id).filter(Boolean))
    ) as number[]
    const colorIds = Array.from(
      new Set((cones || []).map((r) => r.color_id).filter(Boolean))
    ) as number[]

    const [ttRes, colorRes] = await Promise.all([
      threadTypeIds.length
        ? supabaseAdmin
            .from('thread_types')
            .select('id, tex_number, supplier_id, suppliers(name)')
            .in('id', threadTypeIds)
            .limit(threadTypeIds.length)
        : Promise.resolve({ data: [], error: null }),
      colorIds.length
        ? supabaseAdmin
            .from('colors')
            .select('id, name')
            .in('id', colorIds)
            .limit(colorIds.length)
        : Promise.resolve({ data: [], error: null }),
    ])
    if (ttRes.error) return c.json({ data: null, error: ttRes.error.message }, 500)
    if (colorRes.error)
      return c.json({ data: null, error: colorRes.error.message }, 500)

    const ttMap = new Map<number, { tex_number: string; supplier_name: string }>()
    for (const t of (ttRes.data || []) as Array<{
      id: number
      tex_number: string | null
      supplier_id: number | null
      suppliers: { name: string } | { name: string }[] | null
    }>) {
      const sup = Array.isArray(t.suppliers) ? t.suppliers[0] : t.suppliers
      ttMap.set(t.id, {
        tex_number: t.tex_number || '',
        supplier_name: sup?.name || '',
      })
    }
    const colorMap = new Map<number, string>()
    for (const co of (colorRes.data || []) as Array<{ id: number; name: string }>) {
      colorMap.set(co.id, co.name)
    }

    const { data: orderItems, error: oiErr } = await supabaseAdmin
      .from('thread_order_items')
      .select('po_id, style_color_id')
      .eq('week_id', weekId)
      .not('po_id', 'is', null)
      .not('style_color_id', 'is', null)
      .limit(50000)
    if (oiErr) return c.json({ data: null, error: oiErr.message }, 500)

    const styleColorIds = Array.from(
      new Set((orderItems || []).map((o) => o.style_color_id).filter(Boolean))
    ) as number[]

    const styleColorSpecsMap = new Map<
      number,
      Array<{ thread_type_id: number; color_id: number }>
    >()
    if (styleColorIds.length) {
      const { data: specs, error: specErr } = await supabaseAdmin
        .from('style_color_thread_specs')
        .select('style_color_id, thread_type_id, color_id')
        .in('style_color_id', styleColorIds)
        .not('thread_type_id', 'is', null)
        .not('color_id', 'is', null)
        .limit(50000)
      if (specErr) return c.json({ data: null, error: specErr.message }, 500)

      for (const s of (specs || []) as Array<{
        style_color_id: number
        thread_type_id: number
        color_id: number
      }>) {
        const arr = styleColorSpecsMap.get(s.style_color_id) || []
        arr.push({ thread_type_id: s.thread_type_id, color_id: s.color_id })
        styleColorSpecsMap.set(s.style_color_id, arr)
      }
    }

    const poIds = Array.from(
      new Set((orderItems || []).map((o) => o.po_id).filter(Boolean))
    ) as number[]
    const poNumberMap = new Map<number, string>()
    if (poIds.length) {
      const { data: pos, error: poErr } = await supabaseAdmin
        .from('purchase_orders')
        .select('id, po_number')
        .in('id', poIds)
        .limit(poIds.length)
      if (poErr) return c.json({ data: null, error: poErr.message }, 500)
      for (const po of (pos || []) as Array<{ id: number; po_number: string }>) {
        poNumberMap.set(po.id, po.po_number)
      }
    }

    type Line = {
      thread_type_id: number
      color_id: number
      supplier_name: string
      tex_number: string
      color_name: string
      reserved_cones_at_source: number
      reserved_meters_at_source: number
      reserved_full_cones_at_source: number
      reserved_partial_cones_at_source: number
    }
    const poBuckets = new Map<
      number,
      { po_number: string; thread_lines: Line[]; seen: Set<string> }
    >()
    const usedKeys = new Set<string>()

    for (const oi of (orderItems || []) as Array<{
      po_id: number
      style_color_id: number
    }>) {
      const specs = styleColorSpecsMap.get(oi.style_color_id) || []
      for (const spec of specs) {
        const key = `${spec.thread_type_id}-${spec.color_id}`
        const pool = poolMap.get(key)
        if (!pool) continue

        let bucket = poBuckets.get(oi.po_id)
        if (!bucket) {
          bucket = {
            po_number: poNumberMap.get(oi.po_id) || '',
            thread_lines: [],
            seen: new Set(),
          }
          poBuckets.set(oi.po_id, bucket)
        }
        if (bucket.seen.has(key)) continue
        bucket.seen.add(key)
        usedKeys.add(key)

        const tt = ttMap.get(spec.thread_type_id)
        bucket.thread_lines.push({
          thread_type_id: spec.thread_type_id,
          color_id: spec.color_id,
          supplier_name: tt?.supplier_name || '',
          tex_number: tt?.tex_number || '',
          color_name: colorMap.get(spec.color_id) || '',
          reserved_cones_at_source: pool.cones,
          reserved_meters_at_source: pool.meters,
          reserved_full_cones_at_source: pool.full_cones,
          reserved_partial_cones_at_source: pool.partial_cones,
        })
      }
    }

    const pos = Array.from(poBuckets.entries())
      .map(([po_id, b]) => ({
        po_id,
        po_number: b.po_number,
        thread_lines: b.thread_lines,
      }))
      .sort((a, b) => a.po_number.localeCompare(b.po_number))

    const unassignedLines: Line[] = []
    for (const [key, pool] of poolMap.entries()) {
      if (usedKeys.has(key)) continue
      const [ttIdStr, colorIdStr] = key.split('-')
      const ttId = Number(ttIdStr)
      const coId = Number(colorIdStr)
      const ttInfo = ttMap.get(ttId)
      unassignedLines.push({
        thread_type_id: ttId,
        color_id: coId,
        supplier_name: ttInfo?.supplier_name || '',
        tex_number: ttInfo?.tex_number || '',
        color_name: colorMap.get(coId) || '',
        reserved_cones_at_source: pool.cones,
        reserved_meters_at_source: pool.meters,
        reserved_full_cones_at_source: pool.full_cones,
        reserved_partial_cones_at_source: pool.partial_cones,
      })
    }

    return c.json({
      data: {
        week,
        source_warehouse: warehouse,
        pos,
        unassigned: { thread_lines: unassignedLines },
      },
      error: null,
    })
  }
)

router.post(
  '/:weekId/transfer-reserved-cones',
  requirePermission('thread.batch.transfer'),
  async (c) => {
    const weekId = Number(c.req.param('weekId'))
    if (!Number.isFinite(weekId)) {
      return c.json({ data: null, error: 'Tuần không hợp lệ' }, 400)
    }

    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json({ data: null, error: 'Body JSON không hợp lệ' }, 400)
    }

    const parsed = transferReservedBodySchema.safeParse(body)
    if (!parsed.success) {
      return c.json(
        { data: null, error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
        400
      )
    }

    const performedBy = await getPerformerName(c)

    const { data, error } = await supabaseAdmin.rpc('fn_transfer_reserved_cones', {
      p_week_id: weekId,
      p_from_warehouse_id: parsed.data.from_warehouse_id,
      p_to_warehouse_id: parsed.data.to_warehouse_id,
      p_items: parsed.data.items,
      p_performed_by: performedBy,
    })

    if (error) {
      return c.json({ data: null, error: error.message }, 400)
    }

    const result = data as { transaction_id: number; total_cones: number; per_item: any[] }
    return c.json({
      data: result,
      error: null,
      message: `Đã chuyển ${result.total_cones} cuộn`,
    })
  }
)

export default router
