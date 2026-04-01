import { Hono } from 'hono'
import { ZodError } from 'zod'
import { supabaseAdmin as supabase } from '../db/supabase'
import { getPartialConeRatio } from '../utils/settings-helper'
import { getErrorMessage } from '../utils/errorHelper'
import {
  ReturnGroupedSchema,
  ReturnGroupLogsQuerySchema,
} from '../validation/issuesV2'
import {
  processReturnForLine,
  formatZodError,
  getPerformedBy,
  hashPayload,
  type IssueLine,
} from './issuesV2'
import type { ThreadApiResponse } from '../types/thread'
import { requirePermission } from '../middleware/auth'

interface MatchingWeekItem {
  item_id: number
  week_id: number
  week_name: string
}

async function _findMatchingWeekItems(
  poId: number,
  styleId: number,
  styleColorId: number | null,
): Promise<MatchingWeekItem[]> {
  let query = supabase
    .from('thread_order_items')
    .select('id, week_id, thread_order_weeks!inner(id, week_name, status)')
    .eq('po_id', poId)
    .eq('style_id', styleId)
    .in('thread_order_weeks.status', ['CONFIRMED', 'COMPLETED'])

  if (styleColorId) {
    query = query.eq('style_color_id', styleColorId)
  } else {
    query = query.is('style_color_id', null)
  }

  const { data, error } = await query.limit(100)

  if (error || !data) return []

  return data.map((row: any) => ({
    item_id: row.id,
    week_id: row.week_id,
    week_name: (row.thread_order_weeks as any)?.week_name || '',
  }))
}

import type { AppEnv } from '../types/hono-env'

const returnGroupedRoutes = new Hono<AppEnv>()
returnGroupedRoutes.use('*', requirePermission('thread.issues.return'))

returnGroupedRoutes.get('/return-groups', async (c) => {
  try {
    const { data: lines, error } = await supabase
      .from('thread_issue_lines')
      .select(
        `
        id,
        issue_id,
        po_id,
        style_id,
        style_color_id,
        color_id,
        thread_type_id,
        issued_full,
        issued_partial,
        returned_full,
        returned_partial,
        thread_issues!inner(id, issue_code, status, created_at),
        thread_types!inner(id, name, code, supplier_id, tex_number, tex_label)
      `
      )
      .eq('thread_issues.status', 'CONFIRMED')

    if (error) {
      console.error('[return-groups] Query error:', error)
      return c.json<ThreadApiResponse<null>>({ data: null, error: 'Loi truy van danh sach phieu xuat' }, 500)
    }

    const poIds = new Set<number>()
    const styleColorIds = new Set<number>()
    const colorIds = new Set<number>()
    const styleIds = new Set<number>()
    const supplierIds = new Set<number>()
    const threadTypeIds = new Set<number>()

    for (const l of lines || []) {
      if (l.po_id) poIds.add(l.po_id)
      if (l.style_color_id) styleColorIds.add(l.style_color_id)
      if (l.color_id) colorIds.add(l.color_id)
      if (l.style_id) styleIds.add(l.style_id)
      threadTypeIds.add(l.thread_type_id)
      const tt = l.thread_types as any
      if (tt?.supplier_id) supplierIds.add(tt.supplier_id)
    }

    const [poResult, scResult, cResult, sResult, supplierResult, threadColorResult] = await Promise.all([
      poIds.size > 0 ? supabase.from('purchase_orders').select('id, po_number').in('id', [...poIds]) : null,
      styleColorIds.size > 0 ? supabase.from('style_colors').select('id, color_name, hex_code').in('id', [...styleColorIds]) : null,
      colorIds.size > 0 ? supabase.from('colors').select('id, name').in('id', [...colorIds]) : null,
      styleIds.size > 0 ? supabase.from('styles').select('id, style_code, style_name').in('id', [...styleIds]) : null,
      supplierIds.size > 0 ? supabase.from('suppliers').select('id, name').in('id', [...supplierIds]) : null,
      threadTypeIds.size > 0
        ? supabase
            .from('thread_inventory')
            .select('thread_type_id, color_id, colors(name)')
            .in('thread_type_id', [...threadTypeIds])
        : null,
    ])

    const poMap = new Map((poResult?.data || []).map((p) => [p.id, p.po_number]))
    const scMap = new Map((scResult?.data || []).map((s) => [s.id, { color_name: s.color_name, hex_code: s.hex_code }]))
    const cMap = new Map((cResult?.data || []).map((c) => [c.id, c.name]))
    const sMap = new Map((sResult?.data || []).map((s) => [s.id, s.style_code]))
    const supplierMap = new Map((supplierResult?.data || []).map((s) => [s.id, s.name]))

    const ttColorMap = new Map<number, string>()
    for (const inv of threadColorResult?.data || []) {
      const i = inv as any
      if (i.thread_type_id && !ttColorMap.has(i.thread_type_id)) {
        ttColorMap.set(i.thread_type_id, (i.colors as any)?.name || '')
      }
    }

    const groupMap = new Map<
      string,
      {
        po_id: number
        po_number: string | null
        style_id: number
        style_code: string | null
        style_color_id: number | null
        color_id: number | null
        color_name: string | null
        issue_ids: Set<number>
        thread_types: Array<{
          thread_type_id: number
          thread_name: string
          thread_code: string
          outstanding_full: number
          outstanding_partial: number
          total_issued_full: number
          total_issued_partial: number
          total_returned_full: number
          total_returned_partial: number
          line_ids: number[]
        }>
      }
    >()

    for (const line of lines || []) {
      const l = line as any
      const effectiveColorId: number | null = l.style_color_id || l.color_id
      const groupKey = `po:${l.po_id}_style:${l.style_id}_${l.style_color_id ? 'sc' : 'c'}:${effectiveColorId}`

      const totalIssued = (l.issued_full || 0) + (l.issued_partial || 0)
      const totalReturned = (l.returned_full || 0) + (l.returned_partial || 0)
      const totalOutstanding = Math.max(0, totalIssued - totalReturned)
      const rawOutstandingFull = (l.issued_full || 0) - (l.returned_full || 0)
      const outstandingFull = Math.max(0, Math.min(rawOutstandingFull, totalOutstanding))
      const outstandingPartial = totalOutstanding - outstandingFull

      if (!groupMap.has(groupKey)) {
        const scInfo = l.style_color_id ? scMap.get(l.style_color_id) : null
        const colorName = scInfo?.color_name || (l.color_id ? cMap.get(l.color_id) : null) || null

        groupMap.set(groupKey, {
          po_id: l.po_id,
          po_number: l.po_id ? poMap.get(l.po_id) || null : null,
          style_id: l.style_id,
          style_code: l.style_id ? sMap.get(l.style_id) || null : null,
          style_color_id: l.style_color_id || null,
          color_id: l.color_id || null,
          color_name: colorName,
          issue_ids: new Set([l.issue_id]),
          thread_types: [],
        })
      } else {
        groupMap.get(groupKey)!.issue_ids.add(l.issue_id)
      }

      const group = groupMap.get(groupKey)!
      const tt = l.thread_types as { id: number; name: string; code: string; supplier_id: number | null; tex_number: string | null; tex_label: string | null }

      const existingTT = group.thread_types.find((t) => t.thread_type_id === l.thread_type_id)
      if (existingTT) {
        existingTT.outstanding_full += outstandingFull
        existingTT.outstanding_partial += outstandingPartial
        existingTT.total_issued_full += l.issued_full || 0
        existingTT.total_issued_partial += l.issued_partial || 0
        existingTT.total_returned_full += l.returned_full || 0
        existingTT.total_returned_partial += l.returned_partial || 0
        existingTT.line_ids.push(l.id)
      } else {
        const supplierName = tt?.supplier_id ? supplierMap.get(tt.supplier_id) || '' : ''
        const texPart = tt?.tex_label || (tt?.tex_number ? `TEX ${tt.tex_number}` : '')
        const threadColorName = ttColorMap.get(l.thread_type_id) || ''
        const displayName = [supplierName, texPart, threadColorName].filter(Boolean).join(' - ') || tt?.name || ''

        group.thread_types.push({
          thread_type_id: l.thread_type_id,
          thread_name: displayName,
          thread_code: tt?.code || '',
          outstanding_full: outstandingFull,
          outstanding_partial: outstandingPartial,
          total_issued_full: l.issued_full || 0,
          total_issued_partial: l.issued_partial || 0,
          total_returned_full: l.returned_full || 0,
          total_returned_partial: l.returned_partial || 0,
          line_ids: [l.id],
        })
      }
    }

    const groupEntries = Array.from(groupMap.entries()).filter(([, g]) =>
      g.thread_types.some((t) => t.outstanding_full > 0 || t.outstanding_partial > 0)
    )

    const completedGroupKeys = new Set<string>()
    if (groupEntries.length > 0) {
      const allPoIds = [...new Set(groupEntries.map(([, g]) => g.po_id))]
      const allStyleIds = [...new Set(groupEntries.map(([, g]) => g.style_id))]

      const { data: completedItems } = await supabase
        .from('thread_order_item_completions')
        .select('item_id, thread_order_items!inner(po_id, style_id, style_color_id)')
        .in('thread_order_items.po_id', allPoIds)
        .in('thread_order_items.style_id', allStyleIds)
        .limit(500)

      if (completedItems && completedItems.length > 0) {
        const completedPSC = new Set(
          completedItems.map((c: any) => {
            const toi = c.thread_order_items
            return `${toi.po_id}_${toi.style_id}_${toi.style_color_id || 'null'}`
          })
        )

        for (const [key, g] of groupEntries) {
          const pscKey = `${g.po_id}_${g.style_id}_${g.style_color_id || 'null'}`
          if (completedPSC.has(pscKey)) {
            completedGroupKeys.add(key)
          }
        }
      }
    }

    const groups = groupEntries
      .filter(([key]) => !completedGroupKeys.has(key))
      .map(([key, g]) => ({
        group_key: key,
        po_id: g.po_id,
        po_number: g.po_number || '',
        style_id: g.style_id,
        style_code: g.style_code || '',
        style_color_id: g.style_color_id,
        color_id: g.color_id,
        color_name: g.color_name || '',
        issue_count: g.issue_ids.size,
        threads: g.thread_types.filter((t) => t.outstanding_full > 0 || t.outstanding_partial > 0),
      }))

    return c.json({ data: groups, error: null })
  } catch (err) {
    return c.json<ThreadApiResponse<null>>({ data: null, error: getErrorMessage(err) }, 500)
  }
})

returnGroupedRoutes.post('/return-grouped', async (c) => {
  try {
    const body = await c.req.json()

    let validated
    try {
      validated = ReturnGroupedSchema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json<ThreadApiResponse<null>>({ data: null, error: formatZodError(err) }, 400)
      }
      throw err
    }

    const { po_id, style_id, style_color_id, color_id, idempotency_key, lines: requestLines } = validated
    const effectiveColorId = style_color_id || color_id
    const performedBy = getPerformedBy(c)
    const requestHash = hashPayload(body)

    const { data: existingOp, error: opCheckError } = await supabase
      .from('issue_operations_log')
      .select('*')
      .eq('operation_type', 'RETURN_GROUPED')
      .eq('idempotency_key', idempotency_key)
      .single()

    if (existingOp && !opCheckError) {
      if (existingOp.request_hash !== requestHash) {
        return c.json<ThreadApiResponse<null>>(
          { data: null, error: 'Idempotency key da duoc su dung voi payload khac' },
          409
        )
      }
      if (existingOp.status === 'COMPLETED') {
        return c.json({ data: existingOp.result_payload, error: null, message: 'Tra hang thanh cong (cached)' })
      }
      if (existingOp.status === 'IN_PROGRESS') {
        return c.json<ThreadApiResponse<null>>({ data: null, error: 'Operation dang xu ly, vui long doi' }, 409)
      }
    }

    await supabase.from('issue_operations_log').upsert(
      {
        idempotency_key,
        operation_type: 'RETURN_GROUPED',
        request_hash: requestHash,
        request_payload: body,
        status: 'IN_PROGRESS',
        succeeded_line_ids: [],
      },
      { onConflict: 'operation_type,idempotency_key' }
    )

    const partialConeRatio = await getPartialConeRatio()
    if (!partialConeRatio || partialConeRatio <= 0) {
      await supabase
        .from('issue_operations_log')
        .update({ status: 'FAILED', error_info: `Ty le cuon le khong hop le (${partialConeRatio})`, completed_at: new Date().toISOString() })
        .eq('idempotency_key', idempotency_key)
        .eq('operation_type', 'RETURN_GROUPED')
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: `Ty le cuon le khong hop le (${partialConeRatio})` },
        400
      )
    }

    const { data: issueLinesRaw, error: linesError } = await supabase
      .from('thread_issue_lines')
      .select('*, thread_issues!inner(id, status, created_at, issue_code)')
      .eq('po_id', po_id)
      .eq('style_id', style_id)
      .eq('thread_issues.status', 'CONFIRMED')
      .order('created_at', { ascending: true })

    if (linesError) {
      await supabase
        .from('issue_operations_log')
        .update({ status: 'FAILED', error_info: 'Khong the tai danh sach dong phieu xuat', completed_at: new Date().toISOString() })
        .eq('idempotency_key', idempotency_key)
        .eq('operation_type', 'RETURN_GROUPED')
      return c.json<ThreadApiResponse<null>>({ data: null, error: 'Khong the tai danh sach dong phieu xuat' }, 500)
    }

    const matchingLines = (issueLinesRaw || []).filter((l: any) => {
      if (style_color_id) return l.style_color_id === style_color_id
      return l.color_id === color_id
    }) as (IssueLine & { issue_id: number; thread_issues: { id: number; issue_code: string; created_at: string } | null })[]

    const succeededLineIds: number[] = []
    const returnLogRows: Array<{ issue_id: number; line_id: number; returned_full: number; returned_partial: number }> = []
    const distribution: Array<{ thread_type_id: number; line_id: number; returned_full: number; returned_partial: number }> = []

    for (const requestLine of requestLines) {
      const { thread_type_id, returned_full: reqFull, returned_partial: reqPartial } = requestLine
      if (reqFull <= 0 && reqPartial <= 0) continue

      const candidateLines = matchingLines.filter(
        (l) =>
          l.thread_type_id === thread_type_id &&
          (l.issued_full - l.returned_full > 0 || l.issued_partial - l.returned_partial > 0)
      )

      let remainingFull = reqFull
      let remainingPartial = reqPartial

      for (const candidate of candidateLines) {
        if (remainingFull <= 0 && remainingPartial <= 0) break

        const availFull = Math.max(0, candidate.issued_full - candidate.returned_full)
        const availPartial = Math.max(0, candidate.issued_partial - candidate.returned_partial)

        const allocFull = Math.min(remainingFull, availFull)
        const remainFullAfterAlloc = availFull - allocFull
        const allocPartial = Math.min(remainingPartial, availPartial + remainFullAfterAlloc)

        if (allocFull <= 0 && allocPartial <= 0) continue

        const result = await processReturnForLine(
          candidate.id,
          candidate,
          allocFull,
          allocPartial,
          performedBy,
          partialConeRatio,
        )

        if (!result.success) {
          await supabase
            .from('issue_operations_log')
            .update({
              status: 'FAILED',
              succeeded_line_ids: succeededLineIds,
              error_info: result.error || 'Loi xu ly tra hang',
              completed_at: new Date().toISOString(),
            })
            .eq('idempotency_key', idempotency_key)
            .eq('operation_type', 'RETURN_GROUPED')
          return c.json<ThreadApiResponse<null>>(
            { data: null, error: result.error || 'Loi xu ly tra hang' },
            400
          )
        }

        candidate.returned_full = (candidate.returned_full || 0) + result.returned_full
        candidate.returned_partial = (candidate.returned_partial || 0) + result.returned_partial
        remainingFull -= result.returned_full
        remainingPartial -= result.returned_partial

        if (!succeededLineIds.includes(candidate.id)) {
          succeededLineIds.push(candidate.id)
        }

        const issueId = candidate.issue_id
        returnLogRows.push({ issue_id: issueId, line_id: candidate.id, returned_full: result.returned_full, returned_partial: result.returned_partial })
        distribution.push({ thread_type_id, line_id: candidate.id, returned_full: result.returned_full, returned_partial: result.returned_partial })
      }
    }

    if (succeededLineIds.length === 0) {
      await supabase
        .from('issue_operations_log')
        .update({ status: 'FAILED', error_info: 'Khong co so luong tra hop le', completed_at: new Date().toISOString() })
        .eq('idempotency_key', idempotency_key)
        .eq('operation_type', 'RETURN_GROUPED')
      return c.json<ThreadApiResponse<null>>({ data: null, error: 'Khong co so luong tra hop le' }, 400)
    }

    try {
      for (const logRow of returnLogRows) {
        await supabase.from('thread_issue_return_logs').insert({
          issue_id: logRow.issue_id,
          line_id: logRow.line_id,
          returned_full: logRow.returned_full,
          returned_partial: logRow.returned_partial,
          created_by: performedBy || null,
        })
      }
    } catch (logError) {
      console.error('[return-grouped] Failed to insert return logs:', logError)
    }

    const affectedIssueIds = [...new Set(returnLogRows.map((r) => r.issue_id))]
    for (const issueId of affectedIssueIds) {
      const { data: issueLines } = await supabase
        .from('thread_issue_lines')
        .select('issued_full, issued_partial, returned_full, returned_partial')
        .eq('issue_id', issueId)

      const allReturned = issueLines?.every(
        (l) => (l.returned_full + l.returned_partial) >= (l.issued_full + l.issued_partial)
      )

      if (allReturned) {
        await supabase
          .from('thread_issues')
          .update({ status: 'RETURNED', updated_at: new Date().toISOString() })
          .eq('id', issueId)
      }
    }

    const resultPayload = {
      succeeded_line_ids: succeededLineIds,
      distribution,
      po_id,
      style_id,
      style_color_id: style_color_id || null,
      color_id: color_id || null,
      effective_color_id: effectiveColorId,
    }

    await supabase
      .from('issue_operations_log')
      .update({ status: 'COMPLETED', succeeded_line_ids: succeededLineIds, completed_at: new Date().toISOString() })
      .eq('idempotency_key', idempotency_key)
      .eq('operation_type', 'RETURN_GROUPED')

    return c.json({ data: resultPayload, error: null, message: 'Tra hang theo nhom thanh cong' })
  } catch (err) {
    return c.json<ThreadApiResponse<null>>({ data: null, error: getErrorMessage(err) }, 500)
  }
})

returnGroupedRoutes.get('/return-groups/logs', async (c) => {
  try {
    const rawQuery = c.req.query()
    let queryParams
    try {
      queryParams = ReturnGroupLogsQuerySchema.parse(rawQuery)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json<ThreadApiResponse<null>>({ data: null, error: formatZodError(err) }, 400)
      }
      throw err
    }

    const { po_id, style_id, style_color_id, color_id } = queryParams

    let lineQuery = supabase
      .from('thread_issue_lines')
      .select('id, thread_type_id, issued_full, issued_partial, returned_full, returned_partial, thread_issues!inner(id, issue_code, status, created_at)')
      .eq('po_id', po_id)
      .eq('style_id', style_id)
      .in('thread_issues.status', ['CONFIRMED', 'RETURNED'])

    if (style_color_id) {
      lineQuery = lineQuery.eq('style_color_id', style_color_id)
    } else if (color_id) {
      lineQuery = lineQuery.eq('color_id', color_id)
    }

    const { data: issueLines, error: lineError } = await lineQuery

    if (lineError) {
      return c.json<ThreadApiResponse<null>>({ data: null, error: 'Loi truy van dong phieu xuat' }, 500)
    }

    const lineIds = (issueLines || []).map((l: any) => l.id)
    if (lineIds.length === 0) {
      return c.json({ data: [], error: null })
    }

    const { data: returnLogs, error: logError } = await supabase
      .from('thread_issue_return_logs')
      .select('id, issue_id, line_id, returned_full, returned_partial, created_by, created_at')
      .in('line_id', lineIds)
      .order('created_at', { ascending: false })

    if (logError) {
      console.error('[return-groups/logs] Log query error:', logError)
      return c.json<ThreadApiResponse<null>>({ data: null, error: 'Loi truy van lich su tra hang' }, 500)
    }

    const lineMap = new Map<number, any>()
    for (const l of issueLines || []) {
      const line = l as any
      lineMap.set(line.id, line)
    }

    const threadTypeIds = [...new Set((issueLines || []).map((l: any) => l.thread_type_id))]
    const { data: threadTypes } = threadTypeIds.length > 0
      ? await supabase.from('thread_types').select('id, name, code, supplier_id, tex_number, tex_label').in('id', threadTypeIds)
      : { data: [] }
    const ttMap = new Map((threadTypes || []).map((t) => [t.id, t]))

    const logSupplierIds = new Set<number>()
    for (const t of threadTypes || []) {
      if (t.supplier_id) logSupplierIds.add(t.supplier_id)
    }

    const [logSupplierResult, logThreadColorResult] = await Promise.all([
      logSupplierIds.size > 0 ? supabase.from('suppliers').select('id, name').in('id', [...logSupplierIds]) : null,
      threadTypeIds.length > 0
        ? supabase.from('thread_inventory').select('thread_type_id, color_id, colors(name)').in('thread_type_id', threadTypeIds)
        : null,
    ])

    const logSupplierMap = new Map((logSupplierResult?.data || []).map((s) => [s.id, s.name]))
    const logTtColorMap = new Map<number, string>()
    for (const inv of logThreadColorResult?.data || []) {
      const i = inv as any
      if (i.thread_type_id && !logTtColorMap.has(i.thread_type_id)) {
        logTtColorMap.set(i.thread_type_id, (i.colors as any)?.name || '')
      }
    }

    function buildThreadDisplayName(tt: any): string {
      const supplierName = tt?.supplier_id ? logSupplierMap.get(tt.supplier_id) || '' : ''
      const texPart = tt?.tex_label || (tt?.tex_number ? `TEX ${tt.tex_number}` : '')
      const threadColor = tt?.id ? logTtColorMap.get(tt.id) || '' : ''
      return [supplierName, texPart, threadColor].filter(Boolean).join(' - ') || tt?.name || ''
    }

    const logs = (returnLogs || []).map((log: any) => {
      const issueLine = lineMap.get(log.line_id)
      const issue = issueLine?.thread_issues as any
      const tt = issueLine ? ttMap.get(issueLine.thread_type_id) : null
      return {
        id: log.id,
        issue_id: log.issue_id,
        issue_code: issue?.issue_code || null,
        line_id: log.line_id,
        thread_type_id: issueLine?.thread_type_id || null,
        thread_name: buildThreadDisplayName(tt),
        thread_code: tt?.code || null,
        returned_full: log.returned_full,
        returned_partial: log.returned_partial,
        created_by: log.created_by,
        created_at: log.created_at,
      }
    })

    return c.json({ data: logs, error: null })
  } catch (err) {
    return c.json<ThreadApiResponse<null>>({ data: null, error: getErrorMessage(err) }, 500)
  }
})

export default returnGroupedRoutes
