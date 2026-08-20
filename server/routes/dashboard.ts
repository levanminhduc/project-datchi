import { Hono } from 'hono'
import { query, queryCount } from '../db/query'
import { requirePermission } from '../middleware/auth'
import { getKdExcludedSupplierIds, isKdExcluded } from '../utils/kd-excluded-suppliers'
import type { ThreadApiResponse } from '../types/thread'

const dashboard = new Hono()

dashboard.use('*', requirePermission('dashboard.view'))

// ============================================================================
// Dashboard Types
// ============================================================================

interface DashboardSummary {
  total_cones: number
  total_meters: number
  available_cones: number
  available_meters: number
  allocated_cones: number
  allocated_meters: number
  in_production_cones: number
  partial_cones: number
  low_stock_types: number
  critical_stock_types: number
  total_inventory_value: number
}

interface StockAlert {
  id: number
  thread_type_id: number
  thread_type_code: string
  thread_type_name: string
  current_meters: number
  reorder_level: number
  percentage: number
  severity: 'warning' | 'critical'
}

interface AllocationConflict {
  id: number
  thread_type_id: number
  thread_type_code: string
  thread_type_name: string
  total_requested_meters: number
  total_available_meters: number
  shortage_meters: number
  status: string
  created_at: string
}

interface ConflictsSummary {
  total_conflicts: number
  pending_count: number
  conflicts: AllocationConflict[]
}

interface PendingItems {
  pending_allocations: number
  pending_recovery: number
  waitlisted_allocations: number
  overdue_allocations: number
}

interface ActivityItem {
  id: number
  type: 'RECEIVE' | 'ISSUE' | 'RETURN' | 'ALLOCATION' | 'CONFLICT'
  description: string
  timestamp: string
  metadata?: Record<string, unknown>
}

// Helper to safely get relation data (handles both object and array relation shapes)
function getRelation<T>(relation: T | T[] | null | undefined): T | null {
  if (!relation) return null
  if (Array.isArray(relation)) return relation[0] || null
  return relation
}

// ============================================================================
// GET /api/dashboard/summary - KPI summary
// ============================================================================

dashboard.get('/summary', async (c) => {
  try {
    const totalStatuses = ['RECEIVED', 'INSPECTED', 'AVAILABLE', 'SOFT_ALLOCATED', 'HARD_ALLOCATED', 'RESERVED_FOR_ORDER']
    const kdStatuses = ['RECEIVED', 'INSPECTED', 'AVAILABLE']

    type SummaryRow = { thread_type_id: number; supplier_id: number | null; total_full_cones: number; total_partial_cones: number; full_cones: number; partial_cones: number; partial_meters: number; meters_per_cone: number }

    let totalRows: SummaryRow[]
    let kdRows: SummaryRow[]
    try {
      const [totalResult, kdResult, kdExcludedSupplierIds] = await Promise.all([
        query<SummaryRow>(
          'SELECT * FROM fn_cone_summary_filtered($1, $2, $3, $4, $5, $6)',
          [totalStatuses, null, null, null, null, false]
        ),
        query<SummaryRow>(
          'SELECT * FROM fn_cone_summary_filtered($1, $2, $3, $4, $5, $6)',
          [kdStatuses, null, null, null, null, true]
        ),
        getKdExcludedSupplierIds(),
      ])
      totalRows = totalResult
      kdRows = kdResult.filter((r) => !isKdExcluded(kdExcludedSupplierIds, r.supplier_id))
    } catch (rpcErr) {
      console.error('Dashboard summary - RPC error:', rpcErr)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải thống kê tổng quan'
      }, 500)
    }

    const totalCones = totalRows.reduce((sum, r) => sum + Number(r.total_full_cones || 0), 0)
    const totalMeters = totalRows.reduce((sum, r) =>
      sum + Number(r.total_full_cones || 0) * Number(r.meters_per_cone || 0) + Number(r.partial_meters || 0), 0)
    const partialCones = totalRows.reduce((sum, r) => sum + Number(r.total_partial_cones || 0), 0)

    const availableCones = kdRows.reduce((sum, r) => sum + Number(r.full_cones || 0), 0)
    const availableMeters = kdRows.reduce((sum, r) =>
      sum + Number(r.full_cones || 0) * Number(r.meters_per_cone || 0) + Number(r.partial_meters || 0), 0)
    const allocatedCones = totalCones - availableCones
    const allocatedMeters = Math.round((totalMeters - availableMeters) * 100) / 100
    const inProductionCones = 0

    // Calculate inventory value (same as ConeSummaryTable: total_full_cones × unit_price)
    let totalInventoryValue = 0
    const threadTypeIds = [...new Set(totalRows.map(r => r.thread_type_id))]
    if (threadTypeIds.length > 0) {
      const prices = await query<{ thread_type_id: number; supplier_id: number; unit_price: number | null }>(
        `SELECT thread_type_id, supplier_id, unit_price
         FROM thread_type_supplier
         WHERE thread_type_id = ANY($1) AND is_active = TRUE`,
        [threadTypeIds]
      )

      if (prices) {
        const supplierMap = new Map<number, number | null>()
        for (const row of totalRows) {
          if (row.supplier_id && !supplierMap.has(row.thread_type_id)) {
            supplierMap.set(row.thread_type_id, row.supplier_id)
          }
        }
        const priceMap = new Map<number, number>()
        for (const p of prices) {
          const defaultSupplierId = supplierMap.get(p.thread_type_id)
          if (defaultSupplierId && p.supplier_id === defaultSupplierId && p.unit_price != null) {
            priceMap.set(p.thread_type_id, Number(p.unit_price))
          }
        }
        totalInventoryValue = totalRows.reduce((sum, r) => {
          const cones = Number(r.total_full_cones || 0)
          const price = priceMap.get(r.thread_type_id)
          return price && cones > 0 ? sum + cones * price : sum
        }, 0)
      }
    }

    // Query 2: Get thread types with reorder levels
    let threadTypes: Array<{ id: number; reorder_level_meters: number | null }>
    try {
      threadTypes = await query<{ id: number; reorder_level_meters: number | null }>(
        `SELECT id, reorder_level_meters FROM thread_types
         WHERE is_active = TRUE
         LIMIT 5000`,
        []
      )
    } catch (threadTypesError) {
      console.error('Dashboard summary - thread types query error:', threadTypesError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải thống kê tổng quan'
      }, 500)
    }

    // Query 3: Get available stock grouped by thread type for low stock calculation
    let availableStock: Array<{ thread_type_id: number; quantity_meters: number | null }>
    try {
      availableStock = await query<{ thread_type_id: number; quantity_meters: number | null }>(
        `SELECT thread_type_id, quantity_meters FROM thread_inventory
         WHERE status = 'AVAILABLE'
         LIMIT 30000`,
        []
      )
    } catch (availableStockError) {
      console.error('Dashboard summary - available stock query error:', availableStockError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải thống kê tổng quan'
      }, 500)
    }

    // Group available meters by thread type
    const stockByType = new Map<number, number>()
    ;(availableStock || []).forEach(row => {
      const current = stockByType.get(row.thread_type_id) || 0
      stockByType.set(row.thread_type_id, current + (row.quantity_meters || 0))
    })

    // Calculate low stock and critical stock counts
    let lowStockTypes = 0
    let criticalStockTypes = 0

    ;(threadTypes || []).forEach(type => {
      const currentMeters = stockByType.get(type.id) || 0
      const reorderLevel = type.reorder_level_meters || 0

      if (reorderLevel > 0) {
        const percentage = (currentMeters / reorderLevel) * 100

        if (percentage < 25) {
          criticalStockTypes++
          lowStockTypes++ // Critical is also low
        } else if (percentage < 100) {
          lowStockTypes++
        }
      }
    })

    const summary: DashboardSummary = {
      total_cones: totalCones,
      total_meters: Math.round(totalMeters * 100) / 100,
      available_cones: availableCones,
      available_meters: Math.round(availableMeters * 100) / 100,
      allocated_cones: allocatedCones,
      allocated_meters: Math.round(allocatedMeters * 100) / 100,
      in_production_cones: inProductionCones,
      partial_cones: partialCones,
      low_stock_types: lowStockTypes,
      critical_stock_types: criticalStockTypes,
      total_inventory_value: Math.round(totalInventoryValue)
    }

    return c.json<ThreadApiResponse<DashboardSummary>>({
      data: summary,
      error: null
    })
  } catch (err) {
    console.error('Dashboard summary error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi khi tải thống kê tổng quan'
    }, 500)
  }
})

// ============================================================================
// GET /api/dashboard/alerts - Stock alerts (low and critical)
// ============================================================================

dashboard.get('/alerts', async (c) => {
  try {
    // Get all active thread types with reorder levels
    let threadTypes: Array<{ id: number; code: string; name: string; reorder_level_meters: number | null }>
    try {
      threadTypes = await query<{ id: number; code: string; name: string; reorder_level_meters: number | null }>(
        `SELECT id, code, name, reorder_level_meters FROM thread_types
         WHERE is_active = TRUE
         LIMIT 5000`,
        []
      )
    } catch (threadTypesError) {
      console.error('Dashboard alerts - thread types query error:', threadTypesError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải cảnh báo tồn kho'
      }, 500)
    }

    // Get available stock grouped by thread type
    let availableStock: Array<{ thread_type_id: number; quantity_meters: number | null }>
    try {
      availableStock = await query<{ thread_type_id: number; quantity_meters: number | null }>(
        `SELECT thread_type_id, quantity_meters FROM thread_inventory
         WHERE status = 'AVAILABLE'
         LIMIT 30000`,
        []
      )
    } catch (availableStockError) {
      console.error('Dashboard alerts - available stock query error:', availableStockError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải cảnh báo tồn kho'
      }, 500)
    }

    // Group available meters by thread type
    const stockByType = new Map<number, number>()
    ;(availableStock || []).forEach(row => {
      const current = stockByType.get(row.thread_type_id) || 0
      stockByType.set(row.thread_type_id, current + (row.quantity_meters || 0))
    })

    // Build alerts list
    const alerts: StockAlert[] = []
    let alertId = 1

    ;(threadTypes || []).forEach(type => {
      const currentMeters = stockByType.get(type.id) || 0
      const reorderLevel = type.reorder_level_meters || 0

      if (reorderLevel > 0) {
        const percentage = (currentMeters / reorderLevel) * 100

        if (percentage < 100) {
          alerts.push({
            id: alertId++,
            thread_type_id: type.id,
            thread_type_code: type.code,
            thread_type_name: type.name,
            current_meters: Math.round(currentMeters * 100) / 100,
            reorder_level: reorderLevel,
            percentage: Math.round(percentage * 100) / 100,
            severity: percentage < 25 ? 'critical' : 'warning'
          })
        }
      }
    })

    // Sort by severity (critical first) then by percentage (lowest first)
    alerts.sort((a, b) => {
      if (a.severity !== b.severity) {
        return a.severity === 'critical' ? -1 : 1
      }
      return a.percentage - b.percentage
    })

    return c.json<ThreadApiResponse<StockAlert[]>>({
      data: alerts,
      error: null
    })
  } catch (err) {
    console.error('Dashboard alerts error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi khi tải cảnh báo tồn kho'
    }, 500)
  }
})

// ============================================================================
// GET /api/dashboard/conflicts - Active conflicts summary
// ============================================================================

dashboard.get('/conflicts', async (c) => {
  try {
    // Get all conflicts with thread type info
    let conflictsData: Array<{
      id: number
      thread_type_id: number
      total_requested_meters: number
      total_available_meters: number
      shortage_meters: number
      status: string
      created_at: string
      thread_types: { code: string; name: string } | null
    }>
    try {
      conflictsData = await query<{
        id: number
        thread_type_id: number
        total_requested_meters: number
        total_available_meters: number
        shortage_meters: number
        status: string
        created_at: string
        thread_types: { code: string; name: string } | null
      }>(
        `SELECT tc.id, tc.thread_type_id, tc.total_requested_meters,
                tc.total_available_meters, tc.shortage_meters, tc.status, tc.created_at,
                CASE WHEN tt.id IS NULL THEN NULL
                     ELSE json_build_object('code', tt.code, 'name', tt.name) END AS thread_types
         FROM thread_conflicts tc
         LEFT JOIN thread_types tt ON tt.id = tc.thread_type_id
         ORDER BY tc.created_at DESC
         LIMIT 1000`,
        []
      )
    } catch (conflictsError) {
      console.error('Dashboard conflicts - query error:', conflictsError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải thông tin xung đột'
      }, 500)
    }

    const allConflicts = conflictsData || []
    const pendingConflicts = allConflicts.filter(c => c.status === 'PENDING')

    // Transform to AllocationConflict format and get top 5 most urgent (pending first, then by shortage)
    const conflicts: AllocationConflict[] = pendingConflicts
      .slice(0, 5)
      .map(conflict => {
        const threadType = getRelation(conflict.thread_types)
        return {
          id: conflict.id,
          thread_type_id: conflict.thread_type_id,
          thread_type_code: threadType?.code || '',
          thread_type_name: threadType?.name || '',
          total_requested_meters: conflict.total_requested_meters,
          total_available_meters: conflict.total_available_meters,
          shortage_meters: conflict.shortage_meters,
          status: conflict.status,
          created_at: conflict.created_at
        }
      })

    const summary: ConflictsSummary = {
      total_conflicts: allConflicts.length,
      pending_count: pendingConflicts.length,
      conflicts
    }

    return c.json<ThreadApiResponse<ConflictsSummary>>({
      data: summary,
      error: null
    })
  } catch (err) {
    console.error('Dashboard conflicts error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi khi tải thông tin xung đột'
    }, 500)
  }
})

// ============================================================================
// GET /api/dashboard/pending - Pending items requiring action
// ============================================================================

dashboard.get('/pending', async (c) => {
  try {
    // Query pending allocations (PENDING status)
    let pendingAllocationsCount: number
    try {
      pendingAllocationsCount = await queryCount(
        `SELECT count(*)::int AS count FROM thread_allocations WHERE status = $1`,
        ['PENDING']
      )
    } catch (pendingError) {
      console.error('Dashboard pending - allocations query error:', pendingError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải các mục chờ xử lý'
      }, 500)
    }

    // Query waitlisted allocations
    let waitlistedCount: number
    try {
      waitlistedCount = await queryCount(
        `SELECT count(*)::int AS count FROM thread_allocations WHERE status = $1`,
        ['WAITLISTED']
      )
    } catch (waitlistedError) {
      console.error('Dashboard pending - waitlisted query error:', waitlistedError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải các mục chờ xử lý'
      }, 500)
    }

    // Query overdue allocations (past due_date and not completed)
    const today = new Date().toISOString().split('T')[0]
    let overdueCount: number
    try {
      overdueCount = await queryCount(
        `SELECT count(*)::int AS count FROM thread_allocations
         WHERE due_date < $1 AND status NOT IN ('ISSUED', 'CANCELLED')`,
        [today]
      )
    } catch (overdueError) {
      console.error('Dashboard pending - overdue query error:', overdueError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải các mục chờ xử lý'
      }, 500)
    }

    // Query pending recovery (INITIATED, PENDING_WEIGH, WEIGHED statuses)
    let pendingRecoveryCount: number
    try {
      pendingRecoveryCount = await queryCount(
        `SELECT count(*)::int AS count FROM thread_recovery
         WHERE status = ANY($1)`,
        [['INITIATED', 'PENDING_WEIGH', 'WEIGHED']]
      )
    } catch (recoveryError) {
      console.error('Dashboard pending - recovery query error:', recoveryError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải các mục chờ xử lý'
      }, 500)
    }

    const pendingItems: PendingItems = {
      pending_allocations: pendingAllocationsCount || 0,
      pending_recovery: pendingRecoveryCount || 0,
      waitlisted_allocations: waitlistedCount || 0,
      overdue_allocations: overdueCount || 0
    }

    return c.json<ThreadApiResponse<PendingItems>>({
      data: pendingItems,
      error: null
    })
  } catch (err) {
    console.error('Dashboard pending error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi khi tải các mục chờ xử lý'
    }, 500)
  }
})

// ============================================================================
// GET /api/dashboard/activity - Recent activity timeline
// ============================================================================

dashboard.get('/activity', async (c) => {
  try {
    const activities: ActivityItem[] = []

    // Query 1: Recent movements (RECEIVE, ISSUE, RETURN)
    let movementsData: Array<{
      id: number
      movement_type: string
      quantity_meters: number
      reference_id: number | string | null
      created_at: string
      thread_inventory: { cone_id: string; thread_types: { code: string; name: string } | null } | null
    }> = []
    try {
      movementsData = await query<{
        id: number
        movement_type: string
        quantity_meters: number
        reference_id: number | string | null
        created_at: string
        thread_inventory: { cone_id: string; thread_types: { code: string; name: string } | null } | null
      }>(
        `SELECT tm.id, tm.movement_type, tm.quantity_meters, tm.reference_id, tm.created_at,
                CASE WHEN ti.id IS NULL THEN NULL ELSE json_build_object(
                  'cone_id', ti.cone_id,
                  'thread_types', CASE WHEN tt.id IS NULL THEN NULL
                                       ELSE json_build_object('code', tt.code, 'name', tt.name) END
                ) END AS thread_inventory
         FROM thread_movements tm
         LEFT JOIN thread_inventory ti ON ti.id = tm.cone_id
         LEFT JOIN thread_types tt ON tt.id = ti.thread_type_id
         WHERE tm.movement_type = ANY($1)
         ORDER BY tm.created_at DESC
         LIMIT 20`,
        [['RECEIVE', 'ISSUE', 'RETURN']]
      )
    } catch (movementsError) {
      console.error('Dashboard activity - movements query error:', movementsError)
      // Continue with other queries even if this fails
    }
    {
      ;(movementsData || []).forEach(movement => {
        const inventory = getRelation(movement.thread_inventory)
        const threadType = inventory ? getRelation(inventory.thread_types) : null

        let description = ''
        switch (movement.movement_type) {
          case 'RECEIVE':
            description = `Nhập kho cuộn ${inventory?.cone_id || 'N/A'} (${threadType?.name || 'N/A'}) - ${movement.quantity_meters}m`
            break
          case 'ISSUE':
            description = `Xuất kho cuộn ${inventory?.cone_id || 'N/A'} cho đơn ${movement.reference_id || 'N/A'}`
            break
          case 'RETURN':
            description = `Trả về cuộn ${inventory?.cone_id || 'N/A'} - ${movement.quantity_meters}m còn lại`
            break
        }

        activities.push({
          id: movement.id,
          type: movement.movement_type as 'RECEIVE' | 'ISSUE' | 'RETURN',
          description,
          timestamp: movement.created_at,
          metadata: {
            cone_id: inventory?.cone_id,
            thread_code: threadType?.code,
            quantity_meters: movement.quantity_meters,
            reference_id: movement.reference_id
          }
        })
      })
    }

    // Query 2: Recent allocations
    let allocationsData: Array<{
      id: number
      order_id: number | string
      order_reference: string | null
      requested_meters: number
      status: string
      created_at: string
      thread_types: { code: string; name: string } | null
    }> = []
    try {
      allocationsData = await query<{
        id: number
        order_id: number | string
        order_reference: string | null
        requested_meters: number
        status: string
        created_at: string
        thread_types: { code: string; name: string } | null
      }>(
        `SELECT ta.id, ta.order_id, ta.order_reference, ta.requested_meters, ta.status, ta.created_at,
                CASE WHEN tt.id IS NULL THEN NULL
                     ELSE json_build_object('code', tt.code, 'name', tt.name) END AS thread_types
         FROM thread_allocations ta
         LEFT JOIN thread_types tt ON tt.id = ta.thread_type_id
         ORDER BY ta.created_at DESC
         LIMIT 10`,
        []
      )
    } catch (allocationsError) {
      console.error('Dashboard activity - allocations query error:', allocationsError)
      // Continue even if this fails
    }
    {
      ;(allocationsData || []).forEach(allocation => {
        const threadType = getRelation(allocation.thread_types)
        const description = `Yêu cầu phân bổ ${allocation.requested_meters}m ${threadType?.name || 'N/A'} cho đơn ${allocation.order_id}`

        activities.push({
          id: allocation.id + 100000, // Offset to avoid ID collision
          type: 'ALLOCATION',
          description,
          timestamp: allocation.created_at,
          metadata: {
            order_id: allocation.order_id,
            order_reference: allocation.order_reference,
            thread_code: threadType?.code,
            requested_meters: allocation.requested_meters,
            status: allocation.status
          }
        })
      })
    }

    // Query 3: Recent conflicts
    let conflictsData: Array<{
      id: number
      shortage_meters: number
      status: string
      created_at: string
      thread_types: { code: string; name: string } | null
    }> = []
    try {
      conflictsData = await query<{
        id: number
        shortage_meters: number
        status: string
        created_at: string
        thread_types: { code: string; name: string } | null
      }>(
        `SELECT tc.id, tc.shortage_meters, tc.status, tc.created_at,
                CASE WHEN tt.id IS NULL THEN NULL
                     ELSE json_build_object('code', tt.code, 'name', tt.name) END AS thread_types
         FROM thread_conflicts tc
         LEFT JOIN thread_types tt ON tt.id = tc.thread_type_id
         ORDER BY tc.created_at DESC
         LIMIT 5`,
        []
      )
    } catch (conflictsError) {
      console.error('Dashboard activity - conflicts query error:', conflictsError)
      // Continue even if this fails
    }
    {
      ;(conflictsData || []).forEach(conflict => {
        const threadType = getRelation(conflict.thread_types)
        const description = `Phát hiện xung đột: thiếu ${conflict.shortage_meters}m ${threadType?.name || 'N/A'}`

        activities.push({
          id: conflict.id + 200000, // Offset to avoid ID collision
          type: 'CONFLICT',
          description,
          timestamp: conflict.created_at,
          metadata: {
            thread_code: threadType?.code,
            shortage_meters: conflict.shortage_meters,
            status: conflict.status
          }
        })
      })
    }

    // Sort all activities by timestamp descending and limit to 20
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    const limitedActivities = activities.slice(0, 20)

    return c.json<ThreadApiResponse<ActivityItem[]>>({
      data: limitedActivities,
      error: null
    })
  } catch (err) {
    console.error('Dashboard activity error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi khi tải hoạt động gần đây'
    }, 500)
  }
})

export default dashboard
