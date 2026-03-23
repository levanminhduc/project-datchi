import type { PurchaseOrder, CreatePurchaseOrderDTO, UpdatePurchaseOrderDTO, PurchaseOrderFilter } from '@/types/thread';
export declare function usePurchaseOrders(): {
    purchaseOrders: any;
    error: any;
    filters: any;
    selectedPurchaseOrder: any;
    currentPage: any;
    pageSize: any;
    totalCount: any;
    isLoading: any;
    purchaseOrderCount: any;
    clearError: () => void;
    fetchPurchaseOrders: (newFilters?: PurchaseOrderFilter) => Promise<void>;
    fetchAllPurchaseOrders: (newFilters?: PurchaseOrderFilter) => Promise<void>;
    fetchPurchaseOrderById: (id: number) => Promise<void>;
    createPurchaseOrder: (data: CreatePurchaseOrderDTO) => Promise<PurchaseOrder | null>;
    updatePurchaseOrder: (id: number, data: UpdatePurchaseOrderDTO) => Promise<PurchaseOrder | null>;
    deletePurchaseOrder: (id: number) => Promise<boolean>;
    handleTableRequest: (props: {
        pagination: {
            page: number;
            rowsPerPage: number;
            sortBy: string;
            descending: boolean;
        };
    }) => Promise<void>;
};
