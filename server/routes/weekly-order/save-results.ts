import { Hono } from 'hono'
import { ZodError } from 'zod'
import { supabaseAdmin as supabase } from '../../db/supabase'
import { requirePermission } from '../../middleware/auth'
import { getErrorMessage } from '../../utils/errorHelper'
import { SaveResultsSchema } from '../../validation/weeklyOrder'
import type { AppEnv } from '../../types/hono-env'
import { formatZodError } from './helpers'
import { enrichWithInventory } from './enrich-helper'
import { syncDeliveries, createAllocations } from './save-results-helpers'

const saveResults = new Hono<AppEnv>()

saveResults.post('/:id/results', requirePermission('thread.allocations.manage'), async (c) => {
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
        .limit(threadTypeIds.length)

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

      enrichedSummaryData = await enrichWithInventory(
        enrichedSummaryData as Array<{ thread_type_id: number; total_cones: number; [key: string]: unknown }>,
        id,
        { preserveAdditionalOrder: true },
      )
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
      await syncDeliveries(supabase, id, enrichedSummaryData as any)
    }

    if (isConfirmed && validated.calculation_data && Array.isArray(validated.calculation_data)) {
      await createAllocations(supabase, id, validated.calculation_data as any)
    }

    return c.json({ data, error: null, message: 'Lưu kết quả tính toán thành công' })
  } catch (err) {
    console.error('Error saving weekly order results:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

export default saveResults
