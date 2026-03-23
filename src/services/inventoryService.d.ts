/**
 * Inventory Service
 *
 * API client for thread inventory management operations.
 * Handles all HTTP operations for cone inventory.
 */
import type { Cone, InventoryFilters, ReceiveStockDTO, ConeSummaryRow, ConeWarehouseBreakdown, SupplierBreakdown, ConeSummaryFilters } from '@/types/thread';
import type { UnassignedThreadGroup } from '@/types/thread/lot';
interface ApiResponse<T> {
    data: T | null;
    error: string | null;
    message?: string;
}
/**
 * Available stock summary per thread type
 */
export interface AvailableSummary {
    total_meters: number;
    full_cones: number;
    partial_cones: number;
}
export declare const inventoryService: {
    getPaginated(params?: {
        page?: number;
        pageSize?: number;
        search?: string;
        thread_type_id?: number;
        warehouse_id?: number;
        status?: string;
        is_partial?: boolean;
        sortBy?: string;
        descending?: boolean;
    }): Promise<{
        data: Cone[];
        count: number;
    }>;
    /**
     * Lấy danh sách tất cả cone trong kho
     * Uses limit=0 to trigger batch fetch for all records
     * @param filters - Optional filters for search, thread_type_id, warehouse_id, status, is_partial
     * @returns Array of cones
     */
    getAll(filters?: InventoryFilters): Promise<Cone[]>;
    /**
     * Lấy thông tin cone theo ID
     * @param id - Cone ID (database ID)
     * @returns Cone
     * @throws Error if not found
     */
    getById(id: number): Promise<Cone>;
    /**
     * Lấy thông tin cone theo mã vạch (cone_id)
     * @param coneId - Barcode/cone_id string
     * @returns Cone
     * @throws Error if not found
     */
    getByBarcode(coneId: string): Promise<Cone>;
    /**
     * Lấy tất cả cone trong một kho cụ thể (cho kiểm kê)
     * @param warehouseId - Warehouse ID
     * @returns ApiResponse with array of partial cone data
     */
    getByWarehouse(warehouseId: number): Promise<ApiResponse<Partial<Cone>[]>>;
    /**
     * Lấy tổng hợp số lượng có sẵn theo thread type
     * @param threadTypeId - Optional filter by thread type ID
     * @returns Record mapping thread_type_id to summary (total_meters, full_cones, partial_cones)
     */
    getAvailableSummary(threadTypeId?: number): Promise<Record<number, AvailableSummary>>;
    /**
     * Nhập kho mới - tạo nhiều cone cùng lúc
     * @param data - ReceiveStockDTO with thread_type_id, warehouse_id, quantity_cones, etc.
     * @returns Array of created cones
     */
    receiveStock(data: ReceiveStockDTO): Promise<Cone[]>;
    /**
     * Lưu kết quả kiểm kê
     * @param warehouseId - Warehouse ID
     * @param scannedConeIds - Array of scanned cone IDs
     * @param notes - Optional notes
     * @returns Stocktake result with comparison data
     */
    saveStocktake(warehouseId: number, scannedConeIds: string[], notes?: string): Promise<ApiResponse<StocktakeResult>>;
    /**
     * Lấy tổng hợp tồn kho theo cuộn (cone-based summary)
     * Groups by thread_type, counts full and partial cones
     * @param filters - Optional filters: warehouse_id, supplier_id, material, search
     * @returns Array of ConeSummaryRow
     */
    getConeSummary(filters?: ConeSummaryFilters): Promise<ConeSummaryRow[]>;
    /**
     * Lấy chi tiết phân bố kho cho một loại chỉ cụ thể
     * Shows breakdown by warehouse for drill-down view
     * @param threadTypeId - Thread type ID
     * @returns Array of ConeWarehouseBreakdown
     */
    getWarehouseBreakdown(threadTypeId: number, colorId?: number | null): Promise<{
        data: ConeWarehouseBreakdown[];
        supplier_breakdown: SupplierBreakdown[];
    }>;
    getUnassignedByThreadType(warehouseId: number): Promise<UnassignedThreadGroup[]>;
};
/**
 * Stocktake result from backend
 */
export interface StocktakeResult {
    stocktake_id: number;
    warehouse_id: number;
    total_in_db: number;
    total_scanned: number;
    matched: number;
    missing: string[];
    extra: string[];
    match_rate: number;
    performed_at: string;
}
export {};
