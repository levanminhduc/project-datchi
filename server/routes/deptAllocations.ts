import { Hono } from 'hono'
import { ZodError } from 'zod'
import { query, queryOne } from '../db/query'
import { requirePermission } from '../middleware/auth'
import { getErrorMessage } from '../utils/errorHelper'
import { getPartialConeRatio } from '../utils/settings-helper'
import {
  DeptAllocationSummaryQuerySchema,
  DeptAllocateSchema,
  DeptQuotaQuerySchema,
  DeptLogsQuerySchema,
} from '../validation/deptAllocation'

const router = new Hono()

router.use('*', requirePermission('thread.dept-allocation.manage'))

function formatZodError(err: ZodError): string {
  return err.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
}

const roundToTwoDecimals = (n: number) => Math.round(n * 100) / 100

router.get('/summary', async (c) => {
  let validated: ReturnType<typeof DeptAllocationSummaryQuerySchema.parse>
  try {
    validated = DeptAllocationSummaryQuerySchema.parse(c.req.query())
  } catch (err) {
    if (err instanceof ZodError) return c.json({ data: null, error: formatZodError(err) }, 400)
    throw err
  }

  const { po_id, style_id, style_color_id } = validated

  try {
    const orderItems = await query<{ quantity: number }>(
      `SELECT toi.quantity
       FROM thread_order_items toi
       INNER JOIN thread_order_weeks tow ON tow.id = toi.week_id AND tow.status = 'CONFIRMED'
       WHERE toi.po_id = $1 AND toi.style_id = $2 AND toi.style_color_id = $3
       LIMIT 1000`,
      [po_id, style_id, style_color_id]
    )

    const total_product_quantity = (orderItems ?? []).reduce((sum, r) => sum + (r.quantity ?? 0), 0)

    if (total_product_quantity === 0) {
      return c.json({ data: null, error: 'Chưa có tuần hàng xác nhận cho đơn hàng này' }, 400)
    }

    const allocations = await query<{ id: number; department: string; product_quantity: number }>(
      `SELECT id, department, product_quantity
       FROM dept_product_allocations
       WHERE po_id = $1 AND style_id = $2 AND style_color_id = $3 AND deleted_at IS NULL
       LIMIT 200`,
      [po_id, style_id, style_color_id]
    )

    const allocationIds = (allocations ?? []).map((a) => a.id)

    const logsCountMap: Record<number, number> = {}
    if (allocationIds.length > 0) {
      const logs = await query<{ allocation_id: number }>(
        `SELECT allocation_id FROM dept_product_allocation_logs
         WHERE allocation_id = ANY($1)
         LIMIT 5000`,
        [allocationIds]
      )

      for (const log of logs ?? []) {
        logsCountMap[log.allocation_id] = (logsCountMap[log.allocation_id] ?? 0) + 1
      }
    }

    const allocated = (allocations ?? []).map((a) => ({
      ...a,
      logs_count: logsCountMap[a.id] ?? 0,
    }))

    const total_allocated = allocated.reduce((sum, a) => sum + a.product_quantity, 0)
    const remaining = total_product_quantity - total_allocated

    return c.json({
      data: { total_product_quantity, allocated, total_allocated, remaining },
      error: null,
    })
  } catch (err) {
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

router.post('/allocate', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ data: null, error: 'Body JSON không hợp lệ' }, 400)
  }

  let validated: ReturnType<typeof DeptAllocateSchema.parse>
  try {
    validated = DeptAllocateSchema.parse(body)
  } catch (err) {
    if (err instanceof ZodError) return c.json({ data: null, error: formatZodError(err) }, 400)
    throw err
  }

  const { po_id, style_id, style_color_id, department, add_quantity, created_by } = validated

  try {
    const rows = await query<{ result: unknown }>(
      'SELECT fn_dept_allocate($1, $2, $3, $4, $5, $6) AS result',
      [po_id, style_id, style_color_id, department, add_quantity, created_by]
    )
    const data = rows.length > 0 ? rows[0].result : null

    return c.json({ data, error: null, message: 'Phân bổ thành công' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('Chua co tuan hang')) {
      return c.json({ data: null, error: 'Chưa có tuần hàng xác nhận cho đơn hàng này' }, 400)
    }
    if (msg.includes('Vuot qua tong san pham')) {
      return c.json({ data: null, error: 'Số lượng vượt quá SP còn lại' }, 400)
    }
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

router.get('/department-quota', async (c) => {
  let validated: ReturnType<typeof DeptQuotaQuerySchema.parse>
  try {
    validated = DeptQuotaQuerySchema.parse(c.req.query())
  } catch (err) {
    if (err instanceof ZodError) return c.json({ data: null, error: formatZodError(err) }, 400)
    throw err
  }

  const { po_id, style_id, style_color_id, department, thread_type_id } = validated

  try {
    const allocation = await queryOne<{ id: number; product_quantity: number }>(
      `SELECT id, product_quantity
       FROM dept_product_allocations
       WHERE po_id = $1 AND style_id = $2 AND style_color_id = $3 AND department = $4 AND deleted_at IS NULL`,
      [po_id, style_id, style_color_id, department]
    )

    if (!allocation) {
      return c.json({ data: null, error: 'Bộ phận này chưa được phân bổ' }, 404)
    }

    const product_quantity = allocation.product_quantity

    const colorSpec = await queryOne<{ style_thread_spec_id: number; style_thread_specs: { meters_per_unit?: number } | null }>(
      `SELECT scts.style_thread_spec_id,
         CASE WHEN sts.id IS NULL THEN NULL ELSE json_build_object('style_id', sts.style_id, 'meters_per_unit', sts.meters_per_unit) END AS style_thread_specs
       FROM style_color_thread_specs scts
       LEFT JOIN style_thread_specs sts ON sts.id = scts.style_thread_spec_id
       WHERE scts.style_color_id = $1 AND scts.thread_type_id = $2`,
      [style_color_id, thread_type_id]
    )

    const metersPerUnit = (colorSpec?.style_thread_specs as { meters_per_unit?: number } | null)?.meters_per_unit ?? 0

    const threadType = await queryOne<{ meters_per_cone: number | null }>(
      `SELECT meters_per_cone FROM thread_types WHERE id = $1`,
      [thread_type_id]
    )

    const metersPerCone = Number(threadType?.meters_per_cone ?? 0)
    const quota_cones = metersPerCone > 0
      ? Math.ceil((product_quantity * metersPerUnit) / metersPerCone)
      : 0

    const issueLines = await query<{ issued_full: number | null; issued_partial: number | null; returned_full: number | null; returned_partial: number | null }>(
      `SELECT til.issued_full, til.issued_partial, til.returned_full, til.returned_partial
       FROM thread_issue_lines til
       INNER JOIN thread_issues ti ON ti.id = til.issue_id AND ti.status = 'CONFIRMED' AND ti.department = $6
       WHERE til.thread_type_id = $1 AND til.po_id = $2 AND til.style_id = $3 AND til.style_color_id = $4
       LIMIT $5`,
      [thread_type_id, po_id, style_id, style_color_id, 1000, department]
    )

    const ratio = await getPartialConeRatio()

    const confirmed_issued_cones_net = (issueLines ?? []).reduce((sum, line) => {
      const issued = (line.issued_full ?? 0) + (line.issued_partial ?? 0) * ratio
      const returned = (line.returned_full ?? 0) + (line.returned_partial ?? 0) * ratio
      return sum + (issued - returned)
    }, 0)

    const remaining_quota_cones = Math.max(0, quota_cones - roundToTwoDecimals(confirmed_issued_cones_net))

    return c.json({
      data: {
        product_quantity,
        quota_cones,
        confirmed_issued_cones_net: roundToTwoDecimals(confirmed_issued_cones_net),
        remaining_quota_cones: roundToTwoDecimals(remaining_quota_cones),
      },
      error: null,
    })
  } catch (err) {
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

router.get('/logs', async (c) => {
  let validated: ReturnType<typeof DeptLogsQuerySchema.parse>
  try {
    validated = DeptLogsQuerySchema.parse(c.req.query())
  } catch (err) {
    if (err instanceof ZodError) return c.json({ data: null, error: formatZodError(err) }, 400)
    throw err
  }

  const { po_id, style_id, style_color_id, department } = validated

  try {
    const conditions: string[] = [
      'dpa.po_id = $1',
      'dpa.style_id = $2',
      'dpa.style_color_id = $3',
      'dpa.deleted_at IS NULL',
    ]
    const params: unknown[] = [po_id, style_id, style_color_id]

    if (department) {
      params.push(department)
      conditions.push(`dpa.department = $${params.length}`)
    }

    params.push(500)
    const limitPlaceholder = `$${params.length}`

    const data = await query<Record<string, unknown>>(
      `SELECT dpal.*,
         json_build_object(
           'po_id', dpa.po_id, 'style_id', dpa.style_id, 'style_color_id', dpa.style_color_id,
           'department', dpa.department, 'deleted_at', dpa.deleted_at
         ) AS dept_product_allocations
       FROM dept_product_allocation_logs dpal
       INNER JOIN dept_product_allocations dpa ON dpa.id = dpal.allocation_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY dpal.created_at DESC
       LIMIT ${limitPlaceholder}`,
      params
    )

    return c.json({ data: data ?? [], error: null })
  } catch (err) {
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

export default router
