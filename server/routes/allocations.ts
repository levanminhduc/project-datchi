import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'
import type {
  ThreadApiResponse,
  AllocationRow,
  AllocationStatus,
  AllocationPriority,
  CreateAllocationDTO,
  AllocateThreadResult,
  IssueConeResult,
} from '../types/thread'

const allocations = new Hono()

// ============ HELPER FUNCTIONS ============

/**
 * Calculate priority score based on priority level and age
 * Higher score = higher priority
 * Formula: (priority_value × 10) + age_in_days
 */
function calculatePriorityScore(priority: AllocationPriority, createdAt: Date): number {
  const priorityValues: Record<AllocationPriority, number> = {
    URGENT: 4,
    HIGH: 3,
    NORMAL: 2,
    LOW: 1,
  }
  const ageInDays = Math.floor((Date.now() - createdAt.getTime()) / 86400000)
  return priorityValues[priority] * 10 + ageInDays
}

// ============ TYPES ============

interface AllocationWithRelations extends AllocationRow {
  thread_types?: {
    id: number
    code: string
    name: string
    color: string | null
    color_code: string | null
  }
  thread_allocation_cones?: {
    id: number
    cone_id: number
    allocated_meters: number
    thread_inventory?: {
      cone_id: string
      quantity_meters: number
      status: string
    }
  }[]
}

interface ConflictRow {
  id: number
  thread_type_id: number
  total_requested: number
  total_available: number
  shortage: number
  status: 'PENDING' | 'RESOLVED' | 'ESCALATED'
  resolution_notes: string | null
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
  thread_types?: {
    code: string
    name: string
  }
  allocations?: AllocationRow[]
}

// ============ ROUTES ============

/**
 * GET /api/allocations - List all allocations with filters
 * Query params:
 * - order_id: Filter by order
 * - thread_type_id: Filter by thread type
 * - status: Filter by AllocationStatus
 * - priority: Filter by priority
 */
allocations.get('/', async (c) => {
  try {
    const orderId = c.req.query('order_id')
    const threadTypeId = c.req.query('thread_type_id')
    const status = c.req.query('status') as AllocationStatus | undefined
    const priority = c.req.query('priority') as AllocationPriority | undefined

    let query = supabase
      .from('thread_allocations')
      .select(`
        *,
        thread_types(id, code, name, color, color_code)
      `)
      .order('priority_score', { ascending: false })
      .order('created_at', { ascending: false })

    if (orderId) {
      query = query.eq('order_id', orderId)
    }
    if (threadTypeId) {
      query = query.eq('thread_type_id', parseInt(threadTypeId))
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (priority) {
      query = query.eq('priority', priority)
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải danh sách phân bổ',
      }, 500)
    }

    return c.json<ThreadApiResponse<AllocationWithRelations[]>>({
      data: data as AllocationWithRelations[],
      error: null,
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống',
    }, 500)
  }
})

/**
 * GET /api/allocations/conflicts - Get all active conflicts
 * Must be defined BEFORE /:id to avoid route conflicts
 */
allocations.get('/conflicts', async (c) => {
  try {
    const status = c.req.query('status') || 'PENDING'

    const { data, error } = await supabase
      .from('thread_allocation_conflicts')
      .select(`
        *,
        thread_types(code, name)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải danh sách xung đột',
      }, 500)
    }

    return c.json<ThreadApiResponse<ConflictRow[]>>({
      data: data as ConflictRow[],
      error: null,
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống',
    }, 500)
  }
})

/**
 * GET /api/allocations/:id - Get single allocation with allocated cones
 */
allocations.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')

    // Guard: skip if id matches a known static route name
    if (id === 'conflicts') {
      return c.notFound()
    }

    const parsedId = parseInt(id)
    if (isNaN(parsedId)) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'ID không hợp lệ',
      }, 400)
    }

    const { data, error } = await supabase
      .from('thread_allocations')
      .select(`
        *,
        thread_types(id, code, name, color, color_code),
        thread_allocation_cones(
          id,
          cone_id,
          allocated_meters,
          thread_inventory(cone_id, quantity_meters, status)
        )
      `)
      .eq('id', parsedId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json<ThreadApiResponse<null>>({
          data: null,
          error: 'Không tìm thấy đơn phân bổ',
        }, 404)
      }
      console.error('Supabase error:', error)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải thông tin phân bổ',
      }, 500)
    }

    return c.json<ThreadApiResponse<AllocationWithRelations>>({
      data: data as AllocationWithRelations,
      error: null,
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống',
    }, 500)
  }
})

/**
 * POST /api/allocations - Create new allocation request
 */
allocations.post('/', async (c) => {
  try {
    const body = await c.req.json<CreateAllocationDTO>()

    // Validate required fields
    if (!body.order_id || !body.thread_type_id || !body.requested_meters || !body.priority) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Vui lòng điền đầy đủ thông tin: mã đơn hàng, loại chỉ, số mét yêu cầu và mức ưu tiên',
      }, 400)
    }

    if (body.requested_meters <= 0) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Số mét yêu cầu phải lớn hơn 0',
      }, 400)
    }

    // Verify thread type exists
    const { data: threadType, error: threadError } = await supabase
      .from('thread_types')
      .select('id, is_active')
      .eq('id', body.thread_type_id)
      .single()

    if (threadError || !threadType) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy loại chỉ',
      }, 404)
    }

    if (!threadType.is_active) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Loại chỉ này đã ngừng sử dụng',
      }, 400)
    }

    // Calculate priority score
    const now = new Date()
    const priorityScore = calculatePriorityScore(body.priority, now)

    const insertData = {
      order_id: body.order_id,
      order_reference: body.order_reference || null,
      thread_type_id: body.thread_type_id,
      requested_meters: body.requested_meters,
      allocated_meters: 0,
      status: 'PENDING' as AllocationStatus,
      priority: body.priority,
      priority_score: priorityScore,
      requested_date: now.toISOString(),
      due_date: body.due_date || null,
      notes: body.notes || null,
    }

    const { data, error } = await supabase
      .from('thread_allocations')
      .insert(insertData)
      .select(`
        *,
        thread_types(id, code, name, color, color_code)
      `)
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tạo đơn phân bổ',
      }, 500)
    }

    return c.json<ThreadApiResponse<AllocationWithRelations>>({
      data: data as AllocationWithRelations,
      error: null,
      message: 'Tạo đơn phân bổ thành công',
    }, 201)
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống',
    }, 500)
  }
})

/**
 * POST /api/allocations/:id/execute - Execute soft allocation
 * Calls RPC allocate_thread to perform soft allocation
 */
allocations.post('/:id/execute', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'ID không hợp lệ',
      }, 400)
    }

    // Check if allocation exists and is in correct state
    const { data: allocation, error: fetchError } = await supabase
      .from('thread_allocations')
      .select('id, status, thread_type_id, requested_meters')
      .eq('id', id)
      .single()

    if (fetchError || !allocation) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy đơn phân bổ',
      }, 404)
    }

    if (allocation.status !== 'PENDING') {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Đơn phân bổ đã được thực thi',
      }, 400)
    }

    // Call RPC to allocate thread
    const { data: result, error: rpcError } = await supabase
      .rpc('allocate_thread', {
        p_allocation_id: id,
      })

    if (rpcError) {
      console.error('RPC error:', rpcError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi thực thi phân bổ: ' + rpcError.message,
      }, 500)
    }

    const allocateResult = result as AllocateThreadResult

    if (!allocateResult.success) {
      return c.json<ThreadApiResponse<AllocateThreadResult>>({
        data: allocateResult,
        error: allocateResult.message || 'Không đủ chỉ để phân bổ',
      }, 400)
    }

    // Fetch updated allocation
    const { data: updatedAllocation, error: updateFetchError } = await supabase
      .from('thread_allocations')
      .select(`
        *,
        thread_types(id, code, name, color, color_code),
        thread_allocation_cones(
          id,
          cone_id,
          allocated_meters,
          thread_inventory(cone_id, quantity_meters, status)
        )
      `)
      .eq('id', id)
      .single()

    if (updateFetchError) {
      // Still return success but with the RPC result
      return c.json<ThreadApiResponse<AllocateThreadResult>>({
        data: allocateResult,
        error: null,
        message: allocateResult.message,
      })
    }

    return c.json<ThreadApiResponse<AllocationWithRelations>>({
      data: updatedAllocation as AllocationWithRelations,
      error: null,
      message: allocateResult.message,
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống',
    }, 500)
  }
})

/**
 * POST /api/allocations/:id/issue - Issue allocated cones
 * Calls RPC issue_cone for each allocated cone
 */
allocations.post('/:id/issue', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const body = await c.req.json<{ confirmed_by?: string }>().catch(() => ({ confirmed_by: undefined }))

    if (isNaN(id)) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'ID không hợp lệ',
      }, 400)
    }

    // Check if allocation exists and is in correct state
    const { data: allocation, error: fetchError } = await supabase
      .from('thread_allocations')
      .select(`
        id, 
        status,
        thread_allocation_cones(cone_id)
      `)
      .eq('id', id)
      .single()

    if (fetchError || !allocation) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy đơn phân bổ',
      }, 404)
    }

    if (allocation.status !== 'SOFT' && allocation.status !== 'HARD') {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Đơn phân bổ chưa được thực thi hoặc đã xuất kho',
      }, 400)
    }

    const allocatedCones = (allocation as AllocationWithRelations).thread_allocation_cones || []

    if (allocatedCones.length === 0) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không có cuộn chỉ nào được phân bổ',
      }, 400)
    }

    // Issue each cone using RPC
    const issueResults: IssueConeResult[] = []
    let hasError = false

    for (const cone of allocatedCones) {
      const { data: result, error: rpcError } = await supabase
        .rpc('issue_cone', {
          p_cone_id: cone.cone_id,
          p_allocation_id: id,
          p_confirmed_by: body.confirmed_by || null,
        })

      if (rpcError) {
        console.error('RPC error for cone:', cone.cone_id, rpcError)
        hasError = true
        issueResults.push({
          success: false,
          movement_id: null,
          cone_ids: [cone.cone_id],
          message: rpcError.message,
        })
      } else {
        issueResults.push(result as IssueConeResult)
      }
    }

    // Update allocation status to ISSUED
    if (!hasError) {
      const { error: updateError } = await supabase
        .from('thread_allocations')
        .update({ status: 'ISSUED', updated_at: new Date().toISOString() })
        .eq('id', id)

      if (updateError) {
        console.error('Update error:', updateError)
      }
    }

    // Fetch updated allocation
    const { data: updatedAllocation } = await supabase
      .from('thread_allocations')
      .select(`
        *,
        thread_types(id, code, name, color, color_code),
        thread_allocation_cones(
          id,
          cone_id,
          allocated_meters,
          thread_inventory(cone_id, quantity_meters, status)
        )
      `)
      .eq('id', id)
      .single()

    return c.json<ThreadApiResponse<AllocationWithRelations>>({
      data: updatedAllocation as AllocationWithRelations,
      error: hasError ? 'Một số cuộn chỉ không xuất được' : null,
      message: hasError
        ? `Xuất kho một phần: ${issueResults.filter((r) => r.success).length}/${allocatedCones.length} cuộn`
        : `Xuất kho thành công ${allocatedCones.length} cuộn chỉ`,
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống',
    }, 500)
  }
})

/**
 * POST /api/allocations/:id/cancel - Cancel allocation and release cones
 */
allocations.post('/:id/cancel', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const body = await c.req.json<{ reason?: string }>().catch(() => ({ reason: undefined }))

    if (isNaN(id)) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'ID không hợp lệ',
      }, 400)
    }

    // Check if allocation exists and can be cancelled
    const { data: allocation, error: fetchError } = await supabase
      .from('thread_allocations')
      .select(`
        id, 
        status,
        notes,
        thread_allocation_cones(cone_id)
      `)
      .eq('id', id)
      .single()

    if (fetchError || !allocation) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy đơn phân bổ',
      }, 404)
    }

    if (allocation.status === 'ISSUED') {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không thể hủy đơn phân bổ đã xuất kho',
      }, 400)
    }

    if (allocation.status === 'CANCELLED') {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Đơn phân bổ đã được hủy trước đó',
      }, 400)
    }

    const allocatedCones = (allocation as AllocationWithRelations).thread_allocation_cones || []

    // Release allocated cones back to AVAILABLE status
    if (allocatedCones.length > 0) {
      const coneIds = allocatedCones.map((ac) => ac.cone_id)

      const { error: releaseError } = await supabase
        .from('thread_inventory')
        .update({
          status: 'AVAILABLE',
          updated_at: new Date().toISOString(),
        })
        .in('id', coneIds)
        .in('status', ['SOFT_ALLOCATED', 'HARD_ALLOCATED'])

      if (releaseError) {
        console.error('Release error:', releaseError)
        // Continue with cancellation even if release fails
      }

      // Delete allocation-cone junction records
      const { error: deleteError } = await supabase
        .from('thread_allocation_cones')
        .delete()
        .eq('allocation_id', id)

      if (deleteError) {
        console.error('Delete junction error:', deleteError)
      }
    }

    // Update allocation status
    const cancelNotes = body.reason
      ? `${allocation.notes || ''}\n[Hủy]: ${body.reason}`.trim()
      : allocation.notes

    const { data: updatedAllocation, error: updateError } = await supabase
      .from('thread_allocations')
      .update({
        status: 'CANCELLED',
        allocated_meters: 0,
        notes: cancelNotes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        thread_types(id, code, name, color, color_code)
      `)
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi hủy đơn phân bổ',
      }, 500)
    }

    return c.json<ThreadApiResponse<AllocationWithRelations>>({
      data: updatedAllocation as AllocationWithRelations,
      error: null,
      message: `Đã hủy đơn phân bổ và trả lại ${allocatedCones.length} cuộn chỉ`,
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống',
    }, 500)
  }
})

/**
 * POST /api/allocations/:id/resolve - Resolve conflict by adjusting priority
 */
allocations.post('/:id/resolve', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const body = await c.req.json<{
      new_priority?: AllocationPriority
      resolution_notes?: string
      resolved_by?: string
    }>()

    if (isNaN(id)) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'ID không hợp lệ',
      }, 400)
    }

    // Check if allocation exists
    const { data: allocation, error: fetchError } = await supabase
      .from('thread_allocations')
      .select('id, priority, priority_score, created_at')
      .eq('id', id)
      .single()

    if (fetchError || !allocation) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy đơn phân bổ',
      }, 404)
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    // Update priority if provided
    if (body.new_priority) {
      const newScore = calculatePriorityScore(
        body.new_priority,
        new Date(allocation.created_at)
      )
      updates.priority = body.new_priority
      updates.priority_score = newScore
    }

    const { data: updatedAllocation, error: updateError } = await supabase
      .from('thread_allocations')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        thread_types(id, code, name, color, color_code)
      `)
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi cập nhật ưu tiên',
      }, 500)
    }

    // If there's a related conflict, update it as resolved
    if (body.resolution_notes || body.resolved_by) {
      await supabase
        .from('thread_allocation_conflicts')
        .update({
          status: 'RESOLVED',
          resolution_notes: body.resolution_notes || null,
          resolved_by: body.resolved_by || null,
          resolved_at: new Date().toISOString(),
        })
        .contains('competing_allocation_ids', [id])
        .eq('status', 'PENDING')
    }

    return c.json<ThreadApiResponse<AllocationWithRelations>>({
      data: updatedAllocation as AllocationWithRelations,
      error: null,
      message: body.new_priority
        ? `Đã cập nhật mức ưu tiên thành ${body.new_priority}`
        : 'Đã xử lý xung đột',
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống',
    }, 500)
  }
})

/**
 * POST /api/allocations/conflicts/:id/escalate - Escalate a conflict
 */
allocations.post('/conflicts/:id/escalate', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id) || id <= 0) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'ID không hợp lệ',
      }, 400)
    }

    const { notes } = await c.req.json<{ notes?: string }>()

    // Check conflict exists
    const { data: conflict, error: checkError } = await supabase
      .from('thread_allocation_conflicts')
      .select('*')
      .eq('id', id)
      .single()

    if (checkError || !conflict) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy xung đột',
      }, 404)
    }

    if (conflict.status !== 'PENDING') {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Chỉ có thể leo thang xung đột đang chờ xử lý',
      }, 400)
    }

    // Update conflict status to ESCALATED
    const { data, error } = await supabase
      .from('thread_allocation_conflicts')
      .update({
        status: 'ESCALATED',
        resolution_notes: notes || 'Đã leo thang lên cấp quản lý',
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[Allocations] Escalate conflict error:', error)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không thể leo thang xung đột',
      }, 500)
    }

    return c.json<ThreadApiResponse<ConflictRow>>({
      data: data as ConflictRow,
      error: null,
      message: 'Đã leo thang xung đột thành công',
    })
  } catch (error) {
    console.error('[Allocations] Escalate conflict error:', error)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi server khi leo thang xung đột',
    }, 500)
  }
})

/**
 * POST /api/allocations/:id/split - Split allocation into two
 * Calls RPC split_allocation to atomically split the allocation
 */
allocations.post('/:id/split', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id) || id <= 0) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'ID không hợp lệ',
      }, 400)
    }

    const body = await c.req.json<{ split_meters: number; reason?: string }>()

    if (!body.split_meters || body.split_meters <= 0) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Số mét chia phải lớn hơn 0',
      }, 400)
    }

    // Call RPC to split allocation
    const { data: result, error: rpcError } = await supabase
      .rpc('split_allocation', {
        p_allocation_id: id,
        p_split_meters: body.split_meters,
        p_split_reason: body.reason || null,
      })

    if (rpcError) {
      console.error('[Allocations] Split RPC error:', rpcError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi chia nhỏ phân bổ: ' + rpcError.message,
      }, 500)
    }

    const splitResult = result as {
      success: boolean
      original_allocation_id: number
      new_allocation_id: number | null
      original_meters: number
      split_meters: number
      message: string
    }

    if (!splitResult.success) {
      return c.json<ThreadApiResponse<typeof splitResult>>({
        data: splitResult,
        error: splitResult.message,
      }, 400)
    }

    // Fetch both allocations to return complete data
    const { data: allocations_data } = await supabase
      .from('thread_allocations')
      .select(`
        *,
        thread_types(id, code, name, color, color_code)
      `)
      .in('id', [splitResult.original_allocation_id, splitResult.new_allocation_id])

    return c.json<ThreadApiResponse<{
      original: AllocationWithRelations
      new_allocation: AllocationWithRelations
      result: typeof splitResult
    }>>({
      data: {
        original: allocations_data?.find(a => a.id === splitResult.original_allocation_id) as AllocationWithRelations,
        new_allocation: allocations_data?.find(a => a.id === splitResult.new_allocation_id) as AllocationWithRelations,
        result: splitResult,
      },
      error: null,
      message: splitResult.message,
    })
  } catch (error) {
    console.error('[Allocations] Split error:', error)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi server khi chia nhỏ phân bổ',
    }, 500)
  }
})

/**
 * PUT /api/allocations/:id - Update allocation details
 */
allocations.put('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const body = await c.req.json<Partial<CreateAllocationDTO>>()

    if (isNaN(id)) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'ID không hợp lệ',
      }, 400)
    }

    // Check if allocation exists and can be updated
    const { data: allocation, error: fetchError } = await supabase
      .from('thread_allocations')
      .select('id, status, created_at')
      .eq('id', id)
      .single()

    if (fetchError || !allocation) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy đơn phân bổ',
      }, 404)
    }

    if (allocation.status === 'ISSUED' || allocation.status === 'CANCELLED') {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không thể cập nhật đơn phân bổ đã xuất kho hoặc đã hủy',
      }, 400)
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.order_reference !== undefined) {
      updates.order_reference = body.order_reference
    }
    if (body.requested_meters !== undefined) {
      if (body.requested_meters <= 0) {
        return c.json<ThreadApiResponse<null>>({
          data: null,
          error: 'Số mét yêu cầu phải lớn hơn 0',
        }, 400)
      }
      updates.requested_meters = body.requested_meters
    }
    if (body.priority !== undefined) {
      updates.priority = body.priority
      updates.priority_score = calculatePriorityScore(
        body.priority,
        new Date(allocation.created_at)
      )
    }
    if (body.due_date !== undefined) {
      updates.due_date = body.due_date
    }
    if (body.notes !== undefined) {
      updates.notes = body.notes
    }

    const { data: updatedAllocation, error: updateError } = await supabase
      .from('thread_allocations')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        thread_types(id, code, name, color, color_code)
      `)
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi cập nhật đơn phân bổ',
      }, 500)
    }

    return c.json<ThreadApiResponse<AllocationWithRelations>>({
      data: updatedAllocation as AllocationWithRelations,
      error: null,
      message: 'Cập nhật đơn phân bổ thành công',
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống',
    }, 500)
  }
})

/**
 * DELETE /api/allocations/:id - Delete allocation (only if PENDING)
 */
allocations.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'ID không hợp lệ',
      }, 400)
    }

    // Check if allocation exists and can be deleted
    const { data: allocation, error: fetchError } = await supabase
      .from('thread_allocations')
      .select('id, status')
      .eq('id', id)
      .single()

    if (fetchError || !allocation) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy đơn phân bổ',
      }, 404)
    }

    if (allocation.status !== 'PENDING') {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Chỉ có thể xóa đơn phân bổ đang chờ xử lý. Vui lòng hủy đơn thay vì xóa.',
      }, 400)
    }

    const { error: deleteError } = await supabase
      .from('thread_allocations')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi xóa đơn phân bổ',
      }, 500)
    }

    return c.json<ThreadApiResponse<{ id: number }>>({
      data: { id },
      error: null,
      message: 'Xóa đơn phân bổ thành công',
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống',
    }, 500)
  }
})

export default allocations
