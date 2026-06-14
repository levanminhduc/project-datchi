import { Hono } from 'hono'
import { from, type SqlBuilder } from '../db/sql-builder'
import { requirePermission } from '../middleware/auth'
import {
  overQuotaQuerySchema,
} from '../validation/overQuota'
import { parseQueryArray } from '../validation/overQuota'
import {
  categorizeReason,
  excessCones,
  topReasonLabel,
} from '../utils/over-quota-helpers'
import type { ViewRow } from '../utils/over-quota-helpers'
import type { OverQuotaQuery } from '../validation/overQuota'
import type { AppEnv } from '../types/hono-env'
import overQuotaExtra from './over-quota-extra'

const VIEW = 'v_issue_reconciliation'
const BATCH_SIZE = 5000

export function applyViewFilters(q: SqlBuilder, filters: OverQuotaQuery): SqlBuilder {
  q.eq('issue_status', 'CONFIRMED')

  if (filters.date_from) q.gte('issue_date', filters.date_from)
  if (filters.date_to) q.lte('issue_date', filters.date_to + 'T23:59:59')

  const poIds = parseQueryArray(filters.po_ids)
  if (poIds.length > 0) q.in('po_id', poIds.map(Number))

  const styleIds = parseQueryArray(filters.style_ids)
  if (styleIds.length > 0) q.in('style_id', styleIds.map(Number))

  const departments = parseQueryArray(filters.departments)
  if (departments.length > 0) q.in('department', departments)

  if (filters.reason === 'ky_thuat') {
    q.ilike('over_quota_notes', '%Ky Thuat%')
  } else if (filters.reason === 'rai_dau_may') {
    q.ilike('over_quota_notes', '%rai dau may%')
  }

  if (filters.only_over_quota === 'true') {
    q.eq('is_over_quota', true)
  }

  return q
}

const overQuota = new Hono<AppEnv>()
overQuota.use('*', requirePermission('thread.allocations.view'))

async function fetchAllRows(filters: ReturnType<typeof overQuotaQuerySchema.parse>) {
  const rows: ViewRow[] = []
  let offset = 0
  let hasMore = true
  while (hasMore) {
    const q = applyViewFilters(from(VIEW).select('*'), filters).range(
      offset,
      offset + BATCH_SIZE - 1,
    )
    const data = await q.list<ViewRow & Record<string, unknown>>()
    if (!data || data.length === 0) break
    rows.push(...(data as unknown as ViewRow[]))
    hasMore = data.length === BATCH_SIZE
    offset += BATCH_SIZE
  }
  return rows
}

overQuota.get('/summary', async (c) => {
  try {
    const filters = overQuotaQuerySchema.parse(c.req.query())
    const rows = await fetchAllRows(filters)

    const overRows = rows.filter((r) => r.is_over_quota)
    const totalEvents = overRows.length
    const totalExcess = overRows.reduce((sum, r) => sum + excessCones(r), 0)
    const overRate = rows.length > 0
      ? Math.round((totalEvents / rows.length) * 1000) / 10
      : 0

    const byStyle = new Map<number, { code: string; excess: number }>()
    for (const r of overRows) {
      const prev = byStyle.get(r.style_id) ?? { code: r.style_code, excess: 0 }
      prev.excess += excessCones(r)
      byStyle.set(r.style_id, prev)
    }
    let topStyle: { id: number; code: string; name: string; excess_cones: number } | null = null
    for (const [id, v] of byStyle) {
      if (!topStyle || v.excess > topStyle.excess_cones) {
        topStyle = { id, code: v.code, name: v.code, excess_cones: Math.round(v.excess * 10) / 10 }
      }
    }

    const byDept = new Map<string, number>()
    for (const r of overRows) {
      byDept.set(r.department, (byDept.get(r.department) ?? 0) + 1)
    }
    let topDept: { name: string; over_count: number } | null = null
    for (const [name, count] of byDept) {
      if (!topDept || count > topDept.over_count) topDept = { name, over_count: count }
    }

    const reasonCounts = { ky_thuat: 0, rai_dau_may: 0, khac: 0 }
    for (const r of overRows) {
      const cat = categorizeReason(r.over_quota_notes)
      reasonCounts[cat as keyof typeof reasonCounts]++
    }

    return c.json({
      data: {
        total_over_events: totalEvents,
        total_excess_cones: Math.round(totalExcess * 10) / 10,
        over_rate_pct: overRate,
        top_style: topStyle,
        top_dept: topDept,
        top_reason: topReasonLabel(reasonCounts),
      },
      error: null,
    })
  } catch (err) {
    return c.json({ data: null, error: String(err) }, 500)
  }
})

overQuota.get('/by-style', async (c) => {
  try {
    const filters = overQuotaQuerySchema.parse(c.req.query())
    const rows = await fetchAllRows(filters)

    const styleMap = new Map<number, {
      style_code: string
      rows: ViewRow[]
    }>()
    for (const r of rows) {
      if (!r.style_id) continue
      const entry = styleMap.get(r.style_id) ?? { style_code: r.style_code, rows: [] }
      entry.rows.push(r)
      styleMap.set(r.style_id, entry)
    }

    const styleNames = new Map<number, string>()
    const ids = [...styleMap.keys()]
    if (ids.length > 0) {
      const data = await from('styles')
        .select('id, style_name')
        .in('id', ids)
        .limit(500)
        .list<{ id: number; style_name: string }>()
      data?.forEach((s: { id: number; style_name: string }) => styleNames.set(s.id, s.style_name))
    }

    const result = [...styleMap.entries()].map(([styleId, entry]) => {
      const overRows = entry.rows.filter((r) => r.is_over_quota)
      const totalQuota = entry.rows.reduce((s, r) => s + (r.quota_cones ?? 0), 0)
      const totalIssued = entry.rows.reduce((s, r) => s + r.consumed_equivalent_cones, 0)
      const totalExcess = overRows.reduce((s, r) => s + excessCones(r), 0)
      const reasonBreakdown = { ky_thuat: 0, rai_dau_may: 0, khac: 0 }
      for (const r of overRows) {
        const cat = categorizeReason(r.over_quota_notes)
        reasonBreakdown[cat as keyof typeof reasonBreakdown]++
      }
      const deptMap = new Map<string, number>()
      for (const r of overRows) {
        deptMap.set(r.department, (deptMap.get(r.department) ?? 0) + 1)
      }
      return {
        style_id: styleId,
        style_code: entry.style_code,
        style_name: styleNames.get(styleId) ?? entry.style_code,
        total_quota: Math.round(totalQuota * 10) / 10,
        total_issued: Math.round(totalIssued * 10) / 10,
        total_excess: Math.round(totalExcess * 10) / 10,
        over_count: overRows.length,
        over_rate_pct: totalQuota > 0
          ? Math.round((totalExcess / totalQuota) * 1000) / 10
          : 0,
        top_reason: topReasonLabel(reasonBreakdown),
        reason_breakdown: reasonBreakdown,
        dept_breakdown: [...deptMap.entries()].map(([dept, count]) => ({ dept, count })),
      }
    })
    result.sort((a, b) => b.total_excess - a.total_excess)

    return c.json({ data: result, error: null })
  } catch (err) {
    return c.json({ data: null, error: String(err) }, 500)
  }
})

overQuota.route('/', overQuotaExtra)

export default overQuota
