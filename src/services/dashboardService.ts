/**
 * Dashboard Service
 *
 * API client for dashboard operations.
 * Handles all HTTP operations for dashboard metrics, alerts, and activity.
 */

import { fetchApi } from './api'

interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

/**
 * Dashboard summary statistics
 */
export interface DashboardSummary {
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

/**
 * Stock alert for low/critical inventory levels
 */
export interface StockAlert {
  id: number
  thread_type_id: number
  thread_type_code: string
  thread_type_name: string
  current_meters: number
  reorder_level: number
  percentage: number
  severity: 'warning' | 'critical'
}

/**
 * Pending items requiring action
 */
export interface PendingItems {
  pending_allocations: number
  pending_recovery: number
  waitlisted_allocations: number
  overdue_allocations: number
}

/**
 * Activity feed item
 */
export interface ActivityItem {
  id: number
  type: 'RECEIVE' | 'ISSUE' | 'RETURN' | 'ALLOCATION' | 'CONFLICT'
  description: string
  timestamp: string
  metadata?: Record<string, any>
}

/**
 * Conflicts summary
 */
export interface ConflictsSummary {
  total_conflicts: number
  pending_count: number
  conflicts: any[]
}

export const dashboardService = {
  /**
   * Lấy thống kê tổng hợp dashboard
   * @returns Summary statistics
   */
  async getSummary(): Promise<DashboardSummary> {
    const response = await fetchApi<ApiResponse<DashboardSummary>>('/api/dashboard/summary')

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không có dữ liệu thống kê')
    }

    return response.data
  },

  /**
   * Lấy danh sách cảnh báo tồn kho thấp
   * @returns Array of stock alerts
   */
  async getAlerts(): Promise<StockAlert[]> {
    const response = await fetchApi<ApiResponse<StockAlert[]>>('/api/dashboard/alerts')

    if (response.error) {
      throw new Error(response.error)
    }

    return response.data || []
  },

  /**
   * Lấy thông tin xung đột cấp phát
   * @returns Conflicts summary with pending count and conflict list
   */
  async getConflicts(): Promise<ConflictsSummary> {
    const response = await fetchApi<ApiResponse<ConflictsSummary>>('/api/dashboard/conflicts')

    if (response.error) {
      throw new Error(response.error)
    }

    return response.data || { total_conflicts: 0, pending_count: 0, conflicts: [] }
  },

  /**
   * Lấy số lượng các mục đang chờ xử lý
   * @returns Pending items counts
   */
  async getPending(): Promise<PendingItems> {
    const response = await fetchApi<ApiResponse<PendingItems>>('/api/dashboard/pending')

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không có dữ liệu chờ xử lý')
    }

    return response.data
  },

  /**
   * Lấy hoạt động gần đây
   * @returns Array of activity items
   */
  async getActivity(): Promise<ActivityItem[]> {
    const response = await fetchApi<ApiResponse<ActivityItem[]>>('/api/dashboard/activity')

    if (response.error) {
      throw new Error(response.error)
    }

    return response.data || []
  },
}
