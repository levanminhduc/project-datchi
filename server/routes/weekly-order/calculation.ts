import { Hono } from 'hono'
import { ZodError } from 'zod'
import { supabaseAdmin as supabase } from '../../db/supabase'
import { requirePermission } from '../../middleware/auth'
import { getErrorMessage } from '../../utils/errorHelper'
import { getPartialConeRatio } from '../../utils/settings-helper'
import {
  EnrichInventorySchema,
  UpdateQuotaConesSchema,
  SaveResultsSchema,
} from '../../validation/weeklyOrder'
import type { AppEnv } from '../../types/hono-env'
import { formatZodError } from './helpers'

const calculation = new Hono<AppEnv>()

calculation.post('/enrich-inventory', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const body = await c.req.json()

    let validated
    try {
      validated = EnrichInventorySchema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ data: null, error: formatZodError(err) }, 400)
      }
      throw err
    }

    const { summary_rows, current_week_id } = validated

    const threadTypeIds = [...new Set(summary_rows.map((r) => r.thread_type_id))]

    const partialConeRatio = await getPartialConeRatio()

    const colorNames = [...new Set(
      summary_rows
        .map((r) => (r as Record<string, unknown>).thread_color as string | null | undefined)
        .filter((c): c is string => !!c && c.trim() !== ''),
    )]

    const colorNameToId = new Map<string, number>()
    if (colorNames.length > 0) {
      const { data: colorRows } = await supabase
        .from('colors')
        .select('id, name')
        .in('name', colorNames)
        .limit(colorNames.length)

      for (const c of colorRows || []) {
        colorNameToId.set(c.name, c.id)
      }
    }

    const coloredTypeIds: number[] = []
    const coloredColorIds: number[] = []
    const nonColoredTypeIds: number[] = []

    for (const row of summary_rows) {
      const tc = (row as Record<string, unknown>).thread_color as string | null | undefined
      if (tc && tc.trim() !== '' && colorNameToId.has(tc)) {
        coloredTypeIds.push(row.thread_type_id)
        coloredColorIds.push(colorNameToId.get(tc)!)
      } else if (!tc || tc.trim() === '') {
        nonColoredTypeIds.push(row.thread_type_id)
      }
    }

    const uniqueColoredTypeIds = [...new Set(coloredTypeIds)]
    const uniqueColoredColorIds = [...new Set(coloredColorIds)]
    const uniqueNonColoredTypeIds = [...new Set(nonColoredTypeIds)]

    const inventoryMap = new Map<string, { full: number; partial: number }>()

    if (uniqueColoredTypeIds.length > 0 && uniqueColoredColorIds.length > 0) {
      const { data: coloredCounts, error: coloredError } = await supabase
        .from('thread_inventory')
        .select('thread_type_id, color_id, is_partial')
        .in('status', ['RECEIVED', 'INSPECTED', 'AVAILABLE', 'SOFT_ALLOCATED'])
        .in('thread_type_id', uniqueColoredTypeIds)
        .in('color_id', uniqueColoredColorIds)
        .limit(50000)

      if (coloredError) throw coloredError

      const colorIdToName = new Map<number, string>()
      for (const [name, id] of colorNameToId) {
        colorIdToName.set(id, name)
      }

      for (const inv of coloredCounts || []) {
        const cName = colorIdToName.get(inv.color_id)
        if (!cName) continue
        const key = `${inv.thread_type_id}_${cName}`
        const entry = inventoryMap.get(key) || { full: 0, partial: 0 }
        if (inv.is_partial) {
          entry.partial++
        } else {
          entry.full++
        }
        inventoryMap.set(key, entry)
      }
    }

    if (uniqueNonColoredTypeIds.length > 0) {
      const { data: inventoryCounts, error: invError } = await supabase.rpc('fn_count_available_cones', {
        p_thread_type_ids: uniqueNonColoredTypeIds,
      })

      if (invError) throw invError

      for (const row of inventoryCounts || []) {
        const key = `${row.thread_type_id}_`
        const entry = inventoryMap.get(key) || { full: 0, partial: 0 }
        if (row.is_partial) {
          entry.partial = Number(row.cone_count)
        } else {
          entry.full = Number(row.cone_count)
        }
        inventoryMap.set(key, entry)
      }
    }

    const committedMap = new Map<number, number>()
    if (threadTypeIds.length > 0) {
      let confirmedQuery = supabase
        .from('thread_order_results')
        .select('week_id, summary_data, thread_order_weeks!inner(status)')
        .eq('thread_order_weeks.status', 'CONFIRMED')

      if (current_week_id) {
        confirmedQuery = confirmedQuery.neq('week_id', current_week_id)
      }

      const { data: confirmedData, error: confirmedError } = await confirmedQuery

      if (confirmedError) {
        console.error('[enrich-inventory] confirmedError:', confirmedError)
      }

      for (const result of confirmedData || []) {
        const summaryRows = result.summary_data as Array<{ thread_type_id: number; total_cones: number }> | null
        if (!summaryRows) continue
        for (const row of summaryRows) {
          if (threadTypeIds.includes(row.thread_type_id)) {
            const current = committedMap.get(row.thread_type_id) || 0
            committedMap.set(row.thread_type_id, current + (row.total_cones || 0))
          }
        }
      }
    }

    const enrichedRows = summary_rows.map((row) => {
      const tc = (row as Record<string, unknown>).thread_color as string | null | undefined
      const key = `${row.thread_type_id}_${tc && tc.trim() !== '' ? tc : ''}`
      const inv = inventoryMap.get(key) || { full: 0, partial: 0 }
      const full_cones = inv.full
      const partial_cones = inv.partial
      const inventory_cones = full_cones + partial_cones
      const equivalent_cones = Math.round((full_cones + partial_cones * partialConeRatio) * 10) / 10
      const sl_can_dat = Math.max(0, Math.ceil(row.total_cones - equivalent_cones))
      const additional_order = 0
      const total_final = sl_can_dat

      return {
        ...row,
        full_cones,
        partial_cones,
        inventory_cones,
        equivalent_cones,
        sl_can_dat,
        additional_order,
        total_final,
      }
    })

    return c.json({ data: enrichedRows, error: null })
  } catch (err) {
    console.error('Error enriching inventory data:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

calculation.put('/items/:id/quota', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const weekId = parseInt(c.req.param('id'))
    if (isNaN(weekId)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const body = await c.req.json()

    let validated
    try {
      validated = UpdateQuotaConesSchema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ data: null, error: formatZodError(err) }, 400)
      }
      throw err
    }

    const { thread_type_id, quota_cones } = validated

    const { error: weekError } = await supabase
      .from('thread_order_weeks')
      .select('id')
      .eq('id', weekId)
      .single()

    if (weekError) {
      if (weekError.code === 'PGRST116') {
        return c.json({ data: null, error: 'Không tìm thấy tuần đặt hàng' }, 404)
      }
      throw weekError
    }

    const { data: results, error: resultsError } = await supabase
      .from('thread_order_results')
      .select('*')
      .eq('week_id', weekId)
      .single()

    if (resultsError) {
      if (resultsError.code === 'PGRST116') {
        return c.json({ data: null, error: 'Chưa có kết quả tính toán cho tuần này' }, 404)
      }
      throw resultsError
    }

    let updated = false
    const summaryData = results.summary_data as any[]
    for (const row of summaryData) {
      if (row.thread_type_id === thread_type_id) {
        row.quota_cones = quota_cones
        updated = true
        break
      }
    }

    if (!updated) {
      return c.json({ data: null, error: 'Không tìm thấy loại chỉ trong kết quả tuần này' }, 404)
    }

    const { error: updateError } = await supabase
      .from('thread_order_results')
      .update({
        summary_data: summaryData,
      })
      .eq('week_id', weekId)
      .select()
      .single()

    if (updateError) throw updateError

    return c.json({
      data: { thread_type_id, quota_cones },
      error: null,
      message: `Đã cập nhật định mức cuộn cho loại chỉ`,
    })
  } catch (err) {
    console.error('Error updating quota cones:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

calculation.post('/:id/results', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const { data: week, error: fetchError } = await supabase
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

    const isConfirmed = week.status === 'CONFIRMED'

    const body = await c.req.json()

    let validated
    try {
      validated = SaveResultsSchema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ data: null, error: formatZodError(err) }, 400)
      }
      throw err
    }

    let enrichedSummaryData = validated.summary_data || null
    if (validated.summary_data && Array.isArray(validated.summary_data)) {
      const summaryRows = validated.summary_data as Array<{
        thread_type_id: number
        total_meters?: number
        meters_per_cone?: number
        [key: string]: unknown
      }>

      const threadTypeIds = [...new Set(summaryRows.map((r) => r.thread_type_id))]

      const { data: threadTypes, error: threadError } = await supabase
        .from('thread_types')
        .select('id, meters_per_cone')
        .in('id', threadTypeIds)

      if (threadError) {
        console.warn('Error fetching thread types for quota calculation:', threadError)
      }

      const metersPerConeMap = new Map<number, number>()
      for (const tt of threadTypes || []) {
        metersPerConeMap.set(tt.id, tt.meters_per_cone || 2000)
      }

      enrichedSummaryData = summaryRows.map((row) => {
        const totalMeters = row.total_meters || 0
        const metersPerCone = row.meters_per_cone || metersPerConeMap.get(row.thread_type_id) || 2000

        const quotaCones = totalMeters > 0 ? Math.ceil(totalMeters / metersPerCone) : 0

        if (!row.meters_per_cone && !metersPerConeMap.has(row.thread_type_id)) {
          console.warn(`Thread type ${row.thread_type_id} has no meters_per_cone, using default 2000`)
        }

        return {
          ...row,
          quota_cones: quotaCones,
        }
      })
    }

    const { data, error } = await supabase
      .from('thread_order_results')
      .upsert(
        {
          week_id: id,
          calculation_data: validated.calculation_data,
          summary_data: enrichedSummaryData,
          calculated_at: new Date().toISOString(),
        },
        { onConflict: 'week_id' },
      )
      .select()
      .single()

    if (error) throw error

    if (isConfirmed && enrichedSummaryData && Array.isArray(enrichedSummaryData)) {
      const summaryRows = enrichedSummaryData as Array<{
        thread_type_id: number
        supplier_id?: number | null
        delivery_date?: string | null
        lead_time_days?: number | null
        total_final?: number | null
        total_cones?: number | null
        thread_color?: string | null
        thread_color_code?: string | null
        [key: string]: unknown
      }>

      const { data: existingDeliveries } = await supabase
        .from('thread_order_deliveries')
        .select('id, thread_type_id, supplier_id, delivery_date, status, received_quantity, quantity_cones, thread_color')
        .eq('week_id', id)

      const desiredDeliveryMap = new Map<string, {
        week_id: number
        thread_type_id: number
        supplier_id: number
        delivery_date: string
        status: 'PENDING'
        quantity_cones: number
        thread_color: string | null
        thread_color_code: string | null
      }>()

      for (const row of summaryRows) {
        const plannedCones = row.total_final ?? row.total_cones ?? 0
        if (!row.supplier_id || plannedCones < 1) continue

        const compositeKey = `${row.thread_type_id}_${row.thread_color ?? ''}`

        if (!desiredDeliveryMap.has(compositeKey)) {
          const leadTime = (row.lead_time_days && row.lead_time_days > 0) ? row.lead_time_days : 7
          const deliveryDate = row.delivery_date || (() => {
            const d = new Date()
            d.setDate(d.getDate() + leadTime)
            return d.toISOString().split('T')[0]
          })()

          desiredDeliveryMap.set(compositeKey, {
            week_id: id,
            thread_type_id: row.thread_type_id,
            supplier_id: row.supplier_id!,
            delivery_date: deliveryDate,
            status: 'PENDING',
            quantity_cones: plannedCones,
            thread_color: row.thread_color ?? null,
            thread_color_code: row.thread_color_code ?? null,
          })
        } else {
          const existing = desiredDeliveryMap.get(compositeKey)!
          existing.quantity_cones += plannedCones
        }
      }

      const desiredDeliveryRows = Array.from(desiredDeliveryMap.values())
      const existingCompositeKeys = new Set(
        (existingDeliveries || []).map((d: { thread_type_id: number; thread_color?: string | null }) =>
          `${d.thread_type_id}_${d.thread_color ?? ''}`)
      )

      const newDeliveryRows = desiredDeliveryRows
        .filter((row) => !existingCompositeKeys.has(`${row.thread_type_id}_${row.thread_color ?? ''}`))

      if (newDeliveryRows.length > 0) {
        for (const row of newDeliveryRows) {
          console.info(`[saveResults] Creating delivery for week=${id} thread_type=${row.thread_type_id} color=${row.thread_color}: quantity_cones=${row.quantity_cones}`)
        }

        const { error: deliveryError } = await supabase
          .from('thread_order_deliveries')
          .insert(newDeliveryRows)

        if (deliveryError) {
          console.warn('Error creating delivery records:', deliveryError)
        }
      }

      const existingByCompositeKey = new Map(
        (existingDeliveries || []).map((row: {
          id: number
          thread_type_id: number
          supplier_id: number | null
          delivery_date: string
          status: string
          received_quantity: number | null
          quantity_cones: number | null
          thread_color?: string | null
        }) => [`${row.thread_type_id}_${row.thread_color ?? ''}`, row])
      )

      const rowsToSync = desiredDeliveryRows.filter((row) => {
        const key = `${row.thread_type_id}_${row.thread_color ?? ''}`
        const existing = existingByCompositeKey.get(key)
        if (!existing) return false
        if (existing.status !== 'PENDING') return false
        if ((existing.received_quantity || 0) > 0) return false

        const sameSupplier = (existing.supplier_id ?? null) === (row.supplier_id ?? null)
        const sameQuantity = (existing.quantity_cones ?? 0) === row.quantity_cones
        return !(sameSupplier && sameQuantity)
      })

      if (rowsToSync.length > 0) {
        const nowIso = new Date().toISOString()
        for (const row of rowsToSync) {
          const key = `${row.thread_type_id}_${row.thread_color ?? ''}`
          const existing = existingByCompositeKey.get(key)
          if (!existing) continue

          console.info(`[saveResults] Syncing delivery for week=${id} thread_type=${row.thread_type_id} color=${row.thread_color}: quantity_cones ${existing.quantity_cones ?? 0} -> ${row.quantity_cones}`)

          const { error: syncError } = await supabase
            .from('thread_order_deliveries')
            .update({
              supplier_id: row.supplier_id,
              quantity_cones: row.quantity_cones,
              thread_color: row.thread_color,
              thread_color_code: row.thread_color_code,
              updated_at: nowIso,
            })
            .eq('id', existing.id)

          if (syncError) {
            console.warn('Error syncing existing pending delivery row:', syncError)
          }
        }
      }
    }

    if (isConfirmed && validated.calculation_data && Array.isArray(validated.calculation_data)) {
      const allocationRows: Array<{
        order_id: string
        order_reference: string
        thread_type_id: number
        requested_meters: number
        priority: string
        status: string
      }> = []

      for (const result of validated.calculation_data as Array<{
        style_id: number
        style_code: string
        style_name: string
        calculations: Array<{
          spec_id: number
          process_name: string
          shortage_cones?: number
          is_fully_stocked?: boolean
          meters_per_cone?: number | null
          color_breakdown?: Array<{
            thread_type_id: number
            color_name: string
            total_meters: number
          }>
        }>
      }>) {
        for (const calc of result.calculations) {
          if (calc.is_fully_stocked === true) continue

          const shortageCones = calc.shortage_cones || 0
          if (shortageCones <= 0) continue

          const metersPerCone = calc.meters_per_cone || 0
          if (metersPerCone <= 0) continue

          if (calc.color_breakdown && calc.color_breakdown.length > 0) {
            const threadTypeMap = new Map<number, number>()
            for (const cb of calc.color_breakdown) {
              const cbNeededCones = Math.ceil(cb.total_meters / metersPerCone)
              const current = threadTypeMap.get(cb.thread_type_id) || 0
              threadTypeMap.set(cb.thread_type_id, current + cbNeededCones)
            }

            for (const [threadTypeId, neededCones] of threadTypeMap) {
              const totalCones = [...threadTypeMap.values()].reduce((a, b) => a + b, 0)
              const shortageForThisType = Math.ceil((shortageCones / totalCones) * neededCones)

              if (shortageForThisType > 0) {
                allocationRows.push({
                  order_id: `WO-${id}-${result.style_code}-${calc.spec_id}`,
                  order_reference: `Tuần ${id} - ${result.style_name} - ${calc.process_name}`,
                  thread_type_id: threadTypeId,
                  requested_meters: shortageForThisType * metersPerCone,
                  priority: 'NORMAL',
                  status: 'PENDING',
                  week_id: id,
                } as any)
              }
            }
          }
        }
      }

      if (allocationRows.length > 0) {
        const { error: allocError } = await supabase
          .from('thread_allocations')
          .insert(allocationRows)

        if (allocError) {
          console.warn('Error creating allocation records:', allocError)
        }
      }
    }

    return c.json({ data, error: null, message: 'Lưu kết quả tính toán thành công' })
  } catch (err) {
    console.error('Error saving weekly order results:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

calculation.get('/:id/results', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const { data, error } = await supabase
      .from('thread_order_results')
      .select('*')
      .eq('week_id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ data: null, error: 'Chưa có kết quả tính toán cho tuần này' }, 404)
      }
      throw error
    }

    return c.json({ data, error: null })
  } catch (err) {
    console.error('Error fetching weekly order results:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

calculation.get('/:id/thread-summary-live', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const [summaryResult, reservedResult, pendingResult] = await Promise.all([
      supabase
        .from('thread_order_results')
        .select('summary_data')
        .eq('week_id', id)
        .single(),
      supabase
        .from('thread_inventory')
        .select('thread_type_id')
        .eq('reserved_week_id', id)
        .eq('status', 'RESERVED_FOR_ORDER')
        .limit(5000),
      supabase
        .from('thread_order_deliveries')
        .select('thread_type_id, quantity_cones')
        .eq('week_id', id)
        .eq('status', 'PENDING')
        .limit(1000),
    ])

    if (summaryResult.error) {
      if (summaryResult.error.code === 'PGRST116') {
        return c.json({ data: [], error: null })
      }
      throw summaryResult.error
    }

    const summaryData = (summaryResult.data?.summary_data || []) as Array<{
      thread_type_id: number
      thread_type_name: string
      supplier_name: string
      tex_number: string
      thread_color?: string
      total_cones: number
    }>

    if (!summaryData.length) {
      return c.json({ data: [], error: null })
    }

    const reservedMap = new Map<number, number>()
    for (const row of reservedResult.data || []) {
      reservedMap.set(row.thread_type_id, (reservedMap.get(row.thread_type_id) || 0) + 1)
    }

    const pendingMap = new Map<number, number>()
    for (const row of pendingResult.data || []) {
      pendingMap.set(row.thread_type_id, (pendingMap.get(row.thread_type_id) || 0) + (row.quantity_cones || 0))
    }

    const rows = summaryData.map((row) => {
      const totalCones = row.total_cones || 0
      const reservedCones = reservedMap.get(row.thread_type_id) || 0
      const pendingCones = pendingMap.get(row.thread_type_id) || 0
      return {
        thread_type_id: row.thread_type_id,
        thread_type_name: row.thread_type_name,
        supplier_name: row.supplier_name,
        tex_number: row.tex_number,
        thread_color: row.thread_color || null,
        total_cones: totalCones,
        reserved_cones: reservedCones,
        pending_cones: pendingCones,
        remaining: Math.max(0, totalCones - reservedCones),
      }
    })

    return c.json({ data: rows, error: null })
  } catch (err) {
    console.error('Error fetching thread summary live:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

export default calculation
