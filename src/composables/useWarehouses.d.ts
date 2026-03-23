/**
 * Warehouse Management Composable
 *
 * Provides centralized warehouse options for dropdowns.
 * Supports hierarchy with LOCATION (địa điểm) and STORAGE (kho) types.
 * Fetches data from /api/warehouses endpoint.
 */
import { type Warehouse } from '@/services/warehouseService';
export interface WarehouseOption {
    label: string;
    value: number;
    type?: 'LOCATION' | 'STORAGE';
    disabled?: boolean;
}
export interface GroupedWarehouseOption {
    label: string;
    value: number | null;
    type: 'LOCATION' | 'STORAGE';
    disabled: boolean;
    parentId: number | null;
}
export declare function useWarehouses(): {
    warehouses: any;
    warehouseTree: any;
    loading: any;
    error: any;
    locations: any;
    storageWarehouses: any;
    warehousesByLocation: any;
    warehouseOptions: any;
    groupedWarehouseOptions: any;
    storageOptions: any;
    fetchWarehouses: () => Promise<void>;
    fetchWarehouseTree: () => Promise<void>;
    getWarehouseLabel: (id: number) => string;
    getWarehouseById: (id: number) => Warehouse | undefined;
    getLocationName: (warehouseId: number) => string;
    getStoragesForLocation: (locationId: number) => Warehouse[];
    clearError: () => void;
};
