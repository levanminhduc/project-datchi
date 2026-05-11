import { Hono } from 'hono'
import { supabaseAdmin } from '../../db/supabase'
import { requirePermission } from '../../middleware/auth'
import type { AppEnv } from '../../types/hono-env'
import { getPartialConeRatio } from '../../utils/settings-helper'
import {
  buildPoQuotaMap,
  fetchCalculationData,
  fetchOrderItems,
  fetchColorNameToIdMap,
  fetchSpecsByStyleColors,
} from './transfer-by-calculation'

type IssuedRow = {
  po_id: number | null
  thread_type_id: number
  thread_color_id: number | null
  issued_cones: number
  returned_cones: number
}

function roundToTwoDecimals(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

async function fetchIssuedByPo(weekId: number, ratio: number): Promise<IssuedRow[]> {
  const { data: items, error: itemsErr } = await supabaseAdmin
    .from('thread_order_items')
    .select('po_id, style_id, style_color_id')
    .eq('week_id', weekId)
    .not('po_id', 'is', null)
    .limit(10000)
  if (itemsErr) throw itemsErr
  if (!items || items.length === 0) return []

  const poIds = Array.from(new Set(items.map(i => i.po_id).filter((v): v is number => v != null)))
  const styleColorIds = Array.from(new Set(items.map(i => i.style_color_id).filter((v): v is number => v != null)))
  if (poIds.length === 0 || styleColorIds.length === 0) return []

  const { data: lines, error: linesErr } = await supabaseAdmin
    .from('thread_issue_lines')
    .select('po_id, style_id, style_color_id, thread_type_id, thread_color_id, issued_full, issued_partial, returned_full, returned_partial, thread_issues!inner(status)')
    .in('po_id', poIds)
    .in('style_color_id', styleColorIds)
    .eq('thread_issues.status', 'CONFIRMED')
    .limit(50000)
  if (linesErr) throw linesErr
  if (!lines || lines.length === 0) return []

  const validKeys = new Set<string>()
  for (const it of items as Array<{ po_id: number | null; style_id: number | null; style_color_id: number | null }>) {
    validKeys.add(`${it.po_id ?? 'null'}_${it.style_id ?? 'null'}_${it.style_color_id ?? 'null'}`)
  }

  const grouped = new Map<string, IssuedRow>()
  for (const line of lines as Array<{
    po_id: number | null
    style_id: number | null
    style_color_id: number | null
    thread_type_id: number
    thread_color_id: number | null
    issued_full: number | null
    issued_partial: number | null
    returned_full: number | null
    returned_partial: number | null
  }>) {
    const itemKey = `${line.po_id ?? 'null'}_${line.style_id ?? 'null'}_${line.style_color_id ?? 'null'}`
    if (!validKeys.has(itemKey)) continue
    const key = `${line.po_id ?? 'null'}_${line.thread_type_id}_${line.thread_color_id ?? ''}`
    const issued = roundToTwoDecimals((line.issued_full ?? 0) + (line.issued_partial ?? 0) * ratio)
    const returned = roundToTwoDecimals((line.returned_full ?? 0) + (line.returned_partial ?? 0) * ratio)
    const existing = grouped.get(key)
    if (existing) {
      existing.issued_cones += issued
      existing.returned_cones += returned
    } else {
      grouped.set(key, {
        po_id: line.po_id,
        thread_type_id: line.thread_type_id,
        thread_color_id: line.thread_color_id,
        issued_cones: issued,
        returned_cones: returned,
      })
    }
  }
  return Array.from(grouped.values())
}

const router = new Hono<AppEnv>()

router.get(
  '/:weekId/progress-summary',
  requirePermission('thread.weekly-order.view'),
  async (c) => {
    try {
      const weekIdRaw = c.req.param('weekId')
      if (!/^\d+$/.test(weekIdRaw)) {
        return c.json({ data: null, error: 'weekId không hợp lệ' }, 400)
      }
      const weekId = Number(weekIdRaw)

      const { data: weekRow, error: weekErr } = await supabaseAdmin
        .from('thread_order_weeks')
        .select('id, week_name, status')
        .eq('id', weekId)
        .maybeSingle()
      if (weekErr) throw weekErr
      if (!weekRow) return c.json({ data: null, error: 'Tuần không tồn tại' }, 404)

      const [{ calculation_data }, orderItems, ratio] = await Promise.all([
        fetchCalculationData(weekId),
        fetchOrderItems(weekId),
        getPartialConeRatio(),
      ])
      const issuedRows = await fetchIssuedByPo(weekId, ratio)

      if (calculation_data.length === 0) {
        return c.json({
          data: {
            week: weekRow,
            pos: [],
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

      const issuedByKey = new Map<string, { issued: number; returned: number }>()
      for (const row of issuedRows) {
        const key = `${row.po_id ?? 'null'}_${row.thread_type_id}_${row.thread_color_id ?? ''}`
        const existing = issuedByKey.get(key)
        if (existing) {
          existing.issued += row.issued_cones
          existing.returned += row.returned_cones
        } else {
          issuedByKey.set(key, { issued: row.issued_cones, returned: row.returned_cones })
        }
      }

      const poNumbersMap = new Map<number, string>()
      const poIdsToFetch = poOrder.map(p => p.po_id).filter((id): id is number => id != null)
      if (poIdsToFetch.length > 0) {
        const { data: pos, error: posErr } = await supabaseAdmin
          .from('purchase_orders')
          .select('id, po_number')
          .in('id', poIdsToFetch)
          .limit(poIdsToFetch.length)
        if (posErr) throw posErr
        for (const p of (pos ?? []) as Array<{ id: number; po_number: string }>) {
          poNumbersMap.set(p.id, p.po_number)
        }
      }

      const posResp = poOrder.map(po => {
        const quotaMap = poQuotaMap.get(po.po_id) ?? new Map()
        const thread_lines = Array.from(quotaMap.values()).map(t => {
          const issuedKey = `${po.po_id ?? 'null'}_${t.thread_type_id}_${t.thread_color_id}`
          const issuedEntry = issuedByKey.get(issuedKey)
          const issued_cones = issuedEntry?.issued ?? 0
          const returned_cones = issuedEntry?.returned ?? 0
          const net_issued = Math.max(0, issued_cones - returned_cones)
          const pending_cones = Math.max(0, t.quota_cones - net_issued)
          return {
            thread_type_id: t.thread_type_id,
            thread_color_id: t.thread_color_id,
            supplier_name: t.supplier_name,
            tex_number: t.tex_number,
            color_name: t.color_name,
            quota_cones: t.quota_cones,
            issued_cones,
            returned_cones,
            net_issued,
            pending_cones,
          }
        })

        const total_quota = thread_lines.reduce((s, l) => s + l.quota_cones, 0)
        const total_issued = thread_lines.reduce((s, l) => s + l.issued_cones, 0)
        const total_returned = thread_lines.reduce((s, l) => s + l.returned_cones, 0)
        const total_net = Math.max(0, total_issued - total_returned)
        const total_pending = Math.max(0, total_quota - total_net)

        return {
          po_id: po.po_id,
          po_number: po.po_id != null ? (poNumbersMap.get(po.po_id) ?? '') : '(Không có PO)',
          display_order: po.display_order,
          summary: {
            total_quota_cones: total_quota,
            total_issued_cones: total_issued,
            total_returned_cones: total_returned,
            total_net_issued: total_net,
            total_pending_cones: total_pending,
          },
          thread_lines: thread_lines.sort((a, b) => {
            if (a.supplier_name !== b.supplier_name) return a.supplier_name.localeCompare(b.supplier_name)
            if (a.tex_number !== b.tex_number) return a.tex_number.localeCompare(b.tex_number)
            return a.color_name.localeCompare(b.color_name)
          }),
        }
      })

      return c.json({
        data: {
          week: weekRow,
          pos: posResp,
        },
        error: null,
      })
    } catch (err) {
      console.error('[progress-summary] failed:', err)
      const message = err instanceof Error ? err.message : 'Lỗi truy vấn dữ liệu'
      return c.json({ data: null, error: message }, 500)
    }
  },
)

export default router
