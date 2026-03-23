/**
 * Lot Service
 *
 * API client for lot management operations.
 */
import type { Lot, LotStatus, CreateLotRequest, UpdateLotRequest, LotFilters } from '@/types/thread/lot';
import type { Cone } from '@/types/thread/inventory';
import type { BatchTransaction } from '@/types/thread/batch';
export declare const lotService: {
    /**
     * Tạo lô mới
     */
    create(data: CreateLotRequest): Promise<Lot>;
    /**
     * Lấy danh sách lô với filters
     */
    getAll(filters?: LotFilters): Promise<Lot[]>;
    /**
     * Lấy thông tin chi tiết lô
     */
    getById(id: number): Promise<Lot>;
    /**
     * Cập nhật thông tin lô
     */
    update(id: number, data: UpdateLotRequest): Promise<Lot>;
    /**
     * Lấy danh sách cuộn trong lô
     */
    getCones(lotId: number): Promise<Cone[]>;
    /**
     * Lấy lịch sử thao tác của lô
     */
    getTransactions(lotId: number): Promise<BatchTransaction[]>;
    /**
     * Thay đổi trạng thái lô (quarantine/release)
     */
    setStatus(id: number, status: LotStatus): Promise<Lot>;
};
