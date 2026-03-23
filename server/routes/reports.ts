import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'
import { requirePermission } from '../middleware/auth'
import type { ThreadApiResponse } from '../types/thread'

const reports = new Hono()

reports.use('*', requirePermission('reports.view'))

// Types
interface AllocationReportRow {
  id: number
  order_id: string
  order_reference: string | null
  thread_type_id: number
  thread_type_code: string
  thread_type_name: string
  requested_meters: number
  allocated_meters: number
  fulfillment_rate: number  // percentage 0-100
  status: string
  priority: string
  created_at: string
  soft_at: string | null    // timestamp when status became SOFT
  issued_at: string | null  // timestamp when status became ISSUED
  transition_hours: number | null  // hours from SOFT to ISSUED
}

interface AllocationReportSummary {
  total_allocations: number
  total_requested_meters: number
  total_allocated_meters: number
  overall_fulfillment_rate: number
  avg_transition_hours: number | null
  allocations: AllocationReportRow[]
}

/**
 * GET /api/reports/allocations - Generate allocation report
 * Query params: from_date, to_date, thread_type_id, status
 */
reports.get('/allocations', async (c) => {
  try {
    const fromDate = c.req.query('from_date')
    const toDate = c.req.query('to_date')
    const threadTypeId = c.req.query('thread_type_id')
    const status = c.req.query('status')

    // Build allocation query
    let query = supabase
      .from('thread_allocations')
      .select(`
        id, order_id, order_reference,
        thread_type_id, requested_meters, allocated_meters,
        status, priority, created_at,
        thread_types(code, name)
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (fromDate) {
      query = query.gte('created_at', fromDate)
    }
    if (toDate) {
      query = query.lte('created_at', toDate + 'T23:59:59')
    }
    if (threadTypeId) {
      query = query.eq('thread_type_id', parseInt(threadTypeId))
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data: allocations, error: allocError } = await query

    if (allocError) {
      console.error('Allocation query error:', allocError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải dữ liệu phân bổ',
      }, 500)
    }

    // Get status transition times from audit log
    const allocationIds = (allocations || []).map(a => a.id)
    
    const transitionMap = new Map<number, { soft_at: string | null; issued_at: string | null }>()
    
    if (allocationIds.length > 0) {
      const { data: auditData } = await supabase
        .from('thread_audit_log')
        .select('record_id, old_values, new_values, created_at')
        .eq('table_name', 'thread_allocations')
        .eq('action', 'UPDATE')
        .in('record_id', allocationIds)
        .order('created_at', { ascending: true })

      // Process audit log to find status transitions
      ;(auditData || []).forEach(entry => {
        const recordId = entry.record_id
        const newStatus = entry.new_values?.status
        
        if (!transitionMap.has(recordId)) {
          transitionMap.set(recordId, { soft_at: null, issued_at: null })
        }
        
        const record = transitionMap.get(recordId)!
        
        if (newStatus === 'SOFT' && !record.soft_at) {
          record.soft_at = entry.created_at
        }
        if (newStatus === 'ISSUED' && !record.issued_at) {
          record.issued_at = entry.created_at
        }
      })
    }

    // Build report rows
    let totalRequested = 0
    let totalAllocated = 0
    const transitionTimes: number[] = []

    const reportRows: AllocationReportRow[] = (allocations || []).map(a => {
      const requested = Number(a.requested_meters) || 0
      const allocated = Number(a.allocated_meters) || 0
      const rate = requested > 0 ? Math.round((allocated / requested) * 10000) / 100 : 0
      
      totalRequested += requested
      totalAllocated += allocated

      const transitions = transitionMap.get(a.id)
      let transitionHours: number | null = null
      
      if (transitions?.soft_at && transitions?.issued_at) {
        const softTime = new Date(transitions.soft_at).getTime()
        const issuedTime = new Date(transitions.issued_at).getTime()
        transitionHours = Math.round((issuedTime - softTime) / (1000 * 60 * 60) * 100) / 100
        transitionTimes.push(transitionHours)
      }

      return {
        id: a.id,
        order_id: a.order_id,
        order_reference: a.order_reference,
        thread_type_id: a.thread_type_id,
        thread_type_code: (a.thread_types as any)?.code || '',
        thread_type_name: (a.thread_types as any)?.name || '',
        requested_meters: requested,
        allocated_meters: allocated,
        fulfillment_rate: rate,
        status: a.status,
        priority: a.priority,
        created_at: a.created_at,
        soft_at: transitions?.soft_at || null,
        issued_at: transitions?.issued_at || null,
        transition_hours: transitionHours,
      }
    })

    // Calculate summary
    const overallRate = totalRequested > 0 
      ? Math.round((totalAllocated / totalRequested) * 10000) / 100 
      : 0
    
    const avgTransition = transitionTimes.length > 0
      ? Math.round(transitionTimes.reduce((a, b) => a + b, 0) / transitionTimes.length * 100) / 100
      : null

    const summary: AllocationReportSummary = {
      total_allocations: reportRows.length,
      total_requested_meters: Math.round(totalRequested * 100) / 100,
      total_allocated_meters: Math.round(totalAllocated * 100) / 100,
      overall_fulfillment_rate: overallRate,
      avg_transition_hours: avgTransition,
      allocations: reportRows,
    }

    return c.json<ThreadApiResponse<AllocationReportSummary>>({
      data: summary,
      error: null,
      message: `Đã tạo báo cáo với ${reportRows.length} phân bổ`,
    })

  } catch (err) {
    console.error('Report generation error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống khi tạo báo cáo',
    }, 500)
  }
})

export default reports
