import { Hono } from 'hono'
import { ZodError } from 'zod'
import { supabaseAdmin as supabase } from '../../db/supabase'
import { requirePermission } from '../../middleware/auth'
import { getErrorMessage } from '../../utils/errorHelper'
import {
  UpdateDeliverySchema,
  ReceiveDeliverySchema,
} from '../../validation/weeklyOrder'
import type { AppEnv } from '../../types/hono-env'
import { formatZodError } from './helpers'

const deliveries = new Hono<AppEnv>()

deliveries.get('/deliveries/overview', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const status = c.req.query('status')
    const weekId = c.req.query('week_id')

    let query = supabase
      .from('thread_order_deliveries')
      .select(`
        *,
        supplier:suppliers(id, name),
        thread_type:thread_types(id, name, tex_number, color_data:colors!color_id(name, hex_code)),
        week:thread_order_weeks(id, week_name)
      `)
      .order('delivery_date', { ascending: true })

    if (status) {
      query = query.eq('status', status)
    }
    if (weekId) {
      query = query.eq('week_id', parseInt(weekId))
    }

    const { data, error } = await query

    if (error) throw error

    const weekIds = [...new Set((data || []).map((row: any) => row.week_id))]

    const { data: resultsData } = await supabase
      .from('thread_order_results')
      .select('week_id, summary_data')
      .in('week_id', weekIds)

    const summaryMap = new Map<number, Map<string, { total_final: number; thread_color?: string; thread_color_code?: string }>>()
    for (const result of resultsData || []) {
      if (result.summary_data && Array.isArray(result.summary_data)) {
        const threadMap = new Map<string, { total_final: number; thread_color?: string; thread_color_code?: string }>()
        for (const row of result.summary_data as Array<{ thread_type_id: number; total_final?: number; thread_color?: string; thread_color_code?: string }>) {
          if (row.thread_type_id && row.total_final !== undefined) {
            const key = `${row.thread_type_id}_${row.thread_color ?? ''}`
            threadMap.set(key, {
              total_final: row.total_final,
              thread_color: row.thread_color || undefined,
              thread_color_code: row.thread_color_code || undefined,
            })
          }
        }
        summaryMap.set(result.week_id, threadMap)
      }
    }

    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const enrichedRows = (data || [])
      .map((row: any) => {
        const deliveryDate = new Date(row.delivery_date)
        deliveryDate.setHours(0, 0, 0, 0)
        const days_remaining = Math.ceil((deliveryDate.getTime() - now.getTime()) / 86400000)

        const threadMap = summaryMap.get(row.week_id)
        const compositeKey = `${row.thread_type_id}_${row.thread_color ?? ''}`
        let summaryInfo = threadMap?.get(compositeKey)
        if (!summaryInfo && !row.thread_color && threadMap) {
          let fallbackTotal = 0
          for (const [key, val] of threadMap) {
            if (key.startsWith(`${row.thread_type_id}_`)) fallbackTotal += val.total_final
          }
          if (fallbackTotal > 0) summaryInfo = { total_final: fallbackTotal }
        }
        const total_cones = summaryInfo?.total_final ?? null

        return {
          ...row,
          supplier_name: row.supplier?.name || '',
          thread_type_name: row.thread_type?.name || '',
          tex_number: row.thread_type?.tex_number || '',
          color_name: row.thread_color || row.thread_type?.color_data?.name || summaryInfo?.thread_color || '',
          color_hex: row.thread_color_code || row.thread_type?.color_data?.hex_code || summaryInfo?.thread_color_code || '',
          week_name: row.week?.week_name || '',
          days_remaining,
          is_overdue: days_remaining < 0 && row.status === 'PENDING',
          total_cones,
        }
      })
      .filter((row: any) => {
        if (row.total_cones === null) {
          return row.status === 'DELIVERED' || (row.received_quantity || 0) > 0
        }
        return row.total_cones >= 1
      })

    const dedupeMap = new Map<string, any>()
    const toTimestamp = (value: unknown) => {
      const ts = new Date(String(value || '')).getTime()
      return Number.isNaN(ts) ? 0 : ts
    }

    for (const row of enrichedRows) {
      const key = `${row.week_id}_${row.thread_type_id}_${row.thread_color ?? ''}`
      const existing = dedupeMap.get(key)
      if (!existing) {
        dedupeMap.set(key, row)
        continue
      }

      const existingDelivered = existing.status === 'DELIVERED'
      const currentDelivered = row.status === 'DELIVERED'
      const existingUpdatedAt = toTimestamp(existing.updated_at ?? existing.created_at)
      const currentUpdatedAt = toTimestamp(row.updated_at ?? row.created_at)

      if ((!existingDelivered && currentDelivered) || currentUpdatedAt > existingUpdatedAt) {
        dedupeMap.set(key, row)
      }
    }

    const enriched = Array.from(dedupeMap.values())
      .sort((a, b) => String(a.delivery_date).localeCompare(String(b.delivery_date)))

    const { data: loanAggs } = await supabase
      .from('thread_order_loans')
      .select('from_week_id, to_week_id, thread_type_id, quantity_cones')
      .eq('status', 'ACTIVE')
      .is('deleted_at', null)
      .not('from_week_id', 'is', null)

    const borrowedMap = new Map<string, number>()
    const lentMap = new Map<string, number>()
    for (const loan of loanAggs || []) {
      const borrowKey = `${loan.to_week_id}_${loan.thread_type_id}`
      borrowedMap.set(borrowKey, (borrowedMap.get(borrowKey) || 0) + loan.quantity_cones)
      const lentKey = `${loan.from_week_id}_${loan.thread_type_id}`
      lentMap.set(lentKey, (lentMap.get(lentKey) || 0) + loan.quantity_cones)
    }

    const withLoanContext = enriched.map((row: any) => {
      const key = `${row.week_id}_${row.thread_type_id}`
      return {
        ...row,
        borrowed_in: borrowedMap.get(key) || 0,
        lent_out: lentMap.get(key) || 0,
      }
    })

    return c.json({ data: withLoanContext, error: null })
  } catch (err) {
    console.error('Error fetching deliveries overview:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

deliveries.patch('/deliveries/:deliveryId', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const deliveryId = parseInt(c.req.param('deliveryId'))
    if (isNaN(deliveryId)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const body = await c.req.json()

    let validated
    try {
      validated = UpdateDeliverySchema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ data: null, error: formatZodError(err) }, 400)
      }
      throw err
    }

    const updateFields: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }
    if (validated.delivery_date !== undefined) updateFields.delivery_date = validated.delivery_date
    if (validated.actual_delivery_date !== undefined) updateFields.actual_delivery_date = validated.actual_delivery_date
    if (validated.status !== undefined) updateFields.status = validated.status
    if (validated.notes !== undefined) updateFields.notes = validated.notes

    const { data, error } = await supabase
      .from('thread_order_deliveries')
      .update(updateFields)
      .eq('id', deliveryId)
      .select(`
        *,
        supplier:suppliers(id, name),
        thread_type:thread_types(id, name, tex_number)
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ data: null, error: 'Không tìm thấy bản ghi giao hàng' }, 404)
      }
      throw error
    }

    if (validated.delivery_date !== undefined) {
      const updatedDelivery = data as { week_id: number; thread_type_id: number }

      const { data: resultRow, error: resultFetchError } = await supabase
        .from('thread_order_results')
        .select('id, summary_data')
        .eq('week_id', updatedDelivery.week_id)
        .maybeSingle()

      if (resultFetchError) {
        console.warn('Error fetching weekly result for delivery-date sync:', resultFetchError)
      } else if (resultRow?.summary_data && Array.isArray(resultRow.summary_data)) {
        let changed = false
        const nextSummary = (resultRow.summary_data as Array<Record<string, unknown>>).map((row) => {
          if (row.thread_type_id === updatedDelivery.thread_type_id) {
            changed = true
            return { ...row, delivery_date: validated.delivery_date }
          }
          return row
        })

        if (changed) {
          const { error: resultUpdateError } = await supabase
            .from('thread_order_results')
            .update({ summary_data: nextSummary })
            .eq('id', resultRow.id)

          if (resultUpdateError) {
            console.warn('Error syncing delivery_date into summary_data:', resultUpdateError)
          }
        }
      }
    }

    return c.json({
      data: {
        ...data,
        supplier_name: (data as any).supplier?.name || '',
        thread_type_name: (data as any).thread_type?.name || '',
        tex_number: (data as any).thread_type?.tex_number || '',
      },
      error: null,
      message: 'Cập nhật thông tin giao hàng thành công',
    })
  } catch (err) {
    console.error('Error updating delivery:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

deliveries.post('/deliveries/:deliveryId/receive', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const deliveryId = parseInt(c.req.param('deliveryId'))
    if (isNaN(deliveryId)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const body = await c.req.json()

    let validated
    try {
      validated = ReceiveDeliverySchema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ data: null, error: formatZodError(err) }, 400)
      }
      throw err
    }

    const { warehouse_id, quantity, received_by, expiry_date } = validated

    const { data: delivery, error: deliveryError } = await supabase
      .from('thread_order_deliveries')
      .select('id, status, week_id, thread_type_id')
      .eq('id', deliveryId)
      .single()

    if (deliveryError) {
      if (deliveryError.code === 'PGRST116') {
        return c.json({ data: null, error: 'Không tìm thấy delivery' }, 404)
      }
      throw deliveryError
    }

    if (delivery.status !== 'DELIVERED') {
      return c.json({ data: null, error: 'Chỉ có thể nhập kho cho đơn đã giao' }, 400)
    }

    const { data: result, error: rpcError } = await supabase.rpc('fn_receive_delivery', {
      p_delivery_id: deliveryId,
      p_received_qty: quantity,
      p_warehouse_id: warehouse_id,
      p_received_by: received_by,
      p_expiry_date: expiry_date || null,
    })

    if (rpcError) {
      console.error('fn_receive_delivery error:', rpcError)
      return c.json({ data: null, error: rpcError.message }, 500)
    }

    return c.json({
      data: {
        cones_created: result?.cones_created ?? quantity,
        cones_reserved: result?.cones_reserved ?? 0,
        remaining_shortage: result?.remaining_shortage ?? 0,
        lot_number: result?.lot_number ?? null,
        auto_return: result?.auto_return ?? { settled: 0, returned_cones: 0, details: [] },
      },
      error: null,
      message: `Đã nhập ${quantity} cuộn chỉ vào kho`,
    })
  } catch (err) {
    console.error('Error receiving delivery:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

deliveries.get('/:id/deliveries', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const [deliveriesResult, loansResult, summaryResult] = await Promise.all([
      supabase
        .from('thread_order_deliveries')
        .select(`
          *,
          supplier:suppliers(id, name),
          thread_type:thread_types(id, name, tex_number, color_data:colors!color_id(name, hex_code))
        `)
        .eq('week_id', id)
        .order('delivery_date', { ascending: true }),
      supabase
        .from('thread_order_loans')
        .select('thread_type_id, from_week_id, to_week_id, quantity_cones')
        .or(`from_week_id.eq.${id},to_week_id.eq.${id}`)
        .eq('status', 'ACTIVE')
        .is('deleted_at', null),
      supabase
        .from('thread_order_results')
        .select('summary_data')
        .eq('week_id', id)
        .single(),
    ])

    if (deliveriesResult.error) throw deliveriesResult.error

    const summaryColorMap = new Map<number, { thread_color: string; thread_color_code: string }>()
    if (summaryResult.data?.summary_data && Array.isArray(summaryResult.data.summary_data)) {
      for (const row of summaryResult.data.summary_data as Array<{ thread_type_id: number; thread_color?: string; thread_color_code?: string }>) {
        if (row.thread_type_id && row.thread_color) {
          summaryColorMap.set(row.thread_type_id, {
            thread_color: row.thread_color,
            thread_color_code: row.thread_color_code || '',
          })
        }
      }
    }

    const loanRows = loansResult.data || []
    const loanAggregates = new Map<number, { borrowed_in: number; lent_out: number }>()
    for (const loan of loanRows) {
      if (!loanAggregates.has(loan.thread_type_id)) {
        loanAggregates.set(loan.thread_type_id, { borrowed_in: 0, lent_out: 0 })
      }
      const agg = loanAggregates.get(loan.thread_type_id)!
      if (loan.to_week_id === id && loan.from_week_id !== null) {
        agg.borrowed_in += loan.quantity_cones
      }
      if (loan.from_week_id === id) {
        agg.lent_out += loan.quantity_cones
      }
    }

    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const enriched = (deliveriesResult.data || []).map((row: any) => {
      const deliveryDate = new Date(row.delivery_date)
      deliveryDate.setHours(0, 0, 0, 0)
      const days_remaining = Math.ceil((deliveryDate.getTime() - now.getTime()) / 86400000)
      const loanData = loanAggregates.get(row.thread_type_id) || { borrowed_in: 0, lent_out: 0 }
      const summaryColor = summaryColorMap.get(row.thread_type_id)
      return {
        ...row,
        supplier_name: row.supplier?.name || '',
        thread_type_name: row.thread_type?.name || '',
        tex_number: row.thread_type?.tex_number || '',
        color_name: row.thread_type?.color_data?.name || summaryColor?.thread_color || '',
        color_hex: row.thread_type?.color_data?.hex_code || summaryColor?.thread_color_code || '',
        days_remaining,
        is_overdue: days_remaining < 0 && row.status === 'PENDING',
        borrowed_in: loanData.borrowed_in,
        lent_out: loanData.lent_out,
      }
    })

    return c.json({ data: enriched, error: null })
  } catch (err) {
    console.error('Error fetching week deliveries:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

export default deliveries
