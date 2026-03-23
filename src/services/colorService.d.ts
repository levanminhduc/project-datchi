/**
 * Color Service
 *
 * API client for color master data management.
 */
import type { Color, ColorWithSuppliers, ColorFormData, ColorFilters } from '@/types/thread/color';
/**
 * ColorSupplierLink - Junction table row with supplier details
 */
export interface ColorSupplierLink {
    id: number;
    color_id: number;
    supplier_id: number;
    price_per_kg: number | null;
    min_order_qty: number | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    supplier: {
        id: number;
        code: string;
        name: string;
        contact_name?: string | null;
        phone?: string | null;
        email?: string | null;
        is_active?: boolean;
    };
}
export declare const colorService: {
    /**
     * Lấy danh sách màu với filters
     */
    getAll(filters?: ColorFilters): Promise<Color[]>;
    /**
     * Lấy thông tin chi tiết màu với danh sách nhà cung cấp
     */
    getById(id: number): Promise<ColorWithSuppliers>;
    /**
     * Tạo màu mới
     */
    create(data: ColorFormData): Promise<Color>;
    /**
     * Cập nhật thông tin màu
     */
    update(id: number, data: Partial<ColorFormData> & {
        is_active?: boolean;
    }): Promise<Color>;
    /**
     * Xóa màu (soft delete - chuyển is_active = false)
     */
    remove(id: number): Promise<void>;
    /**
     * Lấy danh sách nhà cung cấp liên kết với màu
     */
    getSuppliers(colorId: number): Promise<ColorSupplierLink[]>;
    /**
     * Liên kết nhà cung cấp với màu
     */
    linkSupplier(colorId: number, supplierId: number, pricePerKg?: number, minOrderQty?: number): Promise<ColorSupplierLink>;
    /**
     * Cập nhật thông tin liên kết (giá, MOQ)
     */
    updateLink(colorId: number, linkId: number, data: {
        price_per_kg?: number | null;
        min_order_qty?: number | null;
        is_active?: boolean;
    }): Promise<ColorSupplierLink>;
    /**
     * Gỡ liên kết nhà cung cấp khỏi màu
     */
    unlinkSupplier(colorId: number, linkId: number): Promise<void>;
};
