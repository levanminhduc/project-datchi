import { Hono } from 'hono'
import { ZodError } from 'zod'
import { supabaseAdmin as supabase } from '../../db/supabase'
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

const loansReservations = new Hono<AppEnv>()

loansReservations.post('/completion-lookup', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const { po_id, style_id, style_color_id } = await c.req.json()

    if (!po_id || !style_id) {
      return c.json({ data: null, error: 'po_id và style_id là bắt buộc' }, 400)
    }

    let query = supabase
      .from('thread_order_items')
      .select('id, week_id, thread_order_weeks!inner(id, week_name, status)')
      .eq('po_id', po_id)
      .eq('style_id', style_id)
      .in('thread_order_weeks.status', ['CONFIRMED', 'COMPLETED'])

    if (style_color_id) {
      query = query.eq('style_color_id', style_color_id)
    } else {
      query = query.is('style_color_id', null)
    }

    const { data, error } = await query.limit(100)

    if (error) throw error

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

    const { data: validItems, error: queryError } = await supabase
      .from('thread_order_items')
      .select('id, week_id, thread_order_weeks!inner(status)')
      .in('id', itemIds)
      .in('thread_order_weeks.status', ['CONFIRMED', 'COMPLETED'])

    if (queryError) throw queryError

    const validIds = (validItems || []).map((i: any) => i.id)
    const claims = c.get('jwtPayload' as never) as any
    const performedBy = claims?.employee_code || claims?.email || 'system'

    if (validIds.length > 0) {
      const upsertRows = validIds.map((itemId: number) => ({
        item_id: itemId,
        completed_by: performedBy,
      }))

      const { error: upsertError } = await supabase
        .from('thread_order_item_completions')
        .upsert(upsertRows, { onConflict: 'item_id' })

      if (upsertError) throw upsertError
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
    const { data, error } = await supabase.rpc('fn_loan_dashboard_summary')

    if (error) throw error

    return c.json({ data, error: null })
  } catch (err) {
    console.error('Error fetching loan dashboard summary:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

loansReservations.get('/loans/all', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const { data: loans, error } = await supabase
      .from('thread_order_loans')
      .select(
        `
        *,
        from_week:thread_order_weeks!thread_order_loans_from_week_id_fkey(id, week_name),
        to_week:thread_order_weeks!thread_order_loans_to_week_id_fkey(id, week_name),
        thread_type:thread_types(id, code, name, tex_number, supplier:suppliers(name))
      `,
      )
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) throw error

    const weekIds = [
      ...new Set(
        (loans || []).flatMap((l: any) => [l.from_week_id, l.to_week_id].filter(Boolean)),
      ),
    ]

    const summaryMap = new Map<number, Map<number, { supplier_name: string; tex_number: string; thread_color: string }>>()
    if (weekIds.length > 0) {
      const { data: resultsData } = await supabase
        .from('thread_order_results')
        .select('week_id, summary_data')
        .in('week_id', weekIds)

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

    const { data: logs, error } = await supabase
      .from('thread_loan_return_logs')
      .select('*')
      .eq('loan_id', loanId)
      .order('created_at', { ascending: false })

    if (error) throw error

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

    const { data: result, error: rpcError } = await supabase.rpc('fn_manual_return_loan', {
      p_loan_id: loanId,
      p_quantity: validated.quantity,
      p_returned_by: returnedBy,
      p_notes: validated.notes || null,
    })

    if (rpcError) {
      return c.json({ data: null, error: rpcError.message }, 400)
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

    const { data: week, error: weekError } = await supabase
      .from('thread_order_weeks')
      .select('id, status')
      .eq('id', weekId)
      .single()

    if (weekError || !week) {
      return c.json({ data: null, error: 'Không tìm thấy tuần đặt hàng' }, 404)
    }
    if (week.status !== 'CONFIRMED') {
      return c.json({ data: null, error: 'Chỉ có thể đánh dấu hoàn tất khi tuần ở trạng thái CONFIRMED' }, 400)
    }

    const { data: item, error: itemError } = await supabase
      .from('thread_order_items')
      .select('id')
      .eq('id', itemId)
      .eq('week_id', weekId)
      .single()

    if (itemError || !item) {
      return c.json({ data: null, error: 'Sản phẩm không thuộc tuần này' }, 404)
    }

    const claims = c.get('jwtPayload' as never) as any
    const performedBy = claims?.employee_code || claims?.email || 'system'

    const { data, error } = await supabase
      .from('thread_order_item_completions')
      .upsert({ item_id: itemId, completed_by: performedBy }, { onConflict: 'item_id' })
      .select()
      .single()

    if (error) throw error

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

    const { data: week, error: weekError } = await supabase
      .from('thread_order_weeks')
      .select('id, status')
      .eq('id', weekId)
      .single()

    if (weekError || !week) {
      return c.json({ data: null, error: 'Không tìm thấy tuần đặt hàng' }, 404)
    }
    if (week.status !== 'CONFIRMED') {
      return c.json({ data: null, error: 'Không thể bỏ đánh dấu khi tuần không ở trạng thái CONFIRMED' }, 400)
    }

    const { data: item, error: itemError } = await supabase
      .from('thread_order_items')
      .select('id')
      .eq('id', itemId)
      .eq('week_id', weekId)
      .single()

    if (itemError || !item) {
      return c.json({ data: null, error: 'Sản phẩm không thuộc tuần này' }, 404)
    }

    const { error } = await supabase
      .from('thread_order_item_completions')
      .delete()
      .eq('item_id', itemId)

    if (error) throw error

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

    const { data, error } = await supabase
      .from('thread_order_item_completions')
      .select('*, item:thread_order_items!inner(id, week_id)')
      .eq('item.week_id', weekId)

    if (error) throw error

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

    const { data: week, error: weekError } = await supabase
      .from('thread_order_weeks')
      .select('id, status')
      .eq('id', weekId)
      .single()

    if (weekError || !week) {
      return c.json({ data: null, error: 'Không tìm thấy tuần đặt hàng' }, 404)
    }

    const { count: totalCones, error: coneError } = await supabase
      .from('thread_inventory')
      .select('id', { count: 'exact', head: true })
      .eq('reserved_week_id', weekId)
      .eq('status', 'RESERVED_FOR_ORDER')

    if (coneError) throw coneError

    const { count: totalItems } = await supabase
      .from('thread_order_items')
      .select('id', { count: 'exact', head: true })
      .eq('week_id', weekId)

    const { count: completedItems } = await supabase
      .from('thread_order_item_completions')
      .select('id', { count: 'exact', head: true })
      .in(
        'item_id',
        (await supabase.from('thread_order_items').select('id').eq('week_id', weekId)).data?.map((i: any) => i.id) || [],
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
      const { data: cones, error: conesError } = await supabase
        .from('thread_inventory')
        .select(
          `id, thread_type_id, original_week_id,
          thread_type:thread_types(tex_number, supplier:suppliers(name)),
          color:colors!color_id(name)`,
        )
        .eq('reserved_week_id', weekId)
        .eq('status', 'RESERVED_FOR_ORDER')

      if (!conesError && cones && cones.length > 0) {
        const borrowedWeekIds = [
          ...new Set(
            cones
              .filter((c: any) => c.original_week_id != null && c.original_week_id !== weekId)
              .map((c: any) => c.original_week_id as number),
          ),
        ]

        const origWeekMap = new Map<number, { status: string; week_name: string }>()
        if (borrowedWeekIds.length > 0) {
          const { data: origWeeks } = await supabase
            .from('thread_order_weeks')
            .select('id, status, week_name')
            .in('id', borrowedWeekIds)
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
      } else if (!conesError && cones) {
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

    const { data: rpcResult, error: rpcError } = await supabase.rpc('fn_complete_week_and_release', {
      p_week_id: weekId,
      p_performed_by: performedBy,
    })

    if (rpcError) {
      if (rpcError.message?.includes('Tuần đã được hoàn tất')) {
        return c.json({ data: null, error: 'Tuần đã được hoàn tất' }, 409)
      }
      if (rpcError.message?.includes('Chưa hoàn tất tất cả')) {
        return c.json({ data: null, error: rpcError.message }, 400)
      }
      if (rpcError.message?.includes('CONFIRMED')) {
        return c.json({ data: null, error: rpcError.message }, 400)
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

    const { data, error } = await supabase.rpc('fn_loan_detail_by_thread_type', {
      p_week_id: id,
    })

    if (error) throw error

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

    const { data: result, error: rpcError } = await supabase.rpc('fn_borrow_thread', {
      p_from_week_id: validated.from_week_id,
      p_to_week_id: toWeekId,
      p_thread_type_id: validated.thread_type_id,
      p_quantity: validated.quantity_cones,
      p_reason: validated.reason || null,
      p_user: createdBy,
    })

    if (rpcError) {
      return c.json({ data: null, error: rpcError.message }, 400)
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

    const { data: result, error: rpcError } = await supabase.rpc('fn_batch_borrow_thread', {
      p_from_week_id: validated.from_week_id,
      p_to_week_id: toWeekId,
      p_items: JSON.stringify(validated.items),
      p_reason: validated.reason || null,
      p_user: createdBy,
    })

    if (rpcError) {
      return c.json({ data: null, error: rpcError.message }, 400)
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

    const { data: loans, error } = await supabase
      .from('thread_order_loans')
      .select(
        `
        *,
        from_week:thread_order_weeks!thread_order_loans_from_week_id_fkey(id, week_name),
        to_week:thread_order_weeks!thread_order_loans_to_week_id_fkey(id, week_name),
        thread_type:thread_types(id, code, name, tex_number, supplier:suppliers(name))
      `,
      )
      .or(`from_week_id.eq.${id},to_week_id.eq.${id}`)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error

    const weekIds = [
      ...new Set(
        (loans || []).flatMap((l: any) => [l.from_week_id, l.to_week_id].filter(Boolean)),
      ),
    ]

    const summaryMap = new Map<number, Map<number, { supplier_name: string; tex_number: string; thread_color: string }>>()
    if (weekIds.length > 0) {
      const { data: resultsData } = await supabase
        .from('thread_order_results')
        .select('week_id, summary_data')
        .in('week_id', weekIds)

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

    const [conesResult, resultsResult] = await Promise.all([
      supabase
        .from('thread_inventory')
        .select(
          `
          id,
          cone_id,
          thread_type_id,
          quantity_meters,
          warehouse_id,
          lot_number,
          expiry_date,
          received_date,
          thread_type:thread_types(id, code, name, tex_number, supplier:suppliers(name)),
          warehouse:warehouses(id, code, name)
        `,
        )
        .eq('reserved_week_id', id)
        .eq('status', 'RESERVED_FOR_ORDER')
        .order('thread_type_id')
        .order('expiry_date', { ascending: true, nullsFirst: false }),
      supabase
        .from('thread_order_results')
        .select('summary_data')
        .eq('week_id', id)
        .maybeSingle(),
    ])

    if (conesResult.error) throw conesResult.error

    const cones = conesResult.data || []

    const colorMap = new Map<number, string>()
    if (resultsResult.data?.summary_data && Array.isArray(resultsResult.data.summary_data)) {
      for (const row of resultsResult.data.summary_data as Array<{ thread_type_id: number; thread_color?: string }>) {
        if (row.thread_type_id && row.thread_color) {
          colorMap.set(row.thread_type_id, row.thread_color)
        }
      }
    }

    const enrichedCones = cones.map((cone: any) => ({
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

    const { data: deliveries, error: deliveryError } = await supabase
      .from('thread_order_deliveries')
      .select('thread_type_id, quantity_cones, thread_type:thread_types(id, name)')
      .eq('week_id', id)

    if (deliveryError) throw deliveryError

    const deliveryMap = new Map<number, number>()
    const threadTypeNameMap = new Map<number, string>()
    for (const d of deliveries || []) {
      deliveryMap.set(d.thread_type_id, d.quantity_cones || 0)
      if (d.thread_type && typeof d.thread_type === 'object' && 'name' in d.thread_type) {
        threadTypeNameMap.set(d.thread_type_id, (d.thread_type as unknown as { id: number; name: string }).name)
      }
    }

    const { data: resultsData, error: resultsError } = await supabase
      .from('thread_order_results')
      .select('summary_data')
      .eq('week_id', id)
      .single()

    if (resultsError && resultsError.code !== 'PGRST116') throw resultsError

    type SummaryRow = { thread_type_id?: number; thread_type_name?: string; total_final?: number }
    const summaryData: SummaryRow[] = resultsData?.summary_data || []
    const summaryMapLocal = new Map<number, { name: string; totalFinal: number }>()
    for (const row of summaryData) {
      if (row.thread_type_id && row.total_final != null) {
        summaryMapLocal.set(row.thread_type_id, {
          name: row.thread_type_name || '',
          totalFinal: row.total_final,
        })
        if (!threadTypeNameMap.has(row.thread_type_id) && row.thread_type_name) {
          threadTypeNameMap.set(row.thread_type_id, row.thread_type_name)
        }
      }
    }

    const allThreadTypeIds = new Set<number>([...deliveryMap.keys(), ...summaryMapLocal.keys()])

    if (allThreadTypeIds.size === 0) {
      return c.json({ data: [], error: null })
    }

    const threadTypeIds = Array.from(allThreadTypeIds)

    const { data: reservedCounts, error: reservedError } = await supabase
      .from('thread_inventory')
      .select('thread_type_id')
      .eq('reserved_week_id', id)
      .eq('status', 'RESERVED_FOR_ORDER')
      .in('thread_type_id', threadTypeIds)

    if (reservedError) throw reservedError

    const reservedMap = new Map<number, number>()
    for (const r of reservedCounts || []) {
      const count = reservedMap.get(r.thread_type_id) || 0
      reservedMap.set(r.thread_type_id, count + 1)
    }

    const { data: availableCounts, error: availableError } = await supabase
      .from('thread_inventory')
      .select('thread_type_id')
      .eq('status', 'AVAILABLE')
      .is('reserved_week_id', null)
      .in('thread_type_id', threadTypeIds)

    if (availableError) throw availableError

    const availableMap = new Map<number, number>()
    for (const a of availableCounts || []) {
      const count = availableMap.get(a.thread_type_id) || 0
      availableMap.set(a.thread_type_id, count + 1)
    }

    const summary = threadTypeIds.map((threadTypeId) => {
      const hasDeliveryRow = deliveryMap.has(threadTypeId)
      const needed = hasDeliveryRow
        ? (deliveryMap.get(threadTypeId) || 0)
        : (summaryMapLocal.get(threadTypeId)?.totalFinal || 0)
      const reserved = reservedMap.get(threadTypeId) || 0
      const availableStock = availableMap.get(threadTypeId) || 0
      const shortage = Math.max(0, needed)
      const canReserve = hasDeliveryRow
      const cannotReserveReason = hasDeliveryRow ? undefined : 'Không có dữ liệu giao hàng cho loại chỉ này'
      const threadTypeName = threadTypeNameMap.get(threadTypeId) || ''

      return {
        thread_type_id: threadTypeId,
        thread_type_name: threadTypeName,
        needed,
        reserved,
        shortage,
        available_stock: availableStock,
        can_reserve: canReserve,
        cannot_reserve_reason: cannotReserveReason,
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

    const { data: week, error: weekError } = await supabase
      .from('thread_order_weeks')
      .select('id, status')
      .eq('id', weekId)
      .single()

    if (weekError || !week) {
      return c.json({ data: null, error: 'Không tìm thấy tuần đơn hàng' }, 404)
    }

    if (week.status !== 'CONFIRMED') {
      return c.json({ data: null, error: 'Chỉ có thể lấy từ tồn kho cho tuần đã xác nhận' }, 400)
    }

    const createdBy = await getPerformerName(c)

    const { data: result, error: rpcError } = await supabase.rpc('fn_reserve_from_stock', {
      p_week_id: weekId,
      p_thread_type_id: validated.thread_type_id,
      p_quantity: validated.quantity,
      p_reason: validated.reason || null,
      p_user: createdBy,
    })

    if (rpcError) {
      return c.json({ data: null, error: rpcError.message }, 400)
    }

    return c.json({
      data: result,
      error: null,
      message: `Đã lấy ${result?.reserved || 0} cuộn từ tồn kho`,
    })
  } catch (err) {
    console.error('Error reserving from stock:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

export default loansReservations
