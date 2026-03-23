/**
 * Style Service
 *
 * API client for style operations.
 */
import type { Style, CreateStyleDTO, UpdateStyleDTO, StyleFilter, StyleThreadSpec } from '@/types/thread';
export interface StyleSearchParams {
    search?: string;
    limit?: number;
    excludeIds?: number[];
}
export declare const styleService: {
    /**
     * Search styles với server-side filtering
     * @param params - Search parameters
     * @returns Array of matching styles
     */
    search(params?: StyleSearchParams): Promise<Style[]>;
    /**
     * Lấy danh sách tất cả mã hàng
     * @param filters - Optional filters
     * @returns Array of styles
     */
    getAll(filters?: StyleFilter): Promise<Style[]>;
    /**
     * Lấy thông tin mã hàng theo ID
     * @param id - Style ID
     * @returns Style
     */
    getById(id: number): Promise<Style>;
    /**
     * Tạo mã hàng mới
     * @param data - CreateStyleDTO
     * @returns Created style
     */
    create(data: CreateStyleDTO): Promise<Style>;
    /**
     * Cập nhật mã hàng
     * @param id - Style ID
     * @param data - UpdateStyleDTO
     * @returns Updated style
     */
    update(id: number, data: UpdateStyleDTO): Promise<Style>;
    /**
     * Xóa mã hàng
     * @param id - Style ID
     */
    delete(id: number): Promise<void>;
    /**
     * Lấy định mức chỉ của mã hàng
     * @param id - Style ID
     * @returns Array of style thread specs
     */
    getThreadSpecs(id: number): Promise<StyleThreadSpec[]>;
    /**
     * Lấy danh sách màu có định mức chỉ của mã hàng
     * @param id - Style ID
     * @returns Array of colors with thread specs configured
     */
    getSpecColors(id: number): Promise<Array<{
        id: number;
        color_name: string;
        hex_code: string;
    }>>;
};
