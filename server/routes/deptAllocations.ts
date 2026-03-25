import { Hono } from 'hono'
import { ZodError } from 'zod'
import { supabaseAdmin as supabase } from '../db/supabase'
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

router.use('*', requirePermission('thread.issues.manage'))

function formatZodError(err: ZodError): string {
  return err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
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
    const { data: orderItems, error: oiError } = await supabase
      .from('thread_order_items')
      .select('quantity, thread_order_weeks!inner(status)')
      .eq('po_id', po_id)
      .eq('style_id', style_id)
      .eq('style_color_id', style_color_id)
      .eq('thread_order_weeks.status', 'CONFIRMED')
      .limit(1000)

    if (oiError) throw oiError

    const total_product_quantity = (orderItems ?? []).reduce((sum, r) => sum + (r.quantity ?? 0), 0)

    if (total_product_quantity === 0) {
      return c.json({ data: null, error: 'Chưa có tuần hàng xác nhận cho đơn hàng này' }, 400)
    }

    const { data: allocations, error: allocError } = await supabase
      .from('dept_product_allocations')
      .select('id, department, product_quantity')
      .eq('po_id', po_id)
      .eq('style_id', style_id)
      .eq('style_color_id', style_color_id)
      .is('deleted_at', null)
      .limit(200)

    if (allocError) throw allocError

    const allocationIds = (allocations ?? []).map((a) => a.id)

    const logsCountMap: Record<number, number> = {}
    if (allocationIds.length > 0) {
      const { data: logs, error: logsError } = await supabase
        .from('dept_product_allocation_logs')
        .select('allocation_id')
        .in('allocation_id', allocationIds)
        .limit(5000)

      if (logsError) throw logsError

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
    const { data, error } = await supabase.rpc('fn_dept_allocate', {
      p_po_id: po_id,
      p_style_id: style_id,
      p_style_color_id: style_color_id,
      p_department: department,
      p_add_quantity: add_quantity,
      p_created_by: created_by,
    })

    if (error) {
      const msg = error.message ?? ''
      if (msg.includes('Chua co tuan hang')) {
        return c.json({ data: null, error: 'Chưa có tuần hàng xác nhận cho đơn hàng này' }, 400)
      }
      if (msg.includes('Vuot qua tong san pham')) {
        return c.json({ data: null, error: 'Số lượng vượt quá SP còn lại' }, 400)
      }
      return c.json({ data: null, error: getErrorMessage(error) }, 500)
    }

    return c.json({ data, error: null, message: 'Phân bổ thành công' })
  } catch (err) {
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
    const { data: allocation, error: allocError } = await supabase
      .from('dept_product_allocations')
      .select('id, product_quantity')
      .eq('po_id', po_id)
      .eq('style_id', style_id)
      .eq('style_color_id', style_color_id)
      .eq('department', department)
      .is('deleted_at', null)
      .maybeSingle()

    if (allocError) throw allocError

    if (!allocation) {
      return c.json({ data: null, error: 'Bộ phận này chưa được phân bổ' }, 404)
    }

    const product_quantity = allocation.product_quantity

    const { data: colorSpec, error: specError } = await supabase
      .from('style_color_thread_specs')
      .select('style_thread_spec_id, style_thread_specs:style_thread_spec_id(style_id, meters_per_unit)')
      .eq('style_color_id', style_color_id)
      .eq('thread_type_id', thread_type_id)
      .maybeSingle()

    if (specError) throw specError

    const metersPerUnit = (colorSpec?.style_thread_specs as { meters_per_unit?: number } | null)?.meters_per_unit ?? 0

    const { data: threadType, error: ttError } = await supabase
      .from('thread_types')
      .select('meters_per_cone')
      .eq('id', thread_type_id)
      .maybeSingle()

    if (ttError) throw ttError

    const metersPerCone = Number(threadType?.meters_per_cone ?? 0)
    const quota_cones = metersPerCone > 0
      ? Math.ceil((product_quantity * metersPerUnit) / metersPerCone)
      : 0

    const { data: issueLines, error: ilError } = await supabase
      .from('thread_issue_lines')
      .select('issued_full, issued_partial, returned_full, returned_partial, thread_issues!inner(status, department)')
      .eq('thread_type_id', thread_type_id)
      .eq('po_id', po_id)
      .eq('style_id', style_id)
      .eq('style_color_id', style_color_id)
      .eq('thread_issues.status', 'CONFIRMED')
      .eq('thread_issues.department', department)
      .limit(1000)

    if (ilError) throw ilError

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
    let query = supabase
      .from('dept_product_allocation_logs')
      .select('*, dept_product_allocations!inner(po_id, style_id, style_color_id, department, deleted_at)')
      .eq('dept_product_allocations.po_id', po_id)
      .eq('dept_product_allocations.style_id', style_id)
      .eq('dept_product_allocations.style_color_id', style_color_id)
      .is('dept_product_allocations.deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(500)

    if (department) {
      query = query.eq('dept_product_allocations.department', department)
    }

    const { data, error } = await query

    if (error) throw error

    return c.json({ data: data ?? [], error: null })
  } catch (err) {
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

export default router
