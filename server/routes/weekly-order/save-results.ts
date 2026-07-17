import { Hono } from 'hono'
import { ZodError } from 'zod'
import { queryOne, querySingle, query } from '../../db/query'
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

    const week = await queryOne<{ id: number; status: string }>(
      `SELECT id, status FROM thread_order_weeks WHERE id = $1`,
      [id],
    )

    if (!week) {
      return c.json({ data: null, error: 'Không tìm thấy tuần đặt hàng' }, 404)
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
    let warehouseIds: number[] = []
    if (validated.summary_data && Array.isArray(validated.summary_data)) {
      const summaryRows = validated.summary_data as Array<{
        thread_type_id: number
        total_meters?: number
        meters_per_cone?: number
        [key: string]: unknown
      }>

      const violations: string[] = []
      for (const row of summaryRows) {
        const label = [row.thread_type_name, row.thread_color].filter(Boolean).join(' - ') || `Loại chỉ #${row.thread_type_id}`
        const totalCones = Number(row.total_cones ?? 0)
        const quota = row.quota_cones as number | null | undefined
        if (quota != null && quota > totalCones) {
          violations.push(`${label}: nhu cầu ${quota} vượt nhu cầu tính toán ${totalCones} (chỉ được giảm)`)
        }
        const effectiveDemand = quota != null ? quota : totalCones
        const additional = Number(row.additional_order ?? 0)
        if (additional > 0 && effectiveDemand > 70) {
          violations.push(`${label}: nhu cầu ${effectiveDemand} cuộn vượt 70 nên không được đặt thêm`)
        }
        if (additional > 70) {
          violations.push(`${label}: đặt thêm ${additional} vượt tối đa 70 cuộn`)
        }
        if (additional < 0) {
          violations.push(`${label}: đặt thêm không được âm`)
        }
      }
      if (violations.length > 0) {
        return c.json({ data: null, error: `Dữ liệu không hợp lệ: ${violations.join('; ')}` }, 400)
      }

      const threadTypeIds = [...new Set(summaryRows.map((r) => r.thread_type_id))]

      let threadTypes: Array<{ id: number; meters_per_cone: number | null }> = []
      try {
        threadTypes = await query<{ id: number; meters_per_cone: number | null }>(
          `SELECT id, meters_per_cone FROM thread_types WHERE id = ANY($1) LIMIT $2`,
          [threadTypeIds, threadTypeIds.length],
        )
      } catch (threadError) {
        console.warn('Error fetching thread types for quota calculation:', threadError)
      }

      const metersPerConeMap = new Map<number, number>()
      for (const tt of threadTypes || []) {
        metersPerConeMap.set(tt.id, tt.meters_per_cone || 2000)
      }

      enrichedSummaryData = summaryRows.map((row) => {
        if (!row.meters_per_cone && !metersPerConeMap.has(row.thread_type_id)) {
          console.warn(`Thread type ${row.thread_type_id} has no meters_per_cone, using default 2000`)
        }

        const incomingQuotaCones = (row.quota_cones as number | null | undefined)
        const demandNote = (row.demand_note as string | null | undefined) ?? null

        return {
          ...row,
          quota_cones: incomingQuotaCones != null ? incomingQuotaCones : null,
          demand_note: demandNote,
        }
      })

      const warehouseRows = await query<{ warehouse_id: number }>(
        `SELECT warehouse_id FROM thread_order_week_warehouses WHERE week_id = $1 LIMIT 100`,
        [id],
      )

      warehouseIds = (warehouseRows || []).map((r: { warehouse_id: number }) => r.warehouse_id)
      console.info(`[saveResults] week=${id} warehouseIds=${JSON.stringify(warehouseIds)}`)

      enrichedSummaryData = await enrichWithInventory(
        enrichedSummaryData as Array<{ thread_type_id: number; total_cones: number; [key: string]: unknown }>,
        id,
        {
          preserveAdditionalOrder: true,
          warehouseIds: warehouseIds.length > 0 ? warehouseIds : undefined,
        },
      )
    }

    const data = await querySingle<Record<string, unknown>>(
      `INSERT INTO thread_order_results (week_id, calculation_data, summary_data, calculated_at, warehouse_ids)
       VALUES ($1, $2::jsonb, $3::jsonb, $4, $5)
       ON CONFLICT (week_id) DO UPDATE SET
         calculation_data = EXCLUDED.calculation_data,
         summary_data = EXCLUDED.summary_data,
         calculated_at = EXCLUDED.calculated_at,
         warehouse_ids = EXCLUDED.warehouse_ids
       RETURNING *`,
      [
        id,
        JSON.stringify(validated.calculation_data ?? null),
        JSON.stringify(enrichedSummaryData ?? null),
        new Date().toISOString(),
        warehouseIds,
      ],
    )

    if (isConfirmed && enrichedSummaryData && Array.isArray(enrichedSummaryData)) {
      await syncDeliveries(id, enrichedSummaryData as any)
    }

    if (isConfirmed && validated.calculation_data && Array.isArray(validated.calculation_data)) {
      await createAllocations(id, validated.calculation_data as any)
    }

    return c.json({ data, error: null, message: 'Lưu kết quả tính toán thành công' })
  } catch (err) {
    console.error('Error saving weekly order results:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

export default saveResults
