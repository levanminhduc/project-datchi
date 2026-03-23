/**
 * Cone Summary Composable
 *
 * Provides reactive state and operations for cone-based inventory summary.
 * Groups inventory by thread type, showing full and partial cone counts.
 */
import { type Ref } from 'vue';
import type { ConeSummaryRow, ConeSummaryFilters } from '@/types/thread';
export declare function useConeSummary(): {
    summaryList: any;
    warehouseBreakdown: any;
    supplierBreakdown: any;
    selectedThreadType: any;
    filters: any;
    error: any;
    isLoading: any;
    breakdownLoading: Ref<boolean>;
    hasSummary: any;
    summaryCount: any;
    totalFullCones: any;
    totalPartialCones: any;
    totalPartialMeters: any;
    fetchSummary: (newFilters?: ConeSummaryFilters) => Promise<void>;
    fetchWarehouseBreakdown: (threadTypeId: number, colorId?: number | null) => Promise<void>;
    selectThreadType: (row: ConeSummaryRow | null) => Promise<void>;
    setFilters: (newFilters: ConeSummaryFilters) => Promise<void>;
    clearFilters: () => Promise<void>;
    closeBreakdown: () => void;
    clearError: () => void;
    reset: () => void;
    enableRealtime: () => void;
    disableRealtime: () => void;
};
