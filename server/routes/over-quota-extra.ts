import { Hono } from 'hono'
import { supabaseAdmin } from '../db/supabase'
import {
  overQuotaTrendQuerySchema,
  overQuotaDetailQuerySchema,
  parseQueryArray,
} from '../validation/overQuota'
import {
  applyFilters,
  categorizeReason,
  excessCones,
} from '../utils/over-quota-helpers'
import type { ViewRow } from '../utils/over-quota-helpers'
import type { AppEnv } from '../types/hono-env'

const VIEW = 'v_issue_reconciliation'
const BATCH_SIZE = 5000

const overQuotaExtra = new Hono<AppEnv>()

overQuotaExtra.get('/trend', async (c) => {
  try {
    const filters = overQuotaTrendQuerySchema.parse(c.req.query())
    const rows: ViewRow[] = []
    let offset = 0
    let hasMore = true
    while (hasMore) {
      const q = applyFilters(
        supabaseAdmin.from(VIEW).select('*'),
        filters,
      ).range(offset, offset + BATCH_SIZE - 1)
      const { data, error } = await q
      if (error) throw new Error(error.message)
      if (!data || data.length === 0) break
      rows.push(...(data as unknown as ViewRow[]))
      hasMore = data.length === BATCH_SIZE
      offset += BATCH_SIZE
    }

    const granularity = filters.granularity
    const periodMap = new Map<string, { over_count: number; excess_cones: number }>()

    for (const r of rows) {
      if (!r.is_over_quota) continue
      const d = new Date(r.issue_date)
      let key: string
      if (granularity === 'month') {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
      } else {
        const day = d.getDay()
        const monday = new Date(d)
        monday.setDate(d.getDate() - ((day + 6) % 7))
        key = monday.toISOString().slice(0, 10)
      }
      const entry = periodMap.get(key) ?? { over_count: 0, excess_cones: 0 }
      entry.over_count++
      entry.excess_cones += excessCones(r)
      periodMap.set(key, entry)
    }

    const pad = (n: number) => String(n).padStart(2, '0')
    const result = [...periodMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, v]) => {
        const d = new Date(period)
        let periodLabel: string
        if (granularity === 'month') {
          periodLabel = `${pad(d.getMonth() + 1)}/${d.getFullYear()}`
        } else {
          const end = new Date(d)
          end.setDate(d.getDate() + 6)
          periodLabel = `${pad(d.getDate())}/${pad(d.getMonth() + 1)} - ${pad(end.getDate())}/${pad(end.getMonth() + 1)}`
        }
        return {
          period,
          period_label: periodLabel,
          over_count: v.over_count,
          excess_cones: Math.round(v.excess_cones * 10) / 10,
        }
      })

    return c.json({ data: result, error: null })
  } catch (err) {
    return c.json({ data: null, error: String(err) }, 500)
  }
})

overQuotaExtra.get('/detail', async (c) => {
  try {
    const filters = overQuotaDetailQuerySchema.parse(c.req.query())
    const page = filters.page
    const pageSize = filters.page_size
    const offset = (page - 1) * pageSize

    let q = supabaseAdmin
      .from(VIEW)
      .select('*', { count: 'exact' })
      .eq('issue_status', 'CONFIRMED')

    if (filters.date_from) q = q.gte('issue_date', filters.date_from)
    if (filters.date_to) q = q.lte('issue_date', filters.date_to + 'T23:59:59')
    const poIds = parseQueryArray(filters.po_ids)
    if (poIds.length > 0) q = q.in('po_id', poIds.map(Number))
    const styleIds = parseQueryArray(filters.style_ids)
    if (styleIds.length > 0) q = q.in('style_id', styleIds.map(Number))
    const departments = parseQueryArray(filters.departments)
    if (departments.length > 0) q = q.in('department', departments)
    if (filters.reason === 'ky_thuat') q = q.ilike('over_quota_notes', '%Ky Thuat%')
    else if (filters.reason === 'rai_dau_may') q = q.ilike('over_quota_notes', '%rai dau may%')
    if (filters.only_over_quota === 'true') q = q.eq('is_over_quota', true)
    if (filters.style_id) q = q.eq('style_id', filters.style_id)

    const SORT_MAP: Record<string, string> = {
      excess_cones: 'consumption_percentage',
      consumption_pct: 'consumption_percentage',
    }
    const rawSort = filters.sort_by || 'issue_date'
    const sortCol = SORT_MAP[rawSort] || rawSort
    q = q.order(sortCol, { ascending: filters.descending !== 'true', nullsFirst: false })
    q = q.range(offset, offset + pageSize - 1)

    const { data, error, count } = await q
    if (error) throw new Error(error.message)

    const rows = (data as unknown as ViewRow[]).map((r) => ({
      issue_id: r.issue_id,
      issue_code: r.issue_code,
      department: r.department,
      issue_date: r.issue_date,
      po_number: r.po_number,
      style_id: r.style_id,
      style_code: r.style_code,
      style_name: r.style_code,
      color_name: r.color_name,
      thread_code: r.thread_code,
      thread_name: r.thread_name,
      quota_cones: r.quota_cones ?? 0,
      consumed_equivalent_cones: r.consumed_equivalent_cones,
      excess_cones: excessCones(r),
      consumption_pct: r.consumption_percentage ?? 0,
      over_quota_notes: r.over_quota_notes,
      reason_category: categorizeReason(r.over_quota_notes),
    }))

    return c.json({
      data: { rows, total: count ?? 0, page, page_size: pageSize },
      error: null,
    })
  } catch (err) {
    return c.json({ data: null, error: String(err) }, 500)
  }
})

export default overQuotaExtra
