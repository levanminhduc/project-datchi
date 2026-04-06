import { Hono } from 'hono'
import { ZodError } from 'zod'
import { supabaseAdmin as supabase } from '../../db/supabase'
import { requirePermission } from '../../middleware/auth'
import { getErrorMessage } from '../../utils/errorHelper'
import { broadcastNotification, getWarehouseEmployeeIds } from '../../utils/notificationService'
import { dispatchExternalNotification } from '../../utils/external-notification-dispatcher'
import {
  CreateWeeklyOrderSchema,
  UpdateWeeklyOrderSchema,
  UpdateStatusSchema,
  OrderedQuantitiesQuerySchema,
  HistoryByWeekQuerySchema,
} from '../../validation/weeklyOrder'
import type { WeeklyOrderStatus } from '../../types/weeklyOrder'
import type { AppEnv } from '../../types/hono-env'
import {
  formatZodError,
  VALID_STATUS_TRANSITIONS,
  validateSubArtIds,
  validatePOQuantityLimits,
} from './helpers'

const core = new Hono<AppEnv>()

core.get('/check-name', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const rawName = c.req.query('name')
    const name = rawName?.trim()

    if (!name) {
      return c.json({ data: null, error: 'Thiếu tên tuần' }, 400)
    }

    const { data: week, error } = await supabase
      .from('thread_order_weeks')
      .select('id, week_name, status')
      .eq('week_name', name)
      .maybeSingle()

    if (error) throw error

    if (week) {
      return c.json({ data: { exists: true, week }, error: null })
    }

    return c.json({ data: { exists: false }, error: null })
  } catch (err) {
    console.error('Error checking week name:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

core.get('/assignment-summary', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const statusFilter = c.req.query('status')

    let weeksQuery = supabase
      .from('thread_order_weeks')
      .select('id, week_name, status')
      .order('created_at', { ascending: false })

    if (statusFilter) {
      weeksQuery = weeksQuery.eq('status', statusFilter)
    }

    const { data: weeks, error: weeksError } = await weeksQuery
    if (weeksError) throw weeksError
    if (!weeks || weeks.length === 0) {
      return c.json({ data: [], error: null })
    }

    const weekIds = weeks.map((w: any) => w.id)

    const { data: resultsData, error: resultsError } = await supabase
      .from('thread_order_results')
      .select('week_id, summary_data')
      .in('week_id', weekIds)

    if (resultsError) throw resultsError

    const plannedMap = new Map<number, Map<number, { planned: number; code: string; name: string }>>()
    for (const result of resultsData || []) {
      const summaryRows: any[] = result.summary_data || []
      const typeMap = new Map<number, { planned: number; code: string; name: string }>()
      for (const row of summaryRows) {
        if (row.thread_type_id) {
          typeMap.set(row.thread_type_id, {
            planned: row.total_final ?? row.sl_can_dat ?? row.total_cones ?? 0,
            code: row.thread_type_code || row.code || '',
            name: row.thread_type_name || row.name || '',
          })
        }
      }
      plannedMap.set(result.week_id, typeMap)
    }

    const { data: reservedData, error: reservedError } = await supabase
      .from('thread_inventory')
      .select('reserved_week_id, thread_type_id')
      .in('reserved_week_id', weekIds)
      .eq('status', 'RESERVED_FOR_ORDER')

    if (reservedError) throw reservedError

    const reservedMap = new Map<number, Map<number, number>>()
    for (const cone of reservedData || []) {
      if (!reservedMap.has(cone.reserved_week_id)) {
        reservedMap.set(cone.reserved_week_id, new Map())
      }
      const typeMap = reservedMap.get(cone.reserved_week_id)!
      typeMap.set(cone.thread_type_id, (typeMap.get(cone.thread_type_id) || 0) + 1)
    }

    const { data: allocData, error: allocError } = await supabase
      .from('thread_allocations')
      .select('week_id, thread_type_id, allocated_meters, thread_type:thread_types(meters_per_cone)')
      .in('week_id', weekIds)
      .in('status', ['ISSUED', 'HARD'])

    if (allocError) throw allocError

    const allocMap = new Map<number, Map<number, number>>()
    for (const alloc of allocData || []) {
      if (!alloc.week_id) continue
      if (!allocMap.has(alloc.week_id)) {
        allocMap.set(alloc.week_id, new Map())
      }
      const typeMap = allocMap.get(alloc.week_id)!
      const metersPerCone = (alloc.thread_type as any)?.meters_per_cone || 0
      const cones = metersPerCone > 0
        ? Number(alloc.allocated_meters) / metersPerCone
        : 0
      typeMap.set(alloc.thread_type_id, (typeMap.get(alloc.thread_type_id) || 0) + cones)
    }

    const rows: any[] = []
    for (const week of weeks) {
      const typeMap = plannedMap.get(week.id)
      if (!typeMap) continue

      for (const [threadTypeId, { planned, code, name }] of typeMap) {
        const reserved = reservedMap.get(week.id)?.get(threadTypeId) || 0
        const allocated = Math.round(allocMap.get(week.id)?.get(threadTypeId) || 0)
        const gap = reserved - planned

        rows.push({
          week_id: week.id,
          week_name: week.week_name,
          week_status: week.status,
          thread_type_id: threadTypeId,
          thread_type_code: code,
          thread_type_name: name,
          planned_cones: planned,
          reserved_cones: reserved,
          allocated_cones: allocated,
          gap,
        })
      }
    }

    return c.json({ data: rows, error: null })
  } catch (err) {
    console.error('Error fetching assignment summary:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

core.get('/ordered-quantities', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const query = c.req.query()

    let validated
    try {
      validated = OrderedQuantitiesQuerySchema.parse(query)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ data: null, error: formatZodError(err) }, 400)
      }
      throw err
    }

    let pairs: Array<{ po_id: number; style_id: number }>
    try {
      pairs = JSON.parse(validated.po_style_pairs)
      if (!Array.isArray(pairs) || pairs.length === 0) {
        return c.json({ data: null, error: 'po_style_pairs phải là mảng không rỗng' }, 400)
      }
    } catch {
      return c.json({ data: null, error: 'po_style_pairs không phải JSON hợp lệ' }, 400)
    }

    const excludeWeekId = validated.exclude_week_id ? parseInt(validated.exclude_week_id) : undefined

    const results = []

    for (const pair of pairs) {
      if (!pair.po_id || !pair.style_id) continue

      let itemsQuery = supabase
        .from('thread_order_items')
        .select('quantity, week:thread_order_weeks!inner(id, status)')
        .eq('po_id', pair.po_id)
        .eq('style_id', pair.style_id)
        .neq('week.status', 'CANCELLED')

      if (excludeWeekId) {
        itemsQuery = itemsQuery.neq('week.id', excludeWeekId)
      }

      const { data: items } = await itemsQuery

      const orderedQuantity = (items || []).reduce(
        (sum: number, row: any) => sum + (row.quantity || 0),
        0,
      )

      const { data: poItem } = await supabase
        .from('po_items')
        .select('quantity')
        .eq('po_id', pair.po_id)
        .eq('style_id', pair.style_id)
        .is('deleted_at', null)
        .single()

      const poQuantity = poItem?.quantity || 0
      const remaining = Math.max(0, poQuantity - orderedQuantity)

      results.push({
        po_id: pair.po_id,
        style_id: pair.style_id,
        po_quantity: poQuantity,
        ordered_quantity: orderedQuantity,
        remaining_quantity: remaining,
      })
    }

    return c.json({ data: results, error: null })
  } catch (err) {
    console.error('Error fetching ordered quantities:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

core.get('/history-by-week', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const query = c.req.query()

    let validated
    try {
      validated = HistoryByWeekQuerySchema.parse(query)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ data: null, error: formatZodError(err) }, 400)
      }
      throw err
    }

    const page = validated.page ? Math.max(1, parseInt(validated.page)) : 1
    const limit = validated.limit ? Math.min(Math.max(1, parseInt(validated.limit)), 100) : 10
    const from = (page - 1) * limit

    let weekIds: number[] | null = null

    if (validated.po_id || validated.style_id) {
      let itemQuery = supabase
        .from('thread_order_items')
        .select('week_id, week:thread_order_weeks!inner(status)')

      if (validated.po_id) {
        itemQuery = itemQuery.eq('po_id', parseInt(validated.po_id))
      }
      if (validated.style_id) {
        itemQuery = itemQuery.eq('style_id', parseInt(validated.style_id))
      }
      itemQuery = itemQuery.neq('week.status', 'CANCELLED')

      const { data: matchingItems } = await itemQuery
      weekIds = [...new Set((matchingItems || []).map((i: any) => i.week_id))]

      if (weekIds.length === 0) {
        return c.json({
          data: [],
          error: null,
          pagination: { page, limit, total: 0, totalPages: 0 },
        })
      }
    }

    let countQuery = supabase
      .from('thread_order_weeks')
      .select('id', { count: 'exact', head: true })

    let weeksQuery = supabase
      .from('thread_order_weeks')
      .select('id, week_name, status, created_by, created_at')
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)

    const statusParam = validated.status
    if (statusParam === 'ALL') {
      // No status filter
    } else if (statusParam && ['DRAFT', 'CONFIRMED', 'CANCELLED'].includes(statusParam)) {
      countQuery = countQuery.eq('status', statusParam)
      weeksQuery = weeksQuery.eq('status', statusParam)
    } else {
      countQuery = countQuery.neq('status', 'CANCELLED')
      weeksQuery = weeksQuery.neq('status', 'CANCELLED')
    }

    if (weekIds !== null) {
      countQuery = countQuery.in('id', weekIds)
      weeksQuery = weeksQuery.in('id', weekIds)
    }

    if (validated.from_date) {
      const fromIso = validated.from_date.includes('/')
        ? validated.from_date.split('/').reverse().join('-')
        : validated.from_date
      countQuery = countQuery.gte('created_at', `${fromIso}T00:00:00.000Z`)
      weeksQuery = weeksQuery.gte('created_at', `${fromIso}T00:00:00.000Z`)
    }
    if (validated.to_date) {
      const toIso = validated.to_date.includes('/')
        ? validated.to_date.split('/').reverse().join('-')
        : validated.to_date
      const toDateEnd = toIso.includes('T') ? toIso : `${toIso}T23:59:59.999Z`
      countQuery = countQuery.lte('created_at', toDateEnd)
      weeksQuery = weeksQuery.lte('created_at', toDateEnd)
    }

    if (validated.created_by) {
      countQuery = countQuery.ilike('created_by', `%${validated.created_by}%`)
      weeksQuery = weeksQuery.ilike('created_by', `%${validated.created_by}%`)
    }

    const [{ count }, { data: weeks, error: weeksError }] = await Promise.all([countQuery, weeksQuery])

    if (weeksError) throw weeksError
    if (!weeks || weeks.length === 0) {
      return c.json({
        data: [],
        error: null,
        pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
      })
    }

    const pageWeekIds = weeks.map((w: any) => w.id)

    let itemsQuery = supabase
      .from('thread_order_items')
      .select(`
        id, week_id, po_id, style_id, style_color_id, quantity,
        style:styles(id, style_code, style_name),
        style_color:style_colors(id, color_name, hex_code),
        po:purchase_orders(id, po_number)
      `)
      .in('week_id', pageWeekIds)

    if (validated.po_id) {
      itemsQuery = itemsQuery.eq('po_id', parseInt(validated.po_id))
    }
    if (validated.style_id) {
      itemsQuery = itemsQuery.eq('style_id', parseInt(validated.style_id))
    }

    const { data: items, error: itemsError } = await itemsQuery
    if (itemsError) throw itemsError

    const uniquePairs = new Map<string, { po_id: number; style_id: number }>()
    for (const item of (items || [])) {
      if (item.po_id) {
        const key = `${item.po_id}-${item.style_id}`
        if (!uniquePairs.has(key)) {
          uniquePairs.set(key, { po_id: item.po_id, style_id: item.style_id })
        }
      }
    }

    const progressMap = new Map<string, { po_quantity: number; total_ordered: number }>()

    for (const pair of uniquePairs.values()) {
      const { data: orderedItems } = await supabase
        .from('thread_order_items')
        .select('quantity, week:thread_order_weeks!inner(id, status)')
        .eq('po_id', pair.po_id)
        .eq('style_id', pair.style_id)
        .neq('week.status', 'CANCELLED')

      const totalOrdered = (orderedItems || []).reduce(
        (sum: number, row: any) => sum + (row.quantity || 0),
        0,
      )

      const { data: poItem } = await supabase
        .from('po_items')
        .select('quantity')
        .eq('po_id', pair.po_id)
        .eq('style_id', pair.style_id)
        .is('deleted_at', null)
        .single()

      const poQuantity = poItem?.quantity || 0

      progressMap.set(`${pair.po_id}-${pair.style_id}`, {
        po_quantity: poQuantity,
        total_ordered: totalOrdered,
      })
    }

    const result = weeks.map((week: any) => {
      const weekItems = (items || []).filter((i: any) => i.week_id === week.id)

      const poMap = new Map<string, { po_id: number | null; po_number: string; items: any[] }>()
      for (const item of weekItems) {
        const poKey = item.po_id ? String(item.po_id) : 'null'
        if (!poMap.has(poKey)) {
          poMap.set(poKey, {
            po_id: item.po_id,
            po_number: (item.po as any)?.po_number || 'Không có PO',
            items: [],
          })
        }
        poMap.get(poKey)!.items.push(item)
      }

      const po_groups = Array.from(poMap.values()).map((poGroup) => {
        const styleMap = new Map<number, { style: any; colors: any[]; thisWeekQty: number }>()
        for (const item of poGroup.items) {
          if (!styleMap.has(item.style_id)) {
            styleMap.set(item.style_id, {
              style: item.style,
              colors: [],
              thisWeekQty: 0,
            })
          }
          const sg = styleMap.get(item.style_id)!
          sg.colors.push({
            style_color_id: item.style_color_id,
            color_name: item.style_color?.color_name || '',
            hex_code: item.style_color?.hex_code || '',
            quantity: item.quantity,
          })
          sg.thisWeekQty += item.quantity
        }

        const styles = Array.from(styleMap.entries()).map(([styleId, sg]) => {
          const progressKey = `${poGroup.po_id}-${styleId}`
          const progress = progressMap.get(progressKey)
          const poQuantity = progress?.po_quantity || 0
          const totalOrdered = progress?.total_ordered || 0
          const remaining = Math.max(0, poQuantity - totalOrdered)
          const progressPct = poQuantity > 0 ? Math.round((totalOrdered / poQuantity) * 100) : 0

          return {
            style_id: styleId,
            style_code: sg.style?.style_code || '',
            style_name: sg.style?.style_name || '',
            po_quantity: poQuantity,
            total_ordered: totalOrdered,
            this_week_quantity: sg.thisWeekQty,
            remaining,
            progress_pct: progressPct,
            colors: sg.colors,
          }
        })

        return {
          po_id: poGroup.po_id,
          po_number: poGroup.po_number,
          styles,
        }
      })

      const totalQuantity = weekItems.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0)

      return {
        week_id: week.id,
        week_name: week.week_name,
        status: week.status,
        created_by: week.created_by,
        created_at: week.created_at,
        total_quantity: totalQuantity,
        po_groups,
      }
    })

    const total = count ?? 0
    return c.json({
      data: result,
      error: null,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    console.error('Error fetching history by week:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

core.get('/:id', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const { data, error } = await supabase
      .from('thread_order_weeks')
      .select(
        `
        *,
        items:thread_order_items (
          id,
          week_id,
          po_id,
          style_id,
          style_color_id,
          quantity,
          sub_art_id,
          created_at,
          style:styles (id, style_code, style_name),
          style_color:style_colors (id, color_name, hex_code),
          po:purchase_orders (id, po_number),
          sub_art:sub_arts (id, sub_art_code)
        )
      `,
      )
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ data: null, error: 'Không tìm thấy tuần đặt hàng' }, 404)
      }
      throw error
    }

    return c.json({ data, error: null })
  } catch (err) {
    console.error('Error fetching weekly order:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

core.post('/', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const body = await c.req.json()

    let validated
    try {
      validated = CreateWeeklyOrderSchema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ data: null, error: formatZodError(err) }, 400)
      }
      throw err
    }

    const poValidation = await validatePOQuantityLimits(validated.items)
    if (!poValidation.valid) {
      return c.json({
        data: null,
        error: `Số lượng vượt quá PO:\n${poValidation.errors.join('\n')}`,
      }, 400)
    }

    const subArtError = await validateSubArtIds(validated.items)
    if (subArtError) {
      return c.json({ data: null, error: subArtError }, 400)
    }

    const auth = c.get('auth')
    let createdBy: string | null = null
    if (auth?.employeeId) {
      const { data: emp } = await supabase
        .from('employees')
        .select('full_name')
        .eq('id', auth.employeeId)
        .single()
      createdBy = emp?.full_name || null
    }

    const { data: week, error: weekError } = await supabase
      .from('thread_order_weeks')
      .insert([
        {
          week_name: validated.week_name.trim(),
          start_date: validated.start_date || null,
          end_date: validated.end_date || null,
          status: 'DRAFT',
          notes: validated.notes || null,
          created_by: createdBy,
        },
      ])
      .select()
      .single()

    if (weekError) {
      if (weekError.code === '23505') {
        return c.json({ data: null, error: 'Tên tuần đã tồn tại' }, 409)
      }
      throw weekError
    }

    const itemRows = validated.items.map((item) => ({
      week_id: week.id,
      po_id: item.po_id || null,
      style_id: item.style_id,
      style_color_id: item.style_color_id,
      quantity: item.quantity,
      sub_art_id: item.sub_art_id || null,
    }))

    const { data: items, error: itemsError } = await supabase
      .from('thread_order_items')
      .insert(itemRows)
      .select(
        `
        id,
        week_id,
        po_id,
        style_id,
        style_color_id,
        quantity,
        sub_art_id,
        created_at,
        style:styles (id, style_code, style_name),
        style_color:style_colors (id, color_name, hex_code),
        po:purchase_orders (id, po_number),
        sub_art:sub_arts (id, sub_art_code)
      `,
      )

    if (itemsError) throw itemsError

    return c.json(
      { data: { ...week, items }, error: null, message: 'Tạo tuần đặt hàng thành công' },
      201,
    )
  } catch (err) {
    console.error('Error creating weekly order:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

core.put('/:id', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const { data: existing, error: fetchError } = await supabase
      .from('thread_order_weeks')
      .select('id, status')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return c.json({ data: null, error: 'Không tìm thấy tuần đặt hàng' }, 404)
      }
      throw fetchError
    }

    if (existing.status !== 'DRAFT') {
      return c.json(
        { data: null, error: 'Chỉ có thể cập nhật tuần ở trạng thái nháp (DRAFT)' },
        400,
      )
    }

    const body = await c.req.json()

    let validated
    try {
      validated = UpdateWeeklyOrderSchema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ data: null, error: formatZodError(err) }, 400)
      }
      throw err
    }

    if (validated.items && validated.items.length > 0) {
      const poValidation = await validatePOQuantityLimits(validated.items, id)
      if (!poValidation.valid) {
        return c.json({
          data: null,
          error: `Số lượng vượt quá PO:\n${poValidation.errors.join('\n')}`,
        }, 400)
      }

      const subArtError = await validateSubArtIds(validated.items)
      if (subArtError) {
        return c.json({ data: null, error: subArtError }, 400)
      }
    }

    const updateFields: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }
    if (validated.week_name !== undefined) updateFields.week_name = validated.week_name.trim()
    if (validated.start_date !== undefined) updateFields.start_date = validated.start_date || null
    if (validated.end_date !== undefined) updateFields.end_date = validated.end_date || null
    if (validated.notes !== undefined) updateFields.notes = validated.notes || null

    const auth = c.get('auth')
    if (auth?.employeeId) {
      const { data: emp } = await supabase
        .from('employees')
        .select('full_name')
        .eq('id', auth.employeeId)
        .single()
      updateFields.updated_by = emp?.full_name || null
    }

    const { data: week, error: updateError } = await supabase
      .from('thread_order_weeks')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      if (updateError.code === '23505') {
        return c.json({ data: null, error: 'Tên tuần đã tồn tại' }, 409)
      }
      throw updateError
    }

    let items: Record<string, unknown>[] | null = null
    if (validated.items !== undefined) {
      const { error: deleteError } = await supabase
        .from('thread_order_items')
        .delete()
        .eq('week_id', id)

      if (deleteError) throw deleteError

      if (validated.items.length > 0) {
        const itemRows = validated.items.map((item) => ({
          week_id: id,
          po_id: item.po_id || null,
          style_id: item.style_id,
          style_color_id: item.style_color_id,
          quantity: item.quantity,
          sub_art_id: item.sub_art_id || null,
        }))

        const { data: newItems, error: insertError } = await supabase
          .from('thread_order_items')
          .insert(itemRows)
          .select(
            `
            id,
            week_id,
            po_id,
            style_id,
            style_color_id,
            quantity,
            sub_art_id,
            created_at,
            style:styles (id, style_code, style_name),
            style_color:style_colors (id, color_name, hex_code),
            po:purchase_orders (id, po_number),
            sub_art:sub_arts (id, sub_art_code)
          `,
          )

        if (insertError) throw insertError
        items = newItems
      } else {
        items = []
      }
    }

    const result = items !== null ? { ...week, items } : week

    return c.json({ data: result, error: null, message: 'Cập nhật tuần đặt hàng thành công' })
  } catch (err) {
    console.error('Error updating weekly order:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

core.delete('/:id', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const { data: existing, error: fetchError } = await supabase
      .from('thread_order_weeks')
      .select('id, status')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return c.json({ data: null, error: 'Không tìm thấy tuần đặt hàng' }, 404)
      }
      throw fetchError
    }

    if (existing.status !== 'DRAFT') {
      return c.json(
        { data: null, error: 'Chỉ có thể xóa tuần ở trạng thái nháp (DRAFT)' },
        400,
      )
    }

    const { data: results, error: resultsError } = await supabase
      .from('thread_order_results')
      .select('id')
      .eq('week_id', id)
      .limit(1)

    if (resultsError) throw resultsError

    if (results && results.length > 0) {
      return c.json(
        {
          data: null,
          error: 'Không thể xóa vì đã có kết quả tính toán. Hãy xóa kết quả trước.',
        },
        409,
      )
    }

    const { error: itemsDeleteError } = await supabase
      .from('thread_order_items')
      .delete()
      .eq('week_id', id)

    if (itemsDeleteError) throw itemsDeleteError

    const { error: deleteError } = await supabase
      .from('thread_order_weeks')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    return c.json({ data: null, error: null, message: 'Xóa tuần đặt hàng thành công' })
  } catch (err) {
    console.error('Error deleting weekly order:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

core.patch('/:id/status', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const body = await c.req.json()

    let validated
    try {
      validated = UpdateStatusSchema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ data: null, error: formatZodError(err) }, 400)
      }
      throw err
    }

    const newStatus = validated.status as WeeklyOrderStatus

    const { data: existing, error: fetchError } = await supabase
      .from('thread_order_weeks')
      .select('id, status')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return c.json({ data: null, error: 'Không tìm thấy tuần đặt hàng' }, 404)
      }
      throw fetchError
    }

    const currentStatus = existing.status as WeeklyOrderStatus
    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || []

    if (!allowedTransitions.includes(newStatus)) {
      return c.json(
        {
          data: null,
          error: `Không thể chuyển từ '${currentStatus}' sang '${newStatus}'. Các trạng thái hợp lệ: ${allowedTransitions.join(', ') || 'không có'}`,
        },
        400,
      )
    }

    if (newStatus === 'CONFIRMED') {
      let result = null
      let lastError = null
      const maxRetries = 3
      const retryDelay = 100

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const { data: rpcResult, error: rpcError } = await supabase.rpc('fn_confirm_week_with_reserve', {
          p_week_id: id,
        })

        if (rpcError) {
          lastError = rpcError
          if (rpcError.code === '42883' || rpcError.message?.includes('does not exist')) {
            lastError = null
            break
          }
          break
        }

        result = rpcResult
        const summaries = result?.reservation_summary || []
        const hasSkipped = summaries.some((s: any) => s.skipped_locked > 0)

        if (!hasSkipped) {
          break
        }

        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay))
        }
      }

      if (lastError) {
        console.error('[PATCH status] fn_confirm_week_with_reserve error:', lastError)
        return c.json({ data: null, error: lastError.message }, 500)
      }

      if (result) {
        const { data: week } = await supabase
          .from('thread_order_weeks')
          .select('*')
          .eq('id', id)
          .single()

        const statusLabels: Record<string, string> = { CONFIRMED: 'xác nhận', CANCELLED: 'hủy' }
        const warehouseIds = await getWarehouseEmployeeIds()
        broadcastNotification({
          employeeIds: warehouseIds,
          type: 'WEEKLY_ORDER',
          title: `Đơn đặt hàng tuần #${id} đã được ${statusLabels[newStatus] || newStatus}`,
          actionUrl: `/thread/weekly-order/${id}`,
          metadata: { weekly_order_id: id, new_status: newStatus },
        })

        if (newStatus === 'CONFIRMED') {
          const itemCount = (result?.reservation_summary || []).length
          const totalQuantity = (result?.reservation_summary || []).reduce(
            (sum: number, s: any) => sum + (s.reserved || 0), 0
          )
          dispatchExternalNotification('ORDER_CONFIRMED', {
            weekId: id,
            weekLabel: week?.week_name || `#${id}`,
            createdBy: week?.created_by || '',
            itemCount,
            totalQuantity,
          })
        }

        return c.json({
          data: {
            week,
            reservation_summary: result?.reservation_summary || [],
          },
          error: null,
          message: 'Xác nhận và đặt trước thành công',
        })
      }
    }

    if (newStatus === 'CANCELLED') {
      const { data: activeLoans, error: loansError } = await supabase
        .from('thread_order_loans')
        .select('id')
        .or(`from_week_id.eq.${id},to_week_id.eq.${id}`)
        .is('deleted_at', null)
        .limit(1)

      if (loansError) throw loansError

      if (activeLoans && activeLoans.length > 0) {
        return c.json(
          {
            data: null,
            error: 'Không thể hủy khi còn khoản mượn/cho mượn chưa thanh toán',
          },
          400,
        )
      }

      const { error: releaseError } = await supabase.rpc('fn_release_week_reservations', {
        p_week_id: id,
      })

      if (releaseError) {
        return c.json({ data: null, error: releaseError.message }, 500)
      }
    }

    const { data, error } = await supabase
      .from('thread_order_weeks')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    const statusLabels: Record<string, string> = {
      CONFIRMED: 'xác nhận',
      CANCELLED: 'hủy',
    }
    const warehouseIds = await getWarehouseEmployeeIds()
    broadcastNotification({
      employeeIds: warehouseIds,
      type: 'WEEKLY_ORDER',
      title: `Đơn đặt hàng tuần #${id} đã được ${statusLabels[newStatus] || newStatus}`,
      actionUrl: `/thread/weekly-order/${id}`,
      metadata: { weekly_order_id: id, new_status: newStatus },
    })

    if (newStatus === 'CONFIRMED') {
      dispatchExternalNotification('ORDER_CONFIRMED', {
        weekId: id,
        weekLabel: data?.week_name || `#${id}`,
        createdBy: data?.created_by || '',
        itemCount: 0,
        totalQuantity: 0,
      })
    }

    return c.json({ data, error: null, message: 'Cập nhật trạng thái thành công' })
  } catch (err) {
    console.error('Error updating weekly order status:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

core.get('/', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const query = c.req.query()

    const page = query.page ? parseInt(query.page) : null
    const limit = query.limit ? Math.min(Math.max(parseInt(query.limit), 1), 100) : 20
    const isPaginated = page !== null && !isNaN(page) && page >= 1

    let dbQuery = supabase
      .from('thread_order_weeks')
      .select(
        `
        *,
        item_count:thread_order_items(count)
      `,
        isPaginated ? { count: 'exact' } : undefined,
      )
      .order('created_at', { ascending: false })

    if (query.status) {
      dbQuery = dbQuery.eq('status', query.status)
    }

    if (isPaginated) {
      const from = (page - 1) * limit
      const to = from + limit - 1
      dbQuery = dbQuery.range(from, to)
    }

    const { data, error, count } = await dbQuery

    if (error) throw error

    const result = (data || []).map((row: any) => ({
      ...row,
      item_count: row.item_count?.[0]?.count ?? 0,
    }))

    if (isPaginated) {
      const total = count ?? 0
      return c.json({
        data: result,
        error: null,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    }

    return c.json({ data: result, error: null })
  } catch (err) {
    console.error('Error fetching weekly orders:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

export default core
