/**
 * Issue History Routes
 * Báo cáo lịch sử xuất chỉ, aggregated by supplier + tex_number.
 *
 * Mounted directly under /api/issue-history to avoid the global
 * thread.allocations.view guard on the issuesV2 router.
 */

import { Hono } from 'hono'
import { query } from '../db/query'
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
  tex_label: string
  total_full_cones: number
  department?: string
  style_code?: string
}

type RawLine = {
  id: number
  issued_full: number
  thread_types: {
    tex_number: string | null
    tex_label: string | null
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
    department: string
  }
  styles: { style_code: string | null } | null
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

/**
 * Robust tex comparator: tex_number can be numeric ('60', '100') or
 * non-numeric ('TSP EB60', 'Elecut 60', 'Tơ 210'). If BOTH parse as finite
 * numbers, compare numerically; otherwise fall back to locale compare.
 */
function compareTex(a: string, b: string): number {
  const numA = Number.parseFloat(a)
  const numB = Number.parseFloat(b)
  if (Number.isFinite(numA) && Number.isFinite(numB)) {
    return numA - numB
  }
  return a.localeCompare(b, 'vi')
}

function sortAggregatedRows(
  rows: AggregatedRow[],
  mode: 'summary' | 'detailed',
): AggregatedRow[] {
  if (mode === 'detailed') {
    return rows.sort((a, b) => {
      const departmentCompare = (a.department ?? '').localeCompare(b.department ?? '', 'vi')
      if (departmentCompare !== 0) return departmentCompare

      const styleCompare = (a.style_code ?? '').localeCompare(b.style_code ?? '', 'vi')
      if (styleCompare !== 0) return styleCompare

      const supplierCompare = a.supplier_name.localeCompare(b.supplier_name, 'vi')
      if (supplierCompare !== 0) return supplierCompare

      return compareTex(a.tex_number, b.tex_number)
    })
  }

  return rows.sort((a, b) => {
    const supplierCompare = a.supplier_name.localeCompare(b.supplier_name, 'vi')
    if (supplierCompare !== 0) return supplierCompare

    return compareTex(a.tex_number, b.tex_number)
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

    const { from_date, to_date, warehouse_id, mode } = parsed.data
    const lowerBound = `${from_date}T00:00:00+07:00`
    const upperBound = `${nextCalendarDay(to_date)}T00:00:00+07:00`
    const aggregated = new Map<string, AggregatedRow>()
    let lastId = 0

    const threadTypesEmbed = `
          json_build_object(
            'tex_number', tt.tex_number,
            'tex_label', tt.tex_label,
            'supplier_id', tt.supplier_id,
            'suppliers', json_build_object('id', sup.id, 'name', sup.name)
          )`
    const issuesSummaryEmbed = `
          json_build_object(
            'status', ti.status,
            'updated_at', ti.updated_at,
            'source_warehouse_id', ti.source_warehouse_id
          )`
    const issuesDetailedEmbed = `
          json_build_object(
            'status', ti.status,
            'updated_at', ti.updated_at,
            'source_warehouse_id', ti.source_warehouse_id,
            'department', ti.department
          )`
    const stylesSelect =
      mode === 'detailed'
        ? `,
          CASE WHEN s.id IS NULL THEN NULL ELSE json_build_object('style_code', s.style_code) END AS styles`
        : ''
    const stylesJoin =
      mode === 'detailed' ? '\n      LEFT JOIN styles s ON s.id = til.style_id' : ''

    while (true) {
      const params: unknown[] = ['CONFIRMED', lowerBound, upperBound, lastId]
      let whereWarehouse = ''
      if (warehouse_id) {
        params.push(warehouse_id)
        whereWarehouse = ` AND ti.source_warehouse_id = $${params.length}`
      }
      params.push(BATCH_SIZE)
      const limitPlaceholder = `$${params.length}`

      const sql = `
        SELECT
          til.id,
          til.issued_full,
          ${threadTypesEmbed} AS thread_types,
          ${mode === 'detailed' ? issuesDetailedEmbed : issuesSummaryEmbed} AS thread_issues${stylesSelect}
        FROM thread_issue_lines til
        INNER JOIN thread_types tt ON tt.id = til.thread_type_id
        INNER JOIN suppliers sup ON sup.id = tt.supplier_id
        INNER JOIN thread_issues ti ON ti.id = til.issue_id${stylesJoin}
        WHERE ti.status = $1
          AND ti.updated_at >= $2
          AND ti.updated_at < $3
          AND til.issued_full > 0
          AND til.id > $4${whereWarehouse}
        ORDER BY til.id ASC
        LIMIT ${limitPlaceholder}`

      const batch = (await query<RawLine & Record<string, unknown>>(sql, params)) as unknown as RawLine[]
      if (batch.length === 0) break

      for (const row of batch) {
        const supplier = row.thread_types.suppliers
        const texNumber = row.thread_types.tex_number ?? ''
        const texLabel = row.thread_types.tex_label || texNumber || '-'

        if (mode === 'detailed') {
          const department = row.thread_issues.department
          const styleCode = row.styles?.style_code || '(Không có mã hàng)'
          const key = `${department}|${styleCode}|${supplier.id}|${texLabel}`
          const existing = aggregated.get(key)

          if (existing) {
            existing.total_full_cones += row.issued_full
          } else {
            aggregated.set(key, {
              department,
              style_code: styleCode,
              supplier_id: supplier.id,
              supplier_name: supplier.name,
              tex_number: texNumber,
              tex_label: texLabel,
              total_full_cones: row.issued_full,
            })
          }
        } else {
          const key = `${supplier.id}|${texLabel}`
          const existing = aggregated.get(key)

          if (existing) {
            existing.total_full_cones += row.issued_full
          } else {
            aggregated.set(key, {
              supplier_id: supplier.id,
              supplier_name: supplier.name,
              tex_number: texNumber,
              tex_label: texLabel,
              total_full_cones: row.issued_full,
            })
          }
        }
      }

      lastId = batch[batch.length - 1].id
      if (batch.length < BATCH_SIZE) break
    }

    return c.json({
      data: sortAggregatedRows([...aggregated.values()], mode),
      error: null,
    })
  } catch (error) {
    console.error('[issue-history.aggregated] unexpected error:', error)
    return c.json({ data: null, error: getErrorMessage(error) }, 500)
  }
})

issueHistory.get('/by-thread-type', async (c) => {
  try {
    const reqQuery = c.req.query()
    const threadTypeId = Number(reqQuery.thread_type_id)
    if (!threadTypeId || Number.isNaN(threadTypeId)) {
      return c.json({ data: null, error: 'thread_type_id là bắt buộc' }, 400)
    }

    const threadColorId = reqQuery.thread_color_id ? Number(reqQuery.thread_color_id) : null

    const params: unknown[] = [threadTypeId, 'CONFIRMED']
    let whereColor = ''
    if (threadColorId != null) {
      params.push(threadColorId)
      whereColor = ` AND til.thread_color_id = $${params.length}`
    }

    const dataSql = `
      SELECT
        til.id,
        til.issued_full,
        til.issued_partial,
        til.returned_full,
        til.returned_partial,
        til.po_id,
        json_build_object(
          'issue_code', ti.issue_code,
          'created_by', ti.created_by,
          'status', ti.status,
          'updated_at', ti.updated_at
        ) AS thread_issues,
        CASE WHEN po.id IS NULL THEN NULL ELSE json_build_object('po_number', po.po_number) END AS purchase_orders,
        CASE WHEN s.id IS NULL THEN NULL ELSE json_build_object('style_code', s.style_code) END AS styles,
        CASE WHEN sc.id IS NULL THEN NULL ELSE json_build_object('color_name', sc.color_name) END AS style_colors
      FROM thread_issue_lines til
      INNER JOIN thread_issues ti ON ti.id = til.issue_id
      LEFT JOIN purchase_orders po ON po.id = til.po_id
      LEFT JOIN styles s ON s.id = til.style_id
      LEFT JOIN style_colors sc ON sc.id = til.style_color_id
      WHERE til.thread_type_id = $1
        AND ti.status = $2${whereColor}
      ORDER BY til.id ASC
      LIMIT 2000`

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

    const rows = (await query<RawRow & Record<string, unknown>>(dataSql, params)) as unknown as RawRow[]

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
