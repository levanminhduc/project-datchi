import { Hono } from 'hono'
import { supabaseAdmin } from '../../db/supabase'
import { requirePermission } from '../../middleware/auth'
import type { AppEnv } from '../../types/hono-env'
import { getPartialConeRatio } from '../../utils/settings-helper'
import {
  fetchCalculationData,
  fetchOrderItems,
  fetchColorNameToIdMap,
  fetchSpecsByStyleColors,
} from './transfer-by-calculation'
import {
  type CalculationDataRow,
  type StyleQuotaThread,
  roundToTwoDecimals,
  buildPoStyleQuotaMap,
  fetchIssuedByPoStyleMultiWeek,
} from './progress-helpers'

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
      const issuedRows = await fetchIssuedByPoStyleMultiWeek([weekId], ratio)

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

      const { poOrder, poStyleQuotaMap, poStyleColorMap } = buildPoStyleQuotaMap(
        orderItems,
        specs,
        calculation_data as CalculationDataRow[],
        colorByName,
        colorById,
      )

      // Group issued data by po + style + thread
      const issuedByKey = new Map<string, { issued: number; returned: number }>()
      for (const row of issuedRows) {
        const key = `${row.po_id ?? 'null'}_${row.style_id ?? 'null'}_${row.thread_type_id}_${row.thread_color_id ?? ''}`
        const existing = issuedByKey.get(key)
        if (existing) {
          existing.issued += row.issued_cones
          existing.returned += row.returned_cones
        } else {
          issuedByKey.set(key, { issued: row.issued_cones, returned: row.returned_cones })
        }
      }

      // Also aggregate at PO + thread level for the flat thread_lines
      const issuedByPoThread = new Map<string, { issued: number; returned: number }>()
      for (const row of issuedRows) {
        const key = `${row.po_id ?? 'null'}_${row.thread_type_id}_${row.thread_color_id ?? ''}`
        const existing = issuedByPoThread.get(key)
        if (existing) {
          existing.issued += row.issued_cones
          existing.returned += row.returned_cones
        } else {
          issuedByPoThread.set(key, { issued: row.issued_cones, returned: row.returned_cones })
        }
      }

      // Fetch PO numbers
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

      // Fetch style info
      const allStyleIds = new Set<number>()
      for (const [, styleMap] of poStyleQuotaMap) {
        for (const styleId of styleMap.keys()) allStyleIds.add(styleId)
      }
      const styleInfoMap = new Map<number, { style_code: string; style_name: string }>()
      if (allStyleIds.size > 0) {
        const styleIdArr = Array.from(allStyleIds)
        const { data: stylesData, error: stylesErr } = await supabaseAdmin
          .from('styles')
          .select('id, style_code, style_name')
          .in('id', styleIdArr)
          .limit(styleIdArr.length)
        if (stylesErr) throw stylesErr
        for (const s of (stylesData ?? []) as Array<{ id: number; style_code: string; style_name: string }>) {
          styleInfoMap.set(s.id, { style_code: s.style_code, style_name: s.style_name })
        }
      }

      // Fetch style_color names
      const allStyleColorIds = new Set<number>()
      for (const [, scMap] of poStyleColorMap) {
        for (const [, scSet] of scMap) {
          for (const scId of scSet) allStyleColorIds.add(scId)
        }
      }
      const styleColorNameMap = new Map<number, string>()
      if (allStyleColorIds.size > 0) {
        const scIdArr = Array.from(allStyleColorIds)
        const { data: scData, error: scErr } = await supabaseAdmin
          .from('style_colors')
          .select('id, color_name')
          .in('id', scIdArr)
          .limit(scIdArr.length)
        if (scErr) throw scErr
        for (const sc of (scData ?? []) as Array<{ id: number; color_name: string }>) {
          styleColorNameMap.set(sc.id, sc.color_name)
        }
      }

      const posResp = poOrder.map(po => {
        const styleMap = poStyleQuotaMap.get(po.po_id) ?? new Map<number, Map<string, StyleQuotaThread>>()
        const scMap = poStyleColorMap.get(po.po_id) ?? new Map<number, Set<number>>()

        // Build styles array
        const styles = Array.from(styleMap.entries()).map(([styleId, threadMap]) => {
          const styleInfo = styleInfoMap.get(styleId)
          const styleColorIds = scMap.get(styleId) ?? new Set<number>()
          const styleColors = Array.from(styleColorIds)
            .map(scId => styleColorNameMap.get(scId) ?? '')
            .filter(Boolean)

          const thread_lines = Array.from(threadMap.values()).map(t => {
            const issuedKey = `${po.po_id ?? 'null'}_${styleId}_${t.thread_type_id}_${t.thread_color_id}`
            const issuedEntry = issuedByKey.get(issuedKey)
            const issued_cones = issuedEntry?.issued ?? 0
            const returned_cones = issuedEntry?.returned ?? 0
            const net_issued = roundToTwoDecimals(Math.max(0, issued_cones - returned_cones))
            const pending_cones = roundToTwoDecimals(Math.max(0, t.quota_cones - net_issued))
            return {
              thread_type_id: t.thread_type_id,
              thread_color_id: t.thread_color_id,
              supplier_name: t.supplier_name,
              tex_number: t.tex_number,
              color_name: t.color_name,
              quota_cones: t.quota_cones,
              issued_cones: roundToTwoDecimals(issued_cones),
              returned_cones: roundToTwoDecimals(returned_cones),
              net_issued,
              pending_cones,
            }
          }).sort((a, b) => {
            if (a.supplier_name !== b.supplier_name) return a.supplier_name.localeCompare(b.supplier_name)
            if (a.tex_number !== b.tex_number) return a.tex_number.localeCompare(b.tex_number)
            return a.color_name.localeCompare(b.color_name)
          })

          const total_quota = thread_lines.reduce((s, l) => s + l.quota_cones, 0)
          const total_issued = thread_lines.reduce((s, l) => s + l.issued_cones, 0)
          const total_returned = thread_lines.reduce((s, l) => s + l.returned_cones, 0)
          const total_net = roundToTwoDecimals(Math.max(0, total_issued - total_returned))
          const total_pending = roundToTwoDecimals(Math.max(0, total_quota - total_net))
          const over_quota = roundToTwoDecimals(Math.max(0, total_net - total_quota))

          return {
            style_id: styleId,
            style_code: styleInfo?.style_code ?? '',
            style_name: styleInfo?.style_name ?? '',
            style_colors: styleColors,
            summary: {
              total_quota_cones: roundToTwoDecimals(total_quota),
              total_issued_cones: roundToTwoDecimals(total_issued),
              total_returned_cones: roundToTwoDecimals(total_returned),
              total_net_issued: total_net,
              total_pending_cones: total_pending,
              over_quota_cones: over_quota,
            },
            thread_lines,
          }
        }).sort((a, b) => a.style_code.localeCompare(b.style_code))

        // Build flat thread_lines at PO level (aggregated across styles)
        const poThreadMap = new Map<string, {
          thread_type_id: number
          thread_color_id: number
          supplier_name: string
          tex_number: string
          color_name: string
          quota_cones: number
        }>()
        for (const [, threadMap] of styleMap) {
          for (const [key, t] of threadMap) {
            const existing = poThreadMap.get(key)
            if (existing) {
              existing.quota_cones += t.quota_cones
            } else {
              poThreadMap.set(key, { ...t })
            }
          }
        }

        const thread_lines = Array.from(poThreadMap.values()).map(t => {
          const issuedKey = `${po.po_id ?? 'null'}_${t.thread_type_id}_${t.thread_color_id}`
          const issuedEntry = issuedByPoThread.get(issuedKey)
          const issued_cones = issuedEntry?.issued ?? 0
          const returned_cones = issuedEntry?.returned ?? 0
          const net_issued = roundToTwoDecimals(Math.max(0, issued_cones - returned_cones))
          const pending_cones = roundToTwoDecimals(Math.max(0, t.quota_cones - net_issued))
          return {
            thread_type_id: t.thread_type_id,
            thread_color_id: t.thread_color_id,
            supplier_name: t.supplier_name,
            tex_number: t.tex_number,
            color_name: t.color_name,
            quota_cones: t.quota_cones,
            issued_cones: roundToTwoDecimals(issued_cones),
            returned_cones: roundToTwoDecimals(returned_cones),
            net_issued,
            pending_cones,
          }
        }).sort((a, b) => {
          if (a.supplier_name !== b.supplier_name) return a.supplier_name.localeCompare(b.supplier_name)
          if (a.tex_number !== b.tex_number) return a.tex_number.localeCompare(b.tex_number)
          return a.color_name.localeCompare(b.color_name)
        })

        const total_quota = thread_lines.reduce((s, l) => s + l.quota_cones, 0)
        const total_issued = thread_lines.reduce((s, l) => s + l.issued_cones, 0)
        const total_returned = thread_lines.reduce((s, l) => s + l.returned_cones, 0)
        const total_net = roundToTwoDecimals(Math.max(0, total_issued - total_returned))
        const total_pending = roundToTwoDecimals(Math.max(0, total_quota - total_net))
        const over_quota = roundToTwoDecimals(Math.max(0, total_net - total_quota))

        return {
          po_id: po.po_id,
          po_number: po.po_id != null ? (poNumbersMap.get(po.po_id) ?? '') : '(Không có PO)',
          display_order: po.display_order,
          summary: {
            total_quota_cones: roundToTwoDecimals(total_quota),
            total_issued_cones: roundToTwoDecimals(total_issued),
            total_returned_cones: roundToTwoDecimals(total_returned),
            total_net_issued: total_net,
            total_pending_cones: total_pending,
            over_quota_cones: over_quota,
          },
          styles,
          thread_lines,
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
