/**
 * Thread Type Suppliers Management Composable
 *
 * Provides reactive state and CRUD operations for managing the
 * thread type - supplier relationships (junction table).
 *
 * Each thread type can be sourced from multiple suppliers,
 * each with their own supplier_item_code and unit_price.
 */
import type { ThreadTypeSupplierWithRelations, ThreadTypeSupplierFormData, LinkSupplierFormData, ThreadTypeSupplierFilters } from '@/types/thread/thread-type-supplier';
/**
 * Composable for managing thread type - supplier relationships
 * @param threadTypeId - Optional thread type ID to scope operations
 */
export declare function useThreadTypeSuppliers(threadTypeId?: number): {
    suppliers: any;
    loading: any;
    error: any;
    selectedLink: any;
    filters: any;
    hasSuppliers: any;
    supplierCount: any;
    activeSuppliers: any;
    fetchSuppliers: (targetThreadTypeId?: number) => Promise<void>;
    fetchAll: (newFilters?: ThreadTypeSupplierFilters) => Promise<void>;
    linkSupplier: (targetThreadTypeId: number, data: LinkSupplierFormData) => Promise<ThreadTypeSupplierWithRelations | null>;
    createLink: (data: ThreadTypeSupplierFormData) => Promise<ThreadTypeSupplierWithRelations | null>;
    updateLink: (id: number, data: Partial<Omit<ThreadTypeSupplierFormData, "thread_type_id" | "supplier_id">> & {
        is_active?: boolean;
    }) => Promise<ThreadTypeSupplierWithRelations | null>;
    deleteLink: (id: number) => Promise<boolean>;
    selectLink: (link: ThreadTypeSupplierWithRelations | null) => void;
    getLinkById: (id: number) => ThreadTypeSupplierWithRelations | undefined;
    clearError: () => void;
    reset: () => void;
};
