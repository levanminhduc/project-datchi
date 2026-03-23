/**
 * Warehouse Service
 *
 * API client for warehouse management operations.
 * Handles all HTTP operations for warehouses.
 */
export type WarehouseType = 'LOCATION' | 'STORAGE';
export interface Warehouse {
    id: number;
    code: string;
    name: string;
    location: string | null;
    parent_id: number | null;
    type: WarehouseType;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface WarehouseTreeNode extends Warehouse {
    children: Warehouse[];
}
export declare const warehouseService: {
    /**
     * Lấy danh sách tất cả kho (flat list - backward compatible)
     * @returns Array of all warehouses
     */
    getAll(): Promise<Warehouse[]>;
    /**
     * Lấy danh sách kho dạng cây (LOCATION chứa children STORAGE)
     * @returns Array of location nodes with storage children
     */
    getTree(): Promise<WarehouseTreeNode[]>;
    /**
     * Lấy chỉ các kho lưu trữ (STORAGE) - dùng cho inventory forms
     * @param locationId - Lọc theo địa điểm (optional)
     * @returns Array of storage warehouses only
     */
    getStorageOnly(locationId?: number): Promise<Warehouse[]>;
    /**
     * Lấy chỉ các địa điểm (LOCATION)
     * @returns Array of location warehouses only
     */
    getLocations(): Promise<Warehouse[]>;
    /**
     * Lấy kho theo location ID
     * @param locationId - ID của địa điểm
     * @returns Array of storage warehouses under the location
     */
    getByLocation(locationId: number): Promise<Warehouse[]>;
};
