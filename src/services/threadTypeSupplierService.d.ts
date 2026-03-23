/**
 * Thread Type Supplier Service
 *
 * API client for managing thread type - supplier relationships.
 * Each thread type can be sourced from multiple suppliers,
 * each with their own supplier_item_code and unit_price.
 */
import type { ThreadTypeSupplierWithRelations, ThreadTypeSupplierFormData, LinkSupplierFormData, ThreadTypeSupplierFilters } from '@/types/thread/thread-type-supplier';
export declare const threadTypeSupplierService: {
    /**
     * Lấy danh sách liên kết loại chỉ - nhà cung cấp với filters
     */
    getAll(filters?: ThreadTypeSupplierFilters): Promise<ThreadTypeSupplierWithRelations[]>;
    /**
     * Lấy thông tin chi tiết một liên kết
     */
    getById(id: number): Promise<ThreadTypeSupplierWithRelations>;
    /**
     * Tạo liên kết mới
     */
    create(data: ThreadTypeSupplierFormData): Promise<ThreadTypeSupplierWithRelations>;
    /**
     * Cập nhật liên kết
     */
    update(id: number, data: Partial<Omit<ThreadTypeSupplierFormData, "thread_type_id" | "supplier_id">> & {
        is_active?: boolean;
    }): Promise<ThreadTypeSupplierWithRelations>;
    /**
     * Xóa liên kết (hard delete)
     */
    remove(id: number): Promise<void>;
    /**
     * Lấy danh sách nhà cung cấp cho một loại chỉ
     */
    getSuppliersByThreadType(threadTypeId: number, isActive?: boolean): Promise<ThreadTypeSupplierWithRelations[]>;
    /**
     * Liên kết nhà cung cấp với loại chỉ
     */
    linkSupplierToThread(threadTypeId: number, data: LinkSupplierFormData): Promise<ThreadTypeSupplierWithRelations>;
};
