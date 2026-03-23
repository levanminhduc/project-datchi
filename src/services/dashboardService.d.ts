/**
 * Dashboard Service
 *
 * API client for dashboard operations.
 * Handles all HTTP operations for dashboard metrics, alerts, and activity.
 */
/**
 * Dashboard summary statistics
 */
export interface DashboardSummary {
    total_cones: number;
    total_meters: number;
    available_cones: number;
    available_meters: number;
    allocated_cones: number;
    allocated_meters: number;
    in_production_cones: number;
    partial_cones: number;
    low_stock_types: number;
    critical_stock_types: number;
}
/**
 * Stock alert for low/critical inventory levels
 */
export interface StockAlert {
    id: number;
    thread_type_id: number;
    thread_type_code: string;
    thread_type_name: string;
    current_meters: number;
    reorder_level: number;
    percentage: number;
    severity: 'warning' | 'critical';
}
/**
 * Pending items requiring action
 */
export interface PendingItems {
    pending_allocations: number;
    pending_recovery: number;
    waitlisted_allocations: number;
    overdue_allocations: number;
}
/**
 * Activity feed item
 */
export interface ActivityItem {
    id: number;
    type: 'RECEIVE' | 'ISSUE' | 'RETURN' | 'ALLOCATION' | 'CONFLICT';
    description: string;
    timestamp: string;
    metadata?: Record<string, any>;
}
/**
 * Conflicts summary
 */
export interface ConflictsSummary {
    total_conflicts: number;
    pending_count: number;
    conflicts: any[];
}
export declare const dashboardService: {
    /**
     * Lấy thống kê tổng hợp dashboard
     * @returns Summary statistics
     */
    getSummary(): Promise<DashboardSummary>;
    /**
     * Lấy danh sách cảnh báo tồn kho thấp
     * @returns Array of stock alerts
     */
    getAlerts(): Promise<StockAlert[]>;
    /**
     * Lấy thông tin xung đột cấp phát
     * @returns Conflicts summary with pending count and conflict list
     */
    getConflicts(): Promise<ConflictsSummary>;
    /**
     * Lấy số lượng các mục đang chờ xử lý
     * @returns Pending items counts
     */
    getPending(): Promise<PendingItems>;
    /**
     * Lấy hoạt động gần đây
     * @returns Array of activity items
     */
    getActivity(): Promise<ActivityItem[]>;
};
