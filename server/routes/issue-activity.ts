import { Hono } from 'hono'
import { supabaseAdmin } from '../db/supabase'
import type { AppEnv } from '../types/hono-env'
import { getPartialConeRatio } from '../utils/settings-helper'
import {
  fetchCalculationData,
  fetchColorNameToIdMap,
  fetchSpecsByStyleColors,
} from './weekly-order/transfer-by-calculation'
import {
  roundToTwoDecimals,
  buildPoStyleQuotaMap,
  fetchIssuedByPoStyleMultiWeek,
  fetchLastIssuedAtByPo,
  fetchOrderItemsForWeeks,
  type CalculationDataRow,
  type StyleQuotaThread,
} from './weekly-order/progress-helpers'

const issueActivity = new Hono<AppEnv>()

issueActivity.get(
  '/issue-activity',
  async (c) => {
    try {
      const query = c.req.query()
      const page = Math.max(1, Number(query.page) || 1)
      const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
      const department = query.department || undefined

      const { data: weeks, error: weeksErr } = await supabaseAdmin
        .from('thread_order_weeks')
        .select('id')
        .eq('status', 'CONFIRMED')
        .limit(1000)
      if (weeksErr) throw weeksErr
      if (!weeks || weeks.length === 0) {
        return c.json({
          data: { pos: [], total: 0, page, limit },
          error: null,
        })
      }

      const weekIds = weeks.map(w => w.id)

      const allOrderItems = await fetchOrderItemsForWeeks(weekIds)

      if (allOrderItems.length === 0) {
        return c.json({
          data: { pos: [], total: 0, page, limit },
          error: null,
        })
      }

      const allPoIds = Array.from(new Set(
        allOrderItems.map(i => i.po_id).filter((v): v is number => v != null)
      ))

      const total = allPoIds.length

      const ratio = await getPartialConeRatio()
      const lastIssuedMap = await fetchLastIssuedAtByPo(allPoIds, department)

      const sortedPoIds = [...allPoIds].sort((a, b) => {
        const aTime = lastIssuedMap.get(a)
        const bTime = lastIssuedMap.get(b)
        if (!aTime && !bTime) return a - b
        if (!aTime) return 1
        if (!bTime) return -1
        return new Date(bTime).getTime() - new Date(aTime).getTime()
      })

      const offset = (page - 1) * limit
      const pagePoIds = sortedPoIds.slice(offset, offset + limit)

      if (pagePoIds.length === 0) {
        return c.json({
          data: { pos: [], total, page, limit },
          error: null,
        })
      }

      const pagePoIdSet = new Set(pagePoIds)
      const filteredItems = allOrderItems.filter(i => i.po_id != null && pagePoIdSet.has(i.po_id))

      const styleColorIds = Array.from(new Set(filteredItems.map(it => it.style_color_id)))
      const specs = await fetchSpecsByStyleColors(styleColorIds)

      const threadColorIds = Array.from(new Set(specs.map(s => s.thread_color_id).filter((v): v is number => v != null)))
      const colorByName = await fetchColorNameToIdMap(threadColorIds)
      const colorById = new Map<number, string>()
      for (const [name, id] of colorByName) colorById.set(id, name)

      const itemsByWeek = new Map<number, typeof filteredItems>()
      for (const item of filteredItems) {
        const weekItems = itemsByWeek.get(item.week_id) ?? []
        weekItems.push(item)
        itemsByWeek.set(item.week_id, weekItems)
      }

      const pageWeekIds = Array.from(itemsByWeek.keys())
      const calcByWeekStyle = new Map<string, CalculationDataRow>()
      await Promise.all(pageWeekIds.map(async (weekId) => {
        const { calculation_data } = await fetchCalculationData(weekId)
        for (const cd of calculation_data) {
          calcByWeekStyle.set(`${weekId}_${cd.style_id}`, cd)
        }
      }))

      const mergedPoStyleQuotaMap = new Map<number | null, Map<number, Map<string, StyleQuotaThread>>>()
      const mergedPoStyleColorMap = new Map<number | null, Map<number, Set<number>>>()

      for (const [weekId, weekItems] of itemsByWeek) {
        const weekCalcData = Array.from(calcByWeekStyle.entries())
          .filter(([key]) => key.startsWith(`${weekId}_`))
          .map(([, cd]) => cd)

        const { poStyleQuotaMap: weekQuotaMap, poStyleColorMap: weekColorMap } = buildPoStyleQuotaMap(
          weekItems,
          specs,
          weekCalcData,
          colorByName,
          colorById,
        )

        for (const [poId, styleMap] of weekQuotaMap) {
          if (!mergedPoStyleQuotaMap.has(poId)) mergedPoStyleQuotaMap.set(poId, new Map())
          const mergedStyleMap = mergedPoStyleQuotaMap.get(poId)!
          for (const [styleId, threadMap] of styleMap) {
            if (!mergedStyleMap.has(styleId)) mergedStyleMap.set(styleId, new Map())
            const mergedThreadMap = mergedStyleMap.get(styleId)!
            for (const [key, thread] of threadMap) {
              const existing = mergedThreadMap.get(key)
              if (existing) {
                existing.quota_cones += thread.quota_cones
              } else {
                mergedThreadMap.set(key, { ...thread })
              }
            }
          }
        }

        for (const [poId, styleColorMap] of weekColorMap) {
          if (!mergedPoStyleColorMap.has(poId)) mergedPoStyleColorMap.set(poId, new Map())
          const mergedScMap = mergedPoStyleColorMap.get(poId)!
          for (const [styleId, scSet] of styleColorMap) {
            if (!mergedScMap.has(styleId)) mergedScMap.set(styleId, new Set())
            for (const scId of scSet) mergedScMap.get(styleId)!.add(scId)
          }
        }
      }

      const poStyleQuotaMap = mergedPoStyleQuotaMap
      const poStyleColorMap = mergedPoStyleColorMap

      const issuedRows = await fetchIssuedByPoStyleMultiWeek(weekIds, ratio, department, pagePoIds)

      const issuedByKey = new Map<string, { issued: number; returned: number }>()
      for (const row of issuedRows) {
        if (row.po_id == null || !pagePoIdSet.has(row.po_id)) continue
        const key = `${row.po_id}_${row.style_id ?? 'null'}_${row.thread_type_id}_${row.thread_color_id ?? ''}`
        const existing = issuedByKey.get(key)
        if (existing) {
          existing.issued += row.issued_cones
          existing.returned += row.returned_cones
        } else {
          issuedByKey.set(key, { issued: row.issued_cones, returned: row.returned_cones })
        }
      }

      const poNumbersMap = new Map<number, string>()
      if (pagePoIds.length > 0) {
        const { data: pos, error: posErr } = await supabaseAdmin
          .from('purchase_orders')
          .select('id, po_number')
          .in('id', pagePoIds)
          .limit(pagePoIds.length)
        if (posErr) throw posErr
        for (const p of (pos ?? []) as Array<{ id: number; po_number: string }>) {
          poNumbersMap.set(p.id, p.po_number)
        }
      }

      const allStyleIds = new Set<number>()
      for (const poId of pagePoIds) {
        const styleMap = poStyleQuotaMap.get(poId)
        if (styleMap) {
          for (const styleId of styleMap.keys()) allStyleIds.add(styleId)
        }
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

      const allStyleColorIds = new Set<number>()
      for (const poId of pagePoIds) {
        const scMap = poStyleColorMap.get(poId)
        if (scMap) {
          for (const [, scSet] of scMap) {
            for (const scId of scSet) allStyleColorIds.add(scId)
          }
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

      const posResp = pagePoIds.map(poId => {
        const styleMap = poStyleQuotaMap.get(poId) ?? new Map<number, Map<string, StyleQuotaThread>>()
        const scMap = poStyleColorMap.get(poId) ?? new Map<number, Set<number>>()

        const styles = Array.from(styleMap.entries()).map(([styleId, threadMap]) => {
          const styleInfo = styleInfoMap.get(styleId)
          const styleColorIds = scMap.get(styleId) ?? new Set<number>()
          const styleColors = Array.from(styleColorIds)
            .map(scId => ({ style_color_id: scId, name: styleColorNameMap.get(scId) ?? '' }))
            .filter(sc => sc.name)

          const thread_lines = Array.from(threadMap.values()).map(t => {
            const issuedKey = `${poId}_${styleId}_${t.thread_type_id}_${t.thread_color_id}`
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

        const poTotalQuota = styles.reduce((s, st) => s + st.summary.total_quota_cones, 0)
        const poTotalIssued = styles.reduce((s, st) => s + st.summary.total_issued_cones, 0)
        const poTotalReturned = styles.reduce((s, st) => s + st.summary.total_returned_cones, 0)
        const poTotalNet = roundToTwoDecimals(Math.max(0, poTotalIssued - poTotalReturned))
        const poTotalPending = roundToTwoDecimals(Math.max(0, poTotalQuota - poTotalNet))
        const poOverQuota = roundToTwoDecimals(Math.max(0, poTotalNet - poTotalQuota))

        return {
          po_id: poId,
          po_number: poNumbersMap.get(poId) ?? '',
          last_issued_at: lastIssuedMap.get(poId) ?? null,
          summary: {
            total_quota_cones: roundToTwoDecimals(poTotalQuota),
            total_issued_cones: roundToTwoDecimals(poTotalIssued),
            total_returned_cones: roundToTwoDecimals(poTotalReturned),
            total_net_issued: poTotalNet,
            total_pending_cones: poTotalPending,
            over_quota_cones: poOverQuota,
          },
          styles,
        }
      })

      return c.json({
        data: { pos: posResp, total, page, limit },
        error: null,
      })
    } catch (err) {
      console.error('[issue-activity] failed:', err)
      const message = err instanceof Error ? err.message : 'Lỗi truy vấn dữ liệu'
      return c.json({ data: null, error: message }, 500)
    }
  },
)

export default issueActivity
