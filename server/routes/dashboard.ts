import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'
import { requirePermission } from '../middleware/auth'
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

// Helper to safely get relation data (handles both object and array from Supabase)
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
    // Query 1: Get inventory summary statistics
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('thread_inventory')
      .select('status, quantity_meters, is_partial')

    if (inventoryError) {
      console.error('Dashboard summary - inventory query error:', inventoryError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải thống kê tổng quan'
      }, 500)
    }

    // Calculate inventory metrics
    const inventory = inventoryData || []
    const totalCones = inventory.length
    const totalMeters = inventory.reduce((sum, row) => sum + (row.quantity_meters || 0), 0)
    const availableCones = inventory.filter(row => row.status === 'AVAILABLE').length
    const availableMeters = inventory
      .filter(row => row.status === 'AVAILABLE')
      .reduce((sum, row) => sum + (row.quantity_meters || 0), 0)
    const allocatedCones = inventory.filter(row => 
      row.status === 'SOFT_ALLOCATED' || row.status === 'HARD_ALLOCATED'
    ).length
    const allocatedMeters = inventory
      .filter(row => row.status === 'SOFT_ALLOCATED' || row.status === 'HARD_ALLOCATED')
      .reduce((sum, row) => sum + (row.quantity_meters || 0), 0)
    const inProductionCones = inventory.filter(row => row.status === 'IN_PRODUCTION').length
    const partialCones = inventory.filter(row => row.is_partial === true).length

    // Query 2: Get thread types with reorder levels
    const { data: threadTypes, error: threadTypesError } = await supabase
      .from('thread_types')
      .select('id, reorder_level_meters')
      .eq('is_active', true)

    if (threadTypesError) {
      console.error('Dashboard summary - thread types query error:', threadTypesError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải thống kê tổng quan'
      }, 500)
    }

    // Query 3: Get available stock grouped by thread type for low stock calculation
    const { data: availableStock, error: availableStockError } = await supabase
      .from('thread_inventory')
      .select('thread_type_id, quantity_meters')
      .eq('status', 'AVAILABLE')

    if (availableStockError) {
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
      critical_stock_types: criticalStockTypes
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
    const { data: threadTypes, error: threadTypesError } = await supabase
      .from('thread_types')
      .select('id, code, name, reorder_level_meters')
      .eq('is_active', true)

    if (threadTypesError) {
      console.error('Dashboard alerts - thread types query error:', threadTypesError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải cảnh báo tồn kho'
      }, 500)
    }

    // Get available stock grouped by thread type
    const { data: availableStock, error: availableStockError } = await supabase
      .from('thread_inventory')
      .select('thread_type_id, quantity_meters')
      .eq('status', 'AVAILABLE')

    if (availableStockError) {
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
    const { data: conflictsData, error: conflictsError } = await supabase
      .from('thread_conflicts')
      .select(`
        id,
        thread_type_id,
        total_requested_meters,
        total_available_meters,
        shortage_meters,
        status,
        created_at,
        thread_types (
          code,
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (conflictsError) {
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
    const { count: pendingAllocationsCount, error: pendingError } = await supabase
      .from('thread_allocations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'PENDING')

    if (pendingError) {
      console.error('Dashboard pending - allocations query error:', pendingError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải các mục chờ xử lý'
      }, 500)
    }

    // Query waitlisted allocations
    const { count: waitlistedCount, error: waitlistedError } = await supabase
      .from('thread_allocations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'WAITLISTED')

    if (waitlistedError) {
      console.error('Dashboard pending - waitlisted query error:', waitlistedError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải các mục chờ xử lý'
      }, 500)
    }

    // Query overdue allocations (past due_date and not completed)
    const today = new Date().toISOString().split('T')[0]
    const { count: overdueCount, error: overdueError } = await supabase
      .from('thread_allocations')
      .select('id', { count: 'exact', head: true })
      .lt('due_date', today)
      .not('status', 'in', '("ISSUED","CANCELLED")')

    if (overdueError) {
      console.error('Dashboard pending - overdue query error:', overdueError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải các mục chờ xử lý'
      }, 500)
    }

    // Query pending recovery (INITIATED, PENDING_WEIGH, WEIGHED statuses)
    const { count: pendingRecoveryCount, error: recoveryError } = await supabase
      .from('thread_recovery')
      .select('id', { count: 'exact', head: true })
      .in('status', ['INITIATED', 'PENDING_WEIGH', 'WEIGHED'])

    if (recoveryError) {
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
    const { data: movementsData, error: movementsError } = await supabase
      .from('thread_movements')
      .select(`
        id,
        movement_type,
        quantity_meters,
        reference_id,
        created_at,
        thread_inventory (
          cone_id,
          thread_types (
            code,
            name
          )
        )
      `)
      .in('movement_type', ['RECEIVE', 'ISSUE', 'RETURN'])
      .order('created_at', { ascending: false })
      .limit(20)

    if (movementsError) {
      console.error('Dashboard activity - movements query error:', movementsError)
      // Continue with other queries even if this fails
    } else {
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
    const { data: allocationsData, error: allocationsError } = await supabase
      .from('thread_allocations')
      .select(`
        id,
        order_id,
        order_reference,
        requested_meters,
        status,
        created_at,
        thread_types (
          code,
          name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (allocationsError) {
      console.error('Dashboard activity - allocations query error:', allocationsError)
      // Continue even if this fails
    } else {
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
    const { data: conflictsData, error: conflictsError } = await supabase
      .from('thread_conflicts')
      .select(`
        id,
        shortage_meters,
        status,
        created_at,
        thread_types (
          code,
          name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    if (conflictsError) {
      console.error('Dashboard activity - conflicts query error:', conflictsError)
      // Continue even if this fails
    } else {
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
