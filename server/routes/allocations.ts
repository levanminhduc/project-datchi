import { Hono } from 'hono'
import { query, queryOne } from '../db/query'
import { getErrorMessage } from '../utils/errorHelper'
import { requirePermission } from '../middleware/auth'
import { createNotification, broadcastNotification, getWarehouseEmployeeIds } from '../utils/notificationService'
import type {
  ThreadApiResponse,
  AllocationRow,
  AllocationStatus,
  AllocationPriority,
  CreateAllocationDTO,
  AllocateThreadResult,
  IssueConeResult,
  ApproveRequestDTO,
  RejectRequestDTO,
  MarkReadyDTO,
  ConfirmReceiptDTO,
  WorkflowStatusFilter,
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
  }
  requesting_warehouse?: {
    id: number
    code: string
    name: string
  }
  source_warehouse?: {
    id: number
    code: string
    name: string
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

// ============ SHARED SQL FRAGMENTS ============

// Embed: thread_types(id, code, name) + requesting/source warehouses (to-one → LEFT JOIN + json_build_object)
const ALLOCATION_EMBED_SELECT = `
  ta.*,
  CASE WHEN tt.id IS NULL THEN NULL
       ELSE json_build_object('id', tt.id, 'code', tt.code, 'name', tt.name) END AS thread_types,
  CASE WHEN rw.id IS NULL THEN NULL
       ELSE json_build_object('id', rw.id, 'code', rw.code, 'name', rw.name) END AS requesting_warehouse,
  CASE WHEN sw.id IS NULL THEN NULL
       ELSE json_build_object('id', sw.id, 'code', sw.code, 'name', sw.name) END AS source_warehouse`

const ALLOCATION_EMBED_FROM = `
  FROM thread_allocations ta
  LEFT JOIN thread_types tt ON tt.id = ta.thread_type_id
  LEFT JOIN warehouses rw ON rw.id = ta.requesting_warehouse_id
  LEFT JOIN warehouses sw ON sw.id = ta.source_warehouse_id`

// to-many junction embed: thread_allocation_cones → thread_inventory (FK cone_id → thread_inventory.id)
const ALLOCATION_CONES_SELECT = `,
  COALESCE((
    SELECT json_agg(json_build_object(
      'id', tac.id,
      'cone_id', tac.cone_id,
      'allocated_meters', tac.allocated_meters,
      'thread_inventory', CASE WHEN ti.id IS NULL THEN NULL
        ELSE json_build_object('cone_id', ti.cone_id, 'quantity_meters', ti.quantity_meters, 'status', ti.status) END
    ))
    FROM thread_allocation_cones tac
    LEFT JOIN thread_inventory ti ON ti.id = tac.cone_id
    WHERE tac.allocation_id = ta.id
  ), '[]'::json) AS thread_allocation_cones`

// ============ ROUTES ============

/**
 * GET /api/allocations - List all allocations with filters
 * Query params:
 * - order_id: Filter by order
 * - thread_type_id: Filter by thread type
 * - status: Filter by AllocationStatus
 * - priority: Filter by priority
 * - requesting_warehouse_id: Filter by requesting workshop
 * - source_warehouse_id: Filter by source warehouse
 * - workflow_status: Filter by workflow stage (pending_approval, pending_preparation, pending_pickup, completed)
 * - is_request: If true, only return allocations with requesting_warehouse_id
 */
allocations.get('/', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const orderId = c.req.query('order_id')
    const threadTypeId = c.req.query('thread_type_id')
    const status = c.req.query('status') as AllocationStatus | undefined
    const priority = c.req.query('priority') as AllocationPriority | undefined
    const requestingWarehouseId = c.req.query('requesting_warehouse_id')
    const sourceWarehouseId = c.req.query('source_warehouse_id')
    const workflowStatus = c.req.query('workflow_status') as WorkflowStatusFilter | undefined
    const isRequest = c.req.query('is_request')

    const conditions: string[] = []
    const params: unknown[] = []

    if (orderId) {
      params.push(orderId)
      conditions.push(`ta.order_id = $${params.length}`)
    }
    if (threadTypeId) {
      params.push(parseInt(threadTypeId))
      conditions.push(`ta.thread_type_id = $${params.length}`)
    }
    if (status) {
      params.push(status)
      conditions.push(`ta.status = $${params.length}`)
    }
    if (priority) {
      params.push(priority)
      conditions.push(`ta.priority = $${params.length}`)
    }
    if (requestingWarehouseId) {
      params.push(parseInt(requestingWarehouseId))
      conditions.push(`ta.requesting_warehouse_id = $${params.length}`)
    }
    if (sourceWarehouseId) {
      params.push(parseInt(sourceWarehouseId))
      conditions.push(`ta.source_warehouse_id = $${params.length}`)
    }
    if (isRequest === 'true') {
      conditions.push('ta.requesting_warehouse_id IS NOT NULL')
    }

    // Workflow status filter
    if (workflowStatus === 'pending_approval') {
      params.push('PENDING')
      conditions.push(`ta.status = $${params.length}`)
      conditions.push('ta.requesting_warehouse_id IS NOT NULL')
    } else if (workflowStatus === 'pending_preparation') {
      params.push('APPROVED')
      conditions.push(`ta.status = $${params.length}`)
    } else if (workflowStatus === 'pending_pickup') {
      params.push('READY_FOR_PICKUP')
      conditions.push(`ta.status = $${params.length}`)
    } else if (workflowStatus === 'completed') {
      conditions.push(`ta.status = ANY($${params.length + 1})`)
      params.push(['RECEIVED', 'ISSUED'])
    }

    const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : ''

    const data = await query<Record<string, unknown>>(
      `SELECT ${ALLOCATION_EMBED_SELECT} ${ALLOCATION_EMBED_FROM}${whereClause}
       ORDER BY ta.priority_score DESC, ta.created_at DESC`,
      params
    )

    return c.json<ThreadApiResponse<AllocationWithRelations[]>>({
      data: data as unknown as AllocationWithRelations[],
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
allocations.get('/conflicts', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const status = c.req.query('status') || 'PENDING'

    const data = await query<Record<string, unknown>>(
      `SELECT tc.*,
         CASE WHEN tt.id IS NULL THEN NULL
              ELSE json_build_object('code', tt.code, 'name', tt.name) END AS thread_types
       FROM thread_conflicts tc
       LEFT JOIN thread_types tt ON tt.id = tc.thread_type_id
       WHERE tc.status = $1
       ORDER BY tc.created_at DESC`,
      [status]
    )

    return c.json<ThreadApiResponse<ConflictRow[]>>({
      data: data as unknown as ConflictRow[],
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
allocations.get('/:id', requirePermission('thread.allocations.view'), async (c) => {
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

    const data = await queryOne<Record<string, unknown>>(
      `SELECT ${ALLOCATION_EMBED_SELECT}${ALLOCATION_CONES_SELECT} ${ALLOCATION_EMBED_FROM}
       WHERE ta.id = $1`,
      [parsedId]
    )

    if (!data) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy đơn phân bổ',
      }, 404)
    }

    return c.json<ThreadApiResponse<AllocationWithRelations>>({
      data: data as unknown as AllocationWithRelations,
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
allocations.post('/', requirePermission('thread.allocations.manage'), async (c) => {
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
    const threadType = await queryOne<{ id: number; is_active: boolean }>(
      'SELECT id, is_active FROM thread_types WHERE id = $1',
      [body.thread_type_id]
    )

    if (!threadType) {
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

    // Validate requesting warehouse if provided
    if (body.requesting_warehouse_id) {
      const reqWarehouse = await queryOne<{ id: number; type: string }>(
        'SELECT id, type FROM warehouses WHERE id = $1',
        [body.requesting_warehouse_id]
      )

      if (!reqWarehouse) {
        return c.json<ThreadApiResponse<null>>({
          data: null,
          error: 'Không tìm thấy xưởng yêu cầu',
        }, 404)
      }

      if (reqWarehouse.type !== 'STORAGE') {
        return c.json<ThreadApiResponse<null>>({
          data: null,
          error: 'Xưởng yêu cầu phải là kho lưu trữ (STORAGE)',
        }, 400)
      }
    }

    // Validate source warehouse if provided
    if (body.source_warehouse_id) {
      const srcWarehouse = await queryOne<{ id: number; type: string }>(
        'SELECT id, type FROM warehouses WHERE id = $1',
        [body.source_warehouse_id]
      )

      if (!srcWarehouse) {
        return c.json<ThreadApiResponse<null>>({
          data: null,
          error: 'Không tìm thấy kho nguồn',
        }, 404)
      }

      if (srcWarehouse.type !== 'STORAGE') {
        return c.json<ThreadApiResponse<null>>({
          data: null,
          error: 'Kho nguồn phải là kho lưu trữ (STORAGE)',
        }, 400)
      }
    }

    // Calculate priority score
    const now = new Date()
    const priorityScore = calculatePriorityScore(body.priority, now)

    const inserted = await queryOne<{ id: number }>(
      `INSERT INTO thread_allocations (
         order_id, order_reference, thread_type_id, requested_meters, allocated_meters,
         status, priority, priority_score, requested_date, due_date, notes,
         requesting_warehouse_id, source_warehouse_id, requested_by
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING id`,
      [
        body.order_id,
        body.order_reference || null,
        body.thread_type_id,
        body.requested_meters,
        0,
        'PENDING',
        body.priority,
        priorityScore,
        now.toISOString(),
        body.due_date || null,
        body.notes || null,
        body.requesting_warehouse_id || null,
        body.source_warehouse_id || null,
        body.requested_by || null,
      ]
    )

    const data = await queryOne<Record<string, unknown>>(
      `SELECT ${ALLOCATION_EMBED_SELECT} ${ALLOCATION_EMBED_FROM}
       WHERE ta.id = $1`,
      [inserted!.id]
    )

    return c.json<ThreadApiResponse<AllocationWithRelations>>({
      data: data as unknown as AllocationWithRelations,
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
allocations.post('/:id/execute', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'ID không hợp lệ',
      }, 400)
    }

    // Check if allocation exists and is in correct state
    const allocation = await queryOne<{ id: number; status: string; thread_type_id: number; requested_meters: number; week_id: number | null }>(
      'SELECT id, status, thread_type_id, requested_meters, week_id FROM thread_allocations WHERE id = $1',
      [id]
    )

    if (!allocation) {
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
    let allocateResult: AllocateThreadResult
    try {
      const rows = await query<{ result: AllocateThreadResult }>(
        'SELECT fn_allocate_thread(p_allocation_id => $1, p_week_id => $2) AS result',
        [id, allocation.week_id || null]
      )
      allocateResult = rows[0].result
    } catch (rpcError) {
      console.error('RPC error:', rpcError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi thực thi phân bổ: ' + getErrorMessage(rpcError),
      }, 500)
    }

    if (!allocateResult.success) {
      return c.json<ThreadApiResponse<AllocateThreadResult>>({
        data: allocateResult,
        error: allocateResult.message || 'Không đủ chỉ để phân bổ',
      }, 400)
    }

    // Fetch updated allocation
    const updatedAllocation = await queryOne<Record<string, unknown>>(
      `SELECT ${ALLOCATION_EMBED_SELECT}${ALLOCATION_CONES_SELECT} ${ALLOCATION_EMBED_FROM}
       WHERE ta.id = $1`,
      [id]
    )

    if (!updatedAllocation) {
      // Still return success but with the RPC result
      return c.json<ThreadApiResponse<AllocateThreadResult>>({
        data: allocateResult,
        error: null,
        message: allocateResult.message,
      })
    }

    return c.json<ThreadApiResponse<AllocationWithRelations>>({
      data: updatedAllocation as unknown as AllocationWithRelations,
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

// ============ REQUEST WORKFLOW ENDPOINTS ============

/**
 * POST /api/allocations/:id/approve - Approve a pending request
 * Transitions: PENDING → APPROVED
 */
allocations.post('/:id/approve', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const body = await c.req.json<ApproveRequestDTO>()

    if (isNaN(id)) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'ID không hợp lệ',
      }, 400)
    }

    if (!body.approved_by) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Vui lòng cung cấp thông tin người duyệt',
      }, 400)
    }

    // Check allocation exists and is pending
    const allocation = await queryOne<{ id: number; status: string; requesting_warehouse_id: number | null }>(
      'SELECT id, status, requesting_warehouse_id FROM thread_allocations WHERE id = $1',
      [id]
    )

    if (!allocation) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy yêu cầu',
      }, 404)
    }

    if (allocation.status !== 'PENDING') {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Yêu cầu đã được xử lý',
      }, 400)
    }

    // Update to APPROVED
    const nowIso = new Date().toISOString()
    const updated = await queryOne<Record<string, unknown>>(
      `WITH upd AS (
         UPDATE thread_allocations
         SET status = 'APPROVED', approved_by = $1, approved_at = $2, updated_at = $2
         WHERE id = $3
         RETURNING *
       )
       SELECT ${ALLOCATION_EMBED_SELECT} FROM upd ta
       LEFT JOIN thread_types tt ON tt.id = ta.thread_type_id
       LEFT JOIN warehouses rw ON rw.id = ta.requesting_warehouse_id
       LEFT JOIN warehouses sw ON sw.id = ta.source_warehouse_id`,
      [body.approved_by, nowIso, id]
    )

    if (!updated) {
      console.error('Update error: allocation not found after update')
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi duyệt yêu cầu',
      }, 500)
    }

    if (allocation.requesting_warehouse_id && updated) {
      const reqBy = (updated as unknown as AllocationWithRelations).requested_by
      if (reqBy) {
        const emp = await queryOne<{ id: number }>(
          'SELECT id FROM employees WHERE employee_id = $1',
          [reqBy]
        )
        if (emp) {
          createNotification({
            employeeId: emp.id,
            type: 'ALLOCATION',
            title: `Yêu cầu phân bổ #${id} đã được duyệt`,
            actionUrl: '/thread/allocations',
          }).catch(() => {})
        }
      }
    }

    return c.json<ThreadApiResponse<AllocationWithRelations>>({
      data: updated as unknown as AllocationWithRelations,
      error: null,
      message: 'Đã duyệt yêu cầu',
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
 * POST /api/allocations/:id/reject - Reject a pending request
 * Transitions: PENDING → REJECTED
 */
allocations.post('/:id/reject', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const body = await c.req.json<RejectRequestDTO>()

    if (isNaN(id)) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'ID không hợp lệ',
      }, 400)
    }

    if (!body.rejected_by || !body.reason) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Vui lòng cung cấp người từ chối và lý do',
      }, 400)
    }

    // Check allocation exists and is pending
    const allocation = await queryOne<{ id: number; status: string; requested_by: string | null }>(
      'SELECT id, status, requested_by FROM thread_allocations WHERE id = $1',
      [id]
    )

    if (!allocation) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy yêu cầu',
      }, 404)
    }

    if (allocation.status !== 'PENDING') {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Yêu cầu đã được xử lý',
      }, 400)
    }

    // Update to REJECTED
    const nowIso = new Date().toISOString()
    const updated = await queryOne<Record<string, unknown>>(
      `WITH upd AS (
         UPDATE thread_allocations
         SET status = 'REJECTED', approved_by = $1, approved_at = $2, rejection_reason = $3, updated_at = $2
         WHERE id = $4
         RETURNING *
       )
       SELECT ${ALLOCATION_EMBED_SELECT} FROM upd ta
       LEFT JOIN thread_types tt ON tt.id = ta.thread_type_id
       LEFT JOIN warehouses rw ON rw.id = ta.requesting_warehouse_id
       LEFT JOIN warehouses sw ON sw.id = ta.source_warehouse_id`,
      [body.rejected_by, nowIso, body.reason, id]
    )

    if (!updated) {
      console.error('Update error: allocation not found after update')
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi từ chối yêu cầu',
      }, 500)
    }

    if (allocation.requested_by) {
      const emp = await queryOne<{ id: number }>(
        'SELECT id FROM employees WHERE employee_id = $1',
        [allocation.requested_by]
      )
      if (emp) {
        createNotification({
          employeeId: emp.id,
          type: 'ALLOCATION',
          title: `Yêu cầu phân bổ #${id} đã bị từ chối`,
          body: body.reason,
          actionUrl: '/thread/allocations',
        }).catch(() => {})
      }
    }

    return c.json<ThreadApiResponse<AllocationWithRelations>>({
      data: updated as unknown as AllocationWithRelations,
      error: null,
      message: 'Đã từ chối yêu cầu',
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
 * POST /api/allocations/:id/ready - Mark as ready for pickup
 * Transitions: APPROVED → READY_FOR_PICKUP
 * Also executes soft allocation to reserve cones
 */
allocations.post('/:id/ready', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    // Parse body but don't use it for now (prepared_by is optional)
    await c.req.json<MarkReadyDTO>().catch(() => ({}))

    if (isNaN(id)) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'ID không hợp lệ',
      }, 400)
    }

    // Check allocation exists and is approved
    const allocation = await queryOne<{ id: number; status: string; week_id: number | null }>(
      'SELECT id, status, week_id FROM thread_allocations WHERE id = $1',
      [id]
    )

    if (!allocation) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy yêu cầu',
      }, 404)
    }

    if (allocation.status !== 'APPROVED') {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Yêu cầu chưa được duyệt hoặc đã xử lý',
      }, 400)
    }

    // Execute soft allocation
    let allocateResult: AllocateThreadResult
    try {
      const rows = await query<{ result: AllocateThreadResult }>(
        'SELECT fn_allocate_thread(p_allocation_id => $1, p_week_id => $2) AS result',
        [id, allocation.week_id || null]
      )
      allocateResult = rows[0].result
    } catch (rpcError) {
      console.error('RPC error:', rpcError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi phân bổ chỉ: ' + getErrorMessage(rpcError),
      }, 500)
    }

    if (!allocateResult.success) {
      return c.json<ThreadApiResponse<AllocateThreadResult>>({
        data: allocateResult,
        error: allocateResult.message || 'Không đủ chỉ để chuẩn bị',
      }, 400)
    }

    // Update status to READY_FOR_PICKUP
    await query(
      `UPDATE thread_allocations SET status = 'READY_FOR_PICKUP', updated_at = $1 WHERE id = $2`,
      [new Date().toISOString(), id]
    )

    const updated = await queryOne<Record<string, unknown>>(
      `SELECT ${ALLOCATION_EMBED_SELECT}${ALLOCATION_CONES_SELECT} ${ALLOCATION_EMBED_FROM}
       WHERE ta.id = $1`,
      [id]
    )

    if (!updated) {
      console.error('Update error: allocation not found after update')
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi cập nhật trạng thái',
      }, 500)
    }

    return c.json<ThreadApiResponse<AllocationWithRelations>>({
      data: updated as unknown as AllocationWithRelations,
      error: null,
      message: 'Đã chuẩn bị xong, sẵn sàng để nhận',
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
 * POST /api/allocations/:id/receive - Confirm receipt at workshop
 * Transitions: READY_FOR_PICKUP → RECEIVED
 * Also issues the cones
 */
allocations.post('/:id/receive', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const body = await c.req.json<ConfirmReceiptDTO>()

    if (isNaN(id)) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'ID không hợp lệ',
      }, 400)
    }

    if (!body.received_by) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Vui lòng cung cấp thông tin người nhận',
      }, 400)
    }

    // Check allocation exists and is ready for pickup
    const allocation = await queryOne<{ id: number; status: string; thread_allocation_cones: { cone_id: number }[] }>(
      `SELECT ta.id, ta.status,
         COALESCE((
           SELECT json_agg(json_build_object('cone_id', tac.cone_id))
           FROM thread_allocation_cones tac WHERE tac.allocation_id = ta.id
         ), '[]'::json) AS thread_allocation_cones
       FROM thread_allocations ta
       WHERE ta.id = $1`,
      [id]
    )

    if (!allocation) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy yêu cầu',
      }, 404)
    }

    if (allocation.status !== 'READY_FOR_PICKUP') {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Yêu cầu chưa sẵn sàng để nhận hoặc đã được nhận',
      }, 400)
    }

    const allocatedCones = (allocation as unknown as AllocationWithRelations).thread_allocation_cones || []

    let hasError = false
    try {
      await query(
        'SELECT fn_issue_cone(p_allocation_id => $1, p_confirmed_by => $2) AS result',
        [id, body.received_by]
      )
    } catch (rpcError) {
      hasError = true
      console.error('RPC error for allocation:', id, rpcError)
    }

    // Update status to RECEIVED
    const nowIso = new Date().toISOString()
    const updated = await queryOne<Record<string, unknown>>(
      `WITH upd AS (
         UPDATE thread_allocations
         SET status = 'RECEIVED', received_by = $1, received_at = $2, updated_at = $2
         WHERE id = $3
         RETURNING *
       )
       SELECT ${ALLOCATION_EMBED_SELECT}${ALLOCATION_CONES_SELECT} FROM upd ta
       LEFT JOIN thread_types tt ON tt.id = ta.thread_type_id
       LEFT JOIN warehouses rw ON rw.id = ta.requesting_warehouse_id
       LEFT JOIN warehouses sw ON sw.id = ta.source_warehouse_id`,
      [body.received_by, nowIso, id]
    )

    if (!updated) {
      console.error('Update error: allocation not found after update')
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi xác nhận nhận hàng',
      }, 500)
    }

    return c.json<ThreadApiResponse<AllocationWithRelations>>({
      data: updated as unknown as AllocationWithRelations,
      error: hasError ? 'Một số cuộn chỉ không xuất được' : null,
      message: `Đã xác nhận nhận ${allocatedCones.length} cuộn chỉ`,
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
allocations.post('/:id/issue', requirePermission('thread.allocations.manage'), async (c) => {
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
    const allocation = await queryOne<{
      id: number
      status: string
      thread_allocation_cones: { cone_id: number }[]
    }>(
      `SELECT ta.id, ta.status,
        COALESCE((
          SELECT json_agg(json_build_object('cone_id', tac.cone_id))
          FROM thread_allocation_cones tac
          WHERE tac.allocation_id = ta.id
        ), '[]'::json) AS thread_allocation_cones
       FROM thread_allocations ta
       WHERE ta.id = $1`,
      [id]
    )

    if (!allocation) {
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

    const allocatedCones = allocation.thread_allocation_cones || []

    if (allocatedCones.length === 0) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không có cuộn chỉ nào được phân bổ',
      }, 400)
    }

    const issueResults: IssueConeResult[] = []
    let hasError = false

    try {
      const rows = await query<{ result: IssueConeResult }>(
        'SELECT fn_issue_cone(p_allocation_id => $1, p_confirmed_by => $2) AS result',
        [id, body.confirmed_by || null]
      )
      issueResults.push(rows[0]?.result as IssueConeResult)
    } catch (rpcError) {
      console.error('RPC error for allocation:', id, rpcError)
      hasError = true
      issueResults.push({
        success: false,
        movement_id: null,
        cone_ids: allocatedCones.map((ac) => ac.cone_id),
        message: getErrorMessage(rpcError),
      })
    }

    // Update allocation status to ISSUED
    if (!hasError) {
      try {
        await query(
          'UPDATE thread_allocations SET status = $1, updated_at = $2 WHERE id = $3',
          ['ISSUED', new Date().toISOString(), id]
        )
      } catch (updateError) {
        console.error('Update error:', updateError)
      }
    }

    // Fetch updated allocation
    const updatedAllocation = await queryOne<AllocationWithRelations>(
      `SELECT ${ALLOCATION_EMBED_SELECT}${ALLOCATION_CONES_SELECT}
       ${ALLOCATION_EMBED_FROM}
       WHERE ta.id = $1`,
      [id]
    )

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
allocations.post('/:id/cancel', requirePermission('thread.allocations.manage'), async (c) => {
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
    const allocation = await queryOne<{
      id: number
      status: string
      notes: string | null
      thread_allocation_cones: { cone_id: number }[]
    }>(
      `SELECT ta.id, ta.status, ta.notes,
        COALESCE((
          SELECT json_agg(json_build_object('cone_id', tac.cone_id))
          FROM thread_allocation_cones tac
          WHERE tac.allocation_id = ta.id
        ), '[]'::json) AS thread_allocation_cones
       FROM thread_allocations ta
       WHERE ta.id = $1`,
      [id]
    )

    if (!allocation) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy đơn phân bổ',
      }, 404)
    }

    // Cannot cancel after pickup preparation or receipt
    const nonCancellableStatuses = ['ISSUED', 'READY_FOR_PICKUP', 'RECEIVED']
    if (nonCancellableStatuses.includes(allocation.status)) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không thể hủy đơn phân bổ đã chuẩn bị hoặc đã xuất kho',
      }, 400)
    }

    if (allocation.status === 'CANCELLED') {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Đơn phân bổ đã được hủy trước đó',
      }, 400)
    }

    const allocatedCones = allocation.thread_allocation_cones || []

    // Release allocated cones - use fn_restore_reservation to restore RESERVED_FOR_ORDER if applicable
    if (allocatedCones.length > 0) {
      const coneIds = allocatedCones.map((ac) => ac.cone_id)

      for (const coneId of coneIds) {
        try {
          await query('SELECT fn_restore_reservation(p_cone_id => $1) AS result', [coneId])
        } catch (restoreError) {
          console.error('Restore reservation error for cone', coneId, ':', restoreError)
        }
      }

      // Delete allocation-cone junction records
      try {
        await query('DELETE FROM thread_allocation_cones WHERE allocation_id = $1', [id])
      } catch (deleteError) {
        console.error('Delete junction error:', deleteError)
      }
    }

    // Update allocation status
    const cancelNotes = body.reason
      ? `${allocation.notes || ''}\n[Hủy]: ${body.reason}`.trim()
      : allocation.notes

    let updatedAllocation: AllocationWithRelations | null
    try {
      updatedAllocation = await queryOne<AllocationWithRelations>(
        `WITH upd AS (
           UPDATE thread_allocations
           SET status = $1, allocated_meters = 0, notes = $2, updated_at = $3
           WHERE id = $4
           RETURNING *
         )
         SELECT ${ALLOCATION_EMBED_SELECT}
         FROM upd ta
         LEFT JOIN thread_types tt ON tt.id = ta.thread_type_id
         LEFT JOIN warehouses rw ON rw.id = ta.requesting_warehouse_id
         LEFT JOIN warehouses sw ON sw.id = ta.source_warehouse_id`,
        ['CANCELLED', cancelNotes, new Date().toISOString(), id]
      )
    } catch (updateError) {
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
allocations.post('/:id/resolve', requirePermission('thread.allocations.manage'), async (c) => {
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
    const allocation = await queryOne<{
      id: number
      priority: AllocationPriority
      priority_score: number
      created_at: string
    }>(
      'SELECT id, priority, priority_score, created_at FROM thread_allocations WHERE id = $1',
      [id]
    )

    if (!allocation) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy đơn phân bổ',
      }, 404)
    }

    const setParts: string[] = ['updated_at = $1']
    const params: unknown[] = [new Date().toISOString()]

    // Update priority if provided
    if (body.new_priority) {
      const newScore = calculatePriorityScore(
        body.new_priority,
        new Date(allocation.created_at)
      )
      params.push(body.new_priority)
      setParts.push(`priority = $${params.length}`)
      params.push(newScore)
      setParts.push(`priority_score = $${params.length}`)
    }

    params.push(id)
    let updatedAllocation: AllocationWithRelations | null
    try {
      updatedAllocation = await queryOne<AllocationWithRelations>(
        `WITH upd AS (
           UPDATE thread_allocations
           SET ${setParts.join(', ')}
           WHERE id = $${params.length}
           RETURNING *
         )
         SELECT ${ALLOCATION_EMBED_SELECT}
         FROM upd ta
         LEFT JOIN thread_types tt ON tt.id = ta.thread_type_id
         LEFT JOIN warehouses rw ON rw.id = ta.requesting_warehouse_id
         LEFT JOIN warehouses sw ON sw.id = ta.source_warehouse_id`,
        params
      )
    } catch (updateError) {
      console.error('Update error:', updateError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi cập nhật ưu tiên',
      }, 500)
    }

    // If there's a related conflict, update it as resolved
    if (body.resolution_notes || body.resolved_by) {
      await query(
        `UPDATE thread_conflicts
         SET status = 'RESOLVED', resolution_notes = $1, resolved_by = $2, resolved_at = $3
         WHERE competing_allocation_ids @> $4 AND status = 'PENDING'`,
        [body.resolution_notes || null, body.resolved_by || null, new Date().toISOString(), [id]]
      )

      const warehouseIds = await getWarehouseEmployeeIds()
      broadcastNotification({
        employeeIds: warehouseIds,
        type: 'CONFLICT',
        title: `Xung đột phân bổ #${id} đã được giải quyết`,
        body: body.resolution_notes || 'Xung đột đã được giải quyết',
        actionUrl: '/thread/allocations',
        metadata: { allocation_id: id },
      })
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
allocations.post('/conflicts/:id/escalate', requirePermission('thread.allocations.manage'), async (c) => {
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
    const conflict = await queryOne<{ id: number; status: string }>(
      'SELECT * FROM thread_conflicts WHERE id = $1',
      [id]
    )

    if (!conflict) {
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
    let data: ConflictRow | null
    try {
      const nowIso = new Date().toISOString()
      data = await queryOne<ConflictRow>(
        `UPDATE thread_conflicts
         SET status = 'ESCALATED', resolution_notes = $1, resolved_at = $2, updated_at = $2
         WHERE id = $3
         RETURNING *`,
        [notes || 'Đã leo thang lên cấp quản lý', nowIso, id]
      )
    } catch (error) {
      console.error('[Allocations] Escalate conflict error:', error)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không thể leo thang xung đột',
      }, 500)
    }

    const warehouseIds = await getWarehouseEmployeeIds()
    broadcastNotification({
      employeeIds: warehouseIds,
      type: 'CONFLICT',
      title: `Xung đột #${id} đã được leo thang`,
      body: notes || 'Xung đột đã được leo thang lên cấp quản lý',
      actionUrl: '/thread/allocations',
      metadata: { conflict_id: id },
    })

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
allocations.post('/:id/split', requirePermission('thread.allocations.manage'), async (c) => {
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
    let result: unknown
    try {
      const rows = await query<{ result: unknown }>(
        'SELECT fn_split_allocation(p_allocation_id => $1, p_split_meters => $2, p_split_reason => $3) AS result',
        [id, body.split_meters, body.reason || null]
      )
      result = rows[0]?.result
    } catch (rpcError) {
      console.error('[Allocations] Split RPC error:', rpcError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi chia nhỏ phân bổ: ' + getErrorMessage(rpcError),
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
    const allocations_data = await query<AllocationWithRelations>(
      `SELECT ${ALLOCATION_EMBED_SELECT}
       ${ALLOCATION_EMBED_FROM}
       WHERE ta.id = ANY($1)`,
      [[splitResult.original_allocation_id, splitResult.new_allocation_id]]
    )

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
allocations.put('/:id', requirePermission('thread.allocations.manage'), async (c) => {
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
    const allocation = await queryOne<{ id: number; status: string; created_at: string }>(
      'SELECT id, status, created_at FROM thread_allocations WHERE id = $1',
      [id]
    )

    if (!allocation) {
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

    const setParts: string[] = ['updated_at = $1']
    const params: unknown[] = [new Date().toISOString()]

    if (body.order_reference !== undefined) {
      params.push(body.order_reference)
      setParts.push(`order_reference = $${params.length}`)
    }
    if (body.requested_meters !== undefined) {
      if (body.requested_meters <= 0) {
        return c.json<ThreadApiResponse<null>>({
          data: null,
          error: 'Số mét yêu cầu phải lớn hơn 0',
        }, 400)
      }
      params.push(body.requested_meters)
      setParts.push(`requested_meters = $${params.length}`)
    }
    if (body.priority !== undefined) {
      params.push(body.priority)
      setParts.push(`priority = $${params.length}`)
      params.push(calculatePriorityScore(body.priority, new Date(allocation.created_at)))
      setParts.push(`priority_score = $${params.length}`)
    }
    if (body.due_date !== undefined) {
      params.push(body.due_date)
      setParts.push(`due_date = $${params.length}`)
    }
    if (body.notes !== undefined) {
      params.push(body.notes)
      setParts.push(`notes = $${params.length}`)
    }

    params.push(id)
    let updatedAllocation: AllocationWithRelations | null
    try {
      updatedAllocation = await queryOne<AllocationWithRelations>(
        `WITH upd AS (
           UPDATE thread_allocations
           SET ${setParts.join(', ')}
           WHERE id = $${params.length}
           RETURNING *
         )
         SELECT ${ALLOCATION_EMBED_SELECT}
         FROM upd ta
         LEFT JOIN thread_types tt ON tt.id = ta.thread_type_id
         LEFT JOIN warehouses rw ON rw.id = ta.requesting_warehouse_id
         LEFT JOIN warehouses sw ON sw.id = ta.source_warehouse_id`,
        params
      )
    } catch (updateError) {
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
allocations.delete('/:id', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'ID không hợp lệ',
      }, 400)
    }

    // Check if allocation exists and can be deleted
    const allocation = await queryOne<{ id: number; status: string }>(
      'SELECT id, status FROM thread_allocations WHERE id = $1',
      [id]
    )

    if (!allocation) {
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

    try {
      await query('DELETE FROM thread_allocations WHERE id = $1', [id])
    } catch (deleteError) {
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
