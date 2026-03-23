/**
 * Reconciliation Service
 * Đối chiếu tiêu hao chỉ - Thread Consumption Reconciliation
 *
 * Handles all HTTP operations for reconciliation reports
 * Uses fetchApi for consistent error handling
 */
import type { ReconciliationReport, ReconciliationFilters } from '@/types/thread/reconciliation';
export declare const reconciliationService: {
    /**
     * Lấy báo cáo đối chiếu tiêu hao
     * @param filters - Optional filter parameters
     * @returns Reconciliation report with summary and rows
     */
    getReport(filters?: ReconciliationFilters): Promise<ReconciliationReport>;
    /**
     * Xuất báo cáo đối chiếu ra Excel
     * @param filters - Optional filter parameters
     * @returns Blob containing Excel file
     */
    exportExcel(filters?: ReconciliationFilters): Promise<Blob>;
};
