import { Hono } from 'hono'
import { ZodError } from 'zod'
import { query, queryOne, queryCount } from '../../db/query'
import { requirePermission } from '../../middleware/auth'
import { getErrorMessage } from '../../utils/errorHelper'
import {
  CreateLoanSchema,
  CreateBatchLoanSchema,
  ReserveFromStockSchema,
  ManualReturnSchema,
} from '../../validation/weeklyOrder'
import type { AppEnv } from '../../types/hono-env'
import { formatZodError, getPerformerName } from './helpers'
import { getPartialConeRatio } from '../../utils/settings-helper'
import { isRootUnlocked, logWeekAudit, getPerformer } from '../../utils/weekly-order-unlock'

const loansReservations = new Hono<AppEnv>()

loansReservations.post('/completion-lookup', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const { po_id, style_id, style_color_id } = await c.req.json()

    if (!po_id || !style_id) {
      return c.json({ data: null, error: 'po_id và style_id là bắt buộc' }, 400)
    }

    const params: unknown[] = [po_id, style_id]
    let sql = `SELECT toi.id, toi.week_id,
        json_build_object('id', w.id, 'week_name', w.week_name, 'status', w.status) AS thread_order_weeks
      FROM thread_order_items toi
      INNER JOIN thread_order_weeks w ON w.id = toi.week_id
      WHERE toi.po_id = $1 AND toi.style_id = $2
        AND w.status = ANY($3)`
    params.push(['CONFIRMED', 'COMPLETED'])

    if (style_color_id) {
      params.push(style_color_id)
      sql += ` AND toi.style_color_id = $${params.length}`
    } else {
      sql += ` AND toi.style_color_id IS NULL`
    }
    sql += ' LIMIT 100'

    const data = await query<{ id: number; week_id: number; thread_order_weeks: any }>(sql, params)

    const weekMap = new Map<number, { week_name: string; item_ids: number[] }>()
    for (const row of data || []) {
      const weekName = (row.thread_order_weeks as any)?.week_name || ''
      if (!weekMap.has(row.week_id)) {
        weekMap.set(row.week_id, { week_name: weekName, item_ids: [] })
      }
      weekMap.get(row.week_id)!.item_ids.push(row.id)
    }

    const weeks = Array.from(weekMap.entries()).map(([weekId, info]) => ({
      week_id: weekId,
      week_name: info.week_name,
      item_ids: info.item_ids,
    }))

    return c.json({ data: { weeks }, error: null })
  } catch (err) {
    console.error('Error looking up completion weeks:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

loansReservations.post('/batch-complete', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const body = await c.req.json()
    const itemIds: number[] = body.item_ids

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return c.json({ data: null, error: 'item_ids phải là mảng không rỗng' }, 400)
    }
    if (itemIds.length > 50) {
      return c.json({ data: null, error: 'Tối đa 50 items mỗi lần' }, 400)
    }

    const validItems = await query<{ id: number }>(
      `SELECT toi.id
       FROM thread_order_items toi
       INNER JOIN thread_order_weeks w ON w.id = toi.week_id
       WHERE toi.id = ANY($1) AND w.status = ANY($2)`,
      [itemIds, ['CONFIRMED', 'COMPLETED']],
    )

    const validIds = (validItems || []).map((i: any) => i.id)
    const claims = c.get('jwtPayload' as never) as any
    const performedBy = claims?.employee_code || claims?.email || 'system'

    if (validIds.length > 0) {
      await query(
        `INSERT INTO thread_order_item_completions (item_id, completed_by)
         SELECT unnest($1::int[]), $2
         ON CONFLICT (item_id) DO UPDATE SET completed_by = EXCLUDED.completed_by`,
        [validIds, performedBy],
      )
    }

    return c.json({
      data: { completed_count: validIds.length, skipped_count: itemIds.length - validIds.length },
      error: null,
    })
  } catch (err) {
    console.error('Error batch completing items:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

loansReservations.get('/loans/summary', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const rows = await query<{ result: any }>('SELECT fn_loan_dashboard_summary() AS result')
    const data = rows.length > 0 ? rows[0].result : null

    return c.json({ data, error: null })
  } catch (err) {
    console.error('Error fetching loan dashboard summary:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

loansReservations.get('/loans/all', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const loans = await query<any>(
      `SELECT l.*,
        CASE WHEN fw.id IS NULL THEN NULL ELSE json_build_object('id', fw.id, 'week_name', fw.week_name) END AS from_week,
        CASE WHEN tw.id IS NULL THEN NULL ELSE json_build_object('id', tw.id, 'week_name', tw.week_name) END AS to_week,
        CASE WHEN tt.id IS NULL THEN NULL ELSE json_build_object(
          'id', tt.id, 'code', tt.code, 'name', tt.name, 'tex_number', tt.tex_number,
          'supplier', CASE WHEN sup.id IS NULL THEN NULL ELSE json_build_object('name', sup.name) END
        ) END AS thread_type
       FROM thread_order_loans l
       LEFT JOIN thread_order_weeks fw ON fw.id = l.from_week_id
       LEFT JOIN thread_order_weeks tw ON tw.id = l.to_week_id
       LEFT JOIN thread_types tt ON tt.id = l.thread_type_id
       LEFT JOIN suppliers sup ON sup.id = tt.supplier_id
       WHERE l.deleted_at IS NULL
       ORDER BY l.created_at DESC
       LIMIT 500`,
    )

    const weekIds = [
      ...new Set(
        (loans || []).flatMap((l: any) => [l.from_week_id, l.to_week_id].filter(Boolean)),
      ),
    ]

    const summaryMap = new Map<number, Map<number, { supplier_name: string; tex_number: string; thread_color: string }>>()
    if (weekIds.length > 0) {
      const resultsData = await query<{ week_id: number; summary_data: any }>(
        `SELECT week_id, summary_data FROM thread_order_results WHERE week_id = ANY($1)`,
        [weekIds],
      )

      for (const result of resultsData || []) {
        if (result.summary_data && Array.isArray(result.summary_data)) {
          const threadMap = new Map<number, { supplier_name: string; tex_number: string; thread_color: string }>()
          for (const row of result.summary_data as Array<{ thread_type_id: number; supplier_name?: string; tex_number?: string; thread_color?: string }>) {
            if (row.thread_type_id) {
              threadMap.set(row.thread_type_id, {
                supplier_name: row.supplier_name || '',
                tex_number: row.tex_number || '',
                thread_color: row.thread_color || '',
              })
            }
          }
          summaryMap.set(result.week_id, threadMap)
        }
      }
    }

    const enriched = (loans || []).map((loan: any) => {
      const weekId = loan.to_week_id || loan.from_week_id
      const threadMap = summaryMap.get(weekId)
      const info = threadMap?.get(loan.thread_type_id)
      return {
        ...loan,
        supplier_name: loan.thread_type?.supplier?.name || info?.supplier_name || '',
        tex_number: loan.thread_type?.tex_number || info?.tex_number || '',
        color_name: info?.thread_color || '',
      }
    })

    return c.json({ data: enriched, error: null })
  } catch (err) {
    console.error('Error fetching all loans:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

loansReservations.get('/loans/:loanId/return-logs', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const loanId = parseInt(c.req.param('loanId'))
    if (isNaN(loanId)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const logs = await query<any>(
      `SELECT * FROM thread_loan_return_logs WHERE loan_id = $1 ORDER BY created_at DESC`,
      [loanId],
    )

    return c.json({ data: logs || [], error: null })
  } catch (err) {
    console.error('Error fetching loan return logs:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

loansReservations.post('/:weekId/loans/:loanId/manual-return', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const loanId = parseInt(c.req.param('loanId'))
    if (isNaN(loanId)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const body = await c.req.json()

    let validated
    try {
      validated = ManualReturnSchema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ data: null, error: formatZodError(err) }, 400)
      }
      throw err
    }

    const returnedBy = await getPerformerName(c)

    let result: any
    try {
      const rows = await query<{ result: any }>(
        `SELECT fn_manual_return_loan($1, $2, $3, $4) AS result`,
        [loanId, validated.quantity, returnedBy, validated.notes || null],
      )
      result = rows.length > 0 ? rows[0].result : null
    } catch (rpcErr) {
      return c.json({ data: null, error: getErrorMessage(rpcErr) }, 400)
    }

    return c.json({ data: result, error: null, message: `Đã trả ${validated.quantity} cuộn thành công` })
  } catch (err) {
    console.error('Error processing manual return:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

loansReservations.post('/:id/items/:itemId/complete', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const weekId = parseInt(c.req.param('id'))
    const itemId = parseInt(c.req.param('itemId'))
    if (isNaN(weekId) || isNaN(itemId)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const week = await queryOne<{ id: number; status: string }>(
      `SELECT id, status FROM thread_order_weeks WHERE id = $1`,
      [weekId],
    )

    if (!week) {
      return c.json({ data: null, error: 'Không tìm thấy tuần đặt hàng' }, 404)
    }
    if (week.status !== 'CONFIRMED' && !(await isRootUnlocked(c, weekId))) {
      return c.json({ data: null, error: 'Chỉ có thể đánh dấu hoàn tất khi tuần ở trạng thái CONFIRMED' }, 400)
    }

    const item = await queryOne<{ id: number }>(
      `SELECT id FROM thread_order_items WHERE id = $1 AND week_id = $2`,
      [itemId, weekId],
    )

    if (!item) {
      return c.json({ data: null, error: 'Sản phẩm không thuộc tuần này' }, 404)
    }

    const claims = c.get('jwtPayload' as never) as any
    const performedBy = claims?.employee_code || claims?.email || 'system'

    const data = await queryOne<Record<string, unknown>>(
      `INSERT INTO thread_order_item_completions (item_id, completed_by)
       VALUES ($1, $2)
       ON CONFLICT (item_id) DO UPDATE SET completed_by = EXCLUDED.completed_by
       RETURNING *`,
      [itemId, performedBy],
    )

    return c.json({ data, error: null, message: 'Đã đánh dấu hoàn tất xuất chỉ' })
  } catch (err) {
    console.error('Error marking item complete:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

loansReservations.delete('/:id/items/:itemId/complete', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const weekId = parseInt(c.req.param('id'))
    const itemId = parseInt(c.req.param('itemId'))
    if (isNaN(weekId) || isNaN(itemId)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const week = await queryOne<{ id: number; status: string }>(
      `SELECT id, status FROM thread_order_weeks WHERE id = $1`,
      [weekId],
    )

    if (!week) {
      return c.json({ data: null, error: 'Không tìm thấy tuần đặt hàng' }, 404)
    }
    if (week.status !== 'CONFIRMED' && !(await isRootUnlocked(c, weekId))) {
      return c.json({ data: null, error: 'Không thể bỏ đánh dấu khi tuần không ở trạng thái CONFIRMED' }, 400)
    }

    const item = await queryOne<{ id: number }>(
      `SELECT id FROM thread_order_items WHERE id = $1 AND week_id = $2`,
      [itemId, weekId],
    )

    if (!item) {
      return c.json({ data: null, error: 'Sản phẩm không thuộc tuần này' }, 404)
    }

    await query(
      `DELETE FROM thread_order_item_completions WHERE item_id = $1`,
      [itemId],
    )

    return c.json({ data: null, error: null, message: 'Đã bỏ đánh dấu hoàn tất' })
  } catch (err) {
    console.error('Error unmarking item complete:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

loansReservations.get('/:id/completions', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const weekId = parseInt(c.req.param('id'))
    if (isNaN(weekId)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const data = await query<any>(
      `SELECT toic.*,
        json_build_object('id', toi.id, 'week_id', toi.week_id) AS item
       FROM thread_order_item_completions toic
       INNER JOIN thread_order_items toi ON toi.id = toic.item_id
       WHERE toi.week_id = $1`,
      [weekId],
    )

    return c.json({ data: data || [], error: null })
  } catch (err) {
    console.error('Error fetching completions:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

loansReservations.get('/:id/surplus-preview', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const weekId = parseInt(c.req.param('id'))
    if (isNaN(weekId)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const week = await queryOne<{ id: number; status: string }>(
      `SELECT id, status FROM thread_order_weeks WHERE id = $1`,
      [weekId],
    )

    if (!week) {
      return c.json({ data: null, error: 'Không tìm thấy tuần đặt hàng' }, 404)
    }

    const totalCones = await queryCount(
      `SELECT count(*)::int AS count FROM thread_inventory
       WHERE reserved_week_id = $1 AND status = 'RESERVED_FOR_ORDER'`,
      [weekId],
    )

    const totalItems = await queryCount(
      `SELECT count(*)::int AS count FROM thread_order_items WHERE week_id = $1`,
      [weekId],
    )

    const completedItems = await queryCount(
      `SELECT count(*)::int AS count FROM thread_order_item_completions
       WHERE item_id IN (SELECT id FROM thread_order_items WHERE week_id = $1)`,
      [weekId],
    )

    const allCompleted = (totalItems ?? 0) > 0 && (completedItems ?? 0) >= (totalItems ?? 0)
    const canRelease = allCompleted && week.status === 'CONFIRMED'

    let breakdown:
      | {
          thread_type_id: number
          supplier_name: string
          tex_number: string
          color_name: string
          own_cones: number
          borrowed_cones: number
          borrowed_groups: { original_week_id: number; week_name: string; count: number; action: 're-reserve' | 'release' }[]
        }[]
      | undefined

    try {
      const cones = await query<any>(
        `SELECT inv.id, inv.thread_type_id, inv.original_week_id,
          CASE WHEN tt.id IS NULL THEN NULL ELSE json_build_object(
            'tex_number', tt.tex_number,
            'supplier', CASE WHEN sup.id IS NULL THEN NULL ELSE json_build_object('name', sup.name) END
          ) END AS thread_type,
          CASE WHEN col.id IS NULL THEN NULL ELSE json_build_object('name', col.name) END AS color
         FROM thread_inventory inv
         LEFT JOIN thread_types tt ON tt.id = inv.thread_type_id
         LEFT JOIN suppliers sup ON sup.id = tt.supplier_id
         LEFT JOIN colors col ON col.id = inv.color_id
         WHERE inv.reserved_week_id = $1 AND inv.status = 'RESERVED_FOR_ORDER'`,
        [weekId],
      )

      if (cones && cones.length > 0) {
        const borrowedWeekIds = [
          ...new Set(
            cones
              .filter((c: any) => c.original_week_id != null && c.original_week_id !== weekId)
              .map((c: any) => c.original_week_id as number),
          ),
        ]

        const origWeekMap = new Map<number, { status: string; week_name: string }>()
        if (borrowedWeekIds.length > 0) {
          const origWeeks = await query<{ id: number; status: string; week_name: string }>(
            `SELECT id, status, week_name FROM thread_order_weeks WHERE id = ANY($1)`,
            [borrowedWeekIds],
          )
          for (const w of origWeeks ?? []) {
            origWeekMap.set(w.id, { status: w.status, week_name: w.week_name })
          }
        }

        type BorrowedGroupAccum = { week_name: string; count: number; action: 're-reserve' | 'release' }
        type TypeAccum = {
          thread_type_id: number
          supplier_name: string
          tex_number: string
          color_name: string
          own_cones: number
          borrowed_cones: number
          borrowed_groups: Map<number, BorrowedGroupAccum>
        }
        const byType = new Map<number, TypeAccum>()

        for (const cone of cones as any[]) {
          const tt = cone.thread_type ?? {}
          const typeId: number = cone.thread_type_id
          if (!byType.has(typeId)) {
            byType.set(typeId, {
              thread_type_id: typeId,
              supplier_name: tt.supplier?.name ?? '-',
              tex_number: tt.tex_number != null ? String(tt.tex_number) : '-',
              color_name: cone.color?.name ?? '-',
              own_cones: 0,
              borrowed_cones: 0,
              borrowed_groups: new Map(),
            })
          }
          const grp = byType.get(typeId)!

          const origId: number | null = cone.original_week_id
          if (origId != null && origId !== weekId) {
            const origWeek = origWeekMap.get(origId)
            if (origWeek?.status === 'CONFIRMED') {
              grp.borrowed_cones++
              const bg = grp.borrowed_groups.get(origId)
              if (bg) {
                bg.count++
              } else {
                grp.borrowed_groups.set(origId, { week_name: origWeek.week_name, count: 1, action: 're-reserve' })
              }
            } else {
              grp.own_cones++
            }
          } else {
            grp.own_cones++
          }
        }

        breakdown = Array.from(byType.values()).map((g) => ({
          thread_type_id: g.thread_type_id,
          supplier_name: g.supplier_name,
          tex_number: g.tex_number,
          color_name: g.color_name,
          own_cones: g.own_cones,
          borrowed_cones: g.borrowed_cones,
          borrowed_groups: Array.from(g.borrowed_groups.entries()).map(([origWeekId, bg]) => ({
            original_week_id: origWeekId,
            week_name: bg.week_name,
            count: bg.count,
            action: bg.action,
          })),
        }))
      } else if (cones) {
        breakdown = []
      }
    } catch (breakdownErr) {
      console.error('Breakdown query failed (fallback to total-only):', breakdownErr)
    }

    return c.json({
      data: {
        total_cones: totalCones ?? 0,
        total_items: totalItems ?? 0,
        completed_items: completedItems ?? 0,
        can_release: canRelease,
        ...(breakdown !== undefined ? { breakdown } : {}),
      },
      error: null,
    })
  } catch (err) {
    console.error('Error fetching surplus preview:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

loansReservations.post('/:id/release-surplus', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const weekId = parseInt(c.req.param('id'))
    if (isNaN(weekId)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const claims = c.get('jwtPayload' as never) as any
    const performedBy = claims?.employee_code || claims?.email || 'system'

    let rpcResult: any
    try {
      const rows = await query<{ result: any }>(
        `SELECT fn_complete_week_and_release($1, $2) AS result`,
        [weekId, performedBy],
      )
      rpcResult = rows.length > 0 ? rows[0].result : null
    } catch (rpcError) {
      const message = rpcError instanceof Error ? rpcError.message : String(rpcError)
      if (message.includes('Tuần đã được hoàn tất')) {
        return c.json({ data: null, error: 'Tuần đã được hoàn tất' }, 409)
      }
      if (message.includes('Chưa hoàn tất tất cả')) {
        return c.json({ data: null, error: message }, 400)
      }
      if (message.includes('CONFIRMED')) {
        return c.json({ data: null, error: message }, 400)
      }
      throw rpcError
    }

    return c.json({
      data: rpcResult,
      error: null,
      message: 'Hoàn tất tuần và trả dư thành công',
    })
  } catch (err) {
    console.error('Error releasing surplus:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

loansReservations.get('/:id/loan-detail-by-type', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const rows = await query<{ result: any }>(
      `SELECT fn_loan_detail_by_thread_type($1) AS result`,
      [id],
    )
    const data = rows.length > 0 ? rows[0].result : null

    return c.json({ data: data || [], error: null })
  } catch (err) {
    console.error('Error fetching loan detail by type:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

loansReservations.post('/:id/loans', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const toWeekId = parseInt(c.req.param('id'))

    if (isNaN(toWeekId)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const body = await c.req.json()

    let validated
    try {
      validated = CreateLoanSchema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ data: null, error: formatZodError(err) }, 400)
      }
      throw err
    }

    const createdBy = await getPerformerName(c)

    let result: any
    try {
      const rows = await query<{ result: any }>(
        `SELECT fn_borrow_thread($1, $2, $3, $4, $5, $6) AS result`,
        [
          validated.from_week_id,
          toWeekId,
          validated.thread_type_id,
          validated.quantity_cones,
          validated.reason || null,
          createdBy,
        ],
      )
      result = rows.length > 0 ? rows[0].result : null
    } catch (rpcErr) {
      return c.json({ data: null, error: getErrorMessage(rpcErr) }, 400)
    }

    return c.json({
      data: result,
      error: null,
      message: 'Mượn chỉ thành công',
    })
  } catch (err) {
    console.error('Error creating loan:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

loansReservations.post('/:id/loans/batch', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const toWeekId = parseInt(c.req.param('id'))

    if (isNaN(toWeekId)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const body = await c.req.json()

    let validated
    try {
      validated = CreateBatchLoanSchema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ data: null, error: formatZodError(err) }, 400)
      }
      throw err
    }

    const createdBy = await getPerformerName(c)

    let result: any
    try {
      const rows = await query<{ result: any }>(
        `SELECT fn_batch_borrow_thread($1, $2, $3::jsonb, $4, $5) AS result`,
        [
          validated.from_week_id,
          toWeekId,
          JSON.stringify(validated.items),
          validated.reason || null,
          createdBy,
        ],
      )
      result = rows.length > 0 ? rows[0].result : null
    } catch (rpcErr) {
      return c.json({ data: null, error: getErrorMessage(rpcErr) }, 400)
    }

    return c.json({
      data: result,
      error: null,
      message: `Mượn ${validated.items.length} loại chỉ thành công`,
    })
  } catch (err) {
    console.error('Error creating batch loan:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

loansReservations.get('/:id/loans', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const loans = await query<any>(
      `SELECT l.*,
        CASE WHEN fw.id IS NULL THEN NULL ELSE json_build_object('id', fw.id, 'week_name', fw.week_name) END AS from_week,
        CASE WHEN tw.id IS NULL THEN NULL ELSE json_build_object('id', tw.id, 'week_name', tw.week_name) END AS to_week,
        CASE WHEN tt.id IS NULL THEN NULL ELSE json_build_object(
          'id', tt.id, 'code', tt.code, 'name', tt.name, 'tex_number', tt.tex_number,
          'supplier', CASE WHEN sup.id IS NULL THEN NULL ELSE json_build_object('name', sup.name) END
        ) END AS thread_type
       FROM thread_order_loans l
       LEFT JOIN thread_order_weeks fw ON fw.id = l.from_week_id
       LEFT JOIN thread_order_weeks tw ON tw.id = l.to_week_id
       LEFT JOIN thread_types tt ON tt.id = l.thread_type_id
       LEFT JOIN suppliers sup ON sup.id = tt.supplier_id
       WHERE (l.from_week_id = $1 OR l.to_week_id = $1) AND l.deleted_at IS NULL
       ORDER BY l.created_at DESC`,
      [id],
    )

    const weekIds = [
      ...new Set(
        (loans || []).flatMap((l: any) => [l.from_week_id, l.to_week_id].filter(Boolean)),
      ),
    ]

    const summaryMap = new Map<number, Map<number, { supplier_name: string; tex_number: string; thread_color: string }>>()
    if (weekIds.length > 0) {
      const resultsData = await query<{ week_id: number; summary_data: any }>(
        `SELECT week_id, summary_data FROM thread_order_results WHERE week_id = ANY($1)`,
        [weekIds],
      )

      for (const result of resultsData || []) {
        if (result.summary_data && Array.isArray(result.summary_data)) {
          const threadMap = new Map<number, { supplier_name: string; tex_number: string; thread_color: string }>()
          for (const row of result.summary_data as Array<{ thread_type_id: number; supplier_name?: string; tex_number?: string; thread_color?: string }>) {
            if (row.thread_type_id) {
              threadMap.set(row.thread_type_id, {
                supplier_name: row.supplier_name || '',
                tex_number: row.tex_number || '',
                thread_color: row.thread_color || '',
              })
            }
          }
          summaryMap.set(result.week_id, threadMap)
        }
      }
    }

    const enrichLoan = (loan: any) => {
      const weekId = loan.to_week_id || loan.from_week_id
      const threadMap = summaryMap.get(weekId)
      const info = threadMap?.get(loan.thread_type_id)
      return {
        ...loan,
        supplier_name: loan.thread_type?.supplier?.name || info?.supplier_name || '',
        tex_number: loan.thread_type?.tex_number || info?.tex_number || '',
        color_name: info?.thread_color || '',
      }
    }

    const enrichedAll = (loans || []).map(enrichLoan)
    const given = enrichedAll.filter((l: any) => l.from_week_id === id)
    const received = enrichedAll.filter((l: any) => l.to_week_id === id)

    return c.json({
      data: { all: enrichedAll, given, received },
      error: null,
    })
  } catch (err) {
    console.error('Error fetching loans:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

loansReservations.get('/:id/reservations', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const [cones, resultsRow] = await Promise.all([
      query<any>(
        `SELECT inv.id, inv.cone_id, inv.thread_type_id, inv.quantity_meters::float8 AS quantity_meters, inv.warehouse_id,
          inv.lot_number, inv.expiry_date, inv.received_date,
          CASE WHEN tt.id IS NULL THEN NULL ELSE json_build_object(
            'id', tt.id, 'code', tt.code, 'name', tt.name, 'tex_number', tt.tex_number,
            'supplier', CASE WHEN sup.id IS NULL THEN NULL ELSE json_build_object('name', sup.name) END
          ) END AS thread_type,
          CASE WHEN wh.id IS NULL THEN NULL ELSE json_build_object('id', wh.id, 'code', wh.code, 'name', wh.name) END AS warehouse
         FROM thread_inventory inv
         LEFT JOIN thread_types tt ON tt.id = inv.thread_type_id
         LEFT JOIN suppliers sup ON sup.id = tt.supplier_id
         LEFT JOIN warehouses wh ON wh.id = inv.warehouse_id
         WHERE inv.reserved_week_id = $1 AND inv.status = 'RESERVED_FOR_ORDER'
         ORDER BY inv.thread_type_id ASC, inv.expiry_date ASC NULLS LAST`,
        [id],
      ),
      queryOne<{ summary_data: any }>(
        `SELECT summary_data FROM thread_order_results WHERE week_id = $1`,
        [id],
      ),
    ])

    const colorMap = new Map<number, string>()
    if (resultsRow?.summary_data && Array.isArray(resultsRow.summary_data)) {
      for (const row of resultsRow.summary_data as Array<{ thread_type_id: number; thread_color?: string }>) {
        if (row.thread_type_id && row.thread_color) {
          colorMap.set(row.thread_type_id, row.thread_color)
        }
      }
    }

    const enrichedCones = (cones || []).map((cone: any) => ({
      ...cone,
      thread_type: cone.thread_type
        ? { ...cone.thread_type, color_name: colorMap.get(cone.thread_type_id) || '' }
        : cone.thread_type,
    }))

    const summaryMap = new Map<number, { thread_type_id: number; count: number; total_meters: number }>()
    for (const cone of cones) {
      const existing = summaryMap.get(cone.thread_type_id)
      if (existing) {
        existing.count++
        existing.total_meters += cone.quantity_meters || 0
      } else {
        summaryMap.set(cone.thread_type_id, {
          thread_type_id: cone.thread_type_id,
          count: 1,
          total_meters: cone.quantity_meters || 0,
        })
      }
    }

    return c.json({
      data: {
        cones: enrichedCones,
        summary: Array.from(summaryMap.values()),
        total_cones: cones.length,
      },
      error: null,
    })
  } catch (err) {
    console.error('Error fetching reservations:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

loansReservations.get('/:id/reservation-summary', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const bomData = await query<{ thread_type_id: number; color_id: number | null; needed_cones: number }>(
      `SELECT thread_type_id, color_id, needed_cones FROM fn_parse_calculation_cones($1)`,
      [id],
    )

    type BomRow = { thread_type_id: number; color_id: number | null; needed_cones: number }
    const bomRows = (bomData || []) as BomRow[]

    if (bomRows.length === 0) {
      return c.json({ data: [], error: null })
    }

    const threadTypeIds = Array.from(new Set(bomRows.map((r) => r.thread_type_id)))
    const colorIds = Array.from(new Set(bomRows.map((r) => r.color_id).filter((c): c is number => c !== null)))

    const threadTypes = await query<{ id: number; name: string }>(
      `SELECT id, name FROM thread_types WHERE id = ANY($1) LIMIT $2`,
      [threadTypeIds, threadTypeIds.length],
    )

    const ttNameMap = new Map<number, string>()
    for (const tt of threadTypes || []) {
      ttNameMap.set(tt.id, tt.name || '')
    }

    const colorNameMap = new Map<number, string>()
    if (colorIds.length > 0) {
      const colors = await query<{ id: number; name: string }>(
        `SELECT id, name FROM colors WHERE id = ANY($1) LIMIT $2`,
        [colorIds, colorIds.length],
      )

      for (const color of colors || []) {
        colorNameMap.set(color.id, color.name || '')
      }
    }

    const partialConeRatio = await getPartialConeRatio()
    const toEquivalent = (isPartial: boolean | null | undefined) => isPartial ? partialConeRatio : 1
    const roundEquivalent = (value: number) => Math.round(value * 100) / 100

    type ConeQuantity = { physical: number; equivalent: number }
    const emptyQuantity = (): ConeQuantity => ({ physical: 0, equivalent: 0 })

    const reservedCones = await query<{ thread_type_id: number; color_id: number | null; is_partial: boolean | null }>(
      `SELECT thread_type_id, color_id, is_partial FROM thread_inventory
       WHERE reserved_week_id = $1 AND status = 'RESERVED_FOR_ORDER'
         AND thread_type_id = ANY($2)
       LIMIT 100000`,
      [id, threadTypeIds],
    )

    const reservedMap = new Map<string, ConeQuantity>()
    for (const r of reservedCones || []) {
      const key = `${r.thread_type_id}-${r.color_id ?? ''}`
      const current = reservedMap.get(key) || emptyQuantity()
      current.physical += 1
      current.equivalent += toEquivalent(r.is_partial)
      reservedMap.set(key, current)
    }

    const warehouseRows = await query<{ warehouse_id: number }>(
      `SELECT warehouse_id FROM thread_order_week_warehouses WHERE week_id = $1 LIMIT 100`,
      [id],
    )

    const warehouseIds = (warehouseRows || []).map((row) => row.warehouse_id)

    const availableParams: unknown[] = [threadTypeIds]
    let availableSql = `SELECT thread_type_id, color_id, is_partial FROM thread_inventory
       WHERE status = 'AVAILABLE' AND reserved_week_id IS NULL
         AND thread_type_id = ANY($1)`
    if (warehouseIds.length > 0) {
      availableParams.push(warehouseIds)
      availableSql += ` AND warehouse_id = ANY($${availableParams.length})`
    }
    availableSql += ' LIMIT 100000'

    const availableCones = await query<{ thread_type_id: number; color_id: number | null; is_partial: boolean | null }>(
      availableSql,
      availableParams,
    )

    const availableMap = new Map<string, ConeQuantity>()
    for (const a of availableCones || []) {
      const key = `${a.thread_type_id}-${a.color_id ?? ''}`
      const current = availableMap.get(key) || emptyQuantity()
      current.physical += 1
      current.equivalent += toEquivalent(a.is_partial)
      availableMap.set(key, current)
    }

    const deliveries = await query<{ thread_type_id: number }>(
      `SELECT thread_type_id FROM thread_order_deliveries
       WHERE week_id = $1 AND thread_type_id = ANY($2)
       LIMIT $3`,
      [id, threadTypeIds, threadTypeIds.length],
    )

    const deliverySet = new Set((deliveries || []).map((d) => d.thread_type_id))

    const summary = bomRows.map((row) => {
      const key = `${row.thread_type_id}-${row.color_id ?? ''}`
      const reserved = reservedMap.get(key) || emptyQuantity()
      const availableStock = availableMap.get(key) || emptyQuantity()
      const reservedEquivalent = roundEquivalent(reserved.equivalent)
      const availableEquivalent = roundEquivalent(availableStock.equivalent)
      const shortage = roundEquivalent(Math.max(0, row.needed_cones - reservedEquivalent))
      const hasDelivery = deliverySet.has(row.thread_type_id)

      return {
        thread_type_id: row.thread_type_id,
        color_id: row.color_id || 0,
        color_name: row.color_id ? (colorNameMap.get(row.color_id) || '') : '',
        thread_type_name: ttNameMap.get(row.thread_type_id) || '',
        needed: row.needed_cones,
        reserved: reservedEquivalent,
        reserved_physical_cones: reserved.physical,
        reserved_equivalent_cones: reservedEquivalent,
        shortage,
        shortage_equivalent_cones: shortage,
        available_stock: availableEquivalent,
        available_physical_cones: availableStock.physical,
        available_equivalent_cones: availableEquivalent,
        can_reserve: hasDelivery,
        cannot_reserve_reason: hasDelivery ? undefined : 'Không có dữ liệu giao hàng cho loại chỉ này',
      }
    })

    return c.json({ data: summary, error: null })
  } catch (err) {
    console.error('Error fetching reservation summary:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

loansReservations.post('/:id/reserve-from-stock', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const weekId = parseInt(c.req.param('id'))

    if (isNaN(weekId)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const body = await c.req.json()

    let validated
    try {
      validated = ReserveFromStockSchema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ data: null, error: formatZodError(err) }, 400)
      }
      throw err
    }

    const week = await queryOne<{ id: number; status: string }>(
      `SELECT id, status FROM thread_order_weeks WHERE id = $1`,
      [weekId],
    )

    if (!week) {
      return c.json({ data: null, error: 'Không tìm thấy tuần đơn hàng' }, 404)
    }

    const unlockedReserve = week.status !== 'CONFIRMED' && (await isRootUnlocked(c, weekId))

    if (week.status !== 'CONFIRMED' && !unlockedReserve) {
      return c.json({ data: null, error: 'Chỉ có thể lấy từ tồn kho cho tuần đã xác nhận' }, 400)
    }

    const createdBy = await getPerformerName(c)

    let result: any
    try {
      const rows = await query<{ result: any }>(
        `SELECT fn_reserve_from_stock($1, $2, $3, $4, $5, $6) AS result`,
        [
          weekId,
          validated.thread_type_id,
          validated.quantity,
          validated.reason || null,
          createdBy,
          validated.color_id,
        ],
      )
      result = rows.length > 0 ? rows[0].result : null
    } catch (rpcErr) {
      return c.json({ data: null, error: getErrorMessage(rpcErr) }, 400)
    }

    if (unlockedReserve) {
      await logWeekAudit({
        weekId,
        tableName: 'thread_order_reservations',
        recordId: validated.thread_type_id,
        action: 'INSERT',
        newValues: {
          thread_type_id: validated.thread_type_id,
          color_id: validated.color_id,
          quantity: validated.quantity,
          reason: validated.reason ?? null,
          reserved_physical_cones: result?.reserved_physical_cones ?? 0,
        },
        performedBy: getPerformer(c),
      })
    }

    return c.json({
      data: result,
      error: null,
      message: `Đã lấy ${result?.reserved_physical_cones || 0} cuộn từ tồn kho (${result?.reserved_equivalent_cones || 0} cuộn quy đổi)`,
    })
  } catch (err) {
    console.error('Error reserving from stock:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

export default loansReservations
