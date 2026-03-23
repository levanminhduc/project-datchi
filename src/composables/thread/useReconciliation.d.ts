/**
 * Thread Consumption Reconciliation Composable
 * Đối chiếu tiêu hao chỉ - Reconciliation Report
 *
 * Provides reactive state and operations for thread consumption reconciliation.
 * Handles fetching reports, filtering, and Excel export.
 */
import type { ReconciliationFilters, ReconciliationRow } from '@/types/thread/reconciliation';
export declare function useReconciliation(): {
    report: any;
    filters: any;
    error: any;
    isLoading: any;
    rows: any;
    summary: any;
    hasData: any;
    rowCount: any;
    generatedAt: any;
    overQuotaCount: any;
    fetchReport: (newFilters?: ReconciliationFilters) => Promise<void>;
    exportExcel: () => Promise<void>;
    updateFilters: (newFilters: Partial<ReconciliationFilters>, refetch?: boolean) => Promise<void>;
    clearFilters: (refetch?: boolean) => Promise<void>;
    clearReport: () => void;
    getRowsByConsumption: (type: "over" | "under" | "normal", tolerancePercent?: number) => ReconciliationRow[];
    clearError: () => void;
};
