/**
 * Suppliers Management Composable
 *
 * Provides reactive state and CRUD operations for supplier master data management.
 * Follows patterns from useThreadTypes.ts
 */
import type { Supplier, SupplierFormData, SupplierFilters } from '@/types/thread/supplier';
export declare function useSuppliers(): {
    suppliers: any;
    loading: any;
    error: any;
    selectedSupplier: any;
    filters: any;
    hasSuppliers: any;
    supplierCount: any;
    activeSuppliers: any;
    fetchSuppliers: (newFilters?: SupplierFilters) => Promise<void>;
    createSupplier: (data: SupplierFormData) => Promise<Supplier | null>;
    updateSupplier: (id: number, data: Partial<SupplierFormData> & {
        is_active?: boolean;
    }) => Promise<Supplier | null>;
    deleteSupplier: (id: number) => Promise<boolean>;
    selectSupplier: (supplier: Supplier | null) => void;
    getSupplierById: (id: number) => Supplier | undefined;
    setFilters: (newFilters: SupplierFilters) => Promise<void>;
    clearFilters: () => Promise<void>;
    clearError: () => void;
    reset: () => void;
};
