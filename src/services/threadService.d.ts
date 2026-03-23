/**
 * Thread Service
 *
 * API client for thread type management operations.
 * Handles all HTTP operations for thread types.
 */
import type { ThreadType, ThreadTypeFormData, ThreadTypeFilters } from '@/types/thread';
export declare const threadService: {
    /**
     * Lấy danh sách tất cả loại chỉ
     * @param filters - Optional filters for search, color, material, supplier, is_active
     * @returns Array of thread types
     */
    getAll(filters?: ThreadTypeFilters): Promise<ThreadType[]>;
    /**
     * Lấy thông tin loại chỉ theo ID
     * @param id - Thread type ID
     * @returns Thread type or null if not found
     */
    getById(id: number): Promise<ThreadType | null>;
    /**
     * Tạo loại chỉ mới
     * @param data - Thread type form data
     * @returns Created thread type
     */
    create(data: ThreadTypeFormData): Promise<ThreadType>;
    /**
     * Cập nhật thông tin loại chỉ
     * @param id - Thread type ID
     * @param data - Partial thread type data to update
     * @returns Updated thread type
     */
    update(id: number, data: Partial<ThreadTypeFormData>): Promise<ThreadType>;
    /**
     * Xóa loại chỉ (soft delete)
     * @param id - Thread type ID
     */
    remove(id: number): Promise<void>;
};
