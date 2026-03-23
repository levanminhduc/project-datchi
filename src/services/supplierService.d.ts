/**
 * Supplier Service
 *
 * API client for supplier master data management.
 */
import type { Supplier, SupplierDetail, SupplierFormData, SupplierFilters } from '@/types/thread/supplier';
export declare const supplierService: {
    /**
     * Lấy danh sách nhà cung cấp với filters
     */
    getAll(filters?: SupplierFilters): Promise<Supplier[]>;
    /**
     * Lấy thông tin chi tiết nhà cung cấp với danh sách màu
     */
    getById(id: number): Promise<SupplierDetail>;
    /**
     * Tạo nhà cung cấp mới
     */
    create(data: SupplierFormData): Promise<Supplier>;
    /**
     * Cập nhật thông tin nhà cung cấp
     */
    update(id: number, data: Partial<SupplierFormData> & {
        is_active?: boolean;
    }): Promise<Supplier>;
    /**
     * Xóa nhà cung cấp (soft delete - chuyển is_active = false)
     */
    remove(id: number): Promise<void>;
    /**
     * Lấy danh sách màu cho một nhà cung cấp
     */
    getColors(supplierId: number): Promise<unknown[]>;
    /**
     * Liên kết màu với nhà cung cấp
     */
    linkColor(supplierId: number, colorId: number, isPreferred?: boolean): Promise<void>;
};
