import { Hono } from 'hono'
import { ZodError } from 'zod'
import { query, queryOne } from '../db/query'
import { from } from '../db/sql-builder'
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
  const params: unknown[] = [poId, styleId]
  let whereColor: string
  if (styleColorId) {
    params.push(styleColorId)
    whereColor = `toi.style_color_id = $${params.length}`
  } else {
    whereColor = 'toi.style_color_id IS NULL'
  }

  const sql = `
    SELECT
      toi.id,
      toi.week_id,
      json_build_object('id', tow.id, 'week_name', tow.week_name, 'status', tow.status) AS thread_order_weeks
    FROM thread_order_items toi
    INNER JOIN thread_order_weeks tow ON tow.id = toi.week_id
    WHERE toi.po_id = $1
      AND toi.style_id = $2
      AND tow.status = ANY($${params.length + 1})
      AND ${whereColor}
    LIMIT 100`
  params.push(['CONFIRMED', 'COMPLETED'])

  let data: Array<Record<string, any>>
  try {
    data = await query<Record<string, any>>(sql, params)
  } catch {
    return []
  }
  if (!data) return []

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
    let lines: Array<Record<string, any>>
    try {
      lines = await query<Record<string, any>>(
        `
        SELECT
          til.id,
          til.issue_id,
          til.po_id,
          til.style_id,
          til.style_color_id,
          til.color_id,
          til.thread_type_id,
          til.thread_color_id,
          til.issued_full,
          til.issued_partial,
          til.returned_full,
          til.returned_partial,
          json_build_object('id', ti.id, 'issue_code', ti.issue_code, 'status', ti.status, 'created_at', ti.created_at) AS thread_issues,
          json_build_object('id', tt.id, 'name', tt.name, 'code', tt.code, 'supplier_id', tt.supplier_id, 'tex_number', tt.tex_number, 'tex_label', tt.tex_label) AS thread_types
        FROM thread_issue_lines til
        INNER JOIN thread_issues ti ON ti.id = til.issue_id
        INNER JOIN thread_types tt ON tt.id = til.thread_type_id
        WHERE ti.status = $1`,
        ['CONFIRMED']
      )
    } catch (error) {
      console.error('[return-groups] Query error:', error)
      return c.json<ThreadApiResponse<null>>({ data: null, error: 'Loi truy van danh sach phieu xuat' }, 500)
    }

    const poIds = new Set<number>()
    const styleColorIds = new Set<number>()
    const colorIds = new Set<number>()
    const styleIds = new Set<number>()
    const supplierIds = new Set<number>()
    const threadColorIds = new Set<number>()

    for (const l of lines || []) {
      if (l.po_id) poIds.add(l.po_id)
      if (l.style_color_id) styleColorIds.add(l.style_color_id)
      if (l.color_id) colorIds.add(l.color_id)
      if (l.style_id) styleIds.add(l.style_id)
      const cid = l.thread_color_id
      if (cid) threadColorIds.add(cid)
      const tt = l.thread_types as any
      if (tt?.supplier_id) supplierIds.add(tt.supplier_id)
    }

    const [poResult, scResult, cResult, sResult, supplierResult, threadColorNameResult] = await Promise.all([
      poIds.size > 0 ? from('purchase_orders').select('id, po_number').in('id', [...poIds]).list<{ id: number; po_number: string }>() : null,
      styleColorIds.size > 0 ? from('style_colors').select('id, color_name, hex_code').in('id', [...styleColorIds]).list<{ id: number; color_name: string; hex_code: string }>() : null,
      colorIds.size > 0 ? from('colors').select('id, name').in('id', [...colorIds]).list<{ id: number; name: string }>() : null,
      styleIds.size > 0 ? from('styles').select('id, style_code, style_name').in('id', [...styleIds]).list<{ id: number; style_code: string; style_name: string }>() : null,
      supplierIds.size > 0 ? from('suppliers').select('id, name').in('id', [...supplierIds]).list<{ id: number; name: string }>() : null,
      threadColorIds.size > 0 ? from('colors').select('id, name').in('id', [...threadColorIds]).list<{ id: number; name: string }>() : null,
    ])

    const poMap = new Map((poResult || []).map((p) => [p.id, p.po_number]))
    const scMap = new Map((scResult || []).map((s) => [s.id, { color_name: s.color_name, hex_code: s.hex_code }]))
    const cMap = new Map((cResult || []).map((c) => [c.id, c.name]))
    const sMap = new Map((sResult || []).map((s) => [s.id, s.style_code]))
    const supplierMap = new Map((supplierResult || []).map((s) => [s.id, s.name]))

    const threadColorNameMap = new Map<number, string>(
      (threadColorNameResult || []).map((c) => [c.id, c.name])
    )

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
          thread_color_id: number | null
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

      const lineThreadColorId: number | null = l.thread_color_id ?? null
      const existingTT = group.thread_types.find(
        (t) => t.thread_type_id === l.thread_type_id && t.thread_color_id === lineThreadColorId
      )
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
        const threadColorName = lineThreadColorId ? threadColorNameMap.get(lineThreadColorId) || '' : ''
        const displayName = [supplierName, texPart, threadColorName].filter(Boolean).join(' - ') || tt?.name || ''

        group.thread_types.push({
          thread_type_id: l.thread_type_id,
          thread_color_id: lineThreadColorId,
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

      const completedItems = await query<{
        item_id: number
        thread_order_items: { po_id: number; style_id: number; style_color_id: number | null }
      }>(
        `SELECT
           toic.item_id,
           json_build_object('po_id', toi.po_id, 'style_id', toi.style_id, 'style_color_id', toi.style_color_id) AS thread_order_items
         FROM thread_order_item_completions toic
         INNER JOIN thread_order_items toi ON toi.id = toic.item_id
         WHERE toi.po_id = ANY($1) AND toi.style_id = ANY($2)
         LIMIT 500`,
        [allPoIds, allStyleIds]
      )

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
        threads: g.thread_types,
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

    const existingOp = await queryOne<Record<string, any>>(
      `SELECT * FROM issue_operations_log
       WHERE operation_type = $1 AND idempotency_key = $2`,
      ['RETURN_GROUPED', idempotency_key]
    )

    if (existingOp) {
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

    await query(
      `INSERT INTO issue_operations_log (idempotency_key, operation_type, request_hash, request_payload, status, succeeded_line_ids)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (operation_type, idempotency_key) DO UPDATE SET
         request_hash = EXCLUDED.request_hash,
         request_payload = EXCLUDED.request_payload,
         status = EXCLUDED.status,
         succeeded_line_ids = EXCLUDED.succeeded_line_ids`,
      [idempotency_key, 'RETURN_GROUPED', requestHash, JSON.stringify(body), 'IN_PROGRESS', []]
    )

    const partialConeRatio = await getPartialConeRatio()
    if (!partialConeRatio || partialConeRatio <= 0) {
      await query(
        `UPDATE issue_operations_log SET status = $1, error_info = $2, completed_at = $3
         WHERE idempotency_key = $4 AND operation_type = $5`,
        ['FAILED', `Ty le cuon le khong hop le (${partialConeRatio})`, new Date().toISOString(), idempotency_key, 'RETURN_GROUPED']
      )
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: `Ty le cuon le khong hop le (${partialConeRatio})` },
        400
      )
    }

    let issueLinesRaw: Array<Record<string, any>>
    try {
      issueLinesRaw = await query<Record<string, any>>(
        `SELECT
           til.*,
           json_build_object('id', ti.id, 'status', ti.status, 'created_at', ti.created_at, 'issue_code', ti.issue_code) AS thread_issues
         FROM thread_issue_lines til
         INNER JOIN thread_issues ti ON ti.id = til.issue_id
         WHERE til.po_id = $1
           AND til.style_id = $2
           AND ti.status = $3
         ORDER BY til.created_at ASC`,
        [po_id, style_id, 'CONFIRMED']
      )
    } catch {
      await query(
        `UPDATE issue_operations_log SET status = $1, error_info = $2, completed_at = $3
         WHERE idempotency_key = $4 AND operation_type = $5`,
        ['FAILED', 'Khong the tai danh sach dong phieu xuat', new Date().toISOString(), idempotency_key, 'RETURN_GROUPED']
      )
      return c.json<ThreadApiResponse<null>>({ data: null, error: 'Khong the tai danh sach dong phieu xuat' }, 500)
    }

    const matchingLines = (issueLinesRaw || []).filter((l: any) => {
      if (style_color_id) return l.style_color_id === style_color_id
      return l.color_id === color_id
    }) as (IssueLine & { issue_id: number; thread_issues: { id: number; issue_code: string; created_at: string } | null })[]

    const succeededLineIds: number[] = []
    const returnLogRows: Array<{ issue_id: number; line_id: number; returned_full: number; returned_partial: number }> = []
    const distribution: Array<{ thread_type_id: number; thread_color_id: number | null; line_id: number; returned_full: number; returned_partial: number }> = []

    const allMatchingLineIds = matchingLines.map(l => l.id)

    const [allFullCones, allPartialCones] = await Promise.all([
      from('thread_inventory')
        .select('id, quantity_meters, status, issued_line_id')
        .in('issued_line_id', allMatchingLineIds)
        .in('status', ['IN_PRODUCTION', 'HARD_ALLOCATED'])
        .eq('is_partial', false)
        .order({ column: 'id', ascending: true })
        .limit(10000)
        .list<{ id: number; quantity_meters: number; status: string; issued_line_id: number }>(),
      from('thread_inventory')
        .select('id, status, issued_line_id')
        .in('issued_line_id', allMatchingLineIds)
        .in('status', ['IN_PRODUCTION', 'HARD_ALLOCATED'])
        .eq('is_partial', true)
        .order({ column: 'id', ascending: true })
        .limit(10000)
        .list<{ id: number; status: string; issued_line_id: number }>(),
    ])

    const fullConesByLine = new Map<number, Array<{ id: number; quantity_meters: number; status: string }>>()
    const partialConesByLine = new Map<number, Array<{ id: number; status: string }>>()

    for (const cone of allFullCones || []) {
      const lineIdKey = (cone as any).issued_line_id as number
      const arr = fullConesByLine.get(lineIdKey) || []
      arr.push({ id: cone.id, quantity_meters: cone.quantity_meters, status: cone.status })
      fullConesByLine.set(lineIdKey, arr)
    }

    for (const cone of allPartialCones || []) {
      const lineIdKey = (cone as any).issued_line_id as number
      const arr = partialConesByLine.get(lineIdKey) || []
      arr.push({ id: cone.id, status: cone.status })
      partialConesByLine.set(lineIdKey, arr)
    }

    const uniqueThreadTypeIds = [...new Set(matchingLines.map(l => l.thread_type_id))]
    const threadTypesData = uniqueThreadTypeIds.length > 0
      ? await from('thread_types')
          .select('id, meters_per_cone')
          .in('id', uniqueThreadTypeIds)
          .list<{ id: number; meters_per_cone: number | null }>()
      : []

    const metersPerConeMap = new Map<number, number | null>()
    for (const tt of threadTypesData || []) {
      metersPerConeMap.set(tt.id, tt.meters_per_cone)
    }

    for (const requestLine of requestLines) {
      const { thread_type_id, thread_color_id, returned_full: reqFull, returned_partial: reqPartial } = requestLine
      if (reqFull <= 0 && reqPartial <= 0) continue

      const lineTcId: number | null = thread_color_id ?? null
      const candidateLines = matchingLines.filter(
        (l) =>
          l.thread_type_id === thread_type_id &&
          (l.thread_color_id ?? null) === lineTcId &&
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
          {
            fullCones: fullConesByLine.get(candidate.id) || [],
            partialCones: partialConesByLine.get(candidate.id) || [],
            metersPerCone: metersPerConeMap.get(candidate.thread_type_id) ?? null,
          },
        )

        if (!result.success) {
          await query(
            `UPDATE issue_operations_log SET status = $1, succeeded_line_ids = $2, error_info = $3, completed_at = $4
             WHERE idempotency_key = $5 AND operation_type = $6`,
            ['FAILED', succeededLineIds, result.error || 'Loi xu ly tra hang', new Date().toISOString(), idempotency_key, 'RETURN_GROUPED']
          )
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
        distribution.push({ thread_type_id, thread_color_id: lineTcId, line_id: candidate.id, returned_full: result.returned_full, returned_partial: result.returned_partial })
      }
    }

    if (succeededLineIds.length === 0) {
      await query(
        `UPDATE issue_operations_log SET status = $1, error_info = $2, completed_at = $3
         WHERE idempotency_key = $4 AND operation_type = $5`,
        ['FAILED', 'Khong co so luong tra hop le', new Date().toISOString(), idempotency_key, 'RETURN_GROUPED']
      )
      return c.json<ThreadApiResponse<null>>({ data: null, error: 'Khong co so luong tra hop le' }, 400)
    }

    try {
      if (returnLogRows.length > 0) {
        const values: string[] = []
        const insertParams: unknown[] = []
        for (const r of returnLogRows) {
          const base = insertParams.length
          values.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`)
          insertParams.push(r.issue_id, r.line_id, r.returned_full, r.returned_partial, performedBy || null)
        }
        await query(
          `INSERT INTO thread_issue_return_logs (issue_id, line_id, returned_full, returned_partial, created_by)
           VALUES ${values.join(', ')}`,
          insertParams
        )
      }
    } catch (logError) {
      console.error('[return-grouped] Failed to insert return logs:', logError)
    }

    const affectedIssueIds = [...new Set(returnLogRows.map((r) => r.issue_id))]
    for (const issueId of affectedIssueIds) {
      const issueLines = await from('thread_issue_lines')
        .select('issued_full, issued_partial, returned_full, returned_partial')
        .eq('issue_id', issueId)
        .list<{ issued_full: number; issued_partial: number; returned_full: number; returned_partial: number }>()

      const allReturned = issueLines?.every(
        (l) => (l.returned_full + l.returned_partial) >= (l.issued_full + l.issued_partial)
      )

      if (allReturned) {
        await query(
          `UPDATE thread_issues SET status = $1, updated_at = $2 WHERE id = $3`,
          ['RETURNED', new Date().toISOString(), issueId]
        )
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

    await query(
      `UPDATE issue_operations_log SET status = $1, succeeded_line_ids = $2, completed_at = $3
       WHERE idempotency_key = $4 AND operation_type = $5`,
      ['COMPLETED', succeededLineIds, new Date().toISOString(), idempotency_key, 'RETURN_GROUPED']
    )

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

    const lineParams: unknown[] = [po_id, style_id]
    let whereColor = ''
    if (style_color_id) {
      lineParams.push(style_color_id)
      whereColor = ` AND til.style_color_id = $${lineParams.length}`
    } else if (color_id) {
      lineParams.push(color_id)
      whereColor = ` AND til.color_id = $${lineParams.length}`
    }
    lineParams.push(['CONFIRMED', 'RETURNED'])
    const statusPlaceholder = `$${lineParams.length}`

    let issueLines: Array<Record<string, any>>
    try {
      issueLines = await query<Record<string, any>>(
        `SELECT
           til.id,
           til.thread_type_id,
           til.thread_color_id,
           til.issued_full,
           til.issued_partial,
           til.returned_full,
           til.returned_partial,
           json_build_object('id', ti.id, 'issue_code', ti.issue_code, 'status', ti.status, 'created_at', ti.created_at) AS thread_issues
         FROM thread_issue_lines til
         INNER JOIN thread_issues ti ON ti.id = til.issue_id
         WHERE til.po_id = $1
           AND til.style_id = $2${whereColor}
           AND ti.status = ANY(${statusPlaceholder})`,
        lineParams
      )
    } catch {
      return c.json<ThreadApiResponse<null>>({ data: null, error: 'Loi truy van dong phieu xuat' }, 500)
    }

    const lineIds = (issueLines || []).map((l: any) => l.id)
    if (lineIds.length === 0) {
      return c.json({ data: [], error: null })
    }

    let returnLogs: Array<Record<string, any>>
    try {
      returnLogs = await from('thread_issue_return_logs')
        .select('id, issue_id, line_id, returned_full, returned_partial, created_by, created_at')
        .in('line_id', lineIds)
        .order({ column: 'created_at', ascending: false })
        .list<Record<string, any>>()
    } catch (logError) {
      console.error('[return-groups/logs] Log query error:', logError)
      return c.json<ThreadApiResponse<null>>({ data: null, error: 'Loi truy van lich su tra hang' }, 500)
    }

    const lineMap = new Map<number, any>()
    for (const l of issueLines || []) {
      const line = l as any
      lineMap.set(line.id, line)
    }

    const threadTypeIds = [...new Set((issueLines || []).map((l: any) => l.thread_type_id))]
    const threadTypes = threadTypeIds.length > 0
      ? await from('thread_types').select('id, name, code, supplier_id, tex_number, tex_label').in('id', threadTypeIds).list<{ id: number; name: string; code: string; supplier_id: number | null; tex_number: string | null; tex_label: string | null }>()
      : []
    const ttMap = new Map((threadTypes || []).map((t) => [t.id, t]))

    const logSupplierIds = new Set<number>()
    for (const t of threadTypes || []) {
      if (t.supplier_id) logSupplierIds.add(t.supplier_id)
    }

    const logThreadColorIds = new Set<number>()
    for (const l of issueLines || []) {
      const tcId = (l as any).thread_color_id
      if (tcId) logThreadColorIds.add(tcId)
    }

    const [logSupplierResult, logThreadColorResult] = await Promise.all([
      logSupplierIds.size > 0 ? from('suppliers').select('id, name').in('id', [...logSupplierIds]).list<{ id: number; name: string }>() : null,
      logThreadColorIds.size > 0 ? from('colors').select('id, name').in('id', [...logThreadColorIds]).list<{ id: number; name: string }>() : null,
    ])

    const logSupplierMap = new Map((logSupplierResult || []).map((s) => [s.id, s.name]))
    const logColorNameMap = new Map<number, string>(
      (logThreadColorResult || []).map((c) => [c.id, c.name])
    )

    function buildThreadDisplayName(tt: any, tcId: number | null | undefined): string {
      const supplierName = tt?.supplier_id ? logSupplierMap.get(tt.supplier_id) || '' : ''
      const texPart = tt?.tex_label || (tt?.tex_number ? `TEX ${tt.tex_number}` : '')
      const threadColor = tcId ? logColorNameMap.get(tcId) || '' : ''
      return [supplierName, texPart, threadColor].filter(Boolean).join(' - ') || tt?.name || ''
    }

    const logs = (returnLogs || []).map((log: any) => {
      const issueLine = lineMap.get(log.line_id)
      const issue = issueLine?.thread_issues as any
      const tt = issueLine ? ttMap.get(issueLine.thread_type_id) : null
      const lineTcId: number | null = issueLine?.thread_color_id ?? null
      return {
        id: log.id,
        issue_id: log.issue_id,
        issue_code: issue?.issue_code || null,
        line_id: log.line_id,
        thread_type_id: issueLine?.thread_type_id || null,
        thread_color_id: lineTcId,
        thread_name: buildThreadDisplayName(tt, lineTcId),
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
