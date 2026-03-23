/**
 * Report Service
 *
 * API client for generating allocation reports.
 * Handles HTTP operations for report endpoints.
 */
export interface ReportFilters {
    from_date?: string;
    to_date?: string;
    thread_type_id?: number;
    status?: string;
}
export interface AllocationReportRow {
    id: number;
    order_id: string;
    order_reference: string | null;
    thread_type_id: number;
    thread_type_code: string;
    thread_type_name: string;
    requested_meters: number;
    allocated_meters: number;
    fulfillment_rate: number;
    status: string;
    priority: string;
    created_at: string;
    soft_at: string | null;
    issued_at: string | null;
    transition_hours: number | null;
}
export interface AllocationReportData {
    total_allocations: number;
    total_requested_meters: number;
    total_allocated_meters: number;
    overall_fulfillment_rate: number;
    avg_transition_hours: number | null;
    allocations: AllocationReportRow[];
}
export declare const reportService: {
    /**
     * Lấy báo cáo phân bổ với bộ lọc
     * @param filters - Bộ lọc: from_date, to_date, thread_type_id, status
     * @returns Report data with allocations and summary
     */
    getAllocationReport(filters?: ReportFilters): Promise<AllocationReportData>;
};
