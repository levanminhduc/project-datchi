/**
 * Stock Service
 *
 * API client for thread stock management operations.
 * Handles quantity-based inventory tracking with FEFO deduction.
 */
import type { AggregatedStockRecord, ThreadStockSummary, ThreadStockFilters, AddStockDTO, DeductStockDTO, ReturnStockDTO, DeductStockResponse } from '@/types/thread/stock';
export declare const stockService: {
    /**
     * Lay danh sach ton kho voi bo loc
     * @param filters - Optional filters: thread_type_id, warehouse_id, lot_number
     * @returns Array of stock records with relations
     */
    getAll(filters?: ThreadStockFilters): Promise<AggregatedStockRecord[]>;
    /**
     * Lay tong hop ton kho theo loai chi
     * @param warehouseId - Optional warehouse filter
     * @returns Array of stock summaries by thread type
     */
    getSummary(warehouseId?: number): Promise<ThreadStockSummary[]>;
    addStock(data: AddStockDTO): Promise<{
        cones_created: number;
        lot_number: string;
        cone_ids: string[];
    }>;
    /**
     * Xuat kho theo FEFO (First Expired First Out)
     * Tu dong tru tu cac lo cu nhat truoc
     * @param data - Deduction request
     * @returns Deduction result showing which lots were affected
     */
    deductStock(data: DeductStockDTO): Promise<DeductStockResponse>;
    /**
     * Tra lai ton kho
     * Cong so luong vao stock record tuong ung
     * @param data - Return data
     * @returns Updated stock record
     */
    returnStock(data: ReturnStockDTO): Promise<{
        cones_created: number;
        lot_number: string;
    }>;
    /**
     * Lay ton kho theo loai chi cu the
     * @param threadTypeId - Thread type ID
     * @param warehouseId - Optional warehouse filter
     * @returns Array of stock records for that thread type
     */
    getByThreadType(threadTypeId: number, warehouseId?: number): Promise<AggregatedStockRecord[]>;
    /**
     * Lay ton kho theo kho
     * @param warehouseId - Warehouse ID
     * @returns Array of stock records for that warehouse
     */
    getByWarehouse(warehouseId: number): Promise<AggregatedStockRecord[]>;
    /**
     * Kiem tra ton kho co du khong
     * @param threadTypeId - Thread type ID
     * @param qtyFull - Required full cones
     * @param qtyPartial - Required partial cones
     * @param warehouseId - Optional warehouse filter
     * @returns true if sufficient stock available
     */
    checkAvailability(threadTypeId: number, qtyFull: number, qtyPartial?: number, warehouseId?: number): Promise<boolean>;
};
