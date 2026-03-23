/**
 * Thread Inventory Management Composable
 *
 * Provides reactive state and operations for thread inventory management.
 * Follows patterns from useThreadTypes.ts
 */
import type { Cone, InventoryFilters, ReceiveStockDTO } from '@/types/thread';
export declare function useInventory(): {
    inventory: any;
    loading: any;
    error: any;
    selectedCone: any;
    filters: any;
    availableSummary: any;
    totalCount: any;
    currentPage: any;
    pageSize: any;
    sortBy: any;
    descending: any;
    isLoading: any;
    hasInventory: any;
    inventoryCount: any;
    availableCones: any;
    partialCones: any;
    fetchInventory: (newFilters?: InventoryFilters) => Promise<void>;
    handleTableRequest: (props: {
        pagination: {
            page: number;
            rowsPerPage: number;
            sortBy: string;
            descending: boolean;
        };
    }) => Promise<void>;
    receiveStock: (data: ReceiveStockDTO) => Promise<Cone[] | null>;
    getConeById: (id: number) => Cone | undefined;
    fetchAvailableSummary: (threadTypeId?: number) => Promise<void>;
    selectCone: (cone: Cone | null) => void;
    setFilters: (newFilters: InventoryFilters) => Promise<void>;
    clearFilters: () => Promise<void>;
    clearError: () => void;
    reset: () => void;
    enableRealtime: () => void;
    disableRealtime: () => void;
};
