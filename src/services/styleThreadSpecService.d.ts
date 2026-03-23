/**
 * Style Thread Spec Service
 *
 * API client for style thread specification operations.
 */
import type { StyleThreadSpec, StyleColorThreadSpec, CreateStyleThreadSpecDTO, UpdateStyleThreadSpecDTO, CreateStyleColorThreadSpecDTO, UpdateStyleColorThreadSpecDTO, StyleThreadSpecFilter } from '@/types/thread';
export declare const styleThreadSpecService: {
    /**
     * Lấy danh sách tất cả định mức chỉ
     * @param filters - Optional filters
     * @returns Array of style thread specs
     */
    getAll(filters?: StyleThreadSpecFilter): Promise<StyleThreadSpec[]>;
    /**
     * Lấy thông tin định mức chỉ theo ID
     * @param id - Style thread spec ID
     * @returns Style thread spec
     */
    getById(id: number): Promise<StyleThreadSpec>;
    /**
     * Tạo định mức chỉ mới
     * @param data - CreateStyleThreadSpecDTO
     * @returns Created style thread spec
     */
    create(data: CreateStyleThreadSpecDTO): Promise<StyleThreadSpec>;
    /**
     * Cập nhật định mức chỉ
     * @param id - Style thread spec ID
     * @param data - UpdateStyleThreadSpecDTO
     * @returns Updated style thread spec
     */
    update(id: number, data: UpdateStyleThreadSpecDTO): Promise<StyleThreadSpec>;
    /**
     * Xóa định mức chỉ
     * @param id - Style thread spec ID
     */
    delete(id: number): Promise<void>;
    /**
     * Lấy danh sách định mức chỉ theo màu
     * @param specId - Style thread spec ID
     * @returns Array of color specs
     */
    getColorSpecs(specId: number): Promise<StyleColorThreadSpec[]>;
    /**
     * Thêm định mức chỉ theo màu
     * @param specId - Style thread spec ID
     * @param data - CreateStyleColorThreadSpecDTO
     * @returns Created color spec
     */
    addColorSpec(specId: number, data: CreateStyleColorThreadSpecDTO): Promise<StyleColorThreadSpec>;
    /**
     * Lấy tất cả định mức chỉ theo màu cho một mã hàng (batch)
     * @param styleId - Style ID
     * @returns Array of all color specs for this style
     */
    getAllColorSpecsByStyle(styleId: number): Promise<StyleColorThreadSpec[]>;
    /**
     * Cập nhật định mức chỉ theo màu
     * @param colorSpecId - Color spec ID
     * @param data - Update data
     * @returns Updated color spec
     */
    updateColorSpec(colorSpecId: number, data: UpdateStyleColorThreadSpecDTO): Promise<StyleColorThreadSpec>;
    /**
     * Xóa định mức chỉ theo màu
     * @param colorSpecId - Color spec ID
     */
    deleteColorSpec(colorSpecId: number): Promise<void>;
};
