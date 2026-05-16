/**
 * Issue History Routes
 * Báo cáo lịch sử xuất chỉ, aggregated by supplier + tex_number.
 *
 * Mounted directly under /api/issue-history to avoid the global
 * thread.allocations.view guard on the issuesV2 router.
 */

import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'
import { requirePermission } from '../middleware/auth'
import type { AppEnv } from '../types/hono-env'
import { getErrorMessage } from '../utils/errorHelper'
import { ExportHistoryQuerySchema } from '../validation/issuesV2'

const issueHistory = new Hono<AppEnv>()

issueHistory.use('/aggregated', requirePermission('thread.issues.export-history'))

type AggregatedRow = {
  supplier_id: number
  supplier_name: string
  tex_number: string
  total_full_cones: number
}

type RawLine = {
  id: number
  issued_full: number
  thread_types: {
    tex_number: string | null
    supplier_id: number
    suppliers: {
      id: number
      name: string
    }
  }
  thread_issues: {
    status: string
    updated_at: string
    source_warehouse_id: number | null
  }
}

const BATCH_SIZE = 1000

function nextCalendarDay(yyyymmdd: string): string {
  const [year, month, day] = yyyymmdd.split('-').map(Number)
  const utcMs = Date.UTC(year, month - 1, day) + 24 * 60 * 60 * 1000
  const next = new Date(utcMs)
  const nextYear = next.getUTCFullYear()
  const nextMonth = String(next.getUTCMonth() + 1).padStart(2, '0')
  const nextDay = String(next.getUTCDate()).padStart(2, '0')
  return `${nextYear}-${nextMonth}-${nextDay}`
}

function sortAggregatedRows(rows: AggregatedRow[]): AggregatedRow[] {
  return rows.sort((a, b) => {
    const supplierCompare = a.supplier_name.localeCompare(b.supplier_name, 'vi')
    if (supplierCompare !== 0) return supplierCompare

    const texA = Number.parseFloat(a.tex_number) || 0
    const texB = Number.parseFloat(b.tex_number) || 0
    return texA - texB
  })
}

issueHistory.get('/aggregated', async (c) => {
  try {
    const parsed = ExportHistoryQuerySchema.safeParse(c.req.query())
    if (!parsed.success) {
      return c.json(
        {
          data: null,
          error: parsed.error.issues[0]?.message || 'Tham số không hợp lệ',
        },
        400,
      )
    }

    const { from_date, to_date, warehouse_id } = parsed.data
    const lowerBound = `${from_date}T00:00:00+07:00`
    const upperBound = `${nextCalendarDay(to_date)}T00:00:00+07:00`
    const aggregated = new Map<string, AggregatedRow>()
    let lastId = 0

    while (true) {
      let query = supabase
        .from('thread_issue_lines')
        .select(
          `
          id,
          issued_full,
          thread_types!inner (
            tex_number,
            supplier_id,
            suppliers!inner ( id, name )
          ),
          thread_issues!inner (
            status,
            updated_at,
            source_warehouse_id
          )
          `,
        )
        .eq('thread_issues.status', 'CONFIRMED')
        .gte('thread_issues.updated_at', lowerBound)
        .lt('thread_issues.updated_at', upperBound)
        .gt('issued_full', 0)
        .gt('id', lastId)
        .order('id', { ascending: true })
        .limit(BATCH_SIZE)

      if (warehouse_id) {
        query = query.eq('thread_issues.source_warehouse_id', warehouse_id)
      }

      const { data, error } = await query
      if (error) {
        console.error('[issue-history.aggregated] query failed:', error)
        return c.json({ data: null, error: error.message }, 500)
      }

      const batch = (data ?? []) as unknown as RawLine[]
      if (batch.length === 0) break

      for (const row of batch) {
        const supplier = row.thread_types.suppliers
        const texNumber = row.thread_types.tex_number ?? ''
        const key = `${supplier.id}|${texNumber}`
        const existing = aggregated.get(key)

        if (existing) {
          existing.total_full_cones += row.issued_full
        } else {
          aggregated.set(key, {
            supplier_id: supplier.id,
            supplier_name: supplier.name,
            tex_number: texNumber,
            total_full_cones: row.issued_full,
          })
        }
      }

      lastId = batch[batch.length - 1].id
      if (batch.length < BATCH_SIZE) break
    }

    return c.json({
      data: sortAggregatedRows([...aggregated.values()]),
      error: null,
    })
  } catch (error) {
    console.error('[issue-history.aggregated] unexpected error:', error)
    return c.json({ data: null, error: getErrorMessage(error) }, 500)
  }
})

issueHistory.get('/by-thread-type', async (c) => {
  try {
    const query = c.req.query()
    const threadTypeId = Number(query.thread_type_id)
    if (!threadTypeId || Number.isNaN(threadTypeId)) {
      return c.json({ data: null, error: 'thread_type_id là bắt buộc' }, 400)
    }

    const threadColorId = query.thread_color_id ? Number(query.thread_color_id) : null

    let dataQuery = supabase
      .from('thread_issue_lines')
      .select(`
        id,
        issued_full,
        issued_partial,
        returned_full,
        returned_partial,
        po_id,
        thread_issues!inner (
          issue_code,
          created_by,
          status,
          updated_at
        ),
        purchase_orders ( po_number ),
        styles ( style_code ),
        style_colors ( color_name )
      `)
      .eq('thread_type_id', threadTypeId)
      .eq('thread_issues.status', 'CONFIRMED')
      .order('id', { ascending: true })
      .limit(2000)

    if (threadColorId != null) {
      dataQuery = dataQuery.eq('thread_color_id', threadColorId)
    }

    const { data, error: dataErr } = await dataQuery
    if (dataErr) {
      console.error('[issue-history.by-thread-type] query failed:', dataErr)
      return c.json({ data: null, error: dataErr.message }, 500)
    }

    type RawRow = {
      id: number
      issued_full: number
      issued_partial: number
      returned_full: number
      returned_partial: number
      po_id: number | null
      thread_issues: { issue_code: string; created_by: string; status: string; updated_at: string }
      purchase_orders: { po_number: string } | null
      styles: { style_code: string } | null
      style_colors: { color_name: string } | null
    }

    const rows = (data ?? []) as unknown as RawRow[]

    const poGroups = new Map<string, {
      po_number: string | null
      total_net_full: number
      total_net_partial: number
      last_issued_at: string
      lines: Array<{
        issue_code: string
        style_code: string | null
        style_color_name: string | null
        created_by: string
        issued_at: string
        net_full: number
        net_partial: number
      }>
    }>()

    for (const r of rows) {
      const poKey = r.po_id != null ? String(r.po_id) : 'no-po'
      const netFull = (r.issued_full ?? 0) - (r.returned_full ?? 0)
      const netPartial = (r.issued_partial ?? 0) - (r.returned_partial ?? 0)
      const issuedAt = r.thread_issues.updated_at

      if (!poGroups.has(poKey)) {
        poGroups.set(poKey, {
          po_number: r.purchase_orders?.po_number ?? null,
          total_net_full: 0,
          total_net_partial: 0,
          last_issued_at: issuedAt,
          lines: [],
        })
      }

      const group = poGroups.get(poKey)!
      group.total_net_full += netFull
      group.total_net_partial += netPartial
      if (issuedAt > group.last_issued_at) group.last_issued_at = issuedAt

      group.lines.push({
        issue_code: r.thread_issues.issue_code,
        style_code: r.styles?.style_code ?? null,
        style_color_name: r.style_colors?.color_name ?? null,
        created_by: r.thread_issues.created_by,
        issued_at: issuedAt,
        net_full: netFull,
        net_partial: netPartial,
      })
    }

    const items = [...poGroups.values()].sort(
      (a, b) => new Date(b.last_issued_at).getTime() - new Date(a.last_issued_at).getTime(),
    )

    return c.json({
      data: { items, total: items.length },
      error: null,
    })
  } catch (error) {
    console.error('[issue-history.by-thread-type] unexpected error:', error)
    return c.json({ data: null, error: getErrorMessage(error) }, 500)
  }
})

export default issueHistory
