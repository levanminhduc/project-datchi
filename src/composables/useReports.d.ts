/**
 * Reports Composable
 *
 * Provides reactive state and methods for allocation reports.
 * Follows useDashboard.ts pattern for structure and error handling.
 */
import { type ReportFilters } from '@/services/reportService';
export declare function useReports(): {
    reportData: any;
    filters: any;
    error: any;
    isLoading: any;
    hasData: any;
    summary: any;
    allocations: any;
    fetchAllocationReport: (reportFilters?: ReportFilters) => Promise<void>;
    exportToXlsx: () => Promise<void>;
    setFilters: (newFilters: Partial<ReportFilters>) => void;
    clearFilters: () => void;
    clearError: () => void;
};
