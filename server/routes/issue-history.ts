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

issueHistory.use('*', requirePermission('thread.issues.export-history'))

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

export default issueHistory
