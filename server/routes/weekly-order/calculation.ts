import { Hono } from 'hono'
import { ZodError } from 'zod'
import { supabaseAdmin as supabase } from '../../db/supabase'
import { requirePermission } from '../../middleware/auth'
import { getErrorMessage } from '../../utils/errorHelper'
import {
  EnrichInventorySchema,
  UpdateQuotaConesSchema,
} from '../../validation/weeklyOrder'
import type { AppEnv } from '../../types/hono-env'
import { formatZodError } from './helpers'
import { enrichWithInventory } from './enrich-helper'
import saveResults from './save-results'
import threadSummaryLive from './thread-summary-live'

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

    const { summary_rows, current_week_id, warehouse_ids } = validated

    const enrichedRows = await enrichWithInventory(summary_rows, current_week_id, {
      warehouseIds: warehouse_ids,
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

calculation.route('/', saveResults)

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

calculation.route('/', threadSummaryLive)

export default calculation
