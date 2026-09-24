import { Hono } from 'hono'
import { ZodError } from 'zod'
import { queryOne, querySingle, query, runOn, tx } from '../../db/query'
import { requirePermission } from '../../middleware/auth'
import { getErrorMessage } from '../../utils/errorHelper'
import { SaveResultsSchema } from '../../validation/weeklyOrder'
import type { AppEnv } from '../../types/hono-env'
import { formatZodError } from './helpers'
import { enrichWithInventory } from './enrich-helper'
import { syncDeliveries } from './save-results-helpers'
import { isRootUnlocked, logWeekAudit, getPerformer } from '../../utils/weekly-order-unlock'

const saveResults = new Hono<AppEnv>()

type SummaryAuditRow = {
  thread_type_id: number
  thread_color_id?: number | null
  thread_color?: string | null
  total_final?: number | null
  quota_cones?: number | null
  additional_order?: number | null
  delivery_date?: string | null
}

type ResultRow = {
  id: number
  summary_data: SummaryAuditRow[] | null
  [key: string]: unknown
}

function pickChangedSummaryRows(before: SummaryAuditRow[], after: SummaryAuditRow[]) {
  const toKey = (r: SummaryAuditRow) => `${r.thread_type_id}_${r.thread_color_id ?? r.thread_color ?? ''}`
  const toAudit = (r: SummaryAuditRow | undefined) =>
    r
      ? {
          total_final: r.total_final ?? null,
          quota_cones: r.quota_cones ?? null,
          additional_order: r.additional_order ?? null,
          delivery_date: r.delivery_date ?? null,
        }
      : null
  const beforeMap = new Map(before.map((r) => [toKey(r), r]))
  const afterMap = new Map(after.map((r) => [toKey(r), r]))
  const oldValues: Record<string, unknown> = {}
  const newValues: Record<string, unknown> = {}
  for (const key of new Set([...beforeMap.keys(), ...afterMap.keys()])) {
    const oldRow = toAudit(beforeMap.get(key))
    const newRow = toAudit(afterMap.get(key))
    if (JSON.stringify(oldRow) === JSON.stringify(newRow)) continue
    oldValues[key] = oldRow
    newValues[key] = newRow
  }
  return { oldValues, newValues }
}

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

    if (week.status !== 'DRAFT' && !isConfirmed) {
      return c.json({ data: null, error: 'Tuần đã hoàn tất hoặc đã huỷ, không thể lưu kết quả' }, 400)
    }

    if (isConfirmed && !(await isRootUnlocked(c, id))) {
      return c.json(
        { data: null, error: 'Tuần đã xác nhận: chỉ tài khoản root đang mở khóa chỉnh sửa mới lưu được' },
        403,
      )
    }

    const officialResults = isConfirmed
      ? await queryOne<ResultRow>(`SELECT id, summary_data FROM thread_order_results WHERE week_id = $1`, [id])
      : null

    if (isConfirmed && !officialResults) {
      return c.json({ data: null, error: 'Chưa có kết quả chính thức của tuần này' }, 404)
    }

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
          frozenInventoryRows: isConfirmed
            ? ((officialResults?.summary_data ?? []) as Array<{ thread_type_id: number; total_cones: number; [key: string]: unknown }>)
            : undefined,
        },
      )
    }

    if (isConfirmed) {
      const draft = await querySingle<Record<string, unknown>>(
        `UPDATE thread_order_results
         SET draft_summary_data = $2::jsonb, draft_saved_at = NOW(), draft_saved_by = $3, updated_at = NOW()
         WHERE week_id = $1
         RETURNING *`,
        [id, JSON.stringify(enrichedSummaryData ?? []), getPerformer(c)],
      )
      return c.json({
        data: draft,
        error: null,
        message: 'Đã lưu bản tạm. Bấm "Áp dụng chính thức" để cập nhật số giao NCC',
      })
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

    return c.json({ data, error: null, message: 'Lưu kết quả tính toán thành công' })
  } catch (err) {
    console.error('Error saving weekly order results:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

saveResults.post('/:id/results/apply', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    if (!(await isRootUnlocked(c, id))) {
      return c.json(
        { data: null, error: 'Chỉ tài khoản root đang mở khóa chỉnh sửa mới áp dụng được' },
        403,
      )
    }

    const performer = getPerformer(c)
    const outcome = await tx(async (client) => {
      const weeks = await runOn<{ status: string }>(
        client,
        `SELECT status FROM thread_order_weeks WHERE id = $1 FOR UPDATE`,
        [id],
      )
      if (weeks.length === 0) return { status: 404 as const, error: 'Không tìm thấy tuần đặt hàng' }
      if (weeks[0].status !== 'CONFIRMED') {
        return { status: 400 as const, error: 'Chỉ áp dụng được cho tuần đã xác nhận' }
      }

      const current = await runOn<ResultRow & { draft_summary_data: SummaryAuditRow[] | null }>(
        client,
        `SELECT id, summary_data, draft_summary_data FROM thread_order_results WHERE week_id = $1 FOR UPDATE`,
        [id],
      )
      if (current.length === 0 || !current[0].draft_summary_data) {
        return { status: 400 as const, error: 'Không có bản lưu tạm để áp dụng' }
      }

      const updated = await runOn<ResultRow>(
        client,
        `UPDATE thread_order_results
         SET summary_data = draft_summary_data,
             draft_summary_data = NULL, draft_saved_at = NULL, draft_saved_by = NULL,
             updated_at = NOW()
         WHERE week_id = $1
         RETURNING *`,
        [id],
      )
      const applied = updated[0]

      await syncDeliveries(id, applied.summary_data ?? [], client)

      const { oldValues, newValues } = pickChangedSummaryRows(
        current[0].summary_data ?? [],
        applied.summary_data ?? [],
      )
      await logWeekAudit(
        {
          weekId: id,
          tableName: 'thread_order_results',
          recordId: applied.id,
          action: 'UPDATE',
          oldValues,
          newValues,
          performedBy: performer,
        },
        client,
      )

      return { status: 200 as const, data: applied }
    })

    if (outcome.status !== 200) {
      return c.json({ data: null, error: outcome.error }, outcome.status)
    }
    return c.json({ data: outcome.data, error: null, message: 'Đã áp dụng chính thức và cập nhật số giao NCC' })
  } catch (err) {
    console.error('[save-results] apply draft failed:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

saveResults.post('/:id/results/discard-draft', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    if (!(await isRootUnlocked(c, id))) {
      return c.json(
        { data: null, error: 'Chỉ tài khoản root đang mở khóa chỉnh sửa mới huỷ được bản tạm' },
        403,
      )
    }

    const data = await queryOne<Record<string, unknown>>(
      `UPDATE thread_order_results
       SET draft_summary_data = NULL, draft_saved_at = NULL, draft_saved_by = NULL, updated_at = NOW()
       WHERE week_id = $1
       RETURNING *`,
      [id],
    )
    if (!data) {
      return c.json({ data: null, error: 'Chưa có kết quả tính toán cho tuần này' }, 404)
    }
    return c.json({ data, error: null, message: 'Đã huỷ bản lưu tạm' })
  } catch (err) {
    console.error('[save-results] discard draft failed:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

export default saveResults
